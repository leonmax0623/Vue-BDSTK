<template lang="pug">
	a-table(
		bordered 
		:loading="!tableData"
		:dataSource="filteredData"
		:columns="columns"
		:pagination="pagination"
	)
		template(#actions="row")
			.actions
				a-button(type="info" @click.stop="editModal(row)") Редактировать
				a-spin(:spinning="isRemoving(row.id)" style="width: max-content;")
					a-button(type="danger" @click.stop="deleteSale(row)") Удалить
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'

export default {
	props: {
		query: String,
		typeId: Number
	},
	data() {
		return {
			pagination: { pageSize: 10 },
			onRemoving: [],
		}
	},
	async created() {
		this.fetch()
	},
	computed: {
		...mapGetters('app', ['getAccess']),
		...mapState('app', ['saleList']),
		columns() {
			const arr = [
				{
					title: 'Название',
					dataIndex: 'subject'
				},
				{
					title: 'Документ',
					dataIndex: 'files'
				},
				{
					title: 'Устройств',
					dataIndex: 'balancerQuantity'
				},
				{
					title: 'Комментарий',
					dataIndex: 'comments'
				},
			]

			if(this.getAccess('Storage.Sales').isFullAccess) {
				arr.push({
					title: 'Действия',
					scopedSlots: { customRender: 'actions' },
				})
			}

			return arr
		},
		filteredData() {
			if(!this.tableData) {
				return null
			}

			if(!this.query) {
				return this.tableData
			}

			return this.tableData.filter(item => {
				return Object
					.keys(item)
					.some(key => {
						return ~item[key].toString().toLowerCase().indexOf(this.query.toLowerCase())
					})
			})
		},
		tableData() {
			if(!this.typeId) {
				return this.saleList
			}

			return this.saleList.filter(x => x.saleType && x.saleType.id === this.typeId)
		}
	},
	methods: {
		...mapActions('app', ['loadSaleList']),
		editModal(record) {
		  this.$bus.$emit('modal', {
				component: 'StorageBypass',
				options: {
					saleId: record.id
				}
			})  
		},
		async fetch() {
			await this.loadSaleList()
		},
		isRemoving(id) {
			return !!~this.onRemoving.indexOf(id)
		},
		async deleteSale({ id }) {
			this.onRemoving.push(id)
			const sale = await this.$api.sale.getSaleById(id)
			this.onRemoving.splice(this.onRemoving.indexOf(id), 1)

			if(sale.balancerItems.length || sale.productItems.length) {
				this.$notification.warning({
					message: 'Невозможно удалить продажу',
					description: 'Данная продажа не пустая, сначала удалите входящие в нее позиции'
				})

				return
			}

			this.$confirm({
				title: 'Удалить данные о продаже?',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.sale.deleteSale(id)
					// await this.fetch()
					this.$bus.emit('route:reload')
				},
				onCancel() {},
			});
		},
	}
}
</script>
