<template lang="pug">
    Page
        SubHeader(slot="sub-header" title="Каналы и оплата")
            .actions
                a-input(
                    placeholder="Поиск..."
                    v-model="searchQuery"
                    allowClear
                    style="width: 300px"
                )

                .dates
                    a-date-picker(v-model="filterFrom" placeholder="От" :locale="$lang.locale")
                    .dates__diff -
                    a-date-picker(v-model="filterTo" placeholder="До" :locale="$lang.locale")

                //- a-button(type="primary" @click="addPayment" icon="gold") Ввод платежа

        a-table(
            bordered 
            :loading="!filtered"
            :dataSource="filtered"
            :columns="columns"
            :pagination="pagination"
            :customRow="customRow"
            @change="change"
        )
            template(#date="date") {{formatDate(date)}}
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
    data() {
        return {
            filterFrom: null,
            filterTo: null,
            searchQuery: '',
            pagination: { pageSize: 10, current: 1 },
            channels: null,
            columns: [
                {
                    title: 'Номер заказа',
                    dataIndex: 'number',
                    sorter: (a, b) => +a.number - +b.number
                },
                {
                    title: 'Номер VLAN',
                    dataIndex: 'vlan',
                    sorter: (a, b) => +a.vlan - +b.vlan
                },
                {
                    title: 'Адрес',
                    dataIndex: 'channelAddress'
                },
                {
                    title: 'Дата включения',
                    dataIndex: 'date',
                    scopedSlots: { customRender: 'date' },
                    sorter: (a, b, order) => {
                        const d1 = (a.date || 0).valueOf()
                        const d2 = (b.date || 0).valueOf()

                        return d2 - d1
                    }
                },
                {
                    title: 'Разовый платеж без НДС',
                    dataIndex: 'onceFee',
                },
                {
                    title: 'Поступивший инсталл. платеж',
                    dataIndex: 'installPaymentValue'
                },
                {
                    title: 'Дата платежа',
                    dataIndex: 'installPaymentDate',
                    scopedSlots: { customRender: 'date' },
                    sorter: (a, b, order) => {
                        const d1 = (a.installPaymentDate || 0).valueOf()
                        const d2 = (b.installPaymentDate || 0).valueOf()

                        return d2 - d1
                    }
                },
                {
                    title: 'Номер платежного поручения',
                    dataIndex: 'installPaymentInfo'
                }
            ]
        }
    },
    // watch: {
    //     filterFrom() {
    //         this.handleDateFilter()
    //     },
    //     filterTo() {
    //         this.handleDateFilter()
    //     },
    // },
    async created() {
        const { page } = this.$route.query

        if(page) {
            this.pagination.current = +page
        }

        this.fetch()
    },
    computed: {
        ...mapGetters('app', ['allowEdit']),
        filtered() {
            if(!this.channels) {
                return null
            }


            return this.channels
                .filter(item => {
                    if(this.searchQuery.length < 2) {
                        return true
                    }

                    return Object
                        .keys(item)
                        .some(key => {
                            let value = String(item[key]).toLowerCase()

                            if(~['date', 'installPaymentDate'].indexOf(key)) {
                                value = moment(item[key]).format('DD.MM.YYYY')
                            }


                            return ~value.indexOf(this.searchQuery.toLowerCase())
                        })
                })
                .filter(item => {
                    if(!this.filterFrom && !this.filterTo) {
                        return true
                    }

                    if(!item.installPaymentDate) {
                        return false
                    }

                    let isFrom = true
                    let isTo = true

                    if(this.filterFrom) {
                        this.filterFrom.set({hour:0, minute:0, second:0, millisecond:0})
                        isFrom = item.installPaymentDate.isSameOrAfter(this.filterFrom)
                    }

                    if(this.filterTo) {
                        this.filterTo.set({hour:11, minute:59, second:59, millisecond:999})
                        isTo = item.installPaymentDate.isSameOrBefore(this.filterTo)
                    }

                    return isFrom && isTo
                })
        }
    },
    methods: {
        change({ current }) {
            this.pagination.current = current

            this.$router.replace({
                query: {
                    page: current
                }
            })
        },
        formatDate(date) {
            return date ? date.format('DD.MM.YYYY') : null
        },
        async fetch() {
            this.channels = (await this.$api.channel.getChannels())
                .map(item => {
                    ['date', 'installPaymentDate'].forEach(key => {
                        item[key] = item[key]
                            ? moment(item[key]).set({hour:0, minute:0, second:0, millisecond:0})
                            : null
                    })

                    return item
                })
        },
        // addPayment() {
        //     this.$modal({
        //         component: 'CreatePayment',
        //         options: {

        //         },
        //         on: {
        //             close: () => {
        //                 this.fetch()
        //             }
        //         }
        //     })
        // },
        customRow(record) {
            return {
                on: {
                    click: async () => {
                        if(!this.allowEdit('Channels')) {
                            return
                        }

                        // const data = await this.$api.order.getPayments(id)
                        this.$modal({
                            component: 'CreatePayment',
                            options: {
                                id: record.id,
                                cost: record.installPaymentValue,
                                date: record.installPaymentDate,
                                info: record.installPaymentInfo
                            },
                            on: {
                                close: () => {
                                    this.fetch()
                                }
                            }
                        })
                    }
                }
            }
        },
    }
}
</script>

<style lang="scss" scoped>
.dates {
    display: flex;
    align-items: center;

    &__diff {
        display: block;
        margin: 0 4px;
    }

}
</style>

<style lang="scss">
    .dates input {
        width: 120px;
    }
</style>