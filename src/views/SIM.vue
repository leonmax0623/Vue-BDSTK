<template>
    <Page class="warp">
        <SubHeader slot="sub-header" title="СИМ">
            <div class="actions">
                <a-input
                    placeholder="Поиск..."
                    v-model.trim="searchQuery"
                    allowClear
                    style="width: 300px"
                >
                    <a-tooltip slot="suffix" title="Поиск">
                        <a-icon type="search" style="color: rgba(0,0,0,.45)" />
                    </a-tooltip>
                </a-input>
                <a-button type="primary" @click="uploadSIM" :loading="!(tariffs && operators)" v-if="!readonly">Импорт СИМ <a-icon type="file-add" /> </a-button>
            </div>
        </SubHeader>

        <a-tabs type="card" class="--nogap" v-model="operatorID" @change="tabChange">
            <a-tab-pane v-for="o of operators" :tab="o.name" :key="o.id"/>
            <a-button slot="tabBarExtraContent" :loading="!emails" :disabled="!(emails && emails.length)" @click="openEmails">Почтовый ящик оператора <span v-if="emails && emails.length" style='margin-left: 4px;'> — {{emails.length}}</span></a-button>
        </a-tabs>

        <a-table
            bordered 
            class="table-sim"
            :loading="!tableData"
            :columns="columns"
            :dataSource="filteredData"
            :pagination="pagination"
            :customRow="customRow"
            @change="onChange"
            :scroll="{ x: true }"
        >
            <div slot="date" slot-scope="date, record">{{formatDate(date)}}</div>

            <template #action="item">
                <a href="#" @click.prevent="openSIMEditor(item)">Редактировать</a>
            </template>
        </a-table>
    </Page>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import dayjs from 'dayjs'
import { StatusSIM } from '@/common'
const size = (size) => ({
    width: size,
    maxWidth: size,
    minWidth: size,
})

const columns = [
    {
        title: 'Действия',
        scopedSlots: { customRender: 'action' },
        customCell: () => ({
            style: size('120px')
        })
    },
    {
        title: 'MSISDN',
        dataIndex: 'msisdn',
        customCell: () => ({
            style: size('100px')
        })
    },
    {
        title: 'ICCID',
        dataIndex: 'iccid',
        customCell: () => ({
            style: size('160px')
        })
    },
    {
        title: 'IP',
        dataIndex: 'ip',
        sorter: (a,b) => {
            if(!a.ip) {
                return 1
            }
            if(!b.ip) {
                return -1
            }
            const num1 = Number(a.ip.split(".").map((num) => (`000${num}`).slice(-3) ).join(""));
            const num2 = Number(b.ip.split(".").map((num) => (`000${num}`).slice(-3) ).join(""));
            return num1-num2;
        },
        customCell: () => ({
            style: size('100px')
        })
    },
    {
        title: 'Статус СИМ',
        dataIndex: 'currentState',
        customCell({ currentState, currentStateID }) {
            const type = Object
                .keys(StatusSIM)
                .find(key => StatusSIM[key] === currentStateID)

            return {
                class: {
                    status: true,
                    [`--${type}`]: true
                },
                style: size('160px')
            }
        },
    },
    {
        title: 'ТП СИМ',
        dataIndex: 'tariffPlanName',
        customCell: () => ({
            style: size('80px')
        })
    },
    {
        title: 'S/N БН',
        dataIndex: 'balancerSerialNumber',
        sorter: (a,b) => a.balancerSerialNumber.localeCompare(b.balancerSerialNumber),
        customCell: () => ({
            style: size('140px')
        })
    },
    {
        title: 'Номер заказа',
        dataIndex: 'orderNumber',
        sorter: (a,b) => +a.orderNumber - +b.orderNumber,
        customCell: () => ({
            style: size('60px')
        })
    },
    {
        title: 'Адрес канала',
        dataIndex: 'address',
        customCell: () => ({
            style: size('160px')
        })
    },
    {
        title: 'Последняя дата активации',  
        dataIndex: 'activateFrom',
        scopedSlots: { customRender: 'date' },
        customCell: () => ({
            style: size('120px')
        })
    },
    {
        title: 'Последняя дата блокировки',
        dataIndex: 'lastLockDate',
        scopedSlots: { customRender: 'date' },
        customCell: () => ({
            style: size('120px')
        })
    },
    {
        title: "Комментарий",
        dataIndex: 'comments',
        customCell: () => ({
            style: size('120px')
        })
    }
]

