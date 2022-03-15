<template lang="pug">
	a-layout.layout
		Header
		div(style="height: 76px;")

		.notifications(v-if="getAccess('Notifications.Status').access")
			NotificationsChannel(:type="21")
			NotificationsChannel(:type="22")
			NotificationsChannel(:type="[29, 1029]")
			NotificationsChannel(:type="32")
		NotificationFlat(v-if="getAccess('HD-Notification').access")
			

		div(style="margin-bottom: calc(-76px - 20px);")

		RouterView(v-if="rendering")

		Footer
		ModalService
		a-spin.loader(:spinning="globalLoading")
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex'

export default {
	data() {
		return {
			globalLoading: false,
			rendering: true
		}
	},
	beforeDestroy() {
		this.connection.stop()
		this.clearNotifications()
		this.$bus.$off('loader')
	},
		async created() {
			this.$bus.$on('loader', e => {
				if(!e) {
					setTimeout(() => {
						this.globalLoading = e
					}, 600);

					return;
				}
				this.globalLoading = e
			})

			await this.loadNotifications()

			const host = process.env.VUE_APP_HOST
				? `${process.env.VUE_APP_HOST}/notifications`
				: location.origin + '/notifications'

			this.connection = new this.$signalR.HubConnectionBuilder()
				.withUrl(host, {
					accessTokenFactory: () => this.token.Access_token
				})
				.build()

			this.connection.on('Notify', (a) => {
				this.notify(a.message)
				this.addNotification(a)
			})

			this.connection.on('Revoke', ({ id }) => {
			this.removeNotification(id)
			})

			this.$bus.$on('notification-remove', id => {
				this.connection.invoke('ProcessNotificationByID', id)
				this.removeNotification(id)
			})

			try {
				await this.connection.start()
				console.log('WS Connected');
			} catch(e) {
				console.log('WS Error');
			}

			this.$bus.$on('route:reload', () => {
				this.rendering = false
				this.$nextTick(() => {
					this.rendering = true
				})
			})

			this.$bus.$on('notifications:reload', this.loadNotifications)
	},
	computed: {
		...mapState('auth', ['token']),
		...mapGetters('app', ['getAccess']),
	},
	methods: {
		...mapMutations('notifications', ['addNotification', 'clearNotifications', 'removeNotification']),
		notify: _.debounce(function(message) {
			this.$notification.info({
				message
			})
		}, 1000),
		async loadNotifications() {
			const notifications = await this.$api.notifications.get()

			this.clearNotifications()

			notifications.forEach(x => {
				if(x.objectType !== 2) {
					this.notify(x.message)
				}
				this.addNotification(x)
			})
		}
	}
}
</script>

<style lang="scss" scoped>
	.notifications {
		box-shadow: 0 0 2px 0 rgba(0,0,0,.2), 0 0 16px 0 rgba(0,0,0,.1);
	}

	.layout {
		min-height: 100vh;
	}

	.loader {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left:0 ;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(#fff, .6);

		&:not(.ant-spin-spinning) {
			// pointer-events: none;
			display: none;
		}
	}
</style>