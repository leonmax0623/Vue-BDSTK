export default ({ get, post, put, delete: _delete }) => ({
    getTariffs() {
        return get('/TariffPlan')
    },
    create(data) {
        return post('/TariffPlan', data)
    },
    update(id, data) {
        return put('/TariffPlan/' + id, data)
    },

    removeTariff(id) {
        return _delete('/TariffPlan/' + id)
    },

    getChannelTarrifs() {
        return get('/ChannelTariffPlan')
    },
    createChannelTariff(data) {
        return post('/ChannelTariffPlan', data)
    },
    updateChannelTariff(id, data) {
        return put('/ChannelTariffPlan/' + id, data)
    },

    removeChannelTariff(id) {
        return _delete('/ChannelTariffPlan/' + id)
    },
})