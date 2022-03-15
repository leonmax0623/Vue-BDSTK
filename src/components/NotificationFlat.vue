<template lang="pug">
	.list(v-if="list && list.length")
		.list__item(v-for="note of list" :key="note.id")
			.list__item-text {{note.message}}
			.list__item-right
				a-tag.list__tag(color="orange") {{$date.short(note.createdDate)}}
				a-button(
					v-if="allowEdit('HD-Notification')"
					@click.prevent="remove(note)"
					type="ghost"
					icon="close"
					size="small"
					style="margin-left:6px; font-size: 12px;"
				)
</template>

<script>
import { mapActions, mapMutations, mapState, mapGetters } from 'vuex'

export default {
	props: ['type'],
	computed: {
		...mapState('notifications', ['notifications']),
		...mapState('app', ['adminSwitcherEnabled', 'admin', 'access']),
        ...mapGetters('app', ['allowEdit']),
		list() {
			return this.notifications.filter(x => x.objectType === 2)
		}
	},
	methods: {
		...mapMutations('notifications', ['addNotification', 'clearNotifications', 'removeNotification']),
		remove(note) {
			this.$confirm({
				title: 'Удалить уведомление?',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					console.log(note)
					// this.$bus.$emit('notification-remove', note.id)
					await this.$api.notifications.remove(note.id)
					this.removeNotification(note.id)
					this.$bus.$emit('notifications:reload')
				},
				onCancel() {},
			});
			
		}
	}
}
</script>

<style lang="scss" scoped>
.list {
	&__item {
		background: #e45858;
		padding: 4px 64px;
		color: #fff;
		display: flex;
		align-items: flex-start;

		&:not(:last-child) {
			border-bottom: 1px solid lighten(#e45858, 6);
		}

		&:hover {
			opacity: .9;
		}
	}

	&__item-right {
		display: flex;
		flex-shrink: 0;
	}

	&__item-text {
		padding-right: 60px;
		flex-grow: 1;
	}

	&__tag {
		margin: 0 12px;
		margin-left: auto;
	}
}
</style>
