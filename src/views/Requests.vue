<template>
    <Page>
        <SubHeader slot="sub-header" title="Заявки">
            <div class="actions">
                <a-input
                    placeholder="Поиск..."
                    v-model="searchQuery"
                    allowClear
                    style="width: 300px"
                >
                    <a-tooltip slot="suffix" title="Поиск">
                        <a-icon type="search" style="color: rgba(0,0,0,.45)" />
                    </a-tooltip>
                </a-input>

                <a-button v-if="allowEdit('Requests')" size="large" type="primary" @click="$router.push('/requests/new')" icon="gold">Новая заявка</a-button>
            </div>
        </SubHeader>

        <a-table
            bordered 
            :loading="!data"
            :columns="columns"
            :dataSource="filtered"
            :pagination="pagination"
            :customRow="customRow"
            :locale="locale"
            :scroll="{ x: 2600 }"
            @change="change"
        >
            <!-- <a slot="action" slot-scope="text, record" href="javascript:;" @click="removeRequest($event, record.id)">Удалить</a> -->
            <template #action="item">
                <router-link :to="`/requests/${item.id}`" class="block">Открыть</router-link>
                <router-link :to="`/requests/new/${item.id}`" class="block">Заменить</router-link>
            </template>
        </a-table>
    </Page>
</template>

<script>
import dayjs from 'dayjs'
import _ from 'lodash'
import { mapState, mapGetters } from 'vuex'
import { filterByFields } from '@/utils'

const columns = [
    {
        title: 'Действия',
        scopedSlots: { customRender: 'action' },
        width: 100,
    },
    {
        title: '#',
        dataIndex: 'number',
        width: 60,
    },
    {
        title: 'Дата создания',
        dataIndex: 'date',
        width: 100,
    },
    {
        title: 'ФИО создавшего заявку',
        dataIndex: 'creatorName',
        width: 140,
    },
    {
        title: 'Наименование абонента',
        dataIndex: 'abonentName',
        width: 160,
    },
    {
        title: 'Регион',
        dataIndex: 'regionTypeName',
        width: 140,
    },
    {
        title: 'Адрес канала',
        dataIndex: 'channelAddress',
        width: 320,
    },
    {
        title: 'Номер проекта',
        dataIndex: 'projectNumber',
        width: 120,
    },
    {
        title: 'Тип БН',
        dataIndex: 'balancerTypeName',
        width: 100
    },
    {
        title: 'Тип сервиса',
        dataIndex: 'serviceTypeName',
        width: 100,
    },
    {
        title: 'Наименование клиента',
        dataIndex: 'clientName',
        width: 140,
    },
    {
        title: 'ФИО КЛ клиента',
        dataIndex: 'clientPersonName',
        width: 120,
    },
    {
        title: 'Телефон КЛ клиента',
        dataIndex: 'clientPersonPhone',
        width: 120,
    },
    {
        title: 'Адрес доставки БН',
        dataIndex: 'deliveryAddress',
        width: 320,
    },
    {
        title: 'ФИО и телефон КЛ для доставки',
        dataIndex: 'deliveryPerson',
        width: 200
    },
    {
        title: 'Разовый платеж',
        dataIndex: 'onceFee',
        width: 100,
    },
    {
        title: 'Ежемес. платеж',
        dataIndex: 'periodicFee',
        width: 100,
    },
    {
        title: 'Доп. действия с заказом',
        dataIndex: 'transferChannel',
        width: 100,
    },
    {
        title: 'Комментарий',
        dataIndex: 'comments',
        width: 320,
    },
];

export default {
    data() {
        return {
            searchQuery: '',
            data: null,
            pagination: { pageSize: 10, current: 1 },
            locale: {
                emptyText: 'Заявки отсутствуют'
            }
        }
    },
    created() {
        const { page } = this.$route.query

        if(page) {
            this.pagination.current = +page
        }

        this.fetch()
    },
    computed: {
        ...mapState('app', ['admin']),
        ...mapGetters('app', ['allowEdit']),
        filtered(item) {
            return filterByFields(this.searchQuery, this.data)(this.columns.map(x => x.dataIndex))
        },
        columns() {
            const cols = [...columns];

            if(this.admin) {
                cols.push({
                    title: 'Действие',
                    key: 'operation',
                    fixed: 'right',
                    width: 100,
                    scopedSlots: { customRender: 'action' },
                })
            }

            return cols;
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
        async fetch() {
            const requests = await this.$api.request.getRequests()

            this.data = requests.map(x => {
                x.date = dayjs(x.date).format('DD.MM.YYYY')
                x.key = x.id

                return x
            })
        },

        customRow(record) {
            return {
                on: {
                    // click: () => {
                    //     this.$router.push('/requests/' + record.id)
                    // }
                }
            }
        },

        removeRequest(e, id) {
            e.stopPropagation()
            this.$api.request.removeRequestById(id)
        }
    }
}
</script>

<style lang="scss" scoped>
    .block {
        display: block;
    }
</style>