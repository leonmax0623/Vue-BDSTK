<template lang="pug">
Page
	SubHeader(slot="sub-header" :title="title")
		span(slot="title-addon")
			a-tag(color="blue" style='margin-left: 12px;' v-if="order") {{order.currentStatus.name}}

			template(v-if="lastStateName")
				a-icon(:style="{ fontSize: '12px', marginRight: '10px', color: '#aaa' }" type="arrow-left")
				
				a-tooltip(placement="bottom" title="Аннулирован из этого статуса")
					span
						a-tag(color="red" slot="title-addon" v-if="order") {{lastStateName}}

		a-button(
			type="link"
			html-type="button"
			class="mr"
			@click="navigateBack"
			icon="left"
			size="large"
		) К списку заказов
		
		a-button(
			type="danger"
			icon="rollback"
			html-type="button"
			size="large"
			@click="rollbackStatus"
			v-if="ALLOW('SHOW_ROLLBACK_BUTTON')"
		) К предыдущему статусу

		a-button(
			style="margin-left: 6px;"
			type="danger"
			icon="scan"
			html-type="button"
			size="large"
			@click="cancelOrder"
			v-if="ALLOW('SHOW_CANCEL_BUTTON')"
		) Аннулировать

		a-button(
			style="margin-left: 6px;"
			type="danger"
			icon="stop"
			html-type="button"
			size="large"
			@click="removeOrder"
			v-if="ALLOW('SHOW_REMOVE_BUTTON')"
		) Удалить

	a-row(:gutter="14" v-if="order")

		a-col(:span="18")
			a-tabs(type="card" class="--nogap" @change="onChangeTab" v-model="activeTab")
				a-tab-pane(tab="Заказ" key="ORDER")
					a-collapse(@change="toggleRequestCollapse" v-model="activeCollapse")
						a-collapse-panel(header="Данные из заявки" key="1" :disabled="!order")
							RequestForm(:loading="loadingRequest" ref="requestForm" readonly)

						a-collapse-panel(header="Базовая информация" key="2" :showArrow="false" class="order-baseinfo")
							a-form-model.--label-left(ref="orderFormRef" :model="formModel" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }")
								a-form-model-item(label="Номер заказа" prop="number")
									a-input(
										:disabled="READONLY"
										v-model="formModel.number"
									)

								a-form-model-item(label="Номер VLAN" prop="vlan")
									a-select(
										showSearch
										:filterOption="false"
										:loading="!vlan"
										v-model="formModel.vlan"
										@search="handleSearchVlan"
										:disabled="isDisabledField('vlan')"
									)
										
										template(v-if="vlanFiltered")
											a-select-option(:value="bn.id" v-for="bn of vlanFiltered" :key="bn.id") {{bn.name}}

										template(v-else-if="order.vlan")
											a-select-option(:value="order.vlan.id") - 

								a-form-model-item(label="Балансировщик" prop="_balancer")
									a-select(
										:loading="!balancers"
										:disabled="isDisabledField('balancer')"
										v-model="formModel._balancer"
										@change="onChangeBalancer"
									)
										a-select-option(:value="bn.id" v-for="bn of balancers" :key="bn.id") {{bn.name}}

								a-form-model-item(label="S/N БН" prop="balancer")
									a-select(
										:loading="bnsLoading"
										:disabled="isDisabledField('balancerSerialNumber')"
										v-model="formModel.balancer"
									)
										a-select-option(:value="bn.id" v-for="bn of bns" :key="bn.id") {{bn.serialNumber}}

								// Tariffs
								a-form-model-item(v-for="operatorID, operatorKey of OperatorType" :label="OperatorFieldName[operatorID]")
									a-row(:gutter="16" v-if="tariffs")
										a-col(v-for="tariff of formModel.tariffs[operatorID].filter(x => !x.deleted)" :span="6")
											a-select(
												:disabled="isDisabledField(`tp_${operatorKey}`)"
												:loading="!tariffs"
												:value="tariff && tariff.id"
												@select="handleChangeTariff($event, tariff, operatorID)"
											)
												a-select-option(:value="bn.id" v-for="bn of tariffsByOperator(operatorID)" :key="bn.id") {{bn.name}}

											AButton(size="small" @click="removeTariff(tariff, operatorID)") Удалить

										a-col(v-if="formModel.tariffs[operatorID] && formModel.tariffs[operatorID].length < 4" :span="6")
											AButton(@click="addTariff(operatorID)") Добавить

								a-form-model-item(label="Адрес доставки БН" prop="deliveryAddress")
									a-input(
										:disabled="READONLY"
										v-model="formModel.deliveryAddress"
									)

								a-form-model-item(label="ФИО КЛ для доставки" prop="deliveryPerson")
									a-input(
										:disabled="READONLY"
										v-model="formModel.deliveryPerson"
									)

								a-form-model-item(label="Комментарий" prop="comments")
									a-textarea(
										:disabled="READONLY"
										placeholder="Введите комментарий..."
										:autoSize="{ minRows: 4, maxRows: 12 }"
										v-model="formModel.comments"
									)

								a-form-model-item(label="Дата создания заказа")
									span {{order.date && $date.full(order.date)}}

								a-row(type="flex" justify="end" v-if="!READONLY")
									a-button(type="primary" @click="handleSave") Сохранить
									a-button(v-if="order.currentStatus.id === 10 && order.expectedStatus.id === 15" type="primary" style='margin-left: 12px;' @click="nextStep") {{order.expectedStatus.name}}

				a-tab-pane(tab="Подписание" key="SIGN" v-if="showTab('SIGN')")
					OrderSign(
						:order="order"
						:READONLY="getAccess('Orders.Sign').isReadOnlyAccess"
						:statusHistory="statusHistory"
					)

				a-tab-pane(tab="Оборудование" key="EQUIP" v-if="showTab('EQUIP')")
					a-card(v-if="hardwareReadyDate")
						div Оборудование подготовлено: {{$date.short(hardwareReadyDate.activateFrom)}}

					ConditionalRenderer
						OrderEquip(
							:readonly="getAccess('Orders.Equip').isReadOnlyAccess"
							:order="order"
							:queue="queue"
							:productsHistory="productsHistory"
						)

				a-tab-pane(tab="Доставка" key="DELIVERY" v-if="showTab('DELIVERY')")
					a-card(v-if="deliverySentDate")
						div Дата передачи в доставку: {{$date.short(deliverySentDate.activateFrom)}}

					DeliveryTab(
						:order="order"
						:isServiceType="isServiceType"
						:docsToUploadRequired="docsToUploadRequired"
						:statusHistory="statusHistory"
						:queue="queue"
					)
						

				a-tab-pane(tab="Отключение канала" key="OFFCHANNEL" v-if="showTab('DISABLE_CHANNEL')")
					a-card
						a-form.--label-left(:form="offChannelForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }")

							a-form-item(:label="~[OrderStatus.ChannelEnabled, OrderStatus.ChannelTransfered].indexOf(order.currentStatus.id) ? 'Отключение с' : 'Отключен с' " v-if="order.currentStatus.id !== OrderStatus.ChannelOnDisabling")
								a-date-picker(
									:disabled="!~[OrderStatus.ChannelEnabled].indexOf(order.currentStatus.id) || !allowEdit('Orders')"
									v-decorator="['disableDate', fieldOptions]"
									placeholder=""
									:locale="$lang.locale"
								)

							a-form-item(v-else label=" " :colon="false")
								a-checkbox(
									:disabled="!allowEdit('Orders')"
									v-if="order.currentStatus.id === OrderStatus.ChannelOnDisabling"
									v-decorator="checkboxRules"
								) Канал отключен


							template(v-if="getAccess('Orders.TurnOff').isFullAccess")
								a-row(type="flex" justify="end" v-if="~[OrderStatus.ChannelEnabled, OrderStatus.ChannelTransfered, OrderStatus.ChannelOnDisabling].indexOf(order.currentStatus.id)")
									a-button(type="primary" @click="disabledDate") Сохранить

				template(v-for="(tab, index) of untrackedStatuses")
					a-tab-pane(v-if="isVisibleUntrackedTab(tab)" :key="tab.id" :tab="untrackedStatuses[index + 1].name")
						UnknownOrderStatus(
							:order="order"
							:status="tab"
							:disabled="isDisabledStatus(tab)"
							:statusHistory="statusHistory"
							:queue="queue"
						)
							
				a-tag(color="green" v-if="order" slot="tabBarExtraContent") {{categoryNameLabel}}
				

		a-col(:span="6")
			a-tabs(type="card" class="--nogap")
				a-tab-pane(tab="Документы" key="DOCS")
					a-card(:loading="!docs" v-if="!docs")
						div

					template(v-else)
						a-card(v-if="!docs.length")
							a-empty(description="Документы отсутствуют")

						template(v-else)
							div(v-if="docsToUploadRequired.length")
								.doc__divider Необходима загрузка:

								a-card(v-for="(doc, i) of docsToUploadRequired" :key="'i' + i + doc.direction")
									div(slot="title" :class="{'--required': doc.required}")
										span {{doc.name}}
	
									a-button-group(slot="extra")
										a-upload(
											name="file"
											:beforeUpload="() => false"
											@change="handleDocument(doc, $event)"
										)
											a-button 
												a-icon(type="upload")
												|  Загрузить

							div(v-if="docsToUpload.length")
								.doc__divider Загрузка доп. файлов:

								a-card(v-for="(doc, i) of docsToUpload" :title="doc.name" :key="'i' + i + doc.direction")
									a-button-group(slot="extra")
										a-upload(
											name="file"
											:beforeUpload="() => false"
											@change="handleDocument(doc, $event)"
										)
											a-button 
												a-icon(type="upload")
												|  Загрузить

							div(v-if="docsToDownload.length")
								.doc__divider Доступно для скачивания:

								a-card(v-for="(doc, i) of docsToDownload" :title="doc.fileName || doc.name" :key="'i' + i + doc.direction")
									a-button-group(slot="extra")
										a-button(icon="download" :loading="isDocSaving(doc.id)" @click="saveFile(doc)")
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import _ from 'lodash'
import { DocumentType, OrderStatus, OperatorFieldName, PaymentType, AddressType, PersonType, OperatorType, ServiceCategory, ServiceCategoryName, getCategoryByService, StatusSIM, FileDirection } from '@/common'
import printjs from 'print-js'
import saveFile from 'file-saver'
import moment from 'moment'
import mime from 'mime'

