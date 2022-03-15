<template>
	<a-modal
        title="Сим карты"
        visible
        :width="700"
        @cancel="close"
	>
        <a-table
            bordered 
            :columns="columns"
            :dataSource="sims"
        />

        <template slot="footer">
            <b></b>
            <a-button v-if="hasNotActivated" @click="activate" type="primary">Активировать</a-button>
        </template>
	</a-modal>
</template>

<script>
import { StatusSIM } from '@/common'

const columns = [
    {
        title: 'ICCID',
        dataIndex: 'iccid'
    },
    {
        title: 'Статус',
        dataIndex: 'currentState'
    }
    // {
    //     scopedSlots: { customRender: 'tp' },
    // }
]

export default {
    props: ['sims'],
    data() {
        return {
            columns
        }
    },
    computed: {
        notActivated() {
            return this.sims.filter(x => x.currentStateID === StatusSIM.SentToActivation)
        },
        hasNotActivated() {
            return !!this.notActivated.length
        }
    },
    methods: {
        addNew() {
            this.$emit('addNew')
        },
        close() {
            this.$emit('close')
        },
        activate() {
            this.$confirm({
                title: 'Активировать СИМ карты?',
                cancelText: 'Отмена',
                okText: 'Активировать',
                onOk: () => {
                    return new Promise((resolve, reject) => {
                        this.notActivated
                            .map(sim => () => this.$api.sim.activate(sim.id))
                            .reduce((acc, next) => acc.then(next), Promise.resolve())
                            .then(() => {
                                resolve()
                                this.close()
                                this.$bus.$emit('route:reload')
                                this.$notification.success({
                                    message: 'СИМ активированы'
                                })
                            })
                    }).catch(() => console.log('Oops errors!'));
                },
                onCancel: () => {},
            });
        }
    }
}
</script>