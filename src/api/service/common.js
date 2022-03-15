export default ({ get }) => ({
    getAppSettings() {
        return get('/Settings')
    }
})