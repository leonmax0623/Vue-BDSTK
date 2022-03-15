<template>
    <a-modal
        :title="title"
        :visible="true"
        @ok="handleSubmit"
        @cancel="close"
        okText="Сохранить"
        cancelText="Отмена"
    >
        <a-form
            :form="form"
            :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }"
            class="--label-left"
        >
            <a-form-item label="Оператор" >
                <a-select
                    :loading="!operators"
                    :disabled="EDIT"
                    v-decorator="['operatorId', formItemOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of operators" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>

            <a-form-item label="Полное наименование" >
                <a-input
                    v-decorator="['comments', formItemOptions]"
                />
            </a-form-item>

            <a-form-item label="Сокращенное наименование" >
                <a-input
                    v-decorator="['name', formItemOptions]"
                />
            </a-form-item>

            <a-form-item label="Тариф с НДС" >
                <a-input-number
                    v-decorator="['cost', formItemOptions]"
                    @change="onChangeVAT"
                />
            </a-form-item>

            <a-form-item label="Тариф без НДС">
                <a-input-number
                    v-decorator="['costWithoutVAT', formItemOptions]"
                    @change="onChangeWithoutVAT"
                />
            </a-form-item>

            <a-form-item label="Трафик" >
                <a-input-number
                    v-decorator="['v', formItemOptions]"
                />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script>
import _ from 'lodash'

export default {
    props: ['record'],
    data() {
        return {
            operators: null
        }
    },
    beforeCreate() {
        this.form = this.$form.createForm(this, { name: 'normal_login' });

        this.$api.sim.getOperators()
            .then(operators => {
                this.operators = operators
            })
    },

    mounted() {
        if(this.record) {
            const form = _.keys(this.record).reduce((prev, key) => {
                const assign = {}

                if(key === 'operatorID') {
                    assign['operatorId'] = this.record[key]
                } else {
                    assign[key] = this.record[key]
                }

                return {
                    ...prev,
                    ...assign
                }
            }, {})

            setTimeout(() => {
                this.form.setFieldsValue(form)
            })
        }
    },

    methods: {
        onChangeVAT(val) {
            const num = +val ||null

            if(num) {
                this.form.setFieldsValue({
                    costWithoutVAT: +(num / 1.2).toFixed(2)
                })
            }
        },
        onChangeWithoutVAT(val) {
            const num = +val ||null

            if(num) {
                this.form.setFieldsValue({
                    cost: +(num * 1.2).toFixed(2)
                })
            }
        },
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
                    const send = _.keys(form).reduce((prev, key) => {
                        const assign = {}

                        if(key === 'operatorId') {
                            assign['operatorID'] = form[key]
                        } else {
                            assign[key] = form[key]
                        }

                        return {
                            ...prev,
                            ...assign
                        }
                    }, {})

                    send.id = this.record.id

                    $promise = this.$api.tariff.update(this.record.id, send)
                } else {
                    $promise = this.$api.tariff.create(form)
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
                : 'Новый тарифный план СИМ'
        },
        formItemOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        }
    }
}
</script>