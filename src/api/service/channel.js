export default ({ get }) => ({
    getChannels() {
        return get('/Channel')
    }
})