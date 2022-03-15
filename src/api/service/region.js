export default ({ get, post }) => ({
    getRegions() {
        return get('/Region/Type')
    }
})