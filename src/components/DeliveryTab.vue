<template lang="pug">
	a-card(v-if="order.currentStatus.id === OrderStatus.ReadyToDelivery")
		a-form-model(ref="formRef" :model="form" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }" class="--label-left")
			a-form-model-item(label=" " :colon="false")
				div Загрузите Акт экспедиторской расписки в блок документов.

			a-form-model-item(label=" " :colon="false" prop="readyToDelivery")
				a-checkbox(
					:disabled="!allowEdit('Orders')"
					v-model="form.readyToDelivery"
				)
					span Передано в доставку

			a-row(type="flex" justify="end" v-if="allowEdit('Orders')")
				a-button(type="primary" @click="sendToDelivery") Сохранить

	a-card(v-else)
		a-form-model(ref="readyToDeliveryForm" :model="form" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }" class="--label-left")
			a-form-model-item(label=" " :colon="false" prop="delivered" v-if="!afterStatus")
				a-checkbox(
					v-model="form.delivered"
					:disabled="!allowEdit('Orders') || afterStatus"
				) Доставлено

			a-form-model-item(label=" " :colon="false" v-else)
				a-checkbox(:checked="true") Доставлено

			a-form-model-item(:label="finishOrderDateLabel" prop="enableDate")
				a-date-picker(
					:disabled="order.currentStatus.id >= OrderStatus.ChannelEnabled || !allowEdit('Orders')"
					v-model="form.enableDate"
					placeholder=""
					:locale="$lang.locale"
				)

			a-row(type="flex" justify="end" v-if="order.currentStatus.id < OrderStatus.ChannelEnabled && allowEdit('Orders')")
				a-button(type="primary" @click="finishOrder") Сохранить
</template>

<script>
import { DocumentType, OrderStatus, PaymentType, AddressType, PersonType, OperatorType, ServiceCategory, ServiceCategoryName, getCategoryByService, StatusSIM, FileDirection } from '@/common'
import { mapGetters } from 'vuex'
import { findLastIndex } from 'lodash'
import moment from 'moment'

export default {
	props: ['order', 'isServiceType', 'docsToUploadRequired', 'statusHistory', 'queue'],
	data: () => ({
		OrderStatus,
		form: {
			readyToDelivery: null,
			delivered: null,
			enableDate: null,
		}
	}),
	watch: {
		queue() {
			this.onLoad()
		}
	},
	mounted() {
		this.onLoad()
	},
	computed: {
		...mapGetters('app', ['allowEdit']),
		afterStatus() {
			return this.order.currentStatus.id !== OrderStatus.Delivery
		},
		rules() {
			return {
				readyToDelivery: [{
					required: true,
					message: 'Необходимо выбрать',
				}],
				delivered: [{
					required: true,
					message: 'Необходимо отметить для сохранения',
				}],
				enableDate: [{
					required: true,
					message: 'Необходимо заполнить',
				}],
			}
		},
		finishOrderDateLabel() {
			// if(this.isServiceType(ServiceCategory.Equipment) || this.isServiceType(ServiceCategory.Sim)) {
			// 	return 'Дата доставки'
			// }

			return 'Дата доставки'
		},
	},
	methods: {
		onLoad() {
			if(!this.queue) {
				return
			}

			const currentIndex = this.queue.findIndex(x => x.id === this.order.currentStatus.id)
			const targetIndex = this.queue.findIndex(x => x.id === OrderStatus.Delivery)

			if(currentIndex > targetIndex) {
				const newIndex = findLastIndex(this.statusHistory, x => x.id === OrderStatus.Delivery)

				this.form.enableDate = moment(this.statusHistory[newIndex + 1].activateFrom)
			}
		},
		sendToDelivery() {
			this.$refs.formRef.validate(async valid => {
				if(!valid) {
					return
				}

				if(!this.docsToUploadRequired.length) {
					await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id)
					this.$bus.$emit('route:reload')
				} else {
					this.$notification.error({
						message: 'Отсуствует файл',
						description: 'Загрузите обязательные файлы!'
					})
				}
			})
		},
		finishOrder() {
			this.$refs.readyToDeliveryForm.validate(async valid => {
				if(!valid) {
					return
				}
				await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id, this.form.enableDate.toDate())

				this.$bus.$emit('route:reload')
			})
		},
	}
}
</script>