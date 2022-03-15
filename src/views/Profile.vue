<template>
    <Page wrap>
        <SubHeader slot="sub-header" title="Профиль"/>

        <a-spin :spinning="!user">
            <a-form :form="form" @submit="handleSubmit" :label-col="{ span: 3 }" :wrapper-col="{ span: 12 }" class="--label-left">
                <a-form-item label="Фамилия"  >
                    <a-input
                        v-decorator="['last', { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>
                
                <a-form-item label="Имя">
                    <a-input
                        v-decorator="['first', { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>

                <a-form-item label="Отчество">
                    <a-input
                        v-decorator="['middle', { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>

                <a-form-item label="Логин">
                    <a-input
                        v-decorator="['login', { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>

                <a-form-item label="Пароль">
                    <a-input-password
                        @input="handlePassword"
                        v-decorator="['password']"
                    />
                </a-form-item>

                <a-form-item label="Подтверждение пароля">
                    <a-input-password
                        :disabled="!password.length"
                        v-decorator="['passwordConfirm', { rules: [{ required: password.length, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>
                
                <a-form-item :wrapper-col="{ span: 12, offset: 3 }">
                    <a-button type="primary" html-type="submit">
                        Сохранить
                    </a-button>
                    <a-button type="primary" ghost @click="resetTables" style="margin-left: 12px;">
                        Сбросить настройки
                    </a-button>
                </a-form-item>
            </a-form>
        </a-spin>
    </Page>
</template>

<script>
import _ from 'lodash'
import { mapActions } from 'vuex'

export default {
    metaInfo: {
        title: 'Мой профиль'
    },
    data() {
        return {
            password: '',

            user: null,
            form: this.$form.createForm(this, { name: 'coordinated' }),
        }
    },
    mounted() {
        this.$api.company.getCurrentUser()
            .then(user => {
                this.user = user

                const { last, first, middle, account } = this.user

                this.form.setFieldsValue({
                    last,
                    first,
                    middle,
                    login: account.login
                });
            })
    },
    methods: {
        ...mapActions('auth', ['loadUser']),
        resetTables() {
            this.$confirm({
                title: 'Сбросить настройки?',
                cancelText: 'Отмена',
                okText: 'Сбросить',
                onOk: () => {
                    localStorage.clear()

                    this.$notification.success({ message: 'Настройки сохранены' })
                },
                onCancel: () => {},
            });
        },
        handlePassword(e) {
            this.password = e.target.value
        },
        handleSubmit(e) {
            e.preventDefault();
            this.form.validateFields((err, values) => {
                if (err) {
                    return
                }

                const data = _.omit(values, ['login', 'password', 'passwordConfirm'])
                const toSend = Object.assign({}, this.user, data, {
                    account: null
                })

                toSend.account = {
                    login: values.login
                }

                if(values.password) {
                    if(values.password !== values.passwordConfirm) {
                        this.$notification.warn({
                            message: 'Пароли не совпадают'
                        })

                        return;
                    } else {
                        toSend.account.password = values.password
                    }
                } 

                this.$api.company.updateUser(this.user.id, toSend)
                    .then(x => {
                        this.loadUser()
                        this.$notification.success({
                            message: 'Изменения сохранены',
                        });
                    })

            });
        }
    }
}
</script>
