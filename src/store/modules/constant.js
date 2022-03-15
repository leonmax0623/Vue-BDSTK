import api from '@/api'

const EnumType = {
	ticket_types: 'ticket_types',
	ticket_statuses: 'ticket_statuses',
	ticket_diagnostics: 'ticket_diagnostics',
	ticket_reasons: 'ticket_reasons',
	ticket_severity: 'ticket_severity',
}

const EnumState = {
	idle: 'idle',
	loading: 'loading',
	error: 'error',
	success: 'success',
}

const createHandler = (type, method) => {
	return async ({ state, commit }, force) => {
		if(state[`fetching_${type}`]) {
			return Promise.resolve()
		}

		if(state[type] && !force) {
			return Promise.resolve()
		}

		commit('setUniform', {
			value: true,
			field: `fetching_${type}`,
		})

		const value = await method()

		commit('setUniform', {
			value,
			field: type,
		})

		commit('setUniform', {
			value: false,
			field: `fetching_${type}`,
		})
	}
}

export default {
	namespaced: true,

	state: {
		[`fetching_${EnumType.ticket_types}`]: false,
		[`fetching_${EnumType.ticket_statuses}`]: false,
		[`fetching_${EnumType.ticket_diagnostics}`]: false,
		[`fetching_${EnumType.ticket_reasons}`]: false,
		[`fetching_${EnumType.ticket_severity}`]: false,

		[EnumType.ticket_types]: null,
		[EnumType.ticket_statuses]: null,
		[EnumType.ticket_diagnostics]: null,
		[EnumType.ticket_reasons]: null,
		[EnumType.ticket_severity]: null,
	},

	mutations: {
		setUniform(state, { field, value }) {
			state[field] = value
		}
	},

	actions: {
		loadTicketTypes: createHandler(EnumType.ticket_types, api.ticket.getTicketTypes),
		loadTicketStatuses: createHandler(EnumType.ticket_statuses, api.ticket.getStatusList),
		loadTicketDiagnostics: createHandler(EnumType.ticket_diagnostics, api.ticket.getDiagnosticTypes),
		[`load_${EnumType.ticket_reasons}`]: createHandler(EnumType.ticket_reasons, api.ticket.getReasons),
		[`load_${EnumType.ticket_severity}`]: createHandler(EnumType.ticket_severity, api.ticket.getSeverities),
	}
}