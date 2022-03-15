import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

Vue.use(Vuex)

const modules = (() => {
	const requireComponent = require.context('./modules', true, /^[^_].+\.js$/i)

	return requireComponent
		.keys()
		.reduce((_modules, filename) => {
			const componentConfig = requireComponent(filename)

			const name = /[^.](.+).js$/.exec(filename)[1]

			_modules[name] = componentConfig.default || componentConfig

			return _modules
		}, {})
	
})()

export default new Vuex.Store({ modules })
