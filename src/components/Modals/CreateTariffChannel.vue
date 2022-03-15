<template>
    <a-modal
        :title="title"
        :visible="true"
        @ok="handleSubmit"
        @cancel="close"
        okText="Сохранить"
        cancelText="Отмена"
        :width="700"
        class="modal"
    >
        <a-form
            :form="form"
            :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }"
            class="--label-left"
        >

            <a-form-item label="Наименование" >
                <a-input
                    v-decorator="['name', formItemOptions]"
                />
            </a-form-item>

            <a-row :gutter="0">
                <a-col :span="10" style="line-height: 36px;" class="ant-form-item-required">
                    Разовый платеж за канал
                </a-col>
                <a-col :span="14">
                    <a-form-item label="Москва и область" >
                        <a-input-number
                            v-decorator="['costMoscow', formItemOptions]"
                        />
                    </a-form-item>

                    <a-form-item label="РФ" >
                        <a-input-number
                            v-decorator="['costRussia', formItemOptions]"
                        />
                    </a-form-item>
                </a-col>
            </a-row>

            

            <a-form-item label="Абонплата за канал" >
                <a-input-number
                    class="w100"
                    v-decorator="['subscriptionFee', formItemOptions]"
                />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script>
import _ from 'lodash'

export default {
    props: ['record'],
    beforeCreate() {
        this.form = this.$form.createForm(this, { name: 'normal_login' });
    },

    mounted() {
        if(this.record) {
            // const form = _.keys(this.record).reduce((prev, key) => {
            //     const assign = {}

            //     if(key === 'operatorID') {
            //         assign['operatorId'] = this.record[key]
            //     } else {
            //         assign[key] = this.record[key]
            //     }

            //     return {
            //         ...prev,
            //         ...assign
            //     }
            // }, {})

            setTimeout(() => this.form.setFieldsValue(this.record))
        }
    },

    methods: {
        close() {
            this.$emit('close')
        },
        handleSubmit(e) {
            e.preventDefault();
            this.form.validateFields((err, form) => {
                if (err) {
                    return
                }

                let $promise

                if(this.EDIT) {
                    $promise = this.$api.tariff.updateChannelTariff(this.record.id, Object.assign({}, this.record, form))
                } else {
                    $promise = this.$api.tariff.createChannelTariff(form)
                }


                $promise
                    .then(() => {
                        this.$notification.success({
                            message: this.EDIT
                                ? 'Изменения сохранены'
                                : 'Тарифный план создан'
                        })

                        this.close()
                        this.$emit('submit')
                    })
            });
        },
    },
    computed: {
        EDIT() {
            return !!this.record
        },
        title() {
            return this.EDIT
                ? 'Редактирование тарифного плана'
                : 'Новый тарифный план Канал'
        },
        formItemOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        }
    }
}
</script>

<style lang="scss" scoped>
    .modal {
        .ant-input-number {
            width: 100% ;
        }
    }
</style>