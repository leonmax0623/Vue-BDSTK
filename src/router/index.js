import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

import { _import } from './utils'

Vue.use(VueRouter)

export const AccessMap = {
	Access: 'Users',
	Channels: 'Channels',
	Documents: 'Documents',
	Orders: 'Orders',
	Profile: 'Profile',
	Rates: 'Tariff',
	Reports: 'Reports',
	Requests: 'Requests',
	SIM: 'SIM',
	Storage: 'Storage',
	'HD-Admin': 'Admin',
	'HD-Tickets': 'Tickets',
	'HD-statistic': 'Statistic',
}

const routes = [
	{
		path: '/',
		component: _import('Root'),
		redirect: { name: 'Auth' },
		children: [
			{
				path: 'profile',
				name: 'Profile',
				component: _import('Profile'),
				meta: {
					access: 'Profile'
				}
			},
			
			{
				path: 'documents',
				name: 'Documents',
				component: _import('Documents'),
				meta: {
					access: 'Documents'
				}
			},
			
			{
				path: 'reports',
				name: 'Reports',
				component: _import('Reports'),
				meta: {
					access: 'Reports'
				}
			},
			
			{
				path: 'channels',
				name: 'Channels',
				component: _import('Channels'),
				meta: {
					access: 'Channels'
				}
			},
			
			{
				path: 'storage',
				name: 'Storage',
				component: _import('Storage'),
				meta: {
					access: 'Storage'
				}
			},
			
			{
				path: 'tariff',
				name: 'Tariff',
				component: _import('Tariff'),
				meta: {
					access: 'Rates'
				}
			},
			{
				path: 'sim',
				name: 'SIM',
				component: _import('SIM'),
				meta: {
					access: 'SIM'
				}
			},
			
			{
				path: 'orders',
				name: 'Orders',
				component: _import('Orders'),
				meta: {
					access: 'Orders'
				}
			},
			{
				path: 'orders/new',
				name: 'Orders.New',
				component: _import('Orders.Page'),
				meta: {
					access: 'Orders'
				}
			},
			{
				path: 'orders/:id',
				name: 'Orders.Page',
				component: _import('Orders.Page'),
				meta: {
					access: 'Orders'
				}
			},
			
			{
				path: 'requests',
				name: 'Requests',
				component: _import('Requests'),
				meta: {
					access: 'Requests'
				}
			},
			{
				path: 'requests/new',
				name: 'Requests.New',
				component: _import('Requests.New'),
				meta: {
					access: 'Requests'
				}
			},
			{
				path: 'requests/new/:parentId',
				name: 'Requests.New.Replace',
				component: _import('Requests.New'),
				meta: {
					access: 'Requests'
				}
			},
			{
				path: 'requests/:id',
				name: 'Requests.Page',
				component: _import('Requests.Page'),
				meta: {
					access: 'Requests'
				}
			},
			
			{
				path: 'users',
				name: 'Users',
				component: _import('Users'),
				meta: {
					access: 'Access'
				}
			},

			{
				path: 'roles',
				name: 'Roles',
				component: _import('Roles'),
				meta: {
					access: 'Access'
				}
			},
			
			{
				path: 'ticket',
				name: 'Tickets',
				component: _import('Tickets'),
				// meta: {
				// 	access: 'ticket'
				// }
			},

			{
				path: 'ticket/:ticketId',
				name: 'TicketPage',
				component: _import('Tickets.Page')
			},

			{
				path: 'statistic',
				name: 'Statistic',
				component: _import('Statistic'),
				// meta: {
				// 	access: 'statistic'
				// }
			},

			{
				path: 'analysis',
				name: 'Analysis',
				component: _import('Analysis'),
				meta: {
					access: 'HD-Analysis'
				}
			},

			{
				path: 'admin',
				name: 'Admin',
				component: _import('Admin'),
				// meta: {
				// 	access: 'Admin'
				// }
			}
		]
	},
	{
		path: '/auth',
		name: 'Auth',
		component: _import('Auth'),
	},
	
	{
		path: '*',
		redirect: { name: 'Requests' }
	}
]

const router = new VueRouter({
	routes,
	mode: 'history',
})

router.beforeEach(async (to, from, next) => {
	if(to.name === 'Auth') {
		try {
			await store.dispatch('auth/sync')
			next({ name: 'Orders' })
		} catch(e) {
			next()
		}
		
		return
	}

	try {
		await store.dispatch('auth/sync')
		const accessMetaKey = _.get(to, 'meta.access')
		
		const accessLevels = store.state.app.access || await store.dispatch('app/loadAccess')
		
		if(!accessLevels) {
			store.commit('auth/removeToken')
			location.reload()
			return
		}
		
		if(accessMetaKey) {
			const hasAccess = accessLevels.find(x => x.name === accessMetaKey).access

			const route = accessLevels.find(item => item.access && AccessMap[item.name])

			if(hasAccess) {
				next()
			} else {
				if(route) {
					next({ name: AccessMap[route.name] })
				} else {
					Vue.prototype.$notification.error('У вас нет доступа к приложению')
				}
			}
		} else {
			next()
		}
	} catch(e) {
		next({ name: 'Auth' })
	}
})

export default router