export default {
    data() {
        return {
            operatorID: null,
            tableData: null,
            operators: null,
            pagination: { pageSize: 10, current: 1 },
            tariffs: null,
            emails: null,
            searchQuery: ''
        }
    },
    async created() {
        const { tab, page } = this.$route.query
        
        this.tariffs = await this.$api.tariff.getTariffs()
        this.operators = await this.$api.sim.getOperators()
        
        if(tab) {
            this.operatorID = +tab
        } else {
            this.operatorID = this.operators[0].id
        }

        if(page) {
            this.pagination.current = +page
        }

        
        this.fetchTable()
    },
    computed: {
        ...mapState('app', ['access']),
        ...mapGetters('app', ['allowEdit']),
        readonly() {
            return !this.allowEdit('SIM')
        },
        columns() {
            if(this.readonly) {
                return columns.filter((_, i) => i !== 0)
            }

            return columns
        },
        filteredData() {
            const query = this.searchQuery.trim().toLowerCase()

            if(!query) {
                return this.tableData
            }

            return this.tableData.filter(row => {

                return Object.keys(row)
                    .some(key => {
                        let value = String(_.get(row, key)).toLowerCase()

                        if(~['activateFrom', 'lastLockDate'].indexOf(key)) {
                            value = this.formatDate(value)
                        }

                        return value.includes(query)
                    })
            })
        }
    },
    methods: {
        onChange(pagination, filters, sorter, item) {
            if(this.pagination.current !== pagination.current) {
                this.pagination = pagination
                this.$router.replace({
                    query: {
                        ...(this.$route.query || {}),
                        page: pagination.current,
                    }
                })
            } else {
                this.pagination.current = 1
            }
        },
        openEmails() {
            this.$bus.$emit('modal', {
                component: 'OperatorEmails',
                options: {
                    emails: this.emails
                }
            })
        },
        openSIMEditor(sim) {
            this.$bus.$emit('modal', {
                component: 'EditSIM',
                options: {
                    sim,
                    tariffs: this.tariffs.filter(x => x.operatorID === this.operatorID)
                },
                on: {
                    saved: () => {
                        this.fetchTable()
                    },
                },
            })
        },
        customRow(sim) {
            return {
                on: {
                    // click: () => {
                        
                    // }
                }
            }
        },
        uploadSIM() {
            this.$bus.$emit('modal', {
                component: 'UploadSimModal',
                options: {
                    operators: this.operators,
                    tariffs: this.tariffs
                },
                on: {

                }
            })
        },
        async fetchTable() {
            this.emails = null

            const { operatorID } = this
            this.tableData = null

            this.emails = await this.$api.sim.getOperatorEmails(this.operatorID)
            this.tableData = await this.$api.sim.getSIM({ operatorID })
        },
        formatDate(date) {
            return date
                ? dayjs(date).format('DD.MM.YY')
                : ''
        },
        tabChange(id) {
            this.pagination.current = 1
            this.operatorID = id
            this.fetchTable()
            this.$router.replace({
                query: {
                    ...this.$route.query,
                    tab: id
                }
            })
        },

    }
}
</script>

<style lang="scss" >

.table-sim {
    .status {

        &.--Activated {
            color: #fff;
            background: #93d88b !important;
        }
        &.--Blocked {
            color: #fff;
            background: #ff8484 !important;
        }
        &.--SentToActivation {
            color: #666;
            background: #fde95a !important;
        }
        &.--OFF {
            color: #fff;
            background: #40288a !important;
        }
    }
}
</style>