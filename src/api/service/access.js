export default ({ get, post, delete: _delete }) => ({
    create(data) {
        return post('/Access', data)
    },
    remove(id) {
        return _delete(`/Access/${id}`)
    },
    access() {
        return get('/Access')
    },
    getList() {
        return get(`/Access/list`)
    }
})