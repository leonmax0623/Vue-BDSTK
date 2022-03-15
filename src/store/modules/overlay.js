export default {
	namespaced: true,
    state: {
        modals: []
    },

    mutations: {
        openModal(state, modal) {
			state.modals.push(modal)
		},
		closeModal(state, uid) {
			state.modals.splice(state.modals.findIndex(item => item._uid === uid))
		},
		closeTopModal(state, next) {
				if(state.modals.length) {
					state.modals.splice(0, 1)
					next(false)
				} else {
					next()
				}
		},
    }
}