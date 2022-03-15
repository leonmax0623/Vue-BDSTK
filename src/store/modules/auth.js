import Api from '@/api'

const STORAGE_KEY = 'token';

export default {
	namespaced: true,

	state: {
		token: null,
		user: null,
	},

	mutations: {
		setToken(state, token) {
			state.token = token
		},
		removeToken(state) {
			localStorage.removeItem(STORAGE_KEY)
			state.token = null
		},
		setUser(state, user) {
			state.user = user
		}
	},

	actions: {
		async loadUser({ commit }) {
			commit('setUser', await Api.company.getCurrentUser())
		},
		async sync({ commit, dispatch }, credentials) {
			const token = localStorage.getItem(STORAGE_KEY)

			if(!token) {
				return Promise.reject()
			}

			const parsed = JSON.parse(token)

			commit('setToken', parsed)

			dispatch('loadUser')

			return Promise.resolve()
		},
		async login({ commit, dispatch }, credentials) {
			return Api.auth.token(credentials)
				.then(token => {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
		
					commit('setToken', token)
				})
		},
		logout({ commit }) {
			try {
				commit('removeToken')
				return Promise.resolve()
			} catch {
				return Promise.reject()
			}
		}
	}
}