export default ({ get, post, delete: _delete, patch }) => ({
	addTestResults(ticketId, comments) {
		return post(`/TroubleTicket/${ticketId}/tests`, {
			comments
		})
	},
	getTestResults(ticketId) {
		return get(`/TroubleTicket/${ticketId}/tests/execute`)
	},
	getBeelineTicket(id) {
		return get(`/Beeline/${id}`)
	},
	applyResponsible(data) {
		return post('/TroubleTicket/responsible', data)
	},
	getSeverities() {
		return get('/TroubleSeverity')
	},
	updateTicket(id, data) {
		return post(`/TroubleTicket/${id}`, data)
	},
	getTickets(params) {
		return get('/TroubleTicket', { params })
	},
	getStatusList() {
		return get('/TroubleStatus')
	},
	getTicketTypes() {
		return get('/TroubleType')
	},
	findClient(params) {
		return get('/TroubleTicket/find', { params, noToasts: true }, { skip: true })
	},
	create(data) {
		return post('/TroubleTicket', data)
	},
	getTicketById(id) {
		return get(`/TroubleTicket/${id}`)
	},
	addStep(id, step) {
		return post(`/TroubleTicket/${id}/step`, step)
	},
	getDiagnosticTypes() {
		return get('/TroubleDiagnostics')
	},
	
	attachFileToStep(ticketId, stepId, formData) {
		return post(`/TroubleTicket/${ticketId}/step/${stepId}/file`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	},

	getTicketFile(ticketId, fileId) {
		return get(`/TroubleTicket/${ticketId}/File/${fileId}`, {
			responseType: 'arraybuffer',
		})
	},
	addDiagnosticToTicket(ticketId, data) {
		return post(`/TroubleTicket/${ticketId}/diags`, data)
	},
	attachFileToDiag(ticketId, diagId, formData) {
		return post(`/TroubleTicket/${ticketId}/diags/${diagId}/file`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	},

	addDiagnostic(data, id = '') {
		return post(`/TroubleDiagnostics/${id}`, data)
	},

	addTroubleType(data, id = 0) {
		return post(`/TroubleType/${id}`, data)
	},

	addTicketReason(data, id = 0) {
		return post(`/TroubleCloseComments/${id}`, data)
	},

	getReasons() {
		return get(`/TroubleCloseComments`)
	},
	
	removeDiag(id) {
		return _delete(`/TroubleDiagnostics/${id}`)
	},

	removeTroubleType(id) {
		return _delete(`/TroubleType/${id}`)
	},

	removeReason(id) {
		return _delete(`/TroubleCloseComments/${id}`)
	},

	closeTicket({ ticketID, comments, closeCommentsID }) {
		return post(`/TroubleTicket/${ticketID}/close`, {
			ticketID,
			comments,
			closeCommentsID,
		})
	},

	getClients() {
		return get(`/TroubleTicket/clients`)
	},
	saveCustomFields(id, data) {
		return post(`/TroubleTicket/${id}/custom`, data)
	},
	getCustomFields(id) {
		return get(`/TroubleTicket/${id}/custom`)
	}
})