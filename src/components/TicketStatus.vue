<template lang="pug">
	//- .status(:style="styles") {{status.name}}
	a-tag(:color="color").pointer {{status.name}}
</template>

<script>
export default {
	props: ['status'],
	computed: {
		color() {
			const background = {
				[this.$config.tickets.status.open]: 'cyan', // Открыта
				[this.$config.tickets.status.inwork]: 'blue', // В работе
				[this.$config.tickets.status.idle]: 'red', // В ожидании
				[this.$config.tickets.status.line2]: 'pink', // 2 линия
				[this.$config.tickets.status.line3]: 'purple', // 3 линия
				[this.$config.tickets.status.closed]: 'green', // Закрыта
			}

			return background[this.status.id]
		}
	}
}
</script>

<style lang="scss" scoped>
.status {
	margin-top: 4px;
	border-radius: 4px;
	padding: 2px 8px;
	display: inline;
}
</style>