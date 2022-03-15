<template lang="pug">
	Page
		SubHeader(slot="sub-header" title="Склад")
			.actions
				
				a-input(
					placeholder="Поиск..."
					v-model="searchQuery"
					enterButton
					allowClear
					style="width: 300px"
				)

				a-button(
					v-if="getAccess('Storage.ControlPositions').access && ~['DEVICES', 'PARTS'].indexOf(activeTab)"
					type="primary"
					@click="modalPositionManagement"
					icon="ordered-list"
				) Управление позициями

		a-spin(:spinning="loading")
			a-tabs(type="card" class="--nogap" @change="tabChange" v-model="activeTab")
				a-button(
					v-if="getAccess('Storage.WriteOff').access && !~['KITS'].indexOf(activeTab)"
					slot="tabBarExtraContent"
					type="primary"
					@click="bypass"
					icon="pic-left"
				) Списать
					

				a-button(
					v-if="getAccess('Storage.Kits').isFullAccess && ~['KITS'].indexOf(activeTab)"
					slot="tabBarExtraContent"
					type="primary"
					@click="$refs.kits.updateKit()"
					icon="plus"
				) Создать комплект

				a-tab-pane(tab="Устройства" key="DEVICES" v-if="getAccess('Storage.Equip').access")
					a-table(
						bordered
						rowKey="id"
						:loading="!devicesData"
						:dataSource="filteredData"
						:pagination="pagination"
					)
						a-table-column(title="Наименование" dataIndex="name" key="name")
						a-table-column(title="Количество" dataIndex="quantity" key="quantity")
						a-table-column(title="S/N" dataIndex="id" key="showDetails")
							template(slot-scope="id")
								span
									a-button(
										size="large"
										type="primary"
										@click="modalSerialNumbers(id)"
										icon="zoom-in"
									) Посмотреть
						
						a-table-column(title="Управление" dataIndex="id" key="manage" v-if="getAccess('Storage.Equip').isFullAccess")
							template(slot-scope="id")
								span
									a-button(
										size="large"
										type="primary"
										@click="modalBalancerManagement(id)"
										icon="sliders"
										:disabled="!allowEdit('Storage')"
									) Управление

						//- a-table-column(title="Документы" dataIndex="id" key="docs")
							template(slot-scope="id")
								a-button(type="primary" @click="openDocs(id)") Открыть документы

				a-tab-pane(tab="Комплектующие" key="PARTS" v-if="getAccess('Storage.Complect').access")
					a-table(
						rowKey="id"
						bordered 
						:loading="!partsData"
						:dataSource="filteredData"
						:pagination="pagination"
					)
						a-table-column(title="Наименование" dataIndex="name" key="name")
						a-table-column(title="Количество" dataIndex="quantity" key="quantity")

						a-table-column(title="Добавить" dataIndex="id" key="add" v-if="getAccess('Storage.Complect').isFullAccess")
							template(slot-scope="id")
								a-input-group(size="large")
									a-row(:gutter="10")
										a-col(:span="10")
											a-input(placeholder="Количество" v-model="addPartsCounters[id]")
										a-col(:span="10")
											a-button(
												size="large"
												type="primary"
												@click="addParts(id, addPartsCounters[id])"
												icon="plus"
											) Добавить

						a-table-column(title="Забрать" dataIndex="id" key="takeAway" v-if="getAccess('Storage.Complect').isFullAccess")
							template(slot-scope="id")
								a-input-group(size="large")
									a-row(:gutter="10")
										a-col(:span="10")
											a-input(placeholder="Количество" v-model="removePartsCounters[id]")
										a-col(:span="10")
											a-button(
												size="large"
												type="primary"
												@click="removeParts(id, removePartsCounters[id])"
												icon="minus"
											) Удалить

						a-table-column(title="Документы" dataIndex="id" key="docs")
							template(slot-scope="id")
								a-button(@click="openDocsForPart(id)" type="primary") Документы

				a-tab-pane(tab="Комплекты" key="KITS" v-if="getAccess('Storage.Kits').access")
					StorageKits(ref="kits")

				a-tab-pane(tab="Продажи, ремонт, потери" key="SALES" v-if="getAccess('Storage.Sales').access")
					StorageSales(:query="searchQuery")

				template(v-if="saleTypes && getAccess('Storage.Sales').access")
					a-tab-pane(
						v-for="tab of saleTypes"
						:tab="tab.name"
						:key="tab.id.toString()"
					)
						StorageSales(:query="searchQuery" :typeId="tab.id")
</template>

<script>
import _ from 'lodash'
import { ProductCategories, ProductStatuses } from '@/common'
import { mapGetters, mapState, mapActions } from 'vuex'
import { compact, uniq } from 'lodash'

export default {
	data() {
		return {
			loading: true,
			ProductCategories,
			ProductStatuses,
			pagination: false,
			activeTab: null,
			devicesData: [],
			partsData: [],
			searchQuery: '',
			addPartsCounters: {},
			removePartsCounters: {},
		}
	},
	async created() {
		const map = {
			DEVICES: 'Storage.Equip',
			PARTS: 'Storage.Complect',
			SALES: 'Storage.Sales'
		}

		this.activeTab = Object
			.keys(map)
			.find(key => this.getAccess(map[key]).access)

		
		await Promise.all([
			this.loadSaleTypes(),
			this.fetchTablesData()
		])

		this.$nextTick(() => {
			if(this.$route.query.tab) {
				this.activeTab = this.$route.query.tab
			}
		})
	},
	computed: {
		...mapGetters('app', ['allowEdit', 'getAccess']),
		...mapState('app', ['saleTypes']),
		filteredData() {
			const sourceData = this.activeTab === 'DEVICES' ? this.devicesData : this.partsData
			
			if(this.searchQuery.length > 2) {
				return _.filter(sourceData, (row) => {
					return Object.keys(row).some(key => {
						if(!row[key] || !['name', 'quantity'].includes(key)) {
							return false
						}
						const field = String(row[key])
						if(field.toLowerCase().includes(this.searchQuery.toLowerCase())) {
							return true
						}
						return false
					})
				})
			} else {
				return sourceData
			}
		}
	},
	methods: {
		...mapActions('app', ['loadSaleTypes']),
		async openDocsForPart(id) {
			const item = this.filteredData.find(x => x.id === id)
			const res = await this.$api.product.getProductCopiesList(id)

			this.$bus.$emit('modal', {
				component: 'StorageItemFiles',
				options: {
					fileIds: compact(uniq(res.map(item => item.fileID))),
					for: item.name,
					items: res
				}
			})
		},
		// openDocs(id) {
		// 	this.$bus.$emit('modal', {
		// 		component: 'StorageSerialNumbers',
		// 		options: {
		// 			device: _.find(this.filteredData, x => x.id === id)
		// 		}
		// 	})
		// },
		bypass() {
			const saleTypeId = parseInt(this.activeTab)


			this.$bus.$emit('modal', {
				component: 'StorageBypass',
				options: {
					saleTypeId: !isNaN(saleTypeId) && saleTypeId
				}
			})
		},
		async fetchTablesData() {
			this.loading = true
			const productsSummary = (await this.$api.product.getProductsSummary()).filter(x => x.status.id === ProductStatuses.Storage)

			this.devicesData = []
			this.partsData = []

			_.forEach(productsSummary, (item) => {
				switch (item.category.id) {
					case this.ProductCategories.Device:
						this.devicesData.push({...item.product, quantity: item.quantity})
						break
					case this.ProductCategories.Part:
						if (item.status.id === this.ProductStatuses.Storage || !item.status.id) {
							this.partsData.push({...item.product, quantity: item.quantity})
						}
						break
				}
			})
			this.loading = false
		},
		tabChange(tab) {
			this.$router.replace({ query: { tab } })
			this.searchQuery = ''

			// switch(this.activeTab) {
			// 	case 'DEVICES':
			// 		this.filteredData = this.devicesData
			// 		break
			// 	case 'PARTS':
			// 		this.filteredData = this.partsData
			// 		break
			// }
		},
		modalSerialNumbers(id) {
			this.$bus.$emit('modal', {
				component: 'StorageSerialNumbers',
				options: {
					device: _.find(this.filteredData, x => x.id === id)
				}
			})
		},
		modalPositionManagement(id) {
			this.$bus.$emit('modal', {
				component: 'PositionManagement',
				on: {
					submit: () => {
						this.fetchTablesData()
					},
					close: () => {
						this.fetchTablesData()
					}
				}
			})
		},
		modalBalancerManagement(id) {
			this.$bus.$emit('modal', {
				component: 'BalancerManagement',
				options: {
					device: _.find(this.filteredData, x => x.id === id)
				},
				on: {
					managed: () => {
						this.fetchTablesData()
					}
				}
			})
		},
		async addParts(id, count) {
			if(!count) {
				this.$notification.error({ message: 'Необходимо указать колличество' })
				return
			}

			this.$confirm({
				title: `Добавить ${count} позиций?`,
				okText: 'Добавить',
				cancelText: 'Отмена',
				onOk: async () => {
					this.$bus.$emit('modal', {
						component: 'AddFileModal',
						options: {
							title: 'Добавление файла',
							desc: 'Прикрепите основание появление комплектующих'
						},
						on: {
							save: async file => {
								this.loading = true

								try {
									const { resultCode: fileID } = await this.$api.file.uploadFile(this.$fileToFormData(file))
									
									await this.$api.product.generateProducts(id, +count, fileID)
									await this.fetchTablesData()
									this.addPartsCounters[id] = ''

									this.$notification.success({ message: this.filteredData.find(x => x.id === id).name,  description: `добавлено ${count}шт.` })
								} catch(e) {

								} finally {
									this.loading = false
								}
							}
						}
					})
				},
				onCancel() {},
			});
		},
		async removeParts(id, count) {
			if(!count) {
				this.$notification.error({ message: 'Необходимо указать колличество' })
				return
			}

			if(!this.filteredData.find(x => x.id === id).quantity) {
				this.$notification.error({ message: 'Позиция не содержит достаточно экземпляров' })
				return
			}

			
			this.$confirm({
				title: `Удалить ${count} позиций?`,
				okText: 'Добавить',
				cancelText: 'Отмена',
				onOk: async () => {
					this.loading = true

					try {
						await this.$api.product.removeProducts(id, +count)
						await this.fetchTablesData()
						this.removePartsCounters[id] = ''
						this.$notification.success({ message: this.filteredData.find(x => x.id === id).name,  description: `Удалено ${count}шт.` })
					} catch {

					} finally {
						this.loading = false
					}
				},
				onCancel() {},
			});
		}
	}
}
</script>