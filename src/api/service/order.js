export default ({ get, post, patch, delete: _delete }) => ({
    rollback(id) {
        return post(`/Order/${id}/Rollback`)
    },
    getShortList() {
        return get(`/Order/ShortList`)
    },
    getPayments(id) {
        return get(`/Order/${id}/Payment`)
    },
    addPayment(id, data) {
        return post(`/Order/${id}/Payment`, data)
    },
    uploadFile(id, docTypeID, formData) {
        return post(`/Order/${id}/File`, formData, {
            params: {
                docTypeID
            },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    createOrder(data) {
        return post('/Order', data)
    },
    createOrderFromRequest(id) {
        return post('/Order/FromRequest/' + id, {})
    },
    getOrders(params) {
        return get('/Order', { params })
    },
    cancel(id) {
        return post(`/Order/${id}/Cancel`)
    },
    getOrderById(id) {
        return get('/Order/' + id)
    },
    getFiles(id) {
        return get('/Order/' + id + '/File')
    },
    getStatusList() {
        return get('/Order/Status')
    },
    updateOrder(data) {
        return patch('/Order/' + data.id, data)
    },
    changeStatus(id, statusId, activateFrom) {
        return post(`/Order/${id}/Status`, {
            id: statusId,
            activateFrom
        })
    },
    changeHistoryItem(orderId, statusId, activateFrom) {
        return post(`/Order/${orderId}/Status/${statusId}/date`, {
            activateFrom
        })
    },
    saveHistoryItemsArray(orderId, items) {
        return post(`/Order/${orderId}/Status/date`, items)
    },
    getOrderDocumentTypes(id) {
        return get(`/Order/${id}/Document`)
    },
    getOrderDocuments(orderId) {
        return get(`/Order/${orderId}/Document`)
    },
    getDocumentsByType(id, typeId = 2) {
        return get(`/Order/${id}/Document/${typeId}`, {
            responseType: 'arraybuffer',
            headers: {
                'Content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        })
    },
    getInvoices(id, data) {
        return get(`/Order/${id}/Invoice`)
    },
    addInvoice(id, data) {
        return post(`/Order/${id}/Invoice`, data)
    },
    getVLANs(id) {
        return get(`/Order/${id}/VLAN/List`)
    },
    getBNs(id, balancerID) {
        return get(`/Order/${id}/Balancer/List`, {
            params: {
                balancerID
            }
        })
    },
    returnBN(id) {
        return _delete(`/Order/${id}/Balancer`)
    },
    getStatusHistory(id) {
        return get(`/Order/${id}/Status`)
    },
    attachSIM(id, simList) {
        return patch(`/Order/${id}/SIM`, simList)
    },
    getProducts(id) {
        return get(`/Order/${id}/Item/Product`)
    },
    getProductsHistory(id) {
        return get(`/Order/${id}/Item/History`)
    },
    addProductsToOrder(orderId, productId, quantity) {
        return post(`/Order/${orderId}/Product/${productId}/${quantity}`)
    },
    removeProductsFromOrder(orderId, productId, quantity) {
        return _delete(`/Order/${orderId}/Product/${productId}/${quantity}`)
    },
    removeProductInstance(orderId, productId) {
        return _delete(`/Order/${orderId}/Product/Item/${productId}`)
    },
    removeOrder(id) {
        return _delete(`/Order/${id}`)
    }
})