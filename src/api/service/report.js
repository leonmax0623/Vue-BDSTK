import mime from 'mime'

export default ({ get }) => ({
    getReports() {
        return get('/Report')
    },
    getReport(id, params) {
        return get('/Report/' + id, {
            responseType: 'arraybuffer',
            headers: {
                'Content-type': mime.getType('test.xls')
            },
            params
        })
    }
})