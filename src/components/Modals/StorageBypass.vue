<template lang="pug">
	a-modal(
		:confirmLoading="loadingModal"
		:title="modalTitle"
		:visible="true"
		:width="780"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		@ok="save"
	)
		a-spin(:spinning="preload")
			a-form.relative(:form="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" class="--label-left")
				a-form-item(label="Название")
					a-input(v-decorator="['subject', formItemOptions]")
					
				a-form-item(label="Категория")
					a-select(v-decorator="['saleType', formItemOptions]")
						a-select-option(
							v-for="type of saleTypes"
							:value="type.id"
							:key="type.id"
						) {{type.name}}

				div.card
					.card__left
						a-form(:form="formUstr" :label-col="{ span: 9 }" :wrapper-col="{ span: 15 }" class="--label-left")
							a-form-item(label="Устройство")
								a-select(v-model="device.selected" @change="handleChangeDevice")
									a-select-option(v-for="item of devices" :value="item.product.id" :key="item.product.id") {{item.product.name}}
							a-form-item(label="S/N")
								a-select(v-model="device.snFrom" @change="handleSnTo" placeholder="С" :disabled="!filteredDeviceInstaces" :loading="device.selected && !filteredDeviceInstaces")
									a-select-option(v-for="item of filteredDeviceInstaces" :value="item.id" :key="item.id") {{item.serialNumber}}
								a-select(v-model="device.snTo" placeholder="По" :disabled="!filteredDeviceInstaces || filteredDeviceInstaces.length < 2 || !device.snFrom" :loading="device.selected && !filteredDeviceInstaces")
									a-select-option(v-for="(item, i) of filteredDeviceInstaces" :value="item.id" :key="item.id" :disabled="i <= selectedSNFromIndex") {{item.serialNumber}}
							a-form-item(label=" " :colon="false")
								.flex
									.filler
									a-button(type="primary" @click="addDevice" :disabled="!(device.selected && device.snFrom)") Добавить

							a-form-item(label="Комплектующее")
								a-select(v-model="selectedComponent")
									a-select-option(v-for="item of filteredComponents" :value="item.product.id" :key="item.product.id") {{item.product.name}}
							a-form-item(label=" " :colon="false")
								.flex
									.filler
									a-button(type="primary" @click="addComponent" :disabled="!selectedComponent") Добавить
					.card__right
						h4 Со склада списано
						ul.list
							li(v-for="item of uniqDevices")
								.flex
									span {{item.product.name}}
									.filler
									a-button(size="small" @click="openDeviceSN(item.product.id, item)") {{countDeviceById(item.product.id)}}
									a-button(size="small" type="danger" icon="close" style="margin-left: 2px;" @click="removeDevice(item)")
				
							li(v-for="item of ready.component" v-if="item.quantity")
								.flex
									span(style="max-width: 200px") {{item.product.name}}
									.filler
									a-button(size="small" @click="removeComponentQuantity(item)" :disabled="!(item.quantity - 1)") -
									a-button(size="small" style="margin: 0 2px;") {{item.quantity}}
									a-button(size="small" @click="addComponentQuantity(item)" :disabled="allowAddQuantity(item)") +
									a-button(size="small" type="danger" icon="close" style="margin-left: 2px;" @click="item.quantity = 0")
				
				a-form-item(label="Документ")
					.uploader
						a-upload(
							name="file"
							@change="pickFile"
							:beforeUpload="() => false"
							v-decorator="['file']"
							:remove="removeFile"
							:showUploadList="false"
						)
							a-button
								a-icon(type="upload")
								| Выбрать файл
						.uploader__name(v-for="(file, i) of files")
							a-icon.uploader__icon(type="cloud-upload")
							span {{file.name}}
							a-button(icon="close" size="small" shape="circle" style="margin-left: 12px;" @click="removeFile(i)")
		
						template(v-if="sale")
							.uploader__name(v-for="(file, i) of sale.files" )
								a-icon.uploader__icon(type="file-text")
								span {{file.name}}
								a-button(icon="download" size="small" shape="circle" style="margin-left: 12px;" @click="download(file)" :loading="isLoadingDoc(file.id)")
								a-button(icon="close" size="small" shape="circle" style="margin-left: 12px;" @click="removeRealFile(file.id)")
				a-form-item(label="Комментарий")
					a-textarea(v-decorator="['comments']")

</template>

<script>
import saveFile from 'file-saver'
import mime from 'mime'
import { mapState } from 'vuex'

const StorageCategory = {
	Device: 1,
	Component: 2
}

const ItemState = {
	InStorage: 1,
	InOrder: 5 
}

