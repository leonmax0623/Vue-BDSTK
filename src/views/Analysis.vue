<template lang="pug">
	Page.wrap
		SubHeader(slot="sub-header" title="Аналитика")
			.actions
				a-input(
					v-model="filter.sn"
					placeholder="Серийный номер балансировщика"
				)
				a-date-picker(
					v-model="filter.from"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="От"
					style="width: 300px"
				)
				span -
				a-date-picker(
					v-model="filter.to"
					:disabled-date="disabledDate"
					format="DD.MM.YYYY"
					placeholder="До"
					style="width: 300px"
				)

				a-button(type="primary" @click="loadReport" :loading="loading") Найти
	

		a-table(v-bind.once="table" :pagination="false" :loading="loading")
</template>

<script>
import moment from 'moment'
import numeral from 'numeral'

const formatNumber = num => numeral(num).format('0.[00]a')

export default {
	data: () => ({
		report: null,
		loading: false,
		filter: {
			sn: '',
			bn: null,
			from: moment().subtract(1, 'week'),
			to: moment(),
		}
	}),
	// created() {
	// 	this.loadReport()
	// },
	computed: {
		table() {
			return {
				columns: [
					{
						title: 'Оператор',
						dataIndex: 'operator'
					},
					{
						title: 'Тариф',
						dataIndex: 'tariff'
					},
					{
						title: 'Входящий трафик (Гбайт)',
						dataIndex: 'incoming'
					},
					{
						title: 'Исходящий трафик (Гбайт)',
						dataIndex: 'outcoming',
					},
					{
						title: 'Итого (Гбайт)',
						dataIndex: 'total'
					},
				],
				dataSource: this.report || [],
			}
		}
	},
	methods: {
		disabledDate(current) {
			return current && current > moment().endOf('day');
		},
		async loadReport() {
			this.loading = true

			this.report = await this.$api.balancer.getReport(this.filter.sn, 'traffic', {
				from: this.filter.from.toDate(), 
				to: this.filter.to.toDate()
			})

			const incoming = formatNumber(this.report.reduce((res, item) => res + item.incoming, 0))
			const outcoming = formatNumber(this.report.reduce((res, item) => res + item.outcoming, 0))
			const total = this.report.reduce((res, item) => res + item.total, 0)
			
			if(this.report.length) {
				this.report.push({
					operator: 'Итого',
					incoming,
					outcoming,
					total,
				})
			}

			this.loading = false
		}
	}
}
</script>