export default {
	data() {
		return {
			OperatorFieldName,
			ServiceCategory,
			OperatorType,
			OrderStatus,

			queue: null,

			statusHistory: null,
			balancers: null,
			docsDownloading: [],
			docsPrinting: [],

			activeCollapse: 2,

			docs: null,
			loadingRequest: false,
			request: null,

			files: null,
			order: null,
			statuses: null,
			readyToDeliveryForm: this.$form.createForm(this, { name: 'ready-delivery-form' }),
			offChannelForm: this.$form.createForm(this, { name: 'off-channel-form' }),
			docsForm: this.$form.createForm(this, { name: 'docs-form' }),

			vlan: null,
			vlanSearchQuery: '',
			bns: null,
			tariffs: null,

			parentOrder: null,
			bnsLoading: false,
			activeTab: null,
			productsHistory: null,

			formModel: {
				number: null,
				vlan: null,
				_balancer: null,
				balancer: null,
				tariffs: null,
				deliveryAddress: null,
				deliveryPerson: null,
				comments: null,
			}
		}
	},
	async created() {
		const { tab = 'ORDER' } = this.$route.query

		this.activeTab = tab

		await this.fetch()
	},
	watch: {
		'$route.params.id'() {
			this.$bus.$emit('route:reload')
		}
	},
	methods: {
		removeTariff(tariff, operatorID) {
			const index = this.formModel.tariffs[operatorID].findIndex(x => x.refID === tariff.refID)

			if(~index) {
				if(~tariff.refID.toString().indexOf('$NEW')) {
					this.formModel.tariffs[operatorID].splice(index, 1)
				} else {
					this.formModel.tariffs[operatorID][index].id = 0
					this.formModel.tariffs[operatorID][index].deleted = true
				}
			}
		},
		addTariff(operatorID) {
			this.formModel.tariffs[operatorID].push({
				operatorID,
				refID: this.$GUID() + '$NEW'
			})
		},
		handleChangeTariff(newTariffId, currentTariff, operatorID) {
			const index = this.formModel.tariffs[operatorID].findIndex(x => x.refID === currentTariff.refID)

			if(~index) {
				this.formModel.tariffs[operatorID].splice(index, 1, {
					...this.tariffs.find(x => x.id === newTariffId),
					refID: currentTariff.refID
				})
			}
		},
		isVisibleUntrackedTab({ id, name }) {
			if(!this.queue) {
				return false
			}

			const currentIndex = this.queue.findIndex(x => x.id === this.order.currentStatus.id)
			const targetIndex = this.queue.findIndex(x => x.id === id)

			return ~targetIndex && currentIndex >= targetIndex && targetIndex !== this.queue.length - 1
		},
		isDisabledStatus({ id }) {
			if(!this.queue) {
				return false
			}

			const currentIndex = this.queue.findIndex(x => x.id === this.order.currentStatus.id)
			const targetIndex = this.queue.findIndex(x => x.id === id)

			return~targetIndex && currentIndex > targetIndex
		},
		async handleDocument(doc, { file }) {
			const formData = new FormData()
			formData.append('file', file)

			await this.$api.order.uploadFile(this.order.id, doc.id, formData)
			
			this.$bus.$emit('route:reload')
		},
		statusInQueue(array) {
			if(!this.queue) {
				return false
			}

			return this.queue.find(({ id }) => {
				return ~array.indexOf(id)
			})
		},
		statusInHistory(array) {
			if(!this.queue) {
				return false
			}

			return this.statusHistory.find(({ id }) => {
				return ~array.indexOf(id)
			})
		},
		showTab(tab) {
			switch(tab) {
				case 'SIGN': {
					if(!this.getAccess('Orders.Sign').access) {
						return false
					}

					if(!this.statusInQueue([
						OrderStatus.OnSign,
						OrderStatus.Signed,
					])) {
						return false
					}

					if(this.CANCELED) {
						return this.getPreviousState().id !== OrderStatus.Preparation
					} else {
						return this.order.currentStatus.id !== OrderStatus.Preparation
					}
				} break;

				case 'EQUIP': {
					if(!this.getAccess('Orders.Equip').access) {
						return false
					}

					if(!this.order) {
						return false
					}

					if(this.isServiceType(ServiceCategory.AVR)) {
						return this.order.expectedStatus.id === OrderStatus.HardwarePreparation || this.statusInHistory([OrderStatus.HardwarePreparation])
					}

					if(this.isServiceType(ServiceCategory.Equipment)) {
						if(this.CANCELED) {
							return this.getPreviousState().id >= OrderStatus.Signed
						}
						return this.order.currentStatus.id >= OrderStatus.Signed
					}

					
					if(this.CANCELED) {
						return this.getPreviousState().id >= OrderStatus.SimActivated
					}

					if(this.order.currentStatus.id >= OrderStatus.SimActivated) {
						return true
					}

					return false
				} break;

				case 'DELIVERY': {
					if(!this.getAccess('Orders.Delivery').access) {
						return false
					}

					if(!this.order) {
						return false
					}

					
					
					if(this.CANCELED) {
						return this.getPreviousState().id >= OrderStatus.ReadyToDelivery
					}

					return this.order.currentStatus.id >= OrderStatus.ReadyToDelivery
				} break;

				case 'DISABLE_CHANNEL': {
					if(!this.getAccess('Orders.TurnOff').access) {
						return false
					}

					if([ServiceCategory.SIM, ServiceCategory.Equipment].some(key => this.isServiceType(key))) {
						return false
					}
		
					const statusId = _.get(this.order, 'currentStatus.id')

					return statusId && ~[
						OrderStatus.ChannelEnabled,
						OrderStatus.ChannelOnDisabling,
						OrderStatus.ChannelDisabled,
						OrderStatus.ChannelOnTransfer,
						OrderStatus.ChannelOnTransfer,
						OrderStatus.ChannelTransfered,
					].indexOf(statusId)
				} break;
	
				default:
					return false
			}
		},
		handleSearchVlan(value) {
			this.vlanSearchQuery = value
		},
		disabledDate() {
			this.offChannelForm.validateFieldsAndScroll(async (err, form) => {
				if(err) {
					return
				}
				if(_.get(this.order, 'currentStatus.id') === OrderStatus.ChannelOnDisabling) {
					await this.$api.order.changeStatus(this.order.id, OrderStatus.ChannelDisabled, new Date())
				} else {
					await this.$api.order.changeStatus(this.order.id, OrderStatus.ChannelOnDisabling, form.disableDate.toDate())
				}

				this.$bus.$emit('route:reload')
			})
		},
		navigateBack() {
			if(this.$router.referer) {
				if(this.$router.referer.name === 'Orders') {
					this.$router.back()
					return;
				}
			}

			this.$router.push({ name: 'Orders' })
		},
		async onChangeTab(tab) {
			this.$router.replace({
				query: {
					tab
				}
			})

			if(tab === 'DELIVERY' && this.order.currentStatus.id >= OrderStatus.ChannelEnabled) {
				this.$nextTick(() => {
					let targetStatus = OrderStatus.ChannelEnabled;

					if(this.isServiceType(ServiceCategory.Equipment)) {
						targetStatus = OrderStatus.EquipDelivered
					}

					if(this.isServiceType(ServiceCategory.Sim)) {
						targetStatus = OrderStatus.SimDelivered
					}



					const enableDate = _.get(this.statusHistory.find(x => x.id === targetStatus), 'activateFrom')

					this.readyToDeliveryForm.setFieldsValue({
						enableDate: enableDate ? moment(enableDate) : enableDate
					})
				})
			}

			if(tab === 'OFFCHANNEL') {
				const disableDate = _.get(this.statusHistory.find(x => x.id === OrderStatus.ChannelOnDisabling), 'activateFrom')

				this.$nextTick(() => {
					this.offChannelForm.setFieldsValue({
						disableDate: disableDate ? moment(disableDate) : disableDate
					})
				})
			}
			
		},
		isDisabledField(fieldName) {
			if(this.READONLY || !this.order) {
				return true
			}

			const isActivatedTP = operatorID => {
				const tpSIMs = this.order.sims.filter(x => x.operatorID === operatorID)

				return tpSIMs.some(x => x.currentStateID !== StatusSIM.Disabled)
			}

			const SimOrderTPRule = operatorID => {
				if(this.order.currentStatus.id >= OrderStatus.SimOnActivation) {
					return true
				}

				return isActivatedTP(operatorID)
			}

			const disabledMap = {
				[ServiceCategory.Sim]: {
					vlan: () => false,
					balancer: () => true,
					balancerSerialNumber: () => true,

					...Object.keys(OperatorType).reduce((acc, operatorKey) => {
						return {
							...acc,
							[`tp_${operatorKey}`]: () => SimOrderTPRule(OperatorType[operatorKey])
						}
					}, {}),
				},
				[ServiceCategory.Equipment]: {
					vlan: () => false,
					balancer: () => true,
					balancerSerialNumber: () => true,

					...Object.keys(OperatorType).reduce((acc, operatorKey) => {
						return {
							...acc,
							[`tp_${operatorKey}`]: () => true
						}
					}, {}),
				},
				[ServiceCategory.Channel]: {
					vlan: () => false,
					balancer: () => this.order.currentStatus.id >= OrderStatus.Delivery,
					balancerSerialNumber: () => this.order.currentStatus.id >= OrderStatus.Delivery,

					...Object.keys(OperatorType).reduce((acc, operatorKey) => {
						return {
							...acc,
							[`tp_${operatorKey}`]: () => SimOrderTPRule(OperatorType[operatorKey])
						}
					}, {}),
				},
				[ServiceCategory.ChannelTransition]: {
					vlan: () => false,
					balancer: () => true,
					balancerSerialNumber: () => true,
					
					...Object.keys(OperatorType).reduce((acc, operatorKey) => {
						return {
							...acc,
							[`tp_${operatorKey}`]: () => true
						}
					}, {}),
				},
				[ServiceCategory.ZIP]: {
					vlan: () => false,
					balancer: () => true,
					balancerSerialNumber: () => false,
					
					...Object.keys(OperatorType).reduce((acc, operatorKey) => {
						return {
							...acc,
							[`tp_${operatorKey}`]: () => true
						}
					}, {}),
				}
			}

			if(this.isServiceType(ServiceCategory.Sim)) {
				return disabledMap[ServiceCategory.Sim][fieldName]()
			}

			if(this.isServiceType(ServiceCategory.Equipment)) {
				return disabledMap[ServiceCategory.Equipment][fieldName]()
			}

			if(this.isServiceType(ServiceCategory.Channel)) {
				return disabledMap[ServiceCategory.Channel][fieldName]()
			}

			if(this.isServiceType(ServiceCategory.ChannelTransition)) {
				return disabledMap[ServiceCategory.ChannelTransition][fieldName]()
			}

			if(this.isServiceType(ServiceCategory.ZIP)) {
				return disabledMap[ServiceCategory.ZIP][fieldName]()
			}

		},
		isServiceType(type) {
			return getCategoryByService(this.order) === type
		},
		ALLOW(type) {
			switch(type) {
				case 'SHOW_ROLLBACK_BUTTON':
					return this.order && this.order.currentStatus.id > OrderStatus.Preparation
				case 'SHOW_REMOVE_BUTTON':
					return this.order && this.order.isLast && this.order.currentStatus.id < OrderStatus.OnSign
				case 'SHOW_CANCEL_BUTTON':
					return this.allowEdit('Orders') && this.order && this.order.currentStatus.id < OrderStatus.ChannelEnabled && !this.isStatus(OrderStatus.Canceled)
				case 'SHOW_SIM_TAB': {
					return this.order && this.order.currentStatus.id >= OrderStatus.SimActivated
				}
				default:
					return false
			}
		},
		rollbackStatus() {
			this.$confirm({
				icon: 'warning',
				okType: 'danger',
				title: 'Подтвердите возврат заказа к предыдущему статусу',
				okText: 'Вернуть к предыдущему статусу',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.order.rollback(this.order.id)

					this.$bus.$emit('route:reload')
				}
			})
		},
		async removeOrder() {
			this.$confirm({
				icon: 'warning',
				okType: 'danger',
				title: 'Подтвердите удаление заказа',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.order.removeOrder(this.order.id)

					this.$router.push({ name: 'Orders' })
				}
			})
		},
		async cancelOrder() {
			this.$confirm({
				icon: 'warning',
				okType: 'danger',
				title: 'Подтвердите аннулирование заказа',
				okText: 'Аннулировать',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.order.cancel(this.order.id)

					this.$bus.$emit('route:reload')
				}
			})
		},
		async onChangeBalancer(balancerId) {
			this.formModel.balancer = null
			this.bnsLoading = true
			this.bns = null
			this.bns = await this.$api.order.getBNs(this.order.id, balancerId)
			this.bnsLoading = false
		},
		isDocPrinting(id) {
			return Boolean(~this.docsPrinting.indexOf(id))
		},
		isDocSaving(id) {
			return Boolean(~this.docsDownloading.indexOf(id))
		},
		async saveFile(doc) {
			this.docsDownloading.push(doc.id)

			try {
				const data = await this.$api.order.getDocumentsByType(this.order.id, doc.id)
				const fileName = doc.fileName || `${doc.name} №${_.get(this.order, 'number') || ''}.docx`

				const blob = new Blob([data], {
					type: mime.getType(fileName)
				})

				saveFile(blob, fileName)

			} catch(e) {
				this.$notification.error({ message: 'Серверная ошибка' })
			} finally {

				setTimeout(() => {
					const index = this.docsDownloading.indexOf(doc.id)
					this.docsDownloading.splice(index, 1)
				}, 200)
			} 
		},
		async printDocument(doc) {
			this.docsPrinting.push(doc.id)
			const data = await this.$api.order.getDocumentsByType(this.order.id, doc.id)
			const blob = new Blob([data], {
				type: 'application/pdf'
			})
			
			const printable = URL.createObjectURL(blob)

			printjs({ printable })

			setTimeout(() => {
				const index = this.docsPrinting.indexOf(doc.id)
				this.docsPrinting.splice(index, 1)
			}, 200)
		},
		tariffsByOperator(operatorID) {
			if(!this.tariffs) {
				return []
			}

			return this.tariffs.filter(x => x.operatorID === operatorID)
		},
		handleSave() {
			this.$refs.orderFormRef.validate(async (valid) => {
				if(!valid) {
					return
				}

				const form = this.formModel

				const data = {
					id: this.order.id,
					number: form.number,
					vlan: this.vlan.find(x => x.id === +form.vlan),
					balancer: this.bns ? this.bns .find(x => x.id === +form.balancer) : null,
					comments: form.comments,
					tariffs: [],

					addresses: ((list) => {
						const t = list.find(x => x.typeID === AddressType.Delivery)

						t.address1 = form.deliveryAddress

						return list
					})([...this.order.addresses]),

					clientPersons: (list => {
						const t = list.find(x => x.typeID === PersonType.Delivery)

						t.firstName = form.deliveryPerson

						return list
					})([...this.order.clientPersons])
				}


				/**
				 * Fill Tariff Plans
				 */
				Object.keys(OperatorType).forEach(operatorKey => {
					const operatorID = OperatorType[operatorKey]

					data.tariffs = data.tariffs.concat(
						...form.tariffs[operatorID]
							.filter(x => !_.isUndefined(x.id))
							.map(tp => {
								if(~tp.refID.toString().indexOf('$NEW')) {
									tp.refID = null
								}

								return tp
							}),
					)
				})

				await this.$api.order.updateOrder(data)

				this.$notification.success({ message: 'Изменения сохранены' })

				if(this.isStatus(OrderStatus.Preparation)) {
					await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
				}

				this.$bus.$emit('route:reload')
			})
		},
		async nextStep() {
			await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
			this.$bus.$emit('route:reload')
		},
		async fetch() {
			const { id } = this.$route.params

			if(!id) {
				return
			}

			;[
				this.order,
				this.files,
				this.statuses,
				this.statusHistory,
				this.productsHistory,
			] = await Promise.all([
				this.$api.order.getOrderById(id),
				this.$api.order.getFiles(id),
				this.$api.order.getStatusList(),
				this.$api.order.getStatusHistory(id),
				this.$api.order.getProductsHistory(id),
			])

			;[
				this.docs,
				this.balancers,
				this.queue,
			] = await Promise.all([
				this.$api.order.getOrderDocuments(this.order.id),
				this.$api.balancer.getBalancers(this.order.balancerType.id),
				this.$api.service.getServiceQueue(this.order.serviceType.id),
				
			])

			const balancerId = _.get(this.order, 'balancer.balancer.id')

			if(balancerId) {
				await this.onChangeBalancer(balancerId)
			}

			this.formModel = {
				number: this.order.number,
				comments: this.order.comments,
				vlan: _.get(this.order, 'vlan.id'),
				_balancer: balancerId,
				balancer: _.get(this.order, 'balancer.id'),
				// balancerType: _.get(this.order, 'balancer.id'),

				tariffs: Object.keys(OperatorType).reduce((acc, operatorKey) => {
					const operatorID = OperatorType[operatorKey]

					return {
						...acc,
						[operatorID]: _.sortBy(
							this.order.tariffs.filter(x => x.operatorID === operatorID),
							x => x.refID
						)
					}
				}, {}),
				
				deliveryAddress: (() => {
					const source = this.order.addresses.find(x => x.typeID === AddressType.Delivery)

					if(source) {
						return source.address1 || source.address2
					}

					return ''
				})(),
				deliveryPerson: (() => {
					const source = this.order.clientPersons.find(x => x.typeID === PersonType.Delivery)

					if(source) {
						return [source.firstName, source.middleName, source.lastName].join(' ').trim()
					}

					return ''
				})(),
			}

			this.tariffs = await this.$api.tariff.getTariffs()
			this.vlan = await this.$api.order.getVLANs(this.order.id)
		},
		async toggleRequestCollapse() {
			if(!this.request) {
				this.loadingRequest = true
				this.request = await this.$api.request.getRequestById(this.order.requestID)
				this.loadingRequest = false

				this.$refs.requestForm.form.setFieldsValue({
					projectNumber: this.request.projectNumber,
					abonent: this.request.abonent.id,
					channelAddress: this.request.addresses.find(x => x.typeID === AddressType.Channel).address1,
					regionType: this.request.regionType.id,
					balancerType: this.request.balancerType.id,
					serviceType: this.request.serviceType.id,
					clientName: this.request.client.name,
					clientPersonName: this.request.clientPersons.find(x => x.typeID === PersonType.Client).firstName,
					clientPersonPhone: this.request.clientPersons.find(x => x.typeID === PersonType.Client).phone,
					deliveryAddress: this.request.addresses.find(x => x.typeID === AddressType.Delivery).address1,
					deliveryPerson: this.request.clientPersons.find(x => x.typeID === PersonType.Delivery).firstName,
					onceFee: this.request.fees.find(x => x.typeID === PaymentType.SinglePayment).value,
					periodicFee: this.request.fees.find(x => x.typeID === PaymentType.PeriodicPayment).value,
					transferChannel: this.request.transferChannel
				});
			}
		},

		isStatus(statusId) {
			if(this.CANCELED) {
				const prev = this.getPreviousState()
				return prev.id === statusId
			}

			return this.order && this.order.currentStatus.id === statusId
		},
		getPreviousState() {
			const canceledStateIndex = _.findIndex(this.statusHistory, x => x.id === OrderStatus.Canceled)

			return this.statusHistory[canceledStateIndex - 1]
		},
	},
	computed: {
		...mapState('auth', ['user']),
		...mapGetters('app', ['allowEdit', 'getAccess']),
		checkboxRules() {
			return ['disabled', { rules: [{ validator: (rule, value, cb) => {
				if(!value) {
					cb('Необходимо отметить для сохранения')
					return 
				}

				cb()
			}}]}]
		},
		rules() {
			const required = { required: true, message: 'Заполните обязательное поле!' }

			return {
				number: [required],
				balancer: [required],
			}
		},
		deliverySentDate() {
			return this.statusHistory.find(x => x.id === OrderStatus.Delivery)
		},
		hardwareReadyDate() {
			const preparationIndex = this.statusHistory.findIndex(x => x.id === OrderStatus.HardwarePreparation)

			if(!~preparationIndex) {
				return false
			} else {
				return this.statusHistory[preparationIndex + 1]
			}

		},
		untrackedStatuses() {
			if(!this.queue) {
				return []
			}

			return this.queue.filter(x => !~Object.values(OrderStatus).indexOf(x.id))
		},
		docsToDownload() {
			if(!this.docs) {
				return null
			}

			return this.docs.filter(x => ~[FileDirection.download, FileDirection.both].indexOf(x.direction))
		},
		docsToUploadRequired() {
			if(!this.docs) {
				return null
			}

			return this.docs.filter(x => ~[FileDirection.upload, FileDirection.both].indexOf(x.direction) && x.required)
		},
		docsToUpload() {
			if(!this.docs) {
				return null
			}

			return this.docs.filter(x => ~[FileDirection.upload, FileDirection.both].indexOf(x.direction) && !x.required)
		},
		vlanFiltered() {
			if(!this.vlan) {
				return null
			}

			let source = this.vlan
			const startIndex = source.findIndex(x => +x.name >= 1546)
			source = source.slice(startIndex)

			const res = !this.vlanSearchQuery.length
				? source.slice(0, 100)
				: this.vlan.filter(item => item.name.startsWith(this.vlanSearchQuery))



			if(this.formModel.vlan) {
				const { vlan } = this.formModel.vlan

				if(vlan && !res.find(x => x.id === vlan)) {
					res.unshift(this.vlan.find(x => x.id === vlan))
				}
			}


			return res 
		},
		
		categoryNameLabel() {
			return ServiceCategoryName[getCategoryByService(this.order)]
		},
		lastStateName() {
			if(!this.CANCELED || !this.statusHistory) return null;

			return this.getPreviousState().name
		},
		CANCELED() {
			if(!this.order) return false

			return this.order.currentStatus.id === OrderStatus.Canceled
		},
		READONLY() {
			return this.CANCELED || this.order.currentStatus.id === OrderStatus.ChannelTransfered || !this.getAccess('Orders.Sign').isFullAccess
		},
		fieldOptions() {
			return {
				rules: [{ required: true, message: 'Заполните обязательное поле!' }]
			}
		},
		title() {
			return _.get(this.order, 'number') || ''
		}
	}
}
</script>

<style lang="scss" >
.--required:after {
	content: '*';
	color: red;
}

.order-baseinfo .ant-collapse-header{
	pointer-events: none;
}

.doc {
	&__divider {
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 0;
	}
}
</style>