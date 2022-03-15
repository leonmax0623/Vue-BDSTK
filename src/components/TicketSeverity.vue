<template lang="pug">
	a-tag(v-if="ticket_severity" :color="color") {{severity.name}}
	a-icon(v-else type="loading")
</template>

<script>
import { mapState } from 'vuex'

export default {
	props: ['severity'],
	computed: {
		...mapState('constant', ['ticket_severity']),
		color() {
			const colorMap = {
				5: 'green',
				3: 'orange',
				2: 'red',
			}

			return colorMap[this.severity.id]
		}
	}
}
</script>