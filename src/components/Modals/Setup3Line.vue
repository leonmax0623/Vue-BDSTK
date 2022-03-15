<template lang="pug">
	a-modal(
		title="3 линия"
		visible
		:width="700"
		@ok="save"
		@cancel="close"
		:loading="loading"
		okText="Передать"
		:okButtonProps="okButtonProps"
	)
		a-spin(:spinning="loading")
			a-form-model(ref="formRef" :model="form" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" class="--label-left")
				a-form-model-item(:label="names.Bitrate" prop="Bitrate")
					a-input(v-model="form.Bitrate")
				a-form-model-item(:label="names.Rtt" prop="Rtt")
					a-input(v-model="form.Rtt")
				a-form-model-item(:label="names.Jitter" prop="Jitter")
					a-input(v-model="form.Jitter")

				.group
					.group__name.ant-col.ant-col-6 Lose
					.group__content

						a-form-model-item(label="M1" prop="LoseM1")
							a-input(v-model="form.LoseM1")
						a-form-model-item(label="M2" prop="LoseM2")
							a-input(v-model="form.LoseM2")
						a-form-model-item(label="M3" prop="LoseM3")
							a-input(v-model="form.LoseM3")
						a-form-model-item(label="M4" prop="LoseM4")
							a-input(v-model="form.LoseM4")

				a-form-model-item(label="Файлы" prop="files")
					div(style="display: flex; flex-wrap: wrap; align-items: center; margin-top: 12px;")
						a-tag(v-for="file of form.files" :key="file.name" style="margin-bottom: 2px;") {{file.name}}
							a-button(icon="close" size="small" type="link" @click="removeFile(file)")


					a-upload(
						name="file"
						@change="pickFile"
						:beforeUpload="() => false"
						:showUploadList="false"
					)
						a-button(:disabled="form.files.length > 1")
							a-icon(type="upload")
							span Выбрать файл

				a-form-model-item(:label="names.comments" prop="comments")
					a-textarea(v-model="form.comments" :autoSize="{ minRows: 4, maxRows: 12 }")
</template>

<script>
export default {
	props: ['process'],
	data() {
		return {
			loading: false,
			form: {
				Bitrate: null,
				Rtt: null,
				Jitter: null,
				LoseM1: null,
				LoseM2: null,
				LoseM3: null,
				LoseM4: null,
				comments: null,
				files: [],
			}
		}
	},
	computed: {
		okButtonProps() {
			return {
				props: {
					loading: this.loading,
				}
			}
		},
		names() {
			return {
				Bitrate: 'Bitrate',
				Rtt: 'Rtt',
				Jitter: 'Jitter',
				LoseM1: 'M1',
				LoseM2: 'M2',
				LoseM3: 'M3',
				LoseM4: 'M4',
				comments: 'Комментарий'
			}
		},
		rules() {
			return {
				Bitrate: [{ required: true, message: 'Заполните поле' }],
				Rtt: [{ required: true, message: 'Заполните поле' }],
				Jitter: [{ required: true, message: 'Заполните поле' }],
				LoseM1: [{ required: true, message: 'Заполните поле' }],
				LoseM2: [{ required: true, message: 'Заполните поле' }],
				LoseM3: [{ required: true, message: 'Заполните поле' }],
				LoseM4: [{ required: true, message: 'Заполните поле' }],
				// comments: [{ required: true, message: 'Заполните поле' }],
			}
		}
	},
	methods: {
		removeFile({ uid }) {
			const index = this.form.files.find(x => x.uid === uid)

			if(~index) {
				this.form.files.splice(index, 1)
			}
		},
		pickFile({ file }) {
			if(!file) {
				return
			}

			if(file.status === 'removed') {
				return
			}

			this.form.files.push(file)
		},
		close() {
			this.$emit('close')
		},
		async save() {
			this.$refs.formRef.validate(async valid => {
				if(!valid) {
					return
				}
				this.loading = true

				await this.process({
					form: this.form,
					names: this.names,
				})

				this.loading = false

				this.close()
			})
		}
	},
}
</script>

<style lang="scss" scoped>
	.group {
		display: flex;

		&__content {
			flex-grow: 1;
		}
	}
</style>