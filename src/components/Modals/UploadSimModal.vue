<template>
    <a-modal
        title="Импорт СИМ"
        :visible="true"
        @ok="save"
        @cancel="close"
        :okText="saveButtonText"
        cancelText="Отмена"
        :width="700"
        class="modal"
        :okButtonProps="okButtonProps"
    >

        <a-form :form="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 10 }" class="--label-left">
            <a-form-item label="Оператор" >
                <a-select
                    v-decorator="['operatorID', fieldOptions]"
                >
                    <a-select-option :value="bn.id" v-for="bn of operators" :key="bn.id">
                        {{bn.name}}
                    </a-select-option>
                </a-select>
            </a-form-item>

            <a-form-item label="Файл Excel">
                <a-upload
                    name="file"
                    @change="pickFile"
                    :beforeUpload="() => false"
                    v-decorator="['file', fieldOptions]"
                    :remove="remove"
                >
                    <a-button> <a-icon type="upload" /> Выбрать файл </a-button>
                </a-upload>
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script>
import excel from 'read-excel-file'
import _ from 'lodash'

export default {
    props: ['operators', 'tariffs'],
    data() {
        return {
            form: this.$form.createForm(this, { name: 'upload-sim-form' }),
            SIMList: null,
        }
    },
    methods: {
        remove() {
            this.SIMList = null
        },
        async pickFile({ file }) {
            if(!file) {
                return
            }

            if(file.status === 'removed') {
                return
            }

            try {
                const [ header, ...values ] = await excel(file)

                this.SIMList = values
            } catch(e) {
                this.$notification.error({
                    message: 'Файл не поддерживается'
                })
            }
        },
        close() {
            this.$emit('close')
        },
        async save() {
            this.form.validateFieldsAndScroll(async (err, { operatorID }) => {
                if(err) {
                    return;
                }

                const sim = this.SIMList
                    .filter(([_, msisdn]) => !!String(msisdn))
                    .map(([number, msisdn, iccid, ip, tpName]) => {
                        tpName = String(tpName || '')

                        const tp = tpName 
                            ? this.tariffs.find(x => x.name.toLowerCase().includes(tpName.toLowerCase()))
                            : null

                        return {
                            operatorID,
                            msisdn: String(msisdn),
                            iccid: String(iccid),
                            ip: String(ip),
                            tariffPlanID: _.get(tp, 'id')
                        }
                    })

                try {
                    await this.$api.sim.addSIM(sim)
                    this.$notification.error({
                        message: 'СИМ импортированы'
                    })

                    this.close()
                    this.$nextTick(() => {
                        this.$bus.$emit('route:reload')
                    })
                } catch(e) {
                    this.$notification.error({
                        message: 'Произошла ошибка'
                    })
                }
            })
        }
    },
    computed: {
        saveButtonText() {
            return 'Загрузить' + (this.SIMList ? ` (${this.SIMList.length})` : '')
        },
        okButtonProps() {
            return {
                props: {
                    disabled: !this.SIMList
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
