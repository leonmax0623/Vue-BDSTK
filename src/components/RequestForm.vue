<template>
    <a-spin :spinning="loading">
        <a-form :form="form" @submit="$emit('submit', $event)" :label-col="{ span: 4 }" :wrapper-col="{ span: 12 }" class="--label-left">
            <slot name="header"/>

            <a-form-item label="Наименование абонента" >
                <a-select
                    :disabled="readonly"
                    :loading="!abonents"
                    v-decorator="['abonent', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of abonents" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>
            
            <a-form-item label="Регион" >
                <a-select
                    :disabled="readonly"
                    :loading="!regions"
                    v-decorator="['regionType', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of regions" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>
            
            <a-form-item label="Адрес канала" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['channelAddress', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="Номер проекта" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['projectNumber', fieldOptions]"
                />
            </a-form-item>

            <a-form-item label="Тип БН">
                <a-select
                    :disabled="readonly"
                    :loading="!bns"
                    v-decorator="['balancerType', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of bns" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>
            
            <a-form-item label="Тип сервиса" >
                <a-select
                    :disabled="readonly"
                    :loading="!services"
                    v-decorator="['serviceType', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of services" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>
            
            <a-form-item label="Наименование клиента" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['clientName', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="ФИО КЛ клиента" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['clientPersonName', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="Телефон КЛ клиента" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['clientPersonPhone', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="Адрес доставки БН" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['deliveryAddress', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="ФИО и телефон КЛ для доставки" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['deliveryPerson', fieldOptions]"
                />
            </a-form-item>
            
            <a-form-item label="Разовый платеж" >
                <a-input-number
                    :disabled="readonly"
                    v-decorator="['onceFee', fieldOptions]"
                />
                руб.
            </a-form-item>
            
            <a-form-item label="Ежемесячный платёж" >
                <a-input-number
                    :disabled="readonly"
                    v-decorator="['periodicFee', fieldOptions]"
                />
                руб.
            </a-form-item>
            
            <a-form-item label="Доп. действия с заказом" >
                <a-input
                    :disabled="readonly"
                    v-decorator="['transferChannel']"
                />
            </a-form-item>

            <a-form-item label="Комментарии" >
                <a-textarea
                    placeholder="Введите комментарий..."
                    :autosize="{ minRows: 4, maxRows: 12 }"
                    :disabled="readonly"
                    v-decorator="['comments']"
                />
            </a-form-item>
            
            <slot name='footer'/>
        </a-form>
    </a-spin>
</template>

<script>
import _ from 'lodash'
import { PaymentType, AddressType, PersonType } from '@/common'

export default {
    props: {
        loading: Boolean,
        readonly: Boolean,
    },
    data() {
        return {
            services: null,
            abonents: null,
            bns: null,
            regions: null,
            form: this.$form.createForm(this, { name: 'request-form' })
        }
    },
    
    async mounted() {
        this.bns = await this.$api.balancer.getBalancerTypes()
        this.abonents = await this.$api.abonent.getAbonents()
        this.services = await this.$api.service.getServices()
        this.regions = await this.$api.region.getRegions()
    },

    computed:{
        fieldOptions() {
            return {
                rules: [{ required: !this.readonly, message: 'Заполните обязательное поле!' }]
            }
        },
    }
}
</script>