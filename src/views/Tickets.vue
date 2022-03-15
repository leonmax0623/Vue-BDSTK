<template lang="pug">
	Page.wrap
		SubHeader(slot="sub-header" title="Тикеты")
			.actions
				a-select(v-model="filterType" style="width: 180px" placeholder="Тип фильтра" allowEmpty allowClear @change="handleFilterType")
					a-select-option(:value="item.id" v-for="item of filter_types" :key="item.id") {{item.name}}

				a-select(:disabled="!filterType" v-model="filterValue[filterType]" style="width: 180px" placeholder="Значение фильтра" allowEmpty allowClear :filterOption="filterOption" showSearch)
					a-select-option(:value="item.id" v-for="item of filter_options[filterType]" :key="item.id" :name="item.name")
						TicketStatus(:status="item" v-if="filterType === 'status'")
						div(v-else) {{item.name}}

				a-date-picker(
					v-model="serverFilters.from"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="От"
					@change="fetch"
				)
				span -
				a-date-picker(
					v-model="serverFilters.to"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="До"
					@change="fetch"
				)

				a-input(
					allowClear
					placeholder="Поиск..."
					style="width: 300px"
					v-model="searchQuery"
				)
					a-tooltip(slot="suffix" title="Поиск")
						a-icon(type="search" style="color: rgba(0,0,0,.45)")

				a-button(@click="applyResponsible" :disabled="!selectedRowKeys.length" :loading="loading.responsible" v-if="getAccess('HD-Tickets-Actor').isFullAccess") Принять в работу

				a-button(type="primary" @click="createTicket" v-if="getAccess('HD-Tickets').isFullAccess") Новый тикет
		
		
		a-table.tickets-table(
			bordered 
			:row-selection="rowSelection"
			:loading="loading.table"
			:columns="columns"
			:dataSource="filteredTickets"
			:locale="locale"
			:pagination="pagination"
			:customRow="customRow"
			:rowClassName="rowClassName"
			rowKey="id"
			@change="tableChange"
			:scroll="{ x: 1500 }"
		)
			template(#date="value, record")
				div {{formatDate(value)}}

			template(#status="status, record")
				RouterLink(:to="`/ticket/${record.id}`" target="_blank" @click.native="toggleUnread(record.id)").flex.flex-col
					TicketStatus(:status="status")
					a-tag(v-if="record.closeComments && record.closeComments.id" style="margin-top: 4px;") {{record.closeComments.name}}
				
			template(#comment="value")
				.comment {{value}}

			template(#unread="value, record")
				a-icon.unread(type="warning" v-if="record.unread")

			template(#severity="severity, record")
				TicketSeverity(:severity="severity")

			template(#simpleTag="value")
				ATag {{value}}

</template>

<script>
import dayjs from 'dayjs'
import { uniqBy, get } from 'lodash'
import { mapActions, mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
	metaInfo: {
		title: 'HD — Тикеты'
	},
	data: () => ({
		tickets: null,
		locale: {
			emptyText: 'Данные отсуствуют'
		},
		filterType: undefined,
		filterValue: {
			balancerTypeID: undefined,
			clientName: undefined,
			troubleType: undefined,
			status: undefined,
		},
		serverFilters: {
			from: null,
			to: null,
		},
		searchQuery: '',
		pagination: { pageSize: 10, current: 1 },
		selectedRowKeys: [],
		loading: {
			responsible: false,
			table: false,
		},
		from: null,
		to: null,
	}),
	created() {
		this.fetch()
	},
	computed: {
		...mapState('auth', ['user']),
		...mapGetters('app', ['getAccess']),
		rowSelection() {
			if(!this.getAccess('HD-Tickets-Actor').isFullAccess) {
				return undefined
			}

			return {
				selectedRowKeys: this.selectedRowKeys,
				onChange: (selectedRowKeys, selectedRows) => {
					this.selectedRowKeys = selectedRowKeys
				},
				getCheckboxProps: record => ({
					props: {
						disabled: record.responsible.departmentID === this.user.id,
					},
				}),
			}
		},
		filteredTickets() {
			if(!this.tickets) {
				return null
			}

			return this.tickets
				.filter(item => {
					return this.is3LineUser ? item.status.id === this.$config.tickets.status.line3 : true
				})
				.filter(item => {
					const filterKey = Object.keys(this.filterValue).find(key => this.filterValue[key])

					if(!filterKey) {
						return true
					}

					const type = this.filter_types.find(x => x.id === filterKey)
					const field = type.field || type.id

					return get(item, field) === this.filterValue[filterKey]
				})
				.filter(item => {
					if(!this.searchQuery) {
						return true
					}

					const fields = {
						number: 'number',
						date: item => this.formatDate(item.date),
						troubleDate: item => this.formatDate(item.troubleDate),
						vlan: 'vlan',
						troubleType: 'troubleType.name',
						client: 'clientName',
						initialBalancerStatus: 'initialBalancerStatus',
						balancerNumber: 'balancerNumber',
						comments: 'comments',
					}

					return Object
						.keys(fields)
						.some(key => {
							if(typeof fields[key] === 'string') {
								return get(item, fields[key]).trim().toLowerCase().includes(this.searchQuery.trim().toLowerCase())
							}

							return fields[key](item).toString().trim().toLowerCase().includes(this.searchQuery.trim().toLowerCase())
						})
				})
		},
		filter_types() {
			return [
				{
					id: 'balancerTypeID',
					name: 'Тип Балансировщика'
				},
				{
					id: 'clientName',
					name: 'Клиент'
				},
				{
					id: 'troubleType',
					name: 'Неисправность',
					field: 'troubleType.id'
				},
				!this.is3LineUser && {
					id: 'status',
					name: 'Статус тикета',
					field: 'status.id'
				}
			].filter(Boolean)
		},
		is3LineUser() {
			if(!this.user) {
				return false
			}

			return this.user && this.user.departmentID === this.$config.department.line3
		},
		filter_options() {
			if(!this.tickets) {
				return {
					balancerTypeID: null
				}
			}
		
			return {
				balancerTypeID: uniqBy(this.tickets.map(x => ({
					id: x.balancerTypeID,
					name: x.balancerTypeName,
				})), x => x.id),

				clientName: uniqBy(this.tickets.map(x => ({
					id: x.clientName,
					name: x.clientName,
				})), x => x.id),

				troubleType: uniqBy(this.tickets.map(x => ({
					id: x.troubleType.id,
					name: x.troubleType.name,
				})), x => x.id),

				status: uniqBy(this.tickets.map(x => ({
					id: x.status.id,
					name: x.status.name,
				})), x => x.id),
			}
		},
		columns() {
			return [
				{
					title: '№',
					dataIndex: 'number',
					width: 70,
				},
				{
					title: 'Дата создания',
					dataIndex: 'date',
					scopedSlots: { customRender: 'date' },
					width: 100,
				},
				{
					title: 'Дата проявления',
					dataIndex: 'troubleDate',
					scopedSlots: { customRender: 'date' },
					width: 100,
				},
				{
					title: 'VLAN',
					dataIndex: 'vlan',
					width: 70,
				},
				{
					title: 'Неисправность',
					dataIndex: 'troubleType.name',
					width: 180,
				},
				{
					title: 'Клиент',
					dataIndex: 'clientName',
					width: 160,
				},
				{
					title: 'Статус БН при создании тикета',
					dataIndex: 'balancerState.name',
					width: 130,
				},
				{
					title: 'Устройство',
					dataIndex: 'balancerNumber',
					width: 160,
				},
				{
					title: 'Приоритет',
					dataIndex: 'severity',
					scopedSlots: { customRender: 'severity' },
					width: 110,
				},
				{
					title: 'Инженер',
					dataIndex: 'responsible.name',
					width: 130,
					scopedSlots: { customRender: 'simpleTag' },
				},
				{
					title: 'Комментарий',
					dataIndex: 'comments',
					scopedSlots: { customRender: 'comment' },
					width: 240,
				},
				{
					title: 'Статус',
					scopedSlots: { customRender: 'status' },
					dataIndex: 'status',
					width: 240,
				},
				{
					title: '',
					scopedSlots: { customRender: 'unread' },
					width: 50,
				}
			].filter(Boolean)
		}
	},
	methods: {
		...mapActions('constant', ['load_ticket_severity']),
		disabledDate(current) {
			return current && current > moment().endOf('day');
		},
		async applyResponsible() {
			this.loading.responsible = true
			try {
				const data = this.selectedRowKeys.map(ticketID => ({ ticketID }))

				await this.$api.ticket.applyResponsible(data)

			} catch(e) {
			} finally {
				this.loading.responsible = false
				this.selectedRowKeys = []
				this.fetch()
			}
		},
		toggleUnread(id) {
			const index = this.tickets.findIndex(x => x.id === id)

			if(~index) {
				this.tickets[index].unread = false
			}
		},
		updateQuery(query) {
			this.$router.replace({ query: { ...this.$route.query, ...query } })   
		},
		tableChange({ current }) {

			this.pagination.current = current
			this.updateQuery({
				page: current
			})
		},
		rowClassName(row) {
			const classNames = {
				'ticket-row': true,
			}

			if(row.status.id === this.$config.tickets.status.closed) {
				return classNames
			}

			const medium = dayjs(row.lastModified).isBefore(dayjs().subtract(1, 'day'))
			const high = dayjs(row.lastModified).isBefore(dayjs().subtract(2, 'day'))

			if(high) {
				classNames['--high'] = true
			} else if(medium) {
				classNames['--medium'] = true
			}
			
			return classNames
		},
		customRow(row) {
			return {
				on: {
					dblclick: e => {
						const { href } = this.$router.resolve(`/ticket/${row.id}`)

						window.open(href, '_blank')
					}
				}
			}
		},
		filterOption(value, option) {
			return option.data.attrs.name.trim().toLowerCase().includes(value.trim().toLowerCase())
		},
		async handleFilterType(type) {
			Object.keys(this.filterValue).forEach(key => {
				this.filterValue[key] = undefined
			})
		},
		async fetch() {
			const params = {
				from: this.serverFilters.from && this.serverFilters.from.toDate(),
				to: this.serverFilters.to && this.serverFilters.to.toDate(),
			}

			try {
				this.loading.table = true
				;[this.tickets] = await Promise.all([
					this.$api.ticket.getTickets(params),
					this.load_ticket_severity()
				])
			} catch(e) {
				console.error(e)
			} finally {
				this.loading.table = false
			}

		},
		formatDate(value) {
			return dayjs(value).format('DD.MM.YYYY HH:mm')
		},
		createTicket() {
			this.$modal({
				component: 'CreateTicket',
				options: {
				},
				on: {
					created: ticketId => {
						// this.tickets.unshift(ticket)
						this.fetch()
					}
				}
			})
		}
	},
}
</script>

<style lang="scss">
.tickets-table .ticket-row {
	&.--medium {
		background: rgba(orange, .1);

		&:hover td {
			background: rgba(orange, .2) !important;
		}
	}
	&.--high {
		background: rgba(red, .1);

		&:hover td {
			background: rgba(red, .2) !important;
		}
	}
}
</style>

<style lang="scss" scoped>
.comment {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 200px;
}

.unread {
	font-size: 16px;
	color: #ff6124;
}


</style>