export default {
	props: {
		saleTypeId: {},
		saleId: {
			required: false
		}
	},
	data() {
		return {
			preload: true,
			downloadingDocs: [],
			sale: null,
			files: [],
			loadingModal: false,
			data: null,
			form: this.$form.createForm(this, { name: 'form' }),
			formUstr: this.$form.createForm(this, { name: 'formUstr' }),

			deviceInstances: null,
			device: {
				selected: null,
				snFrom: null,
				snTo: null
			},
			selectedComponent: null,
			ready: {
				device: [],
				component: []
			}
		}
	},
	async created() {
		await this.fetch()
		this.preload = false
	},
	computed: {
		...mapState('app', ['saleTypes']),
		filteredComponents() {
			if(!this.components) {
				return null
			}

			return this.components.filter(item => {
				const found = this.ready.component.find(x => x.product.id === item.product.id)

				return !found || !found.quantity
			})
		},
		filteredDeviceInstaces() {
			if(!this.deviceInstances) {
				return null
			}

			return this.deviceInstances.filter(x => {
				const found = this.ready.device.find(item => item.id === x.id)

				return found ? found.quantity === 0 : x.status.id === 1
			})
		},
		formItemOptions() {
			return {
				rules: [{ required: true, message: 'Заполните обязательное поле!' }]
			}
		},
		uniqDevices() {
			return _.uniqBy(this.ready.device.filter(x => x.quantity), x => x.product.id)
		},
		selectedSNFromIndex() {
			if(!this.device.snFrom) {
				return null
			}

			return this.filteredDeviceInstaces.findIndex(x => x.id === this.device.snFrom)
		},
		modalTitle() {
			return 'Списать как проданные'
		},
		devices() {
			if(!this.data) {
				return null
			}

			return this.data.filter(x => x.category.id === StorageCategory.Device)
		},
		components() {
			if(!this.data) {
				return null
			}

			return this.data.filter(x => x.category.id === StorageCategory.Component)
		},
	},
	methods: {
		allowAddQuantity(item) {
			return !this.data.find(x => x.product.id === item.product.id).quantity
		},
		handleSnTo() {
			this.device.snTo = null
		},
		removeComponentQuantity(item) {
			item.quantity -= 1
			this.data.find(x => x.product.id === item.product.id).quantity += 1
		},
		addComponentQuantity(item) {
			item.quantity += 1
			this.data.find(x => x.product.id === item.product.id).quantity -= 1
		},
		isLoadingDoc(fileId) {
			return !!this.downloadingDocs.find(id => id === fileId)
		},
		async download(file) {
			this.downloadingDocs.push(file.id)

			const fileContent = await this.$api.sale.getFile(this.saleId, file.id)

			const blob = new Blob([fileContent], {
				type: mime.getType(file.name)
			})

			saveFile(blob, file.name)

			const index = this.downloadingDocs.findIndex(id => id === file.id)

			if(~index) {
				this.downloadingDocs.splice(index, 1)
			}
		},
		removeRealFile(fileId) {
			this.$confirm({
				title: 'Подтвердите действие',
				content: 'Файл будет безвозвратно удален',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.sale.removeFile(this.saleId, fileId)

					const index = this.sale.files.findIndex(x => x.id === fileId)

					if(~index) {
						this.sale.files.splice(index, 1)
					}
				},
				onCancel() {},
			})
		},
		removeFile() {
			this.file = null
		},
		pickFile({ file }) {
			if(!file) {
				return
			}

			if(file.status === 'removed') {
				return
			}

			this.files.push(file)
		},
		removeDevice(device) {
			const array = this.ready.device
				.map(item => {
					if(item.product.id === device.product.id) {
						if(item.quantity) {
							item.quantity = 0
						} else {
							// return null                            
						}
					}

					return item
				})

			this.$set(this.ready, 'device', array)
		},
		async save() {
			
			this.form.validateFields(async (err, form) => {
				if(err) {
					return
				}

				if(!(this.ready.component.length || this.ready.device.length)) {
					this.$error({
						title: "Списание не содержит элементов"
					})

					return
				}

				this.loadingModal = true

				const saveObject = {
					subject: form.subject,
					comments: form.comments,
					balancerItems: this.ready.device,
					productItems: this.ready.component,
					saleType: {
						id: form.saleType
					}
				}

				let saleId = this.saleId

				if(saleId) {
					await this.$api.sale.updateSale(saleId, saveObject)
				} else {
					const { id } = await this.$api.sale.addSale(saveObject)
					saleId = id
				}

				await this.files.reduce(async (defer, file) => {
					await defer
					return this.$api.sale.addFile(saleId, file)
				}, Promise.resolve())

				this.loadingModal = false

				this.close()
				this.$bus.$emit('route:reload')
			})
		},
		removeComponent(productId) {
			const index = this.ready.component.find(x => x.product.id === productId)

			if(~index) {
				this.ready.component.splice(index, 1)
			}
		},
		checkQuantity(productId, quantity) {
			return this.components.find(x => x.product.id === productId).quantity < quantity + 1
		}, 
		countDeviceById(productId) {
			return this.ready.device.filter(x => x.product.id === productId && x.quantity).length
		},
		openDeviceSN(productId, device) {
			
			this.$info({
				title: 'Серийные номера',
				content: h => {
					const snList = this.ready.device.filter(x => x.product.id === productId && x.quantity).map(x => x.serialNumber)

					return h('div', {}, [
						snList.map(str => h('div', { style: { marginBottom: '6px' }}, [
							str,
							h('a-button', {
								props: {
									size:"small", type: "danger", icon: "close", style: "margin-left: 2px;"
								},
								on: {
									click: () => {
										this.$confirm({
											title: 'Подтвердите действие',
											content: 'Отменить списание устройства?',
											okText: 'Удалить',
											cancelText: 'Отмена',
											onOk: async () => {
												const array = this.ready.device
													.map(item => {
														if(item.serialNumber === str) {
															if(item.quantity) {
																item.quantity = 0
															} else {
																// return null                            
															}
														}

														return item
													})

												this.$set(this.ready, 'device', array)
											},
											onCancel() {},
										})
									}
								},
								style: "margin-left: 6px;"
							})
						])),
					])
				},
			});  
		},
		hasComponent(productId) {
			return this.ready.component.find(x => x.product.id === productId)
		},
		addComponent() {
			const component = this.components.find(x => x.product.id === this.selectedComponent)

			this.ready.component.push({ ...component, quantity: 1 })

			const item = this.data.find(x => x.product.id === component.product.id)

			if(item) {
				this.$set(item, 'quantity', item.quantity - 1)
			}


			this.selectedComponent = null
		},
		addDevice() {
			const indexFrom = this.filteredDeviceInstaces.findIndex(x => x.id === this.device.snFrom)
			const indexTo = this.filteredDeviceInstaces.findIndex(x => x.id === this.device.snTo)
			let range = ~indexTo ? this.filteredDeviceInstaces.slice(indexFrom, indexTo + 1) : [this.filteredDeviceInstaces[indexFrom]]

			range = range.map(item => ({ ...item, quantity: 1 }))

			range.forEach(item => {
				const index = this.ready.device.findIndex(x => x.id === item.id)

				if(~index) {
					this.ready.device.splice(index, 1, item)
				} else {
					this.ready.device.push(item)
				}
			})

			// this.ready.device = _.uniqBy(this.ready.device.concat(range), x => x.id)

			console.log(JSON.parse(JSON.stringify(this.ready.device.map(({ id, quantity, serialNumber }) => ({ id, quantity, serialNumber })))))

			// const def = this.data.find(x => x.product.id === this.device.selected)

			// def.quantity = def.quantity - range.length

			this.device.snFrom = null
			this.device.snTo = null
		},
		async handleChangeDevice(deviceId) {
			this.deviceInstances = null
			this.device.snFrom = null
			this.device.snTo = null
			this.device.selected = deviceId

			this.deviceInstances = (await this.$api.product.getProductCopiesList(deviceId))
		},
		async fetch() {
			this.data = (await this.$api.product.getProductsSummary())
				.filter(x => x.status.id === ItemState.InStorage)

			if(this.saleId) {
				const sale = await this.$api.sale.getSaleById(this.saleId)

				this.sale = {
					...sale,
					saleType: sale.saleType ? sale.saleType.id : null
				}

				this.ready.device = this.sale.balancerItems.map((x => {
					x.product = x.balancer
					delete x.balancer
					return x
				}))

				this.ready.component = this.sale.productItems
				
				this.form.setFieldsValue(this.sale)
			} else {
				if(this.saleTypeId) {
					this.form.setFieldsValue({
						saleType: this.saleTypeId
					})
				}
			}
		},
		close() {
			this.$emit('close')
		}
	}
}
</script>

<style lang="scss" scoped>
	.uploader {
		display: flex;
		flex-direction: column;
		
		&__name {
			// margin-left: 12px;
		}

		&__icon {
			margin-right: 6px;
		}
	}

	.card {
		display: flex;
		margin-bottom: 12px;

		&__left {
			flex-basis: 40%;
			padding-right: 20px;
			flex-shrink: 0;
			flex-grow: 1;
		}

		&__right {
			flex-grow: 0;
			flex-basis: 50%;
			display: flex;
			flex-direction: column;
			border-radius: 5px;
			border: 1px solid #ddd;

			h4 {
				margin: 0;
				padding: 4px 0;
				text-align: center;
			}
		}
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;

		li {
			padding: 6px 16px;
			border: 1px solid #ddd;
			border-left: none;
			border-right: none;

			&:last-child {
				margin-bottom: 12px;
			}
		}
	}
	
</style>