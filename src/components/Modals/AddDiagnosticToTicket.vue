<template lang="pug">
	a-modal(
		title="Добавление диагностики"
		:visible="true"
		@ok="submit"
		@cancel="close"
		okText="Добавить"
		cancelText="Отмена"
		:width="700"
		class="modal"
		:okButtonProps="okButtonProps"
	)
		a-form-model(ref="formRef" :model="form" :rules="rules" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
			template(v-if="filtered_types.length")
				a-form-model-item(label="Тип диагностики" prop="diagnosticId")
					a-select(:loading="!ticket_diagnostics" v-model="form.diagnosticId")
						a-select-option(:value="item.id" v-for="item of filtered_types" :key="item.id") {{item.name}}

					div(v-if="ticket_diagnostics && form.diagnosticId")
						a(
							target="_blank"
							v-if="ticket_diagnostics.find(x => x.id === form.diagnosticId).wiki"
							:href="ticket_diagnostics.find(x => x.id === form.diagnosticId).wiki"
						)
							a-icon(type="exclamation-circle")
							span(style="margin-left: 6px") wiki

				a-form-model-item(label="Комментарий" prop="comments")
					a-textarea(v-model="form.comments")

				a-form-model-item(label="Файл" prop="file")
					a-tag(v-if="form.file") {{form.file.name}}
						a-button(icon="close" size="small" type="link" @click="removeFile")
					a-upload(
						v-else
						name="file"
						@change="pickFile"
						:beforeUpload="() => false"
						:remove="removeFile"
						:showUploadList="false"
					)
						a-button
							a-icon(type="upload")
							span Выбрать файл
			a-result(
				v-else
				status="error"
				title="Невозможно добавить диагностику"
				sub-title="Все доступные диагностики уже добавлены к заявке"
			)
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
	props: {
		ticket: {},
		id: {}
	},
	data: () => ({
		loading: false,
		addingDiagnostic: false,
		form: {
			diagnosticId: null,
			comments: null,
			file: null,
		},
		rules: {
			diagnosticId: [{ required: true, message: 'Введите тип диагностики' }],
			comments: [{ required: true, message: 'Введите комментарий' }],
		},
	}),
	async created() {
		await Promise.all([this.loadTicketDiagnostics()])

		if(this.id) {
			console.log(this.id)
			this.form.diagnosticId = this.id
		}
	},
	computed: {
		...mapState('constant', ['ticket_diagnostics']),
		ticketId() {
			return this.ticket.id
		},
		filtered_types() {
			return this.ticket_diagnostics.filter(x => !this.ticket.diags.find(y => y.diagnostics.id === x.id))
		},
		
		okButtonProps() {
			return {
				props: {
					loading: this.loading,
					disabled: !this.filtered_types.length
				}
			}
		}
	},
	methods: {
		...mapActions('constant', ['loadTicketDiagnostics']),
		submit() {
			this.$refs.formRef.validate(async valid => {
				if(!valid) {
					return
				}

				this.loading = true

				const response = await this.$api.ticket.addDiagnosticToTicket(this.ticketId, {
					diagnostics: {
						id: this.form.diagnosticId,
					},
					comments: this.form.comments,
					ticketID: this.ticketId
				})

				
				if(response.resultCode && this.form.file) {
					const formData = new FormData()
					formData.append('file', this.form.file)
					await this.$api.ticket.attachFileToDiag(this.ticketId, response.resultCode, formData)
				}

				this.close()

				this.$emit('save')

				this.loading = false

				this.form = {
					diagnosticId: null,
					comments: null,
					file: null,
				}
				
				this.addingDiagnostic = false
			})
		},
		
		pickFile({ file }) {
			if(!file) {
				return
			}

			if(file.status === 'removed') {
				return
			}

			this.form.file = file
		},
		removeFile() {
			this.form.file = null
		},

		close() {
			this.$emit('close')
		},
	}
}
</script>