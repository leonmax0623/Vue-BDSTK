<template>
	<a-modal
		:title="'Добавление и изменение позиций'"
		:visible="true"
		:width="700"
		@ok="submit"
		@cancel="close"
	>

		<a-spin :spinning="loading">
			<a-form
				:form="form"
				:label-col="{ span: 8 }"
				:wrapper-col="{ span: 16 }"
				class="--label-left"
			>
				<a-form-item label="Наименование" >
					<a-input
						v-decorator="['name', { rules: [{ required: true, message: 'Введите наименование позиции или выберите позицию из списка' }] }]"
					/>
				</a-form-item>
				<a-form-item label="Выберите тип позиции" >
					<a-select
						@change="handlePositionTypeChange"
						v-decorator="['categoryID', { rules: [{ required: true, message: 'Выберите тип позиции или выберите позицию из списка' }] }]"
					>
						<a-select-option
							v-for="item of allCategories"
							:value="item.id"
							:key="item.id"
						>
							{{item.name}}
						</a-select-option>
					</a-select>
				</a-form-item>

				<a-form-item label="Выберите тип устройства" >
					<a-select
						v-decorator="['balancerTypeId', { rules: [{ required: selectedPositionType === ProductCategories.Device, message: 'Выберите тип устройства' }] }]"
						:disabled="disableBalancerTypeSelect"
					>
						<a-select-option
							v-for="item of allBalancerTypes"
							:value="item.id"
							:key="item.id"
						>
							{{item.name}}
						</a-select-option>
					</a-select>
				</a-form-item>
			</a-form>

			<a-list 
				bordered
				:pagination="pagination"
				:dataSource="allPositionsList"
			>
				<a-list-item
					slot="renderItem"
					slot-scope="item"
					@click="handlePositionItemClick(item)"
				>
					<div class="item">
						{{item.name}}
						<div class="item-actions">
							<a-button @click.stop="remove(item)" :loading="!!~getRemovingIndex(item.id)">Удалить</a-button>
						</div>
					</div>
				</a-list-item>
			</a-list>
		</a-spin>

		<template slot="footer">
			<a-button key="cancel" @click="close">Отмена</a-button>
			<a-button key="edit" type="primary" @click="submit('edit')">Изменить</a-button>
			<a-button key="create" type="primary" @click="submit('create')">Добавить</a-button>
		</template>

	</a-modal>
</template>

<script>
import { ProductStatuses, ProductCategories } from '@/common'

export default {
	data() {
		return {
			ProductStatuses,
			ProductCategories,
			loading: true,
			allPositionsList: [],
			allCategories: [],
			allBalancerTypes: [],
			selectedPosition: {},
			selectedPositionType: null,
			disableBalancerTypeSelect: true,
			pagination: {
				pageSize: 8,
			},

			removeLoading: []
		}
	},
	beforeCreate() {
		this.form = this.$form.createForm(this, { name: 'position_management' });
	},
	async mounted() {
		this.allPositionsList = await this.$api.product.getAllProducts()
		this.allCategories = await this.$api.product.getCategories()
		this.allBalancerTypes = await this.$api.balancer.getBalancerTypes()
		this.loading = false
	},
	methods: {
		getRemovingIndex(itemId) {
			return this.removeLoading.findIndex(id => id === itemId)
		},
		async remove(item) {
			this.removeLoading.push(item.id)
			const items = await this.$api.product.getProductCopiesList(item.id)
			const countZakaz = items.filter(x => x.status.id === 5).length
			const countSklad = items.filter(x => x.status.id === 1).length
			this.removeLoading.splice(this.getRemovingIndex(item.id), 1)

			if(countZakaz && countSklad) {
				this.$notification.warning({
					message: 'Невозможно удалить позицию',
					description: `Удаление можно только пустые позиции, текущее кол-во: ${countSklad} на складе, ${countZakaz} в заказах`
				})

				return 
			}

			this.$confirm({
                title: 'Подтвердите действие',
                content: 'Позиция будет безвозвратно удалена со склада',
                okText: 'Удалить',
                cancelText: 'Отмена',
                onOk: async () => {

					await this.$api.product.removeSingleProduct(item.id)


					this.removeLoading.splice(this.getRemovingIndex(item.id), 1)

					this.allPositionsList.splice(this.allPositionsList.findIndex(x => x.id === item.id), 1)

					this.$notification.success({
						message: 'Позиция удалена'
					})
                },
                onCancel() {},
            })
		},
		handlePositionItemClick(item) {
			this.selectedPosition = item
			this.form.setFieldsValue({
				..._.pick(item, [
					'name',
					'categoryID'
				])
			})
		},
		handlePositionTypeChange(value) {
			this.disableBalancerTypeSelect = value !== this.ProductCategories.Device
		},
		close() {
			this.$emit('close')
		},
		async submit(type) {
			this.loading = true
			this.form.validateFields(async (err, form) => {
				if(err) {
					return
				}
				switch(type) {
					case 'edit':
						{
							const data = {
								...this.selectedPosition,
								..._.pick(form, [
									'name'
								]),
							}
							if (data.categoryID === this.ProductCategories.Part) {
								await this.$api.product.editProduct(data)
							}
							if (data.categoryID === this.ProductCategories.Device) {
								await this.$api.balancer.editBalancer(data)
							}
							
							break
						}
					case 'create':
						{
							if (form.categoryID === this.ProductCategories.Part) {
								let data = {
									..._.pick(form, [
										'name',
										'categoryID'
									])
								}
								await this.$api.product.createProduct(data)
							}
							if (form.categoryID === this.ProductCategories.Device) {
								let data = {
									..._.pick(form, [
										'name'
									]),
									balancerType: {
										id: form.balancerTypeId
									}
								}
								await this.$api.balancer.createBalancer(data)
							}
							break
						}
				}
				
			})
			this.loading = false
			this.close()
			this.$emit('submit')
		}
	},
	computed: {
		
	}
}
</script>

<style lang="scss" >
	.item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>