<template>
    <Page>
        <SubHeader slot="sub-header" title="Пользователи">
            <div class="actions">
                <a-input
                    placeholder="Поиск..."
                    v-model="searchQuery"
                    allowClear
                    style="width: 300px"
                >
                    <a-tooltip slot="suffix" title="Поиск">
                        <a-icon type="search" style="color: rgba(0,0,0,.45)" />
                    </a-tooltip>
                </a-input>
                
                <a-button type="primary" @click="addUser" v-if="allowEdit('Access')">Добавить пользователя</a-button>
            </div>
        </SubHeader>

        <a-table
            bordered 
            :loading="!users"
            :columns="columns"
            :dataSource="filteredUsers"
            :locale="locale"
            :customRow="customRow"
            :pagination="false"
        >
            <div slot="fio" slot-scope="text, record">{{getFIO(record)}}</div>
        </a-table>
    </Page>
</template>

<script>
import { filterByFields } from '@/utils'
import { mapGetters } from 'vuex'

const columns = [
    {
        title: 'ФИО',
        scopedSlots: { customRender: 'fio' }
    },
    {
        title: 'Отдел',
        dataIndex: 'departmentName'
    },
    {
        title: 'Должность',
        dataIndex: 'postName'
    }
]

export default {
    metaInfo: {
        title: 'Пользователи'
    },
    data() {
        return {
            searchQuery: '',
            columns,
            users: null,
            locale: {
                emptyText: 'Пользователи не найдены'
            },
        }
    },
    async created() {
        this.fetch()
    },
    computed: {
        ...mapGetters('app', ['allowEdit']),
        filteredUsers() {
            return filterByFields(this.searchQuery, this.users)([
                'first',
                'last',
                'middle'
            ])
        }
    },
    methods: {
        async fetch() {
            this.users = null
            this.users = await this.$api.company.getEmployees()
        },
        getFIO(record) {
            return [record.last, record.first, record.middle].join(' ')
        },
        customRow(user) {
            return {
                on: {
                    click: async e => {
                        if(this.allowEdit('Access')) {
                            this.$bus.$emit('modal', {
                                component: 'UserModal',
                                options: {
                                    userId: user.id
                                },
                                on: {
                                    update: () => {
                                        this.fetch()
                                    }
                                }
                            })
                        }
                    }
                }
            }
        },

        addUser() {
            this.$bus.$emit('modal', {
                component: 'UserModal',
                on: {
                    update: () => {
                        this.fetch()
                    }
                }
            })
        }
    }
}
</script>
