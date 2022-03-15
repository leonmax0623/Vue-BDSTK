<template>
    <Page>
        <SubHeader slot="sub-header" title="Документы"/>

        <div class="flexer">
            <a-card style="width: 800px;">
                <a-form :form="form" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }" class="--label-left">
                    <a-form-item label="Номер заказа" >
                        <a-select
                            showSearch
                            :filterOption="false"
                            :loading="!orders"
                            v-decorator="['order', fieldOptions]"
                            @search="handleSearchOrder"
                        >
                            <a-select-option :value="bn.id" v-for="bn of filteredOrders" :key="bn.id">
                                {{bn.number}}
                            </a-select-option>
                        </a-select>
                        <a-button @click="openOrder">Открыть</a-button>
                    </a-form-item>
                </a-form>

                <a-spin :spinning="loadingDocs" style="width:100%">
                    <div v-if="docs" class="docs">
                        <div v-if="!docs.length" class="error">Нет доступных для скачивания документов</div>

                        <template v-else>
                            <a-card v-for="(doc, i) of docs" :title="doc.name" :key="i">
                                <a-button-group slot="extra">
                                    <!-- <a-button icon="printer" :loading="isDocPrinting(doc.id)" @click="printDocument(doc)"/> -->
                                    <a-button icon="download" @click="saveFile(doc)"/>
                                </a-button-group>
                            </a-card>
                        </template>
                    </div>
                </a-spin>
            </a-card>
        </div>
    </Page>
</template>

<script>

import saveFile from 'file-saver'
import mime from 'mime'

export default {
    data() {
        return {
            currentOrderId: null,
            orders: null,
            form: this.$form.createForm(this, { name: 'form' }),
            query: '',
            loadingDocs: false,
            docs: null,
        }
    },
    created() {
        this.fetch()    
    },
    computed: {
        fieldOptions() {
            return {
                rules: [{ required: true, message: 'Заполните обязательное поле!' }]
            }
        },
        filteredOrders() {
            if(!this.query) {
                return this.orders
            }

            return this.orders.filter(x => x.number.startsWith(this.query))
        },
    },
    methods: {
        async saveFile(doc) {
            const data = await this.$api.order.getDocumentsByType(this.currentOrderId, doc.id)

            const fileName = doc.fileName || `${doc.name} №${this.orders.find(x => x.id === this.currentOrderId).number}.docx`

            const blob = new Blob([data], {
                type: mime.getType(fileName)
            })

            saveFile(blob, fileName)
        },
        async fetch() {
            this.orders = (await this.$api.order.getShortList())
                .sort((a, b) => {
                    const aa = parseFloat(a.number)
                    const bb = parseFloat(b.number)

                    if(aa == bb) {
                        return 0
                    }

                    if(aa > bb) {
                        return 1
                    } else {
                        return -1
                    }
                })
        },
        handleSearchOrder(query) {
            this.query = query
        },
        openOrder() {
            this.form.validateFieldsAndScroll(async (err, { order }) => {
                if(err) {
                    return
                }

                this.currentOrderId = order

                this.loadingDocs = true
                this.docs = await this.$api.order.getOrderDocuments(this.currentOrderId)
                this.loadingDocs = false
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.flexer {
    display: flex;
    align-items: center;
    justify-content: center;
}

.error {
    display: flex;
    justify-content: center;
    color: #999;
    text-transform: uppercase;
}

.docs {
    position: relative;
    border-top: 1px solid #ddd;
    margin: 0 -24px;
    padding: 20px 24px 0;
    overflow: hidden;
    
    &:before {
        content: '';
        position: absolute;
        left: -200px;
        right: -200px;
        bottom: -200px;
        top: 0;
        box-shadow:
            inset 0 2px 10px 0 rgba(#000, .1),
        ;
    }
}
</style>