<template lang="pug">
	Page.orders
		SubHeader(slot="sub-header" title="Заказы")
			.actions
				AButtonGroup
					AButton(
						v-for="(item, index) of periodOptions"
						:key="index"
						:type="activePeriod === item.id ? 'primary' : null"
						:loading="loading && activePeriod === item.id"
						:disabled="loading && activePeriod !== item.id"
						@click="setPeriod(item)"
					) {{item.title}}
					
				AInput(
					placeholder="Поиск..."
					v-model="searchQuery"
					allowClear
					style="width: 300px"
				)
					ATooltip(slot="suffix" title="Поиск")
						AIcon(type="search" style="color: rgba(0,0,0,.45)")
				
				AButton(type="primary" icon="table" @click="columnSettings")
				AButton(type="primary" @click="activateSIM" v-if="selectedTPS.length") Активация
				

		ATable(
			bordered 
			:loading="!orders"
			:columns="activeColumns"
			:dataSource="filteredOrders"
			:rowKey="(record, index) => `${record.id}_${index}`"
			:pagination="pagination"
			:locale="locale"
			:scroll="scroll"
			@change="tableChange"
		)
			.orders__number(
				slot="orderNumber" style="display: flex; flex-direction: column; align-items:center;"
				slot-scope="text, record"
				@click="openStatusHistory(record)"
			)
				div {{`#${record.number}`}}
				div(style="font-size: 14px;") {{`Заявка #${record.requestNumber}`}}
			
			div(slot="big" slot-scope="text, record" style="white-space: pre-line; font-size: 16px; font-weight: bold;") {{text}}

			div(slot="status" slot-scope="text, record")
				div {{record.status.name}}
				div(style="font-size: 12px; color: #aaa;") {{$date.short(record.status.activateFrom)}}

			template(#tp="tariffs, record")
				.tag-list
					a-tag.tag(
						v-for="item of tariffs"
						v-bind="tpCellProps(record, item)"
						v-on="tpCellListeners(record, item)"
					)
						span {{item.name}}

</template>


<script>
import { OrderStatus, StatusSIM } from '@/common'
import { filterByFields } from '@/utils'
import dayjs from 'dayjs'
import { mapGetters } from 'vuex'
import { OperatorType } from '@/common'

const bnColorMap = {
	'BN014': '--red',
	'BN2M21': '--green',
	'BN2MI2': '--blue',
	// 'BN2M12': '--blue',
}

const getClassColor = number => {
	const key = Object
		.keys(bnColorMap)
		.find(key => number.startsWith(key))

	return key && bnColorMap[key]
}

const period = {
	week: 'week',
	month: 'month',
	half: 'half',
	year: 'year',
	all: 'all',
}

export default {
	data() {
		return {
			period,
			loading: false,
			activePeriod: period.month,
			selectedTPS: [],
			orders: null,
			activeColumns: null,
			pagination: { pageSize: 10, current: 1 },
			locale: {
				emptyText: 'Заказы отсутствуют'
			},
			
			defaultColumns: [
				{
					title: 'Номер заказа',
					dataIndex: 'number',
					width: 140,
					scopedSlots: { customRender: 'orderNumber' },
					sorter: (a, b, order) => +a.number - +b.number,
					customCell: (e) => {
						return {
							class: getClassColor(e.balancerNumber)
						}
					}
				},
				{
					title: 'Номер VLAN',
					dataIndex: 'vlan',
					scopedSlots: { customRender: 'big' },
					width: 100,
					sorter: (a, b, order) => +a.vlan - +b.vlan,
					customCell: (e) => {
						return {
							class: getClassColor(e.balancerNumber)
						}
					}
				},
				{
					title: 's/n БН',
					dataIndex: 'balancerNumber',
					scopedSlots: { customRender: 'big' },
					width: 190,
					sorter: (a, b, order) => a.balancerNumber.localeCompare(b.balancerNumber),
					customCell: (e) => {
						return {
							class: getClassColor(e.balancerNumber)
						}
					}
				},
				{
					title: 'Адрес канала',
					dataIndex: 'channelAddress',
					width: 240,
				},
				{
					title: 'Номер проекта',
					dataIndex: 'projectNumber',
					width: 130,
				},
				{
					title: 'Тип БН',
					dataIndex: 'balancerTypeName',
					width: 100,
				},
				{
					title: 'Тип сервиса',
					dataIndex: 'serviceTypeName',
					width: 100,
				},
				{
					title: 'Наименование клиента',
					dataIndex: 'clientName',
					width: 240,
				},
				{
					title: 'ФИО КЛ клиента',
					dataIndex: 'clientPersonName',
					width: 150,
				},
				{
					title: 'Телефон КЛ клиента',
					dataIndex: 'clientPersonPhone',
					width: 180,
				},
				{
					title: 'Адрес доставки оборудования',
					dataIndex: 'deliveryAddress',
					width: 280,
				},
				{
					title: 'ФИО КЛ для доставки',
					dataIndex: 'deliveryPerson',
					width: 150,
				},
				{
					title: 'Разовый платеж',
					dataIndex: 'onceFee',
					width: 100,
					customCell: () => ({
						class: 'center',
					})
				},
				{
					title: 'Ежемес. платеж',
					dataIndex: 'periodicFee',
					width: 100,
					customCell: () => ({
						class: 'center',
					})
				},
				{
					title: 'ТП Билайн',
					dataIndex: `tp_${OperatorType.Beeline}`,
					scopedSlots: { customRender: 'tp' },
					width: 150,
				},
				{
					title: 'ТП Мегафон',
					dataIndex: `tp_${OperatorType.Megafon}`,
					scopedSlots: { customRender: 'tp' },
					width: 150,
				},
				{
					title: 'ТП МТС',
					dataIndex: `tp_${OperatorType.MTS}`,
					scopedSlots: { customRender: 'tp' },
					width: 150,
				},
				{
					title: 'ТП Теле2',
					dataIndex: `tp_${OperatorType.Tele2}`,
					scopedSlots: { customRender: 'tp' },
					width: 150,
				},
				{
					title: 'Комментарий',
					dataIndex: 'comments',
					width: 360,
				},
				{
					title: 'Статус',
					scopedSlots: { customRender: 'status' },
					fixed: 'right',
					width: 220,
					customCell: record => ({
						class: 'order-status',
						on: {
							click: e => {
								const { href } = this.$router.resolve('/orders/' + record.id)


								window.open(href, '_blank')
							}
						}
					}),
				},
			]
		}
	},
	created() {
		const saved = localStorage.getItem('order-table-columns')

		if(saved) {
			const parsed = JSON.parse(saved)

			if(parsed) {
				this.activeColumns = this.defaultColumns.filter(x => ~parsed.indexOf(x.title))
			} else {
				this.activeColumns = this.defaultColumns
			}
		} else {
			this.activeColumns = this.defaultColumns
		}
	},
	async mounted() {
		const queryPeriod = this.$route.query.period

		if(queryPeriod && period[queryPeriod]) {
			this.activePeriod = queryPeriod
		}
		
		await this.fetch()

		this.$nextTick(() => {

			const page = +_.get(this.$route.query, 'page')
	
			if(_.isNumber(page)) {
				this.pagination.current = page
			}
		})
	},
	methods: {
		openStatusHistory(order) {
			this.$modal({
				component: 'StatusHistory',
				options: {
					order
				}
			})
		},
		updateQuery(query) {
			this.$router.replace({ query: { ...this.$route.query, ...query } })   
		},
		setPeriod(period) {
			this.updateQuery({
				period: period.id
			})
			this.activePeriod = period.id
			this.fetch()
		},
		isActivePeriod(period) {
			return this.period === period
		},
		tableChange({ current }) {

			this.pagination.current = current
			this.updateQuery({
				page: current
			})
		},
		getOrderNumber({ requestNumber, number }) {
			return `Номер заказа #${number} \n (Номер заявки #${requestNumber})`
		},
		tpCellListeners(record, tariff) {
			if(~[OrderStatus.ChannelDisabled, OrderStatus.BNinStorage].indexOf(record.status.id)) {
				const sim = record.sims.filter(x => x.tariffPlanID === tariff.id)

				const onBlocking = sim.filter(x => x.currentStateID === StatusSIM.OnBlocking)

				return {
					dblclick: e => {
						if(!this.allowEdit('Orders')) {
							return
						}
	
						if(onBlocking.length) {
							this.$confirm({
								icon: 'warning',
								okType: 'danger',
								title: 'Подтвердите блокировку сим карт',
								okText: 'Заблокировать',
								cancelText: 'Отмена',
								onOk: async () => {
									await Promise.all(onBlocking.map(s => this.$api.sim.block(s.id)))
									this.$notification.success({
										message: 'СИМ успешно заблокированы'
									})

									this.$bus.$emit('route:reload')
								}
							})
						} else {
							this.$modal({
								component: 'BlockSim',
								options: {
									sim
								}
							})
						}
					}
				}

			} else {

				const operatorID = tariff.operatorID
				const selected = _.find(this.selectedTPS, x => x.orderId === record.id)
	
				const tpSIMS = record.sims.filter(x => x.operatorID === operatorID && x.tariffPlanID === tariff.id && x.refID === tariff.refID)
	
				const activation = tpSIMS.some(x => x.currentStateID === StatusSIM.SentToActivation)
				const activated = !_.isEmpty(tpSIMS) && tpSIMS.every(x => x.currentStateID === StatusSIM.Activated)
				const blocked = !_.isEmpty(tpSIMS) && tpSIMS.every(x => x.currentStateID === StatusSIM.Blocked)
	
				const on = {}
				
				if(_.isEmpty(tpSIMS)) {
					on.dblclick = e => this.handleTPClick(e, record, tariff)
				}
	
				if(activation || activated || blocked) {
					on.click = e => {
						this.$modal({
							component: 'TPCellModal',
							options: {
								sims: tpSIMS
							}
						})
					}
				}
	
				return this.allowEdit('Orders') ? on : {}
			}
		},
		tpCellProps(record, tariff) {
			if(~[OrderStatus.ChannelDisabled, OrderStatus.BNinStorage].indexOf(record.status.id)) {
				const sim = record.sims.filter(x => x.tariffPlanID === tariff.id)

				const onBlocking = sim.filter(x => x.currentStateID === StatusSIM.OnBlocking)

				return {
					class: {
						tp: true,
						'--onblock': onBlocking.length,
						'--empty': !sim.length
					},
				}

			} else {

				const operatorID = tariff.operatorID
				const selected = _.find(this.selectedTPS, x => x.refID === tariff.refID)
	
				const tpSIMS = record.sims.filter(x => x.operatorID === operatorID && x.refID === tariff.refID)
	
				const activation = tpSIMS.some(x => x.currentStateID === StatusSIM.SentToActivation && x.refID === tariff.refID)
				const activated = !_.isEmpty(tpSIMS) && tpSIMS.some(x => x.currentStateID === StatusSIM.Activated && x.refID === tariff.refID)
	
				let blockedState = false

				// if(record.linkOrder) {
				//     if(!~[OrderStatus.ChannelTransfered].indexOf(record.linkOrder.status.id)) {
				//         console.log(record.number, tpField, _.get(record.linkOrder, `${tpField}.id`))
				//         blockedState = !!_.get(record.linkOrder, `${tpField}.id`)
				//     }
				// }
	
	
				return {
					class: {
						tp: true,
						'--selected': selected,
						'--activation': activation,
						'--activated': activated,
						'--blocked': blockedState
					},
				}
			}
		},
		handleTPClick(e, record, tariff) {
			e.stopPropagation()
			e.stopImmediatePropagation()

			if(record.expectedStatus.id !== OrderStatus.SimOnActivation || !(tariff.name)) {
				return;
			}

			if(this.selectedTPS.length && this.orders) {
				const firstSelected = this.selectedTPS[0]
				const order = this.orders.find(x => x.id === firstSelected.orderId)

				if(!order.tariffs.some(x => x.id === tariff.id)) {
					return
				}

				if(firstSelected.tpId !== tariff.id) {
					return
				}
			}

			const index = _.findIndex(this.selectedTPS, x => x.refID === tariff.refID)

			if(~index) {
				this.selectedTPS.splice(index, 1)
			} else {
				this.selectedTPS.push({
					orderId: record.id,
					tpId: tariff.id,
					refID: tariff.refID,
					operatorID: tariff.operatorID
				})
			}
		},
		activateSIM() {
			this.$modal({
				component: 'SelectSimForActivation',
				options: {
					selected: this.selectedTPS
				},
				on: {

				}
			})
		},
		async fetch() {
			this.orders = null
			this.loading = true

			this.orders = (await this.$api.order.getOrders({
				from: (() => ({
					[period.week]: dayjs().subtract('1', 'week').toDate(),
					[period.month]: dayjs().subtract('1', 'month').toDate(),
					[period.half]: dayjs().subtract('6', 'month').toDate(),
					[period.year]: dayjs().subtract('1', 'year').toDate(),
					[period.all]: null,
				})[this.activePeriod])()
			})).map(item => {
				item.key = item.id
				return item
			})

			this.loading = false
		},
		columnSettings() {
			this.$bus.$emit('modal', {
				component: 'ColumnSettings',
				options: {
					columns: this.defaultColumns,
					activeColumns: this.activeColumns
				},
				on: {
					save: cols => {
						const columns = this.defaultColumns.filter(x => ~cols.indexOf(x.title))

						localStorage.setItem('order-table-columns', JSON.stringify(columns.map(x => x.title)))

						this.activeColumns = columns 
					}
				}
			})
		}
	},
	computed: {
		...mapGetters('app', ['allowEdit']),
		periodOptions() {
			return [
				{
					id: period.week,
					title: 'Неделя',
				},
				{
					id: period.month,
					title: 'Месяц',
				},
				{
					id: period.half,
					title: 'Полгода',
				},
				{
					id: period.year,
					title: 'Год',
				},
				{
					id: period.all,
					title: 'Все',
				},
			]
		},
		searchQuery: {
			get() {
				const { query = '' } = this.$route.query

				return query
			},
			set(query) {
				this.updateQuery({ query })
			}
		},
		filteredOrders() {
			if(!this.orders) {
				return []
			}

			return filterByFields([this.searchQuery, this.searchQuery.replace(/т/gi, 't')], this.orders)([
				(x) => this.getOrderNumber(x),
				'abonentName',
				'balancerNumber',
				'balancerTypeName',
				'channelAddress',
				'clientName',
				'clientPersonName',
				'clientPersonPhone',
				'comments',
				'deliveryAddress',
				'deliveryPerson',
				'id',
				'onceFee',
				'periodicFee',
				'projectNumber',
				'requestID',
				'serviceTypeName',
				'status.name',
				'vlan',
				'tariffPlan_Beeline.name',
				'tariffPlan_MTS.name',
				'tariffPlan_Megafon.name',
				'tariffPlan_Tele2.name',
			])
			.map(item => {
				Object.keys(OperatorType).forEach(operatorKey => {
					item[`tp_${OperatorType[operatorKey]}`] = item.tariffs.filter(tariff => tariff.operatorID === OperatorType[operatorKey])
				})

				return item
			})
		},
		scroll() {
			return {
				x: this.activeColumns.reduce((x,y) => x + y.width, 0)
			}
		}
	}
}
</script>

<style lang="scss">
	.tag {
		flex-basis: 42%;
		text-align: center;
		padding: 12px 0;

		&-list {
			display: flex;
			flex-wrap: wrap;
		}
	}

	.orders {

		&__number {
			white-space: pre-line;
			font-size: 16px;
			font-weight: bold;
			text-decoration: underline;
			cursor: pointer;
		}

		.tp {
			&.--activated {
				background: green !important;
				color: #fff;
			}

			&.--activation {
				background: yellow !important;
			}

			&.--selected {
				background: red !important;
			}

			&.--blocked {
				background: #ddd !important;
				pointer-events: none;
			}
			
			&.--onblock {
				background: #91bfef !important;
			}

			&.--empty {
				background: #eee;
			}

			&:hover {
				opacity: .6;
			}
		}
	}

	.order-status {
		cursor: pointer;
		color: #1aa0ff;
		
		&:hover > div {
			text-decoration: underline
		}
	}
</style>