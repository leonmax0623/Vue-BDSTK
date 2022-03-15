import _ from 'lodash'
import { isPROD } from '@/utils'
import Api from '@/api'

export default {
	namespaced: true,

	state: {
		adminSwitcherEnabled: !isPROD,
		admin: false,
		queue: [],
		access: null,

		saleTypes: [],
		saleList: [],
	},

	getters: {
		loading(state) {
			return !!state.queue.length 
		},
		getAccess(state) {
			return name => {
				const access = state.access.find(x => x.name == name)

				access.isReadOnlyAccess = access.access && access.readOnly
				access.isFullAccess = access.access && !access.readOnly

				return access
			}
		},
		allowEdit(state) {
			return name => {
				const rule = state.access.find(x => x.name == name)

				if(rule && rule.access && !rule.readOnly) {
					return true
				}

				return false
			}
		}
	},
	
	mutations: {
		setSaleTypes(state, value) {
			state.saleTypes = value
		},
		setSaleList(state, value) {
			state.saleList = value
		},
		startAsyncOperation(state, guid) {
			state.queue.push(guid)
		},
		
		finishAsyncOperation(state, guid) {
			const index = _.findIndex(state.queue, x => x === guid)

			if(~index) {
				state.queue.splice(index, 1)
			}
		},

		toggleAdmin(state) {
			state.admin = !state.admin
		},

		setAccessLevels(state, access) {
			state.access = access
		},
		updateAccessLevels(state, { id, value }) {
			const item = state.access.find(x => x.id === id)

			Object.assign(item, value)
		}
	},

	actions: {
		async loadSaleTypes({ commit }) {
			const data = await Api.sale.getSaleTypes()

			commit('setSaleTypes', data)
		},
		async loadSaleList({ commit }) {
			const data = await Api.sale.getSaleList()

			commit('setSaleList', data)
		},
		async loadAccess({ commit }) {
			// const access = [
			// 	{name: "Access", readOnly: true, access: false, comments: "Администрирование"},
			// 	{name: "Channels", readOnly: true, access: false, comments: "Каналы и оплата"},
			// 	{name: "Documents", readOnly: false, access: false, comments: "Документы"},
			// 	{name: "Orders", readOnly: true, access: true, comments: "Заказы"},
			// 	{name: "Profile", readOnly: false, access: false, comments: "Профиль"},
			// 	{name: "Rates", readOnly: true, access: false, comments: "Тарифные планы"},
			// 	{name: "Reports", readOnly: false, access: false, comments: "Отчёты"},
			// 	{name: "Requests", readOnly: true, access: false, comments: "Заявки"},
			// 	{name: "SIM", readOnly: true, access: false, comments: "СИМ"},
			// 	{name: "Storage", readOnly: true, access: false, comments: "Склад"},
			// ]

			// commit('setAccessLevels', access)

			// return access

			try {
				const access = await Api.access.access()
				commit('setAccessLevels', access)

				return access
			} catch {
				return false
			}

		}
	}
}