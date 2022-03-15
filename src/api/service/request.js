export default ({ get, post, delete: _delete, patch }) => ({
    createRequest(data) {
        return post('/Request', data)
    },
    getRequests(credentials) {
        return get('/Request')
    },
    getRequestById(id) {
        return get('/Request/' + id)
    },
    removeRequestById(id) {
        return _delete('/Request/Item/' + id)
    },
    updateRequest(id, data) {
        return patch('/Request/' + id, data)
    }
})