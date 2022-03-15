<template lang="pug">
	a-form-model.simpleform(
		ref="ruleForm"
		:model="form"
		:rules="rules"
	)
		a-card
			template(v-if="!hideCloseCheck")
				a-checkbox(slot="title" :checked="closing" @input="handleClosingCheckbox"  :disabled="loading" ) Закрывающий

				a-form-model-item(prop="reason" slot="extra")
					a-select(
						:disabled="!closing || loading"
						v-model="form.reason"
						readonly
						:loading="fetching_ticket_reasons"
						style="margin-left: auto; width: 200px;"
					)
						a-select-option(:value="item.id" v-for="item of ticket_reasons" :key="item.id") {{item.name}}

			a-form-model-item(prop="comments")
				a-textarea(v-model="form.comments" placeholder="Комментарий" :disabled="loading")

			div(style="display: flex; justify-content: flex-end; align-items: center; margin-top: 12px;")
				a-tag(v-if="file") {{file.name}}
					a-button(icon="close" size="small" type="link" @click="removeFile")

				a-upload(
					v-else
					name="file"
					@change="pickFile"
					:beforeUpload="() => false"
					v-decorator="['file']"
					:remove="removeFile"
					:showUploadList="false"
				)
					a-button
						a-icon(type="upload")
						span Выбрать файл
				a-button(type="primary" style="margin-left: 12px;" @click="send" :loading="loading") Отправить
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
	props: {
		ticket: {},
		allowClose: Boolean,
		hideCloseCheck: Boolean,
	},
	data: () => ({
		loading: false,
		closing: false,
		types: null,

		form: {
			reason: null,
			comments: '',
		},

		file: null,
	}),
	async created() {
		await Promise.all([
			this.loadTicketStatuses(),
			this.load_ticket_reasons(),
		])
	},
	computed: {
		...mapState('constant', ['ticket_statuses', 'fetching_ticket_reasons', 'ticket_reasons']),
		rules() {
			return {
				reason: [
					{
						required: this.closing,
						message: 'Выберите статус',
					}
				],
				comments: [
					{
						required: !this.closing,
						message: 'Введите комментарий',
					}
				],
			}
		}
	},
	methods: {
		...mapActions('constant', ['loadTicketStatuses', 'load_ticket_reasons']),
		handleClosingCheckbox(value) {
			if(value && !this.allowClose) {
				this.$notification.error({ message: 'Заполните все обязательные диагностики!' })
				return
			} else {
				this.closing = value
			}
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
		send() {
			


			this.$refs.ruleForm.validate(async (valid) => {
				if(!valid) {
					return
				}

				this.loading = true

				let response

				if(this.closing) {
					response = await this.$api.ticket.closeTicket({
						ticketID: this.ticket.id,
						comments: this.form.comments,
						closeCommentsID: this.form.reason,
					})
				} else {
					response = await this.$api.ticket.addStep(this.ticket.id, {
						ticketID: this.ticket.id,
						comments: this.form.comments,
						// statusID: this.form.status
					})
				}

				if(this.file) {
					const formData = new FormData()
					formData.append('file', this.file)
					await this.$api.ticket.attachFileToStep(this.ticket.id, response.id, formData)
				}

				const ticket = await this.$api.ticket.getTicketById(this.ticket.id)

				this.$emit('saved', ticket)

				this.form.status = null
				this.closing = false
				this.form.comments = ''
				this.file = null

				this.loading = false
			})
		}
	}
}
</script>