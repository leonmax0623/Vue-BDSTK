<template lang="pug">
    Page
        SubHeader(slot="sub-header" title="Отчеты")

        a-table(
            bordered 
            class="table-sim"
            :loading="!tableData"
            :dataSource="tableData"
            :columns="columns"
            :customRow="customRow"
            :pagination="false"
        )

            template(#type="item")
                div {{getType(item.typeID)}}

            template(#actions="item")
                a-button(type="primary" @click="download(item)") Создать отчет
</template>

<script>
import { ReportType, ReportTypeName } from '@/common'

export default {
    data() {
        return {
            ReportType,
            tableData: null,
            columns: [
                {
                    title: 'Наименование',
                    dataIndex: 'name',
                },
                {
                    title: 'Тип отчета',
                    scopedSlots: { customRender: 'type' },
                }, {
                    title: 'Действие',
                    scopedSlots: { customRender: 'actions' }
                }
            ]
        }
    },
    created() {
        this.fetch()
    },
    methods: {
        async download(report) {
            this.$modal({
                component: 'ReportSettings',
                options: {
                    report
                }
            })
        },
        customRow(item) {
            return {
                on: {
                    dblclick: async () => {
                        
                    }
                }
            }
        },
        getType(id) {
            return ReportTypeName[id]
        },
        async fetch() {
            this.tableData = await this.$api.report.getReports()
        },
    },
}
</script>