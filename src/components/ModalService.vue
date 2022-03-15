<template>
	<div class="modal-service">
		<component
			v-for="modal in modals"
			:key="modal._uid"
			:is="modal.component"
			v-bind="modal.options"
			v-on="modal.on"
			@close="close(modal._uid)"
		/>
	</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
	computed: {
		...mapState('overlay', ['modals'])
	},
	mounted() {
		this.$bus.$on('modal', this.handleModal)
	},
	beforeDestroy() {
		this.$bus.$off('modal', this.handleModal)
	},
	methods: {
		...mapMutations('overlay', ['openModal', 'closeModal']),
		handleModal({ component, options, on }) {
			this.openModal({
				_uid: this.$GUID(),
				component: () => import('@/components/Modals/' + component + '.vue'),
                options,
                on
			})
		},
		close(uid) {
			this.closeModal(uid)
		}
	}
}
</script>