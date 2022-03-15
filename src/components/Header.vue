<template lang="pug">
	.header
		a-layout-content.header-top
			a-menu(
				class="menu"
				style="dark"
				mode="horizontal"
			)
				Filler
				Notifications.mr(v-if="showNotifications")

		a-layout-content.header-bottom
			a-menu(
				class="menu"
				theme="dark"
				mode="horizontal"
				:style="{ lineHeight: '48px' }"
			)
				a-menu-item(v-for="(link, i) of links" :key="i")
					RouterLink(:to="link.to" class="link" active-class="--active" exact) {{link.label}}

				Filler

				a-popconfirm(
					v-if="getAccess('HD-Notification').isFullAccess"
					placement="leftTop"
					okText="Создать"
					cancelText="Отмена"
					@confirm="createEvent"
					@cancel="newNotificationText = ''"
					:okButtonProps="okButtonProps"
				)
					template(#title)
						p Добавление нового уведомления
						a-textarea(v-model.trim="newNotificationText" style="width: 320px;" placeholder="Текст уведомления")

					a-button(type="link" size="small" icon="pic-center" ghost) Создать уведомление

				a-menu-item
					ADropdown(:trigger="['click']" style="margin-left: 16px;" placement="bottomRight" v-if="user")
						.username(@click="e => e.preventDefault()") {{user.account.login}} 
							AIcon(type="down")
						AMenu(slot="overlay" @click="handleMenuClick")
							AMenuItem(key="profile")
								AIcon(type="user")
								| Профиль
							AMenuItem(key="quit")
								AIcon(type="export")
								| Выйти	
</template>

<script>
import { mapActions, mapMutations, mapState, mapGetters } from 'vuex'

export default {
	data() {
		return {
			newNotificationText: '',
			addingEvent: false,
		}
	},
	methods: {
		...mapActions('auth', ['logout']),
		...mapMutations('app', ['toggleAdmin']),
	  	...mapMutations('notifications', ['addNotification', 'clearNotifications', 'removeNotification']),
		handleMenuClick({ key }) {
			if(key === 'profile') {
				this.$router.push({ name: 'Profile' })
			}

			if(key === 'quit') {
				this.$confirm({
					title: 'Вы уверены что хотите выйти?',
					okText: 'Выйти',
					cancelText: 'Отмена',
					onOk: async () => this.handleLogout(),
					onCancel() {},
				});
			}
		},
		async handleLogout() {
			await this.logout()
			this.$router.push({ name: 'Auth' })
		},
		async createEvent() {
			this.addingEvent = true

			const notification = {
				message: this.newNotificationText,
				objectType: 2,
			}

			await this.$api.notifications.add(notification)

			// this.addNotification(notification)
			this.$bus.$emit('notifications:reload')

			this.addingEvent = false
			this.newNotificationText = ''

			this.$message.success('Уведомление добавлено')
		}
	},
	computed: {
		...mapState('app', ['adminSwitcherEnabled', 'admin', 'access']),
        ...mapGetters('app', ['getAccess']),
		...mapState('auth', ['user']),
		showNotifications() {
			return this.getAccess('Notifications').access
		},
		okButtonProps() {
			return {
				props: {
					loading: this.addingEvent,
					disabled: !this.newNotificationText
				}
			}
		},
		linkFull() {
			return [
				{
					label: 'Заявки',
					to: '/requests',
					access: 'Requests'
				},
				{
					label: 'Заказы',
					to: '/orders',
					access: 'Orders'
				},
				{
					label: 'СИМ',
					to: '/sim',
					access: 'SIM'
				},
				{
					label: 'Тарифные планы',
					to: '/tariff',
					access: 'Rates'
				},
				{
					label: 'Склад',
					to: '/storage',
					access: 'Storage'
				},
				{
					label: 'Каналы и оплата',
					to: '/channels',
					access: 'Channels'
				},
				{
					label: 'Отчеты',
					to: '/reports',
					access: 'Reports'
				},
				{
					label: 'Документы',
					to: '/documents',
					access: 'Documents'
				},

				// HelpDesk
				{
					label: 'Тикеты',
					to: '/ticket',
					access: 'HD-Tickets'
				},
				{
					label: 'Статистика',
					to: '/statistic',
					access: 'HD-statistic'
				},
				{
					label: 'Администратор',
					to: '/admin',
					access: 'HD-Admin'
				},

				{
					label: 'Аналитика',
					to: '/analysis',
					access: 'HD-Analysis'
				},

				// Common
				{
					label: 'Пользователи',
					to: '/users',
					access: 'Access'
				},
				{
					label: 'Доступ',
					to: '/roles',
					access: 'Access'
				},
				{
					label: 'Профиль',
					to: '/profile',
					access: 'Profile'
				},
			]
		},
		links() {
			return this.linkFull
				.filter(item => !item.access || Boolean(this.access.find(x => x.name === item.access).access))
		}
	}
}
</script>

<style lang="scss" scoped>
	.username {
		color: #fff;
		cursor: pointer;
		transition: 160ms linear;

		&:hover {
			color: #1890ff;
		}
	}

	.menu {
		display: flex;
		align-items: center;

		.ant-menu-item {
			padding: 0;

			&.ant-menu-item-selected {
				background: none;
			}
		}
	}

	.logo {
		width: 120px;
		height: 31px;
		background: rgba(255, 255, 255, 0.2);
		margin: 16px 24px 16px 0;
		float: left;
	}

	.filler {
		margin-left: auto;
	}

	.link {
		padding: 0 20px;

		&.--active {
			color: #fff;
			background: #3e566f;
		}
	}

	.header {
		position: fixed;
		z-index: 21;
		width: 100%;
		background: #fff;
	}

	.header-top,
	.header-bottom {
		padding: 0 50px;

	}

	.header-top {
		color: rgba(255, 255, 255, 0.65);
		background: #1e2e3c;

		.menu {
			padding: 8px 0;
			border: none;
			background: none;
		}
	}

	.header-bottom {
		color: rgba(255, 255, 255, 0.65);
		background: #344554;
	
		.menu {
				// padding: 12px 0;
				// border: none;
				background: none;
		}

		.link {
			padding: 0 18px;
		}
	}
</style>
