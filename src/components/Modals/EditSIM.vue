<template>
    <a-modal
        title="Редактирование СИМ"
        :visible="true"
        @ok="save"
        @cancel="close"
        :okText="saveButtonText"
        cancelText="Отмена"
        :width="700"
        class="modal"
        :okButtonProps="okButtonProps"
    >

        <a-form :form="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" class="--label-left">
            <a-form-item label="Тарифный план" >
                <a-select
                    :allowClear="true"
                    v-decorator="['tariffPlanID']"
                >
                    <a-select-option :value="bn.id" v-for="bn of tariffs" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>

            <a-form-item label="Статус" >
                <a-select
                    v-decorator="['currentStateID', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of simStates" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>

            <a-form-item label="MSISDN">
                <a-input
                    v-decorator="['msisdn', fieldOptions]"
                />
            </a-form-item>

            <a-form-item label="ICCID">
                <a-input
                    v-decorator="['iccid', fieldOptions]"
                />
            </a-form-item>

            <a-form-item label="IP">
                <a-input
                    v-decorator="['ip', fieldOptions]"
                />
            </a-form-item>

            <a-form-item label="S/N БН">
                <a-input
                    disabled
                    v-decorator="['balancerSerialNumber']"
                />
            </a-form-item>

            <a-form-item label="Адрес канала">
                <a-input
                    disabled
                    v-decorator="['address']"
                />
            </a-form-item>

            <a-form-item label="Дата включения">
                <a-input
                    disabled
                    v-decorator="['activateFrom']"
                />
            </a-form-item>

            <!-- <a-form-item label="Дата отключения">
                <a-input
                    disabled
                    v-decorator="['address']"
                />
            </a-form-item> -->

            <a-form-item label="Номер заказа">
                <a-input
                    disabled
                    v-decorator="['orderNumber']"
                />
            </a-form-item>

            <a-form-item label="Комментарий">
                <a-textarea
                    :rows="6"
                    v-decorator="['comments']"
                />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script>
import dayjs from 'dayjs'
import { StatusSIM, SimStatusText } from '@/common'

export default {
    props: ['sim', 'tariffs'],
    data() {
        return {
            loading: false,
            form: this.$form.createForm(this, { name: 'request-form' }),
        }
    },
    mounted() {
        const values = {
            ...this.sim,
        }

        if(!values.tariffPlanID) {
            values.tariffPlanID = null
        }

        values.activateFrom = values.activateFrom
            ? dayjs(values.activateFrom).format('DD.MM.YYYY')
            : ''

        setTimeout(() => this.form.setFieldsValue(values))
    },
    methods: {
        close() {
            this.$emit('close')
        },
        async save() {
            this.form.validateFields(async (err, form) => {
                if(err) {
                    return
                }

                try {
                    this.loading = true

                    const data = {
                        ...this.sim,
                        ..._.pick(form, [
                            'tariffPlanID',
                            'currentStateID',
                            'msisdn',
                            'iccid',
                            'ip',
                            'comments'
                        ]),
                    }

                    if(!data.tariffPlanID) {
                        data.tariffPlanID = 0
                    }

                    await this.$api.sim.updateSIM(data.id, data)

                    this.close()
                    this.$notification.success({ message: 'Изменения сохранены' })
                    // this.$bus.$emit('route:reload')
                    this.$emit('saved')
                } catch(e) {
                    this.$notification.error({
                        message: 'Произошла ошибка запроса'
                    })
                } finally {
                    this.loading = false
                }
            })
        }
    },
    computed: {
        simStates() {
            return Object
                .keys(StatusSIM)
                .map(key => ({
                    id: StatusSIM[key],
                    name: SimStatusText[key]
                }))
        },
        saveButtonText() {
            return 'Сохранить'
        },
        okButtonProps() {
            return {
                props: {
                    loading: this.loading,
                    disabled: false
                }
            }
        },
        fieldOptions() {
            return {
                rules: [{ required: !this.readonly, message: 'Заполните обязательное поле!' }]
            }
        },
    }
}
</script>