export default ({ get, delete: _delete, put, post }) => ({
    getReport(sn, report, { from, to } = {}) {
        return get(`/Balancer/${sn}/report/${report}`, {
            params: { from, to }
        })
    },
    getBalancerTypes() {
        return get('/Balancer/Type')
    },
    getBalancers(typeID) {
        return get('/Balancer', {
            params: {
                typeID
            }
        })
    },
    createBalancer(data) {
        return post('/Balancer', data)
    },
    editBalancer(data) {
        return post(`/Balancer/${data.id}`, {...data, balancerType: {id: 0}})
    },
    getBalancerItems(id, statusID = null, useInTickets) {
        return get(`/Balancer/${id}/Item`, {
            params: {
                statusID,
                useInTickets
            },
        })
    },
    deleteBalancerItem(balancerItemId) {
        return _delete(`/Balancer/Item/${balancerItemId}`)
    },
    addBalancerItem(data) {
        return post(`/Balancer/Item`, data)
    },
    generateBalancers(id, from, to, fileID) {
        return post(`/Balancer/Generate/${id}?from=${from}&to=${to}`, {}, {
            params: {
                fileID
            }
        })
    },
    deleteBalancers(id, from, to) {
        return _delete(`/Balancer/Generate/${id}?from=${from}&to=${to}`)
    }
})