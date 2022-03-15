<template lang="pug">
	a-modal(
		:title="modalTitle"
		:visible="true"
		@cancel="close"
		cancelText="Закрыть"
		:width="700"
		:footer="null"
	)
		a-spin(:spinning="loading")
		a-tabs
			a-tab-pane(key="serials" tab="Серийные номера")
				a-list(bordered :pagination="pagination" :dataSource="productList" :locale="$lang")
					a-list-item(slot="renderItem" slot-scope="item")
						div(:class="$style.item")
							div(:class="$style.item__title") {{item.serialNumber}}
							div(:class="$style.item__actions")
								a-button(v-if="item.fileID" @click="downloadFile(item.fileID)" :loading="!!~downloadingDocs.indexOf(item.fileID)" size="small" type="primary") Скачать файл
								a-button(v-else @click="attachFile(item)" :loading="!!~downloadingDocs.indexOf(item.id)" size="small") Прикрепить файл

			a-tab-pane(key="docs" tab="Документы")
				a-list(bordered :pagination="pagination" :dataSource="fileIds" :locale="$lang")
					a-list-item(slot="renderItem" slot-scope="fileId")
						a-list-item-meta(
							:title="files[fileId].name"
							:description="files[fileId].comments"
						)

						template(#actions)
							a-button(@click="downloadFile(fileId)" :loading="!!~downloadingDocs.indexOf(fileId)" size="small" type="primary") Скачать файл
</template>

<script>
import { ProductStatuses } from '@/common'
import saveFile from 'file-saver'
import { compact, uniq } from 'lodash'
import mime from 'mime'
import dayjs from 'dayjs'

export default {
	props: ['device'],
	data() {
		return {
			files: [],
			downloadingDocs: [],
			uploadingDocs: [],
			productList: [],
			loading: true,
			ProductStatuses,
			pagination: {
				pageSize: 10,
			},
		}
	},
	async mounted() {
		this.onLoad()
	},
	methods: {
		async onLoad() {
			this.loading = true
			
			const products = await this.$api.product.getProductCopiesList(this.device.id, this.ProductStatuses.Storage)

			this.productList = products.sort((a, b) => {
				return dayjs(a.status.from).isBefore(dayjs(b.status.from)) ? 1 : -1
			})

			if(this.fileIds.length) {
				const files = await this.$api.file.getFileMetaArray(this.fileIds)
				this.files = files.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
			}

			this.loading = false
		},
		close() {
			this.$emit('close')
		},
		getFile(serialNumber) {
			return this.productList.find(x => x.serialNumber === serialNumber).fileID
		},
		async downloadFile(fileId) {
			const itemsAddon = this.productList.filter(x => x.fileID === fileId).map(x => x.serialNumber).join(', ')

			this.downloadingDocs.push(fileId)
			const fileName = this.files[fileId].name

			const fileContent = await this.$api.file.getFile(fileId)

			const blob = new Blob([fileContent], {
				type: mime.getType(fileName)
			})

			saveFile(blob, fileName.replace(/(\.[^.]+$)/i, `${itemsAddon ? ' - ' + itemsAddon : ''}$1`))

			const index = this.downloadingDocs.findIndex(id => id === fileId)

			if(~index) {
				this.downloadingDocs.splice(index, 1)
			}
		},
		attachFile(item) {
			this.$bus.$emit('modal', {
				component: 'AddFileModal',
				options: {
					title: 'Добавление файла',
					desc: 'Прикрепите основание появление устройств на складе'
				},
				on: {
					save: async file => {
						const index = this.uploadingDocs.push(item.id) - 1

						const { resultCode: fileID } = await this.$api.file.uploadFile(this.$fileToFormData(file))

						await this.$api.product.updateProductItem(item.id, { ...item, fileID })

						this.uploadingDocs.splice(index, 1)
						this.onLoad()
					}
				}
			})
		}
	},
	computed: {
		fileIds() {
			return uniq(
				compact(
					this.productList.map(item => item.fileID)
				)
			)
		},
		modalTitle() {
			return `Серийные номера ${this.device.name}`
		}
	}
}
</script>

<style lang="scss" module>
.item {
	display: flex;
	width: 100%;

	&__title {
		flex-grow: 1;
	}

	&__actions {
		margin-left: auto;
	}
}
</style>