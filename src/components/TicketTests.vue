<template lang="pug">
	div
		a-collapse.tests(:bordered="false")
			template(#expandIcon="props")
				a-icon(type="caret-right" :rotate="props.isActive ? 90 : 0")
			a-collapse-panel.tests__item(
				v-for="test of tests"
				:key="test.id"
				:header="`${test.creator.departmentName} — ${$date.full(test.date)}`"
			)
				pre {{test.comments}}

		a-row(type="flex" justify="end")
			a-button(type="primary" @click="runTests" :loading="isRunningTests") Проверить состояние оборудования
</template>

<script>
export default {
	props: {
		ticketId: Number,
		tests: Array,
	},
	data: () => ({
		isRunningTests: false,
	}),
	methods: {
		async runTests() {
			try {
				this.isRunningTests = true
				const results = await this.$api.ticket.getTestResults(this.ticketId)

				const resp = await this.$api.ticket.addTestResults(this.ticketId, Object.values(results).join('\n'))
				console.log(resp)
				this.$emit('refetch')
			} catch(e) {
				console.error(e)
			} finally {
				this.isRunningTests = false
			}
		}
	}
}
</script>

<style scoped lang="scss">
.tests {
	background: #fff;

	&__item {
		background: #f7f7f7;
		border-radius: 4px;
		margin-bottom: 12px;
		border: 0;
	}
}
</style>