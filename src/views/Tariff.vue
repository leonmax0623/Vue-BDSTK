<template>
    <Page>
        <SubHeader slot="sub-header" title="Тарифные планы">
            <div class="actions">
                <a-input-search
                    placeholder="Поиск..."
                    v-model="searchQuery"
                    allowClear
                    style="width: 300px"
                />
                
                <a-dropdown  :trigger="['click']" v-if="getAccess('Rates').isFullAccess">
                    <a-button type="primary">Создать ТП <a-icon type="gold" /></a-button>

                    <a-menu slot="overlay">
                        <a-menu-item>
                            <a href="javascript:;" @click="modalCreateSIM()">СИМ</a>
                        </a-menu-item>
                        <a-menu-item>
                            <a href="javascript:;" @click="modalCreateChannel()">Канал</a>
                        </a-menu-item>
                    </a-menu>
                </a-dropdown>
            </div>
        </SubHeader>

        <a-tabs type="card" class="tariff-tabs" v-model="activeTab" @change="tabChange">
            <a-tab-pane tab="СИМ" key="SIM">
                <a-table
                    bordered 
                    :loading="!tariffs"
                    :columns="columnsSIM"
                    :dataSource="filteredData"
                    :pagination="pagination"
                >
                    <span slot="action" slot-scope="text, record">
                        <a-button icon="delete" type="danger" @click.stop="removeTP(record)"/>
                    </span>

                    <template slot="title" slot-scope="text, record">
                        <a v-if="getAccess('Rates').isFullAccess" href="#" @click.stop.prevent="openTPSim(record)">{{record && record.operatorName}}</a>
                        <span v-else>{{record && record.operatorName}}</span>
                    </template>
                </a-table>
            </a-tab-pane>
            <a-tab-pane tab="Канал" key="CHANNEL">
                <a-table
                    bordered 
                    :loading="!tariffs"
                    :columns="columnsCHANNEL"
                    :dataSource="filteredData"
                    :pagination="pagination"
                >
                    <span slot="action" slot-scope="text, record">
                        <a-button icon="delete" type="danger" @click.stop="removeTP(record, true)"/>
                    </span>

                    <template slot="title" slot-scope="text, record">
                        <a v-if="getAccess('Rates').isFullAccess" href="#" @click.stop.prevent="customRowChannel(record)">{{record && record.name}}</a>
                        <span v-else>{{record && record.name}}</span>
                    </template>
                </a-table>
            </a-tab-pane>
        </a-tabs>

    </Page>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'

const columnsSIM = [
    {
        title: 'Оператор',
        scopedSlots: { customRender: 'title' },
    },
    {
        title: 'Полное наименование',
        dataIndex: 'comments'
    },
    {
        title: 'Сокращенное',
        dataIndex: 'name'
    },
    {
        title: 'Тариф с НДС',
        dataIndex: 'cost'
    },
    {
        title: 'Тариф без НДС',
        dataIndex: 'costWithoutVAT'
    },
    {
        title: 'Трафик',
        dataIndex: 'v'
    },
    {
        scopedSlots: { customRender: 'action' },
        width: 40
    }
]

const columnsCHANNEL = [
    {
        title: 'Наименование ТП',
        dataIndex: 'name',
        scopedSlots: { customRender: 'title' },
    },
    {
        title: 'Разовый платеж',
        children: [
            {
                title: 'Для Москвы и МО',
                dataIndex: 'costMoscow'
            },
            {
                title: 'Для остальных регионов РФ',
                dataIndex: 'costRussia'
            }
        ]
    },
    {
        title: 'Ежемесячный платеж, руб/мес, без НДС',
        dataIndex: 'subscriptionFee'
    },
    {
        scopedSlots: { customRender: 'action' },
        width: 40
    }
]

export default {
    data() {
        return {
            searchQuery: '',
            activeTab: 'SIM',
            tariffs: null,
            pagination: false,
        }
    },
    mounted() {
        const { tab } = this.$route.query

        if(tab) {
            this.activeTab = tab
        }

        this.$nextTick(this.fetchActualTab)
    },
    computed: {
        ...mapGetters('app', ['getAccess']),
        columnsCHANNEL() {
            const res = columnsCHANNEL

            if(!this.getAccess('Rates').isFullAccess) {
                res.splice(-1)
            }

            return res
        },
        columnsSIM() {
            const res = columnsSIM

            if(!this.getAccess('Rates').isFullAccess) {
                res.splice(-1)
            }

            return res
        },
        filteredData() {
            if(!this.tariffs) {
                return null
            }

            if(!this.searchQuery) {
                return this.tariffs
            }

            return _.filter(this.tariffs, row => {
                return Object
                    .keys(row)
                    .some(key => {
                        if(!row[key]) {
                            return false
                        }

                        const field = String(row[key])

                        if(field.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                            return true
                        }

                        return false
                    })
            })
        }
    },
    methods: {
        async fetch() {
            this.tariffs = null
            this.tariffs = await this.$api.tariff.getTariffs()
        },
        async fetchChannel() {
            this.tariffs = null
            this.tariffs = await this.$api.tariff.getChannelTarrifs()
        },
        async fetchActualTab() {
            switch(this.activeTab) {
                case 'SIM':
                    await this.fetch()
                    break
                case 'CHANNEL':
                    await this.fetchChannel()
                    break
            }

            // this.filteredData = this.tariffs
        },

        tabChange(e) {
            this.searchQuery = ''
            this.activeTab = e
            this.fetchActualTab()
            this.$router.replace({
                query: {
                    tab: e
                }
            })
        },

        removeTP(record, isChannel) {

            this.$confirm({
                title: 'Удалить Тарифный план?',
                content: record.name,
                okText: 'Удалить',
                cancelText: 'Отмена',
                onOk: () => {
                    const fn = isChannel
                        ? this.$api.tariff.removeChannelTariff
                        : this.$api.tariff.removeTariff
            
                    fn(record.id)
                        .then(() => {
                            this.$notification.success({
                                message: 'Тарифный план удален'
                            })
                            this.fetchActualTab()
                        })
                },
                onCancel() {},
            });
        },

        openTPSim(record) {
            this.modalCreateSIM(record)
        },

        customRowChannel(record) {
            this.modalCreateChannel(record)
        },

        modalCreateSIM(record) {
            this.$bus.$emit('modal', {
                component: 'CreateTariffSIM',
                options: {
                    record
                },
                on: {
                    submit: () => this.fetchActualTab()
                }
            })
        },
        modalCreateChannel(record) {
            this.$bus.$emit('modal', {
                component: 'CreateTariffChannel',
                options: {
                    record
                },
                on: {
                    submit: () => this.fetchActualTab()
                }
            })
        }
    }
}
</script>

<style lang="scss" >
.tariff-tabs {
    .ant-tabs-bar {
        margin-bottom: 0;
    }

    // .ant-tabs-content {
    //     background: #fff;
    //     border-radius: 4px;
    //     padding: 24px;
    // }
}
</style>