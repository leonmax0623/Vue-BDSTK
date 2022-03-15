<template>
    <div>
        <a-collapse v-model="activeCollapse">

            <a-collapse-panel header="Комплектующие" key="1" v-if="showTab('EQUIP')">
                <a-row class="mb">
                    <a-col :span="6">
                        <b>Наименование</b>
                    </a-col>
                    <a-col :span="4">
                        <b>Количество</b>
                    </a-col>
                    <a-col :span="4">
                        <b>S/N</b>
                    </a-col>
                </a-row>

                <a-row class="mb" v-if="showBalancerRow">
                    <a-col :span="6">
                        {{order.balancer.balancer.name}}
                    </a-col>
                    <a-col :span="4">
                        1
                    </a-col>
                    <a-col :span="4">
                        {{order.balancer.serialNumber}}
                    </a-col>
                    <a-col :span="4" v-if="~[OrderStatus.DisabledAndSimBlocked, OrderStatus.ChannelDisabled].indexOf(order.currentStatus.id)">
                        <a-checkbox :checked="false" @change="equipReturned">На складе</a-checkbox>
                    </a-col>
                </a-row>

                <div v-if="equipOptions && !equipOptions.length" style="margin-bottom: 12px; color: #ddd;">Нет не добавлено</div>
                <a-row v-for="item of equipOptions" :key="item.product.id" class="mb">
                    <a-col :span="6">
                        <span v-text="item.product.name"/>
                    </a-col>
                    <a-col :span="4">
                        <a-spin :spinning="changeCountInProgress">
                            <a-row v-if="ALLOW_CHANGE_QUANTITY">
                                <a-button-group>
                                    <a-button :disabled="item.quantity === 1" @click="removeCount(item.product.id)" v-if="ALLOW_CHANGE_QUANTITY">-</a-button>
                                    <a-button style="width: 100px; color: #000" disabled>{{item.quantity}}</a-button>
                                    <a-button @click="addCount(item.product.id)" v-if="ALLOW_CHANGE_QUANTITY">+</a-button>
                                    <a-button icon="delete" type="dashed" @click="removeItem(item.product.id, item.quantity)" v-if="ALLOW_CHANGE_QUANTITY"/>
                                </a-button-group>
                            </a-row>
                            <a-row v-else>
                                <span v-text="item.quantity" style="display: iniline-block;"/>
                            </a-row>
                        </a-spin>
                    </a-col>
                </a-row>

                <a-form :form="equipForm" layout="inline" v-if="ALLOW_CHANGE_QUANTITY">
                    <a-form-item>
                        <a-button-group>

                            <a-select
                                :loading="!storage"
                                v-decorator="['equip', { rules: [{ required: true, message: 'Заполните обязательное поле!' }] }]"
                                style="width: 220px;"
                            >
                                <a-select-option :value="item.id" v-for="item of availableEquips" :key="item.id">
                                    {{item.name}}
                                </a-select-option>
                            </a-select>
                            <a-button @click="addEquip">Добавить</a-button>
                        <a-button @click="addKit" :loading="applyComplectLoading">Комплект</a-button>
                        </a-button-group>
                    </a-form-item>
                </a-form>
            </a-collapse-panel>
            
            <a-collapse-panel header="Замены" key="history" v-if="productsHistory && productsHistory.filter(x => x.categoryID === 1).length">
                <a-row class="mb">
                    <a-col :span="4"><strong>Наименование</strong></a-col>
                    <a-col :span="4"><strong>S/N</strong></a-col>
                    <a-col :span="4"><strong>Дата использования</strong></a-col>
                    <a-col :span="4"><strong>Пользователь</strong></a-col>
                </a-row>
                <a-row v-for="item of productsHistory.filter(x => x.categoryID === 1)" :key="item.id">
                    <a-col :span="4">{{item.productName}}</a-col>
                    <a-col :span="4">{{item.serialNumber}}</a-col>
                    <a-col :span="4">{{$date.short(item.activateFrom)}} - {{$date.short(item.activateTo)}}</a-col>
                    <a-col :span="4">{{item.username}}</a-col>
                </a-row>
            </a-collapse-panel>

            <a-collapse-panel key="sims" header="СИМ" v-if="order.sims && order.sims.length" class="--no-content-gap">
                <a-table
                    bordered 
                    :columns="[
                        {
                            title: 'Оператор',
                            dataIndex: 'operatorName'
                        },
                        {
                            title: 'ТП',
                            dataIndex: 'tariffPlanName'
                        },
                        {
                            title: 'ICCID',
                            dataIndex: 'iccid'
                        },
                        {
                            title: 'Статус',
                            dataIndex: 'currentState'
                        },
                        {
                            title: 'Действие',
                            scopedSlots: { customRender: 'actions' },
                        }
                    ]"
                    :pagination="false"
                    :dataSource="order.sims"
                >
                    <template #actions="item">
                        <a-button v-if="~order.number.indexOf('.')" @click="linkToParent(item)">Привязать к устройству родительского заказа</a-button>
                    </template>
                </a-table>
            </a-collapse-panel>
        </a-collapse>
        <a-card>
            <a-form :form="submitForm">
                <a-checkbox :checked="readyHardware" @change="onChangeReadyHardware" :disabled="!isPreparation">Оборудование подготовлено</a-checkbox>

                <a-row type="flex" justify="end">
                    <a-button type="primary" @click="sendToPreparation" v-if="ALLOW_SEND">Отправить на подготовку</a-button>
                </a-row>
            </a-form>
            
        </a-card>
    </div>
</template>

<script>
import { ProductCategories, ProductStatuses, OrderStatus, getCategoryByService, ServiceCategory } from '@/common'

export default {
    props: ['order', 'readonly', 'productsHistory'],
    data() {
        return {
            activeCollapse: 1,
            storage: null,
            equips: [],
            equipForm: this.$form.createForm(this, { name: 'equip-form' }),
            submitForm: this.$form.createForm(this, { name: 'sub-form' }),
            changeCountInProgress: false,
            changesConfirmed: false,
            OrderStatus,
            applyComplectLoading: false,
        }
    },
    mounted() {
        this.fetch()
    },
    computed: {
        showBalancerRow() {
            return this.order.balancer && !(this.isServiceType(ServiceCategory.Equipment) || this.isServiceType(ServiceCategory.Sim) )
        },
        readyHardware() {
            return this.order.currentStatus.id > OrderStatus.HardwarePreparation
        },
        isPreparation() {
            return this.order.currentStatus.id === OrderStatus.HardwarePreparation
        },
        ALLOW_CHANGE_QUANTITY() {
            return this.order.currentStatus.id <= OrderStatus.ReadyToDelivery && !this.readonly
        },
        ALLOW_SEND() {
            if(this.readonly) {
                return false
            }

            if(this.isServiceType(ServiceCategory.Equipment)) {
                return this.order.currentStatus.id === OrderStatus.Signed
            }

            if(this.isServiceType(ServiceCategory.AVR)) {
                return this.order.expectedStatus.id === OrderStatus.HardwarePreparation
            }

            return this.order.currentStatus.id === OrderStatus.SimActivated
        },
        equipOptions() {
            if(!this.equips) {
                return []
            }

            return this.equips
                .reduce((acc, next) => {
                    const index = _.findIndex(acc, x => x.product.id === next.product.id)

                    if(~index) {
                        acc[index].quantity++
                    } else {
                        acc.push({
                            product: next.product,
                            quantity: 1
                        })
                    }

                    return acc
                }, [])
                .sort((a, b) => {
                    if(a.product.id > b.product.id) {
                        return 1
                    }

                    return -1
                })
        },
        availableEquips() {
            if(!(this.storage && this.equips)) {
                return null
            }

            return this.storage
                .filter(x => !this.equips.find(source => source.product.id === x.product.id))
                .map(x => x.product)
        },
    },
    methods: {
       async linkToParent(item) {
            this.$confirm({
                width: 500,
                title: 'Подтвердите привязку',
                content: 'Привязать СИМ к родительскому заказу?',
                cancelText: 'Отмена',
                okText: 'Да',
                onOk: async () => {
                    await this.$api.sim.transferToParent(item.id)
                    this.$bus.$emit('route:reload')
                },
                onCancel: () => {
                },
            })
        },
        equipReturned() {
            this.$confirm({
                    width: 500,
                    title: 'Оборудование на складе?',
                    content: 'БН будет отвязан от заказа',
                    cancelText: 'Отмена',
                    okText: 'Да',
                    onOk: async () => {
                        await this.$api.order.returnBN(this.order.id)
                        await this.$api.order.changeStatus(this.order.id, OrderStatus.BNinStorage)
                        this.$bus.$emit('route:reload')
                    },
                    onCancel: () => {
                    },
            })
        },
        isServiceType(type) {
            return getCategoryByService(this.order) === type
        },
        showTab(tab) {
            switch(tab) {
                case 'EQUIP':
                    return getCategoryByService(this.order) !== ServiceCategory.Sim
            }

            return true
        },
        checkChangesConfirmation() {
            return new Promise(resolve => {
                if(this.changesConfirmed) {
                    return resolve()
                }

                this.$confirm({
                    width: 500,
                    title: 'Подтвердите действие',
                    content: 'Вы собираетесь изменить данные о оборудовании заказа',
                    cancelText: 'Отмена',
                    okText: 'Да',
                    onOk: () => {
                        this.changesConfirmed = true
                        resolve()
                    },
                    onCancel: () => {
                    },
                })
            })
        },
        onChangeReadyHardware(e) {
            this.$confirm({
                width: 500,
                title: 'Оборудование подготовлено?',
                content: 'Статус заказа будет изменен на "Готов к доставке"',
                cancelText: 'Отмена',
                okText: 'Да',
                onOk: () => {
                    return new Promise(async (resolve, reject) => {
                        await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)

                        resolve()
                        this.$bus.$emit('route:reload')
                    }).catch(() => console.log('Oops errors!'));
                },
                onCancel: () => {
                },
            })

        },
        async sendToPreparation() {
            
            this.$confirm({
                title: 'Отправить на подготовку?',
                cancelText: 'Отмена',
                okText: 'Да',
                onOk: () => {
                    return new Promise(async (resolve, reject) => {
                        await this.$api.order.changeStatus(this.order.id, OrderStatus.HardwarePreparation)

                        resolve()
                        this.$bus.$emit('route:reload')
                    }).catch(() => console.log('Oops errors!'));
                },
                onCancel: () => {},
            })
        },
        reload() {
            this.$parent.$emit('child:reload')
        },
        removeItem(productId, quantity = 1) {
            this.$confirm({
                title: 'Удалить оборудование?',
                cancelText: 'Отмена',
                okText: 'Удалить',
                onOk: () => {
                    return new Promise(async (resolve, reject) => {
                        await this.$api.order.removeProductsFromOrder(this.order.id, productId, quantity)

                        resolve()
                        this.reload()
                    }).catch(() => console.log('Oops errors!'));
                },
                onCancel: () => {},
            });
        },
        async removeCount(productId) {
            this.checkChangesConfirmation()
                .then(async () => {
                    this.changeCountInProgress = true
                    const index = _.findIndex(this.equips, x => x.product.id === productId)
        
                    try {
                        await this.$api.order.removeProductsFromOrder(this.order.id, productId, 1)
                        this.equips.splice(index, 1)
                    } catch {
        
                    } finally {
                        this.changeCountInProgress = false
                    }
                })
        },
        async addCount(productId) {
            this.checkChangesConfirmation()
                .then(async () => {
                    this.changeCountInProgress = true
                    const index = _.findIndex(this.equips, x => x.product.id === productId)
        
                    try {
                        await this.$api.order.addProductsToOrder(this.order.id, productId, 1)
        
                        this.equips.push({
                            id: Math.round(Math.random()*100000),
                            product: this.equips[index].product,
                        })
                    } catch {
        
                    } finally {
                        this.changeCountInProgress = false
                    }
                })
        },
        addEquip() {
            this.equipForm.validateFieldsAndScroll(async (err, form) => {
                if(err) {
                    return;
                }

                this.checkChangesConfirmation()
                    .then(async () => {
                        await this.$api.order.addProductsToOrder(this.order.id, form.equip, 1)
        
                        this.reload()
                    })

            })
        },
        addKit() {
            this.$modal({
                component: 'ProductKitApply',
                options: {
                },
                on: {
                    save: async (res) => {
                        const items = {}

                        res.forEach(kit => {
                            kit.items.forEach(prod => {
                                if(items[prod.productID]) {
                                    items[prod.productID].quantity += items[prod.productID].quantity
                                } else {
                                    items[prod.productID] = {
                                        id: prod.productID,
                                        quantity: prod.quantity
                                    }
                                }
                            })
                        })

                        this.checkChangesConfirmation()
                            .then(async () => {

                                this.applyComplectLoading = true

                                const queue = Object.keys(items).map(id => {
                                    return this.$api.order.addProductsToOrder(this.order.id, id, items[id].quantity)
                                })

                                try {
                                    await Promise.all(queue)
                                } catch(e) {
                                    this.$notification.error({ message: 'Произошла серверная ошибка' })
                                } finally {

                                    this.applyComplectLoading = false
                                }

                
                                this.reload()
                            })
                    }
                }
            })
        },
        async fetch() {
            this.equips = await this.$api.order.getProducts(this.order.id)

            this.storage = (await this.$api.product.getProductsSummary())
                .filter(x => {
                    const category = x.category.id === ProductCategories.Part
                    const status = x.status.id === ProductStatuses.Storage

                    return category && status
                })

        }
    }
}
</script>