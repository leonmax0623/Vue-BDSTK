export default ({ get, put, post, delete: _delete }) => ({
    getCurrentUser() {
        return get('/Company/Employee/token')
    },
    updateUser(id, data) {
        return put('/Company/Employee/' + id, data)
    },

    getEmployeeById(id) {
        return get('/Company/Employee/' + id)
    },

    getEmployees() {
        return get('/Company/Employee')
    },
    getDepartments() {
        return get('/Company/Department')
    },
    getPostTypes() {
        return get('/Company/PostType')
    },

    addUser(data) {
        return post('/Company/Employee', data)
    },
    deleteUser(id) {
        return _delete('/Company/Employee/' + id)
    },
    getDepartmentAccess(id) {
        return get(`/Company/Department/${id}/access`)
    },
    getDepartmentAccessFull() {
        return get(`/Company/DepartmentAccess`)
    },
    grantAccess(depId, accessId, readOnly) {
        return post(`/Company/Department/${depId}/grant/${accessId}`, null, {
            params: {
                IsReadOnly: +readOnly,
            }
        })
    },
    revokeAccess(depId, accessId) {
        return post(`/Company/Department/${depId}/revoke/${accessId}`)
    }
})