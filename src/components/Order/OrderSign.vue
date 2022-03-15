<template>
    <a-card>
        <a-checkbox :checked="isCheckedOnSign" @change="changeOnSign" :disabled="READONLY">
            Заказ на подписании
        </a-checkbox>
        <a-checkbox :checked="isCheckedSigned" @change="changeSigned" :disabled="READONLY">
            Заказ подписан
        </a-checkbox>

        <a-form :form="signForm" v-show="isCheckedOnSign" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }" class="--label-left" style="margin-top: 20px;">
            <a-form-item label="Номер счета по инсталляционному платежу" >
                <a-input
                    :disabled="READONLY"
                    v-decorator="['number', fieldOptions]"
                />
            </a-form-item>
            <a-form-item label="Дата счета по инсталляционному платежу" >
                <a-date-picker
                    :disabled="READONLY"
                    v-decorator="['date', fieldOptions]"
                    placeholder=""
                    :locale="$lang.locale"
                />
            </a-form-item>
        </a-form>

        <a-row type="flex" justify="end" v-if="!READONLY">
            <a-button type="primary" style="margin-left: 12px;" :loading="loadingNextStatus" v-if="showNextStatusButton" @click="nextStatus">{{order.expectedStatus.name}}</a-button>
            <a-button type="primary" v-else @click="save" :disabled="buttonDisabled">Сохранить</a-button>
        </a-row>
    </a-card>
</template>

<script>
import { OrderStatus, InvoiceKind, getCategoryByService, ServiceCategory } from '@/common'
import moment from 'moment'
import _ from 'lodash'

export default {
    props: ['order', 'READONLY', 'statusHistory'],
    data() {
        return {
            OrderStatus,
            sign: {
                onSign: false,
                signed: false,
            },
            signForm: this.$form.createForm(this, { name: 'sign-form' }),
            loadingNextStatus: false,
        }
    },
    async mounted() {
        this.invoices = await this.$api.order.getInvoices(this.order.id)

        const first = _.maxBy(this.invoices, x => x.id)

        if(first) {
            setTimeout(() => {
                this.signForm.setFieldsValue({
                    number: first.number,
                    date: moment(first.date)
                })
            })
        }
    },
    methods: {
        isServiceType(type) {
            return getCategoryByService(this.order) === type
        },
        changeOnSign(e) {
            this.sign.onSign = e.target.checked
        },
        changeSigned(e) {
            this.sign.signed = e.target.checked
        },
        async nextStatus() {
            this.loadingNextStatus = true
            await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
            this.loadingNextStatus = false

            this.$bus.$emit('route:reload')
        },
        async save() {
            if(this.isStatus(OrderStatus.Created)) {
                this.signForm.validateFieldsAndScroll(async (err, form) => {
                    if(err) {
                        return
                    }
                    
                    await this.$api.order.addInvoice(this.order.id, {
                        number: form.number,
                        date: form.date.toDate(),
                        kind: InvoiceKind.install
                    })

                    await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)

                    this.$bus.$emit('route:reload')

                })

                return
            }
            
            if(this.isStatus(OrderStatus.OnSign)) {
                await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
                this.$bus.$emit('route:reload')

                return
            }

            this.signForm.validateFieldsAndScroll(async (err, form) => {
                if(err) {
                    return
                }
                
                await this.$api.order.addInvoice(this.order.id, {
                    number: form.number,
                    date: form.date.toDate(),
                    kind: InvoiceKind.install
                })

                if(!~[OrderStatus.SimActivated, OrderStatus.SimOnActivation].indexOf(this.order.expectedStatus.id)) {
                    await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
                }

                this.$bus.$emit('route:reload')

            })



        },
        isStatus(statusId) {
            if(this.order.currentStatus.id === OrderStatus.Canceled) {
                const canceledStateIndex = _.findIndex(this.statusHistory, x => x.id === OrderStatus.Canceled)

                return this.statusHistory[canceledStateIndex - 1].id === statusId
            }

            return this.order.currentStatus.id === statusId
        }
    },
    computed: {
        showNextStatusButton() {
            return this.order.currentStatus.id === OrderStatus.Signed && this.order.expectedStatus.id !== OrderStatus.SimOnActivation
        },
        fieldOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        },
        buttonDisabled() {
            if(this.isStatus(OrderStatus.Created)) {
                return !this.sign.onSign
            }

            if(this.isStatus(OrderStatus.OnSign)) {
                return !this.sign.signed
            }

            return false
            
            // if(this.isStatus(OrderStatus.OnSign)) {
                //     await this.$api.order.changeStatus(this.order.id, OrderStatus.Signed)
            // }
        },
        isCheckedOnSign() {
            if(this.isStatus(OrderStatus.Created)) {
                return this.sign.onSign
            }

            if(this.isStatus(OrderStatus.OnSign)) {
                return true
            }

            return true
        },
        isCheckedSigned() {
            if(this.isStatus(OrderStatus.Created)) {
                return false
            }

            if(this.isStatus(OrderStatus.OnSign)) {
                return this.sign.signed
            }

            return true
        }
    }
}
</script>