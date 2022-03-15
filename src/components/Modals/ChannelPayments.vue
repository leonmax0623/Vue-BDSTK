<template lang="pug">
    a-modal(
        :confirmLoading="loading"
        title="Платежи по каналу"
        :visible="true"
        @ok="save"
        @cancel="close"
        okText="Сохранить"
        cancelText="Отмена"
        :width="700"
        class="modal"
    )
        div nice
         
</template>

<script>
import { InvoiceKind } from '@/common'

export default {
    data() {
        return {
            loading: false,
            payments: null
        }
    },
    async created() {
        this.payments = await this.$api.order.getPayments(id)
    },
    methods: {
        close() {
            this.$emit('close')
        },
        create() {
            this.$modal({
                component: 'CreatePayment',
                options: {
                },
                on: {
                    close: () => {
                        this.fetch()
                    }
                }
            })
        }
    },
}
</script>