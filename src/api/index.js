import { GUID } from '@/plugins'
import axios from 'axios'
import store from '@/store'
import Vue from 'vue'

export const HOST = ''
// export const HOST = process.env.VUE_APP_HOST || ''
// export const HOST = 'http://192.168.10.124'
// export const HOST = 'http://91.237.189.1:6060'
// export const HOST = 'https://avk-billing.ru:8443'
export const BASEURL = '/api'

export default new class Api {
	instance = axios.create({
		baseURL: HOST + BASEURL,
		responseType: 'json',
		headers: {
			'Content-Type': 'application/json'
		},
	})

	constructor () {
		// Register services
		const requireService = require.context('./service', false, /.js$/)

		requireService
			.keys()
			.forEach(filename => {
				const name = /[^.](.+).js$/.exec(filename)[1]

				this[name] = requireService(filename).default(this.instance)
			})

		this.intercept(({ request, response }) => {
			request.use(config => {
				config.guid = GUID()
				store.commit('app/startAsyncOperation', config.guid)

				const { token } = store.state.auth

				if(token) {
					config.headers['Authorization'] = `Bearer ${token.Access_token}`
				}
				
				return config
			})

			response.use(response => {
				store.commit('app/finishAsyncOperation', response.config.guid)

				return response.data
			}, error => {
				if(error.config) {
					store.commit('app/finishAsyncOperation', error.config.guid)

					;((message) => {
						if(!message) return;
						
						Vue.prototype.$notification.error({
							title: 'Произошла ошибка',
							message
						})
					})(_.get(error, 'response.data.message'));

					if(!error.response) {
						Vue.prototype.$bus.$emit('401')
					}
				}

				
				return Promise.reject(error.response || error)
			})
		})
	}

	intercept(fn) {
		fn(this.instance.interceptors)
	}

	install(Vue) {
		Vue.prototype.$api = this
	}
}
