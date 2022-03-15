<template lang="pug">
	a-layout-footer(:style="{ textAlign: 'center' }") {{hd ? 'HelpDesk Агрегация' : 'БДСТК'}} ©2020
</template>

<script>
import { mapState } from 'vuex'

export default {
	computed:{
		...mapState('app', ['access']),
		hd() {
			return this.access.some(x => ~['HD-Admin', 'HD-statistic', 'HD-Tickets'].indexOf(x.name))
		}
	}
}
</script>