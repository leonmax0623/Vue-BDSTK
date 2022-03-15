export default ({ get }) => ({
    getVLANs() {
        return get('/VLAN')
    },
    getFreeVLANs() {
        return get('/VLAN/Available')
    }
})