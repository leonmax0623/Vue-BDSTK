<template lang="pug">
	a-modal(
		title="Блокировка сим"
		:visible="true"
		@ok="save"
		@cancel="close"
		okText="Заблокировать"
		cancelText="Отмена"
		:width="700"
		class="modal"
		:okButtonProps="okButtonProps"
	)
		p Следующие СИМ будут отправлены на блокировку:
		a-table(
			:loading="!sim"
			:columns="columns"
			:dataSource="sim"
			:locale="locale"
		)
</template>

<script>
const columns = [
	{
		title: 'MSISDN',
		dataIndex: 'msisdn'
	},
	{
		title: 'ICCID',
		dataIndex: 'iccid'
	},
	{
		title: 'IP',
		dataIndex: 'ip'
	}
]

export default {
	props: ['sim'],
	data() {
		return {
			loading: false,
			columns,
			locale: {
				emptyText: 'Нет доступных СИМ карт'
			}
		}
	},
	computed: {
		okButtonProps() {
			return {
				props: {
					loading: this.loading,
					disabled: !this.sim.length
				}
			}
		}
	},
	methods :{
		close() {
			this.$emit('close')
		},
		async save() {
			this.loading = true

			const email = await this.$api.sim.prepareBlock(this.sim.map(sim => ({
				...sim,
				simId: sim.id
			})))

			this.loading = false

			this.$modal({
				component: 'ConfirmBlockSimEmail',
				options: {
					email
				},
				on: {
					complete: async body => {
						email.body = body
						await this.$api.sim.sendBlock(email)
						this.close()
						this.$bus.$emit('route:reload')
						this.$notification.success({
							message: 'Письмо о блокировке успешно отправлено'
						})
					}
				}
			})
		},

	}
}
</script>