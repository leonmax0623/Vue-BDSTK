export default ({ get, delete: _delete, put, post  }) => ({
    getCategories() {
        return get('/Product/Category')
    },
    getProductStatuses() {
        return get('/Product/Status')
    },
    getProductsSummary(statusID = null) {
        return get('/Product/Summary', {
            params: {
                statusID: statusID
            }
        })
    },
    getProductCopiesList(id, statusID = null) {
        return get(`/Product/${id}/Item`, {
            params: {
                statusID: statusID
            }
        })
    },
    getAllProducts() {
        return get('/Product')
    },
    createProduct(data) {
        return post('/Product', data)
    },
    editProduct(data) {
        return put(`/Product/${data.id}`, data)
    },
    generateProducts(id, count, fileID) {
        return post('/Product/Item/Generate', [{
            productID: id,
            quantity: count,
            fileID,
        }])
    },
    removeSingleProduct(id) {
        return _delete(`/Product/${id}`)
    },
    removeSingleInstance(id) {
        return _delete(`/Product/Item/${id}`)
    },
    updateProductItem(id, data) {
        return put(`/Product/Item/${id}`, data)
    },
    removeProducts(id, count) {
        let str = String(id)
        return _delete('/Product/' +str +'/Items', {
            params: {
                quantity: count
            }
        })
    }
})