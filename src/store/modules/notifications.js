export default {
    namespaced: true,

    state: {
        notifications: []
    },

    mutations: {
        addNotification(state, notification) {
            state.notifications.unshift(notification)
        },
        removeNotification(state, id) {
            const index = state.notifications.findIndex(x => x.id === id)

            if(~index) {
                state.notifications.splice(index, 1)
            }
        },
        clearNotifications(state) {
            state.notifications = []
        }
    }
}