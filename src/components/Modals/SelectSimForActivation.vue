<template>
	<a-modal
        visible
        :width="700"
        @cancel="close"
	>
        <span slot="title">Выбор СИМ карт для активации</span>

        <a-input
            placeholder="Поиск..."
            v-model="query"
            allowClear
            style="margin-bottom: 12px;"
        >
            <a-tooltip slot="suffix" title="Поиск">
                <a-icon type="search" style="color: rgba(0,0,0,.45)" />
            </a-tooltip>
        </a-input>

		<a-table
            :loading="!sim"
            :columns="columns"
            :dataSource="filtered"
            :rowSelection="rowSelection"
            :locale="locale"
        >
            <span slot="footer">Осталось выбрать: <span style="color: #d2315d;">{{selected.length - selectedRowKeys.length}}</span> сим карт</span>
        </a-table>

        <template slot="footer">
            <a-button @click="close">Отмена</a-button>
            <a-button type="primary" :disabled="disabled" @click="save" :loading="loading">Отправить на активацию</a-button>
        </template>
	</a-modal>
</template>

<script>
import { StatusSIM } from '@/common'

const columns = [
    {
        title: 'MSISDN',
        dataIndex: 'msisdn'
    },
    {
        title: 'ICCID',
        dataIndex: 'iccid'
    },
    {
        title: 'IP',
        dataIndex: 'ip'
    },
    {
        title: 'Статус',
        dataIndex: 'currentState',
    }
]

export default {
    props: ['selected'],
    data() {
        return {
            query: '',
            loading: false,
            selectedRowKeys: [],
            columns,
            sim: null,
            locale: {
                emptyText: 'Нет доступных СИМ карт'
            }
        }
    },
    computed: {
        filtered() {
            if(!this.query) {
                return this.sim
            }

            return this.sim.filter(item => {
                return Object
                    .keys(item)
                    .some(key => {
                        if(!item[key]) {
                            return false
                        }

                        return ~item[key].toString().toLowerCase().indexOf(this.query.toLowerCase())
                    })
            })
        },
        disabled() {
            return this.selectedRowKeys.length !== this.selected.length
        },
        title() {
            return `Выбор СИМ карт для активации в ${this.selected.length} заказах`
        },
        rowSelection() {
            const { selectedRowKeys } = this

            return {
                selectedRowKeys,
                onChange: selected => {
                    if(selected.length > this.selected.length) {
                        return
                    }

                    this.selectedRowKeys = selected
                }
            }
        }
    },
    async created() {
        const { tpId, operatorID } = this.selected[0]

        this.sim = await this.$api.sim.getSIM({ operatorID })

        this.sim = this.sim.filter(s => {
            // Удаляем из списка все симка у которых проставлен тп, но он не совпадает с выбранным
            if(s.tariffPlanID && s.tariffPlanID !== tpId) {
                return false
            }

            if(!~[StatusSIM.Disabled, StatusSIM.Blocked].indexOf(s.currentStateID)) {
                return false
            }

            if(s.used) {
                return false
            }

            return true
        }).map(s => ({
            ...s,
            key: s.id
        }))
    },
    methods: {
        close() {
            this.$emit('close')
        },
        async save() {

            const sim = this.selected.map(({ orderId, tpId, operatorID, refID }, index) => {
                const card = this.sim.find(x => x.id === this.selectedRowKeys[index])

                return {
                    ..._.pick(card, ['msisdn', 'iccid', 'ip']),
                    tariffPlanID: tpId,
                    orderID: orderId,
                    operatorID,
                    simID: card.id,
                    refID
                }
            })

            this.loading = true

            try {
                const email = await this.$api.sim.prepareActivate(sim)
                
                this.loading = false

                this.$modal({
                    component: 'ConfirmSimEmail',
                    options: { email },
                    on: {
                        complete: async body => {
                            await this.$api.sim.sendActivate({ ...email, body })

                            this.$notification.success({
                                message: `Заявка на активацию успешно отправлена`
                            })

                            this.close()
                            this.$nextTick(() => {
                                this.$bus.$emit('route:reload')
                            })
                        }
                    }
                })

            } catch(e) {
                this.loading = false
                this.close()
            }
        }
    }
}
</script>