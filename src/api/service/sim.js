export default ({ get, post, put }) => ({
    getOperators() {
        return get('/SIM/operator')
    },
    getOperatorEmails(id) {
        return get(`/Operator/${id}/EMail`)
    },
    getSIM(params) {
        return get('/SIM', { params })
    },
    addSIM(data) {
        return post('/SIM', data)
    },
    prepareActivate(data) {
        return post('/SIM/PrepareActivate', data)
    },
    sendActivate(data) {
        return post('/SIM/SendActivate', data)
    },
    activate(id) {
        return post(`/SIM/${id}/Activate`)
    },
    updateSIM(id, data) {
        return put(`/SIM/${id}`, data)
    },
    prepareBlock(data) {
        return post(`/SIM/PrepareBlock`, data)
    },
    sendBlock(data) {
        return post(`SIM/sendBlock`, data)
    },
    block(id) {
        return post(`/SIM/${id}/Block`)
    },
    transferToParent(id) {
        return post(`/SIM/${id}/Transfer`)
    }
})