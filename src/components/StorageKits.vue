<template lang="pug">
	ATable(
		bordered 
		:loading="!list"
		:dataSource="filteredData"
		:columns="columns"
		:pagination="pagination"
	)
		template(#content="col, record")
			AButton(@click="updateKit(record)" :type="record.items ? 'dashed' : 'primary' ") {{record.items ? countItems(record.items) : 'Добавить позиции' }}

		template(#remove="col, record")
			AButton(type="danger" @click="remove(record)") Удалить
</template>

<script>
export default {
	props: {
		query: String,
	},
	data: () => ({
		list: null,
		pagination: { pageSize: 10 },
	}),
	created() {
		this.fetch()
	},
	computed: {
		filteredData() {
			if(!this.list) {
				return null
			}

			return this.list
		},
		columns() {
			return [
				{
					title: 'Наименование',
					dataIndex: 'name'
				},
				{
					title: 'Комментарий',
					dataIndex: 'comments'
				},
				{
					title: 'Позиции',
					scopedSlots: { customRender: 'content' },
					width: 200
				},
				{
					scopedSlots: { customRender: 'remove' },
					width: 120
				},
			]
		},
	},
	methods: {
		async fetch() {
			this.list = await this.$api.productKit.getProductKits()
			console.log(this.list)
		},
		countItems(arr) {
			return arr.reduce((acc, item) => {
				return acc + item.quantity
			}, 0) + ' Позиций'
		},
		remove(item) {
			this.$confirm({
				title: 'Вы уверены что хотите удалить комплект?',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.productKit.removeKit(item.id)

					const index = this.list.findIndex(x => x.id === item.id)

					if(~index) {
						this.list.splice(index, 1)
					}

				},
				onCancel() {},
			})
		},
		updateKit(kit) {
			this.$modal({
				component: 'ProductKitModal',
				options: {
					kit
				},
				on: {
					close: () => {
						this.fetch()
					}
				}
			})
		}
	}
}
</script>