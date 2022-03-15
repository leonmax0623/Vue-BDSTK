<template lang="pug">
	a-modal(
		:confirmLoading="loading"
		title="Создание тикета"
		:visible="true"
		@ok="save"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		:width="700"
		class="modal"
	)
		TicketForm(
			ref="ticketForm"
			:client="client"
			:loadingClient="loadingClient"
			@loadClient="findClient"
		)
</template>

<script>
import { get } from 'lodash'

export default {
	data() {
		return {
			loadingClient: false,
			loading: false,

			client: null,
		}
	},
	methods: {
		async findClient({ vlan, sn }) {
			this.client = null

			try {
				this.loadingClient = true
				const item = await this.$api.ticket.findClient({ vlan, sn })
				this.client = item.order
	
				console.log(this.client)

			} catch(e) {
				// this.$notification.error({ message: 'Данные не найдены' })
				
			} finally {
				this.loadingClient = false
			}
		},
		close() {
			this.$emit('close')
		},
		save() {
			if(!get(this.client, 'balancer.serialNumber')) {
				this.$notification.error({ message: 'Невозможно создать заявку без активного БН' })
				return
			}
			
			this.$refs.ticketForm.$refs.formRef.validate(async (valid) => {
				if(!valid) {
					return
				}

				const form = this.$refs.ticketForm.form

				if(!this.client) {
					this.$notification.error({ message: 'Необходимо прикрепить заказ' })

					return
				}


				this.loading = true


				const ticket = await this.$api.ticket.create({
					troubleTypeID: form.troubleTypeID,
					orderID: this.client.id,
					troubleDate: form.troubleDate.toDate(),
					comments: form.comments,
					severityID: form.severity,
					balancerState: {
						id: form.balancerStateID,
					},
				})


				this.loading = false
				this.$notification.success({ message: 'Новый тикет создан' })
				this.$emit('created', ticket.id)
				this.close()
			})
		}
	},
}
</script>