<template lang="pug">
    a-modal(
        :confirmLoading="loading"
        title="Добавление платежа"
        :visible="true"
        @ok="save"
        @cancel="close"
        okText="Сохранить"
        cancelText="Отмена"
        :width="700"
        class="modal"
    )
        a-form(:form="form" :label-col="{ span: 10 }" :wrapper-col="{ span: 10 }" class="--label-left")
            a-form-item(label="Сумма платежа")
                a-input-number(v-decorator="['cost', formItemOptions]")

            a-form-item(label="Дата платежа")
                a-date-picker(v-decorator="['date', formItemOptions]" placeholder="" :locale="$lang.locale")

            a-form-item(label="Номера платежного получения")
                a-input(v-decorator="['info', formItemOptions]")
         
</template>

<script>
import { InvoiceKind } from '@/common'
import dayjs from 'dayjs'
import moment from 'moment'

export default {
    props: ['id', 'cost', 'date', 'info'],
    data() {
        return {
            loading: false,
            form: this.$form.createForm(this, { name: 'upload-sim-form' }),
        }
    },
    mounted() {
        setTimeout(() => {
            this.form.setFieldsValue({
                cost: this.cost,
                date: this.date,
                info: this.info
            })
        })
    },
    computed: {
        formItemOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        }
    },
    methods: {
        close() {
            this.$emit('close')
        },
        save() {
            this.form.validateFields(async (err, form) => {
                if(err) {
                    return
                }

                this.loading = true

                await this.$api.order.addPayment(this.id, {
                    id: this.id,
                    value: +form.cost,
                    valueWoVAT: +(+form.cost / 1.2).toFixed(2),
                    date: form.date.toDate(),
                    info: form.info,
                    kind: InvoiceKind.install,
                })

                this.loading = false
                this.close()
            })
        }
    },
}
</script>