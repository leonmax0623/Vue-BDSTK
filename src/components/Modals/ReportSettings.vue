<template lang="pug">
    a-modal(
        title="Настройка отчета"
        :visible="true"
        @ok="create"
        @cancel="close"
        okText="Создать отчет"
        cancelText="Отмена"
        :width="500"
        class="modal"
        :okButtonProps="okButtonProps"
    )
        div(v-if="loading") Идет создание отчета
        template(v-else)
            template(v-if="report.typeID === ReportType.ByDate")
                a-form(:form="form" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }" class="--label-left")
                    a-form-item(label="Дата отчета")
                        a-date-picker(v-model="date" v-decorator="['date', formItemOptions]" placeholder="" :locale="$lang.locale")
            template(v-if="report.typeID === ReportType.ByPeriod")
                a-button-group(style="margin-bottom: 12px;")
                    a-button(
                        v-for="(item, index) of periodOptions"
                        :key="index"
                        type="primary"
                        @click="setPeriod(item)"
                    ) {{item.title}}
                a-form(:form="form" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
                    a-form-item(label="Дата отчета")
                        a-range-picker(v-decorator="['date', formItemOptions]" :placeholder="['От', 'До']" :locale="$lang.locale")
</template>

<script>
import saveFile from 'file-saver'
import mime from 'mime'
import { ReportType, ReportTypeName } from '@/common'
import moment from 'moment'

export default {
    props: {
        report: {
            required: true,
        },
    },
    data() {
        return {
            ReportType,
            date: null,
            loading: false,
            form: this.$form.createForm(this, { name: 'upload-sim-form' }),
        }
    },
    created() {
        if(this.report.typeID === ReportType.Simple) {
            this.loading = true
            setTimeout(() => {
                this.create()
            }, 1000)
        }
    },
    computed: {
        periodOptions() {
            return [
                {
                    title: 'Год',
                    value: [
                        moment().subtract('year', 1).startOf('month'),
                        moment().endOf('month'),
                    ]
                },
                {
                    title: '6 месяцев',
                    value: [
                        moment().subtract('month', 6).startOf('month'),
                        moment().endOf('month'),
                    ]
                },
                {
                    title: 'Предыдущий месяц',
                    value: [
                        moment().subtract('month', 1).startOf('month'),
                        moment().subtract('month', 1).endOf('month'),
                    ]
                },
                {
                    title: 'Текущий месяц',
                    value: [
                        moment().startOf('month'),
                        moment().endOf('month'),
                    ]
                },
            ]
        },
        formItemOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        },
        okButtonProps() {
            return {
                props: {
                    loading: this.loading,
                    // disabled: (() => {
                    //      switch(this.report.typeID) {
                    //         case ReportType.Simple:
                    //             return false
                    //         case ReportType.ByDate:
                    //         case ReportType.ByPeriod:
                    //             return !this.date
                    //      }
                    // })()
                }
            }
        }
    },
    methods: {
        setPeriod(item) {
            this.form.setFieldsValue({
                date: item.value
            })
        },
        close() {
            this.$emit('close')
        },
        async create() {
            this.form.validateFields(async (err, form) => {
                if(err) {
                    return
                }

                this.loading = true
                
                let fileName = `${this.report.name}.xls`

                const params = {}

                if(this.report.typeID === ReportType.ByDate) {
                    params.date = form.date.toDate()
                    fileName = `${this.report.name} - ${form.date.format('DD.MM.YYYY')}.xls`
                }

                if(this.report.typeID === ReportType.ByPeriod) {
                    const [from, to] = form.date

                    params.from = from.toDate()
                    params.to = to.toDate()
                    fileName = `${this.report.name} - [${from.format('DD.MM.YYYY')}-${to.format('DD.MM.YYYY')}].xls`
                }

                const report = await this.$api.report.getReport(this.report.id, params)

                const blob = new Blob([report], {
                    type: mime.getType(fileName)
                })

                saveFile(blob, fileName)
                this.loading = false
                this.close()
            })
            
        }
    }
}
</script>