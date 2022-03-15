<template lang="pug">
	a-modal(
		:title="title"
		:visible="true"
		:width="500"
		@cancel="close"
	)
		a-upload-dragger(
			name="file"
			@change="pickFile"
			:beforeUpload="() => false"
			:fileList="file ? [file] : []"
			:remove="removeFile"
		)
			
			p.ant-upload-drag-icon
				a-icon(type="inbox")
			p.ant-upload-text(v-if="desc") {{desc}}
			p.ant-upload-hint Нажмите или перетащите файл в зону загрузки


		template(slot="footer")
			a-button(key="cancel" @click="close") Отмена
			a-button(key="save" @click="save" type="primary" :disabled="!file") Сохранить
</template>

<script>
export default {
	props: {
		title: String,
		desc: String,
	},
	data: () => ({
		file: null
	}),
	methods: {
		close() {
			this.$emit('close')
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

			this.file = file
		},
		save() {
			this.$emit('save', this.file)
			this.close()
		}
	}
}
</script>

<style lang="scss" module>
.upload {
	width: 100%;
	display: block;
}
</style>