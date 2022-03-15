export default ({ get, post, delete: _delete }) => ({
    get() {
        return get('/Notification')
    },
    add(data) {
        return post('/Notification', data)
    },
    remove(id) {
        return _delete(`/Notification/${id}`)
    }
})