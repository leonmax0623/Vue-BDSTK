<template>
    <a-modal
        :title="title"
        :visible="true"
        :width="700"
        :okButtonProps="okButtonProps"
        :closable="false"
    >
        <a-spin :spinning="loading">
            <a-form :form="form" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }" class="--label-left">
                <a-form-item label="Фамилия">
                    <a-input
                        v-decorator="['last', fieldOptions]"
                    />
                </a-form-item>
                
                <a-form-item label="Имя">
                    <a-input
                        v-decorator="['first', fieldOptions]"
                    />
                </a-form-item>

                <a-form-item label="Отчество">
                    <a-input
                        v-decorator="['middle', fieldOptions]"
                    />
                </a-form-item>

                <a-form-item label="Отдел" >
                    <a-select
                        :loading="!departments"
                        v-decorator="['departmentID', fieldOptions]"
                    >
                        <a-select-option :value="bn.id" v-for="bn of departments" :key="bn.id">
                            {{bn.name}}
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="Позиция" >
                    <a-select
                        :loading="!postTypes"
                        v-decorator="['postID', fieldOptions]"
                    >
                        <a-select-option :value="bn.id" v-for="bn of postTypes" :key="bn.id">
                            {{bn.name}}
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="Логин">
                    <a-input
                        v-decorator="['login', fieldOptions]"
                    />
                </a-form-item>

                <a-form-item label="Пароль">
                    <a-input-password
                        v-model="password"
                        v-decorator="['password', { rules: [{ required: !userId, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>

                <a-form-item label="Подтверждение пароля">
                    <a-input-password
                        :disabled="!password.length"
                        v-decorator="['passwordConfirm', { rules: [{ required: password.length, message: 'Заполните обязательное поле!' }] }]"
                    />
                </a-form-item>

            </a-form>
        </a-spin>

        <div slot="footer" class="modal-footer">
            <a-button type="danger" ghost @click="removeUser" v-if="userId">Удалить пользователя</a-button>

            <Filler/>

            <a-button @click="close">Отмена</a-button>
            <a-button type="primary" @click="save">Сохранить</a-button>

        </div>
    </a-modal>
</template>

<script>
import { mapActions } from 'vuex'

export default {
    props: ['userId'],
    data() {
        return {
            password: '',

            loading: true,
            departments: null,
            postTypes: null,
            user: null,

            form: this.$form.createForm(this, { name: 'user-form' }),
        }
    },
    async created() {
        if(this.userId) {
            this.user = await this.$api.company.getEmployeeById(this.userId)

            setTimeout(() => {
                this.form.setFieldsValue({
                    ..._.pick(this.user, [
                        'last',
                        'first',
                        'middle',
                        'departmentID',
                        'postID'
                    ]),
                    login: _.get(this.user, 'account.login')
                })
            })
        }

        ;[
            this.departments,
            this.postTypes
        ] = await Promise.all([
            this.$api.company.getDepartments(),
            this.$api.company.getPostTypes(),
        ])

        this.loading = false
    },
    methods: {
        ...mapActions('auth', ['loadUser']),
        removeUser() {
            this.$confirm({
                title: 'Вы уверены что хотите удалить пользователя?',
                okText: 'Удалить',
                cancelText: 'Отмена',
                onOk: async () => {
                    await this.$api.company.deleteUser(this.userId)
                    this.close()
                    this.$notification.success({
                        message: 'Пользователь удален'
                    })
                    this.$emit('update')
                }
            })
        },
        close() {
            this.$emit('close')
        },
        save() {
            this.form.validateFields(async (err, form) => {
                if(err) {
                    return
                }

                const data = {
                    ..._.pick(form, [
                        'last',
                        'first',
                        'middle',
                        'departmentID',
                        'postID'
                    ]),
                    account: {
                        login: form.login
                    }
                }

                if(form.password) {
                    if(form.password !== form.passwordConfirm) {
                        this.$notification.warn({
                            message: 'Пароли не совпадают'
                        })

                        return;
                    } else {
                        data.account.password = form.password
                    }
                }

                if(this.userId) {
                    await this.$api.company.updateUser(this.userId, data)
                    this.loadUser()
                } else {
                    await this.$api.company.addUser(data)
                }

                this.close()
                this.$emit('update')
                this.$notification.success({
                    message: this.userId
                        ? 'Данные пользователя сохранены'
                        : 'Новый пользователь добавлен'
                })
            })
        },
    },
    computed: {
        title() {
            return this.userId
                ? 'Редактирование пользователя'
                : 'Добавление пользователя'
        },
        okButtonProps() {
            return {
                props: {
                    // disabled: true
                }
            }
        },
        fieldOptions() {
            return { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }
        }
    }
}
</script>


<style lang="scss" scoped>
.modal-footer {
    display: flex;
}
</style>