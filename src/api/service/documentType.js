export default ({ get }) => ({
    getDocumentTypes() {
        return get('/DocumentType')
    }
})