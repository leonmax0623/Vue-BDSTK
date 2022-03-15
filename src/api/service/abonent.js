export default ({ get }) => ({
    getAbonents() {
        return get('/Abonent')
    }
})