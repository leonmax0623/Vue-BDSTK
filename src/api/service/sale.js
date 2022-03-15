export default ({ get, post, delete: _delete }) => ({
    getSaleTypes() {
        return get('/Sale/Type')
    },
    deleteSale(id) {
        return _delete(`/Sale/${id}`)
    },
    getSaleList() {
        return get('/Sale')
    },
    addSale(data) {
        return post('/Sale', data)
    },
    getSaleById(id) {
        return get(`/Sale/${id}`)
    },
    updateSale(id, data) {
        return post(`/Sale/${id}`, data)
    },
    addBalancerToSale(id, balancerId) {
        return post(`/Sale/${id}/BalancerItem/${balancerId}`)
    },
    addComponents(id, productId, quantity) {
        return post(`/Sale/${id}/ProductItem/${productId}/`, {
            params: {
                quantity
            }
        })
    },
    addFile(id, file) {
        const formData = new FormData()
        formData.append('file', file)

        return post(`/Sale/${id}/File`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            } 
        })
    },
    removeFile(saleId, fileId) {
        return _delete(`/Sale/${saleId}/File/${fileId}`)
    },
    getFile(saleId, fileId) {
        return get(`/Sale/${saleId}/file/${fileId}`, {
            responseType: 'arraybuffer',
        })
    }
})