export default ({ get, post }) => ({
	getServices() {
		return get('/Service/Type')
	},
	getServiceQueue(id) {
		return get(`/Service/${id}/status`)
	}
})