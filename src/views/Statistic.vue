<template lang="pug">
	Page.wrap
		SubHeader(slot="sub-header" title="Статистика")
			.actions
				a-select(
					v-model="filter.client"
					style="width: 180px"
					placeholder="Клиент"
					allowEmpty
					allowClear
					:loading="!options.clients"
					showSearch
					firstActiveValue
					@search="handleQueryClients"
					:filterOption="false"
				)
					a-select-option(v-for="item of options_filtered.clients" :key="item.name" :value="item.name") {{item.name}}
	
				a-select(
					v-model="filter.balancer"
					style="width: 180px"
					placeholder="Тип устройства"
					allowEmpty
					allowClear
					:loading="!options.balancers"
					showSearch
					firstActiveValue
					@search="handleQueryBalancer"
					@select="handleChangeBalancer"
					:filterOption="false"
				)
					a-select-option(v-for="item of options_filtered.balancers" :key="item.id" :value="item.id") {{item.name}}

				span -

				a-select(
					v-model="filter.balancerItem"
					style="width: 180px"
					placeholder="Устройство"
					allowEmpty
					allowClear
					:loading="loadBalancerItems"
					showSearch
					firstActiveValue
					:disabled="!filter.balancer"
					@search="handleQueryBalancerItem"
					:filterOption="false"
				)
					a-select-option(v-for="item of options_filtered.balancerItems" :key="item.id" :value="item.id") {{item.serialNumber}}

				a-date-picker(
					v-model="filter.date_from"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="От"
				)
				span -
				a-date-picker(
					v-model="filter.date_to"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="До"
				)

				a-button(type="primary" @click="fetch" :loading="loading") Найти

		a-table(
			bordered
			v-if="!(fetching_ticket_reasons || fetching_ticket_types)"
			:loading="loading"
			:columns="statColumns"
			:dataSource="statsData"
			:locale="locale"
			:pagination="pagination"
			:scroll="{ x: 1500 }"
		)

		a-table(
			style="margin-top: 64px;"
			bordered 
			:loading="loading"
			:columns="columns"
			:dataSource="tickets"
			:locale="locale"
			:pagination="pagination"
			:customRow="customRow"
			:scroll="{ x: 1500 }"
			@change="tableChange"
		)
			template(#date="value, record")
				div {{formatDate(value)}}

			template(#status="status, record")
				RouterLink(:to="`/ticket/${record.id}`" target="_blank").flex.flex-col
					TicketStatus(:status="status")
					a-tag(v-if="record.closeComments && record.closeComments.id" style="margin-top: 4px;") {{record.closeComments.name}}
				
			template(#comment="value")
				.comment {{value}}
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { get, take } from 'lodash'
import dayjs from 'dayjs'
import moment from 'moment'

export default {
	metaInfo: {
		title: 'HD — Статистика'
	},
	data: () => ({
		pagination: { pageSize: 10, current: 1 },
		query: {
			client: '',
			balancer: '',
			balancerItem: '',
		},
		loading: false,
		loadBalancerItems: false,
		filter: {
			client: undefined,
			balancer: undefined,
			balancerItem: undefined,
			date_from: null,
			date_to: null,
		},
		options: {
			clients: null,
			balancers: null,
			balancerItems: null
		},
		tickets: null,

		// utils
		locale: {
			emptyText: 'Данные отсуствуют'
		},
	}),
	async created() {
		[
			this.options.clients,
			this.options.balancers,
		] = await Promise.all([
			this.$api.ticket.getClients(),
			this.$api.balancer.getBalancers(),

			this.loadTicketTypes(),
			this.load_ticket_reasons(),
			this.fetch()
		])
	},
	computed: {
		...mapState('constant', [
			'ticket_diagnostics',
			'ticket_types',
			'ticket_reasons',
			'fetching_ticket_diagnostics',
			'fetching_ticket_types',
			'fetching_ticket_reasons',
		]),
		statColumns() {
			return [
				{
					title: '',
					dataIndex: 'name',
					width: 200,
					fixed: true,
				},
				...this.ticket_reasons.map((item, index) => {
					return {
						title: item.name,
						dataIndex: `counters.${index}`,
						width: 200,
					}
				})
			]
		},
		statsData() {
			if(!this.tickets) {
				return []
			}

			return this.ticket_types.map(item => {
				return {
					name: item.name,
					counters: this.ticket_reasons.map(reason => {
						return this.tickets.filter(x => x.troubleType.id === item.id && x.closeComments.id === reason.id).length || ''
					})
				}
			})
		},
		columns() {
			return [
				{
					title: '№',
					dataIndex: 'number',
					width: 80,
				},
				{
					title: 'Дата создания',
					dataIndex: 'date',
					scopedSlots: { customRender: 'date' }
				},
				{
					title: 'Дата проявления',
					dataIndex: 'troubleDate',
					scopedSlots: { customRender: 'date' }
				},
				{
					title: 'VLAN',
					dataIndex: 'vlan',
					width: 80,
				},
				{
					title: 'Неисправность',
					dataIndex: 'troubleType.name',
				},
				{
					title: 'Клиент',
					dataIndex: 'clientName',
				},
				{
					title: 'Статус БН при создании тикета',
					dataIndex: 'initialBalancerStatus',
				},
				{
					title: 'Устройство',
					dataIndex: 'balancerNumber',
					width: 170
				},
				{
					title: 'Комментарий',
					dataIndex: 'comments',
					scopedSlots: { customRender: 'comment' },
					width: 320
				},
				{
					title: 'Статус',
					scopedSlots: { customRender: 'status' },
					dataIndex: 'status',
					width: 280
				}
			]
		},
		options_filtered() {

			const balancerItems = this.query.balancerItem.length > 1
					? (this.options.balancerItems || []).filter(x => x.serialNumber.toLowerCase().includes(this.query.balancerItem.toLowerCase()))
					: take((this.options.balancerItems || []), 20)

			console.log(this.query.balancerItem, (this.options.balancerItems || []).filter(x => x.serialNumber.toLowerCase().includes(this.query.balancerItem.toLowerCase())))

			console.log(balancerItems)

			return {
				clients: this.query.client.length > 1
					? take((this.options.clients || []).filter(x => x.name.toLowerCase().includes(this.query.client.toLowerCase())), 20)
					: take((this.options.clients || []), 20),

				balancers: this.options.balancers || [],

				balancerItems
			}
		}
	},
	methods: {
		...mapActions('constant', ['loadTicketDiagnostics', 'loadTicketTypes', 'load_ticket_reasons']),
		tableChange({ current }) {
			this.pagination.current = current
		},
		disabledDate(current) {
			return current && current > moment().endOf('day');
		},
		handleQueryClients(query) {
			this.query.client = query
		},
		handleQueryBalancer(query) {
			this.query.balancer = query
		},
		handleQueryBalancerItem(query) {
			this.query.balancerItem = query
		},
		async handleChangeBalancer() {
			this.loadBalancerItems = true
			this.options.balancerItems = await this.$api.balancer.getBalancerItems(this.filter.balancer, null, 1)
			this.loadBalancerItems = false
		},
		formatDate(value) {
			return dayjs(value).format('DD.MM.YYYY HH:mm')
		},
		async fetch() {
			this.loading = true

			this.tickets = await this.$api.ticket.getTickets({
				name: get(this.filter, 'client'),
				from: this.filter.date_from && this.filter.date_from.toDate(),
				to: this.filter.date_to && this.filter.date_to.toDate(),
				balancerTypeName: this.filter.balancer && this.options.balancers.find(x => x.id === this.filter.balancer).name,
				balancerNumber: this.filter.balancerItem && this.options.balancerItems.find(x => x.id === this.filter.balancerItem).serialNumber,
			})

			this.loading = false
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
	}
}
</script>