<template lang="pug">
	a-modal(
		:title="modalTitle"
		:visible="true"
		@cancel="close"
		cancelText="Закрыть"
		:width="700"
		:footer="null"
	)
		a-list(bordered :pagination="pagination" :dataSource="fileIds" :locale="$lang")
			template(#renderItem="fileId")
				a-spin(:spinning="!files[fileId]")
					a-list-item
						a-list-item-meta(
							v-if="files[fileId]"
							:title="files[fileId].name"
							:description="files[fileId].comments"
						)

						template(#actions)
							a-button(@click="downloadFile(fileId)" :loading="!!~downloadingDocs.indexOf(fileId)") Скачать файл
</template>

<script>
import saveFile from 'file-saver'
import mime from 'mime'

export default {
	props: ['fileIds', 'for', 'items'],
	data() {
		return {
			downloadingDocs: [],
			loading: true,
			pagination: {
				pageSize: 10,
			},
			files: {}
		}
	},
	async mounted() {
		if(this.fileIds.length) {
			const files = await this.$api.file.getFileMetaArray(this.fileIds)
			this.files = files.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
		}
	},
	methods: {
		close() {
			this.$emit('close')
		},
		async downloadFile(fileId) {
			const quantity = this.items.filter(x => x.fileID === fileId).length

			this.downloadingDocs.push(fileId)
			const fileName = this.files[fileId].name

			const fileContent = await this.$api.file.getFile(fileId)

			const blob = new Blob([fileContent], {
				type: mime.getType(fileName)
			})

			saveFile(blob, fileName.replace(/(\.[^.]+$)/i, `$ ${quantity} - ${this.for}$1`))

			const index = this.downloadingDocs.findIndex(id => id === fileId)

			if(~index) {
				this.downloadingDocs.splice(index, 1)
			}
		},
	},
	computed: {
		modalTitle() {
			return `Документы для ${this.for}`
		}
	}
}
</script>

<style lang="scss" >

</style>