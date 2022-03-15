export default ({ get, post, delete: _delete, patch }) => ({
	getProductKits() {
		return get('/ProductKit/list')
	},
	createKit(data) {
		return post('/ProductKit', data)
	},
	removeKit(id) {
		return _delete(`/ProductKit/${id}`)
	},
	updateKit(id, data) {
		return patch(`/ProductKit/${id}`, data)
	}
})