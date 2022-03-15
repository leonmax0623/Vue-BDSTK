<template lang="pug">
	div
		a-form-model(ref="formRef" :model="form" :rules="rules" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
			a-form-model-item(label="Дата проявления" prop="troubleDate")
				a-date-picker(
					:disabled="disabled"
					:disabled-date="disabledDate"
					v-model="form.troubleDate"
					placeholder=""
					:locale="$lang.locale"
					@change="setDirty"
				)

			a-form-model-item(label="Приоритет" prop="severity")
				a-select(:loading="!ticket_severity" v-model="form.severity" :disabled="disabled" @change="setDirty")
					a-select-option(:value="item.id" v-for="item of ticket_severity" :key="item.id")
						TicketSeverity(:severity="item")

			a-form-model-item(:label="'Статус БН' + (isPage ? '' : ' при создании тикета')" prop="balancerStateID")
				a-select(v-model="modelState" :disabled="disabled" @change="setDirty")
					a-select-option(:value="item.id" v-for="item of status_bn" :key="item.id") {{item.name}}
				
			a-form-model-item(label="Неисправность" prop="troubleTypeID")
				a-select(:loading="!ticket_types" v-model="form.troubleTypeID" :disabled="disabled" @change="setDirty")
					a-select-option(:value="item.id" v-for="item of ticket_types" :key="item.id") {{item.name}}

			a-form-model-item(label="Комментарий" prop="comments")
				a-textarea(autoSize v-model="form.comments" :disabled="disabled" :maxLength="4000" @input="setDirty")

			template(v-if="!disabled")
				a-divider Поиск заказа

				a-form-model-item(label="VLAN" prop="vlan")
					a-input-number(v-model="form.vlan" :disabled="disabled || loadingClient")

				a-form-model-item(label="S/N БН" prop="sn")
					a-input(v-model="form.sn" :disabled="disabled || loadingClient")

				a-form-model-item(label=" " :colon="false")
					a-button(@click="loadClient" :loading="loadingClient" type="dashed" ) Получить данные
				
			a-divider Заказ

		template(v-if="client")
			
			a-form-model( :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
				a-form-model-item(label="VLAN")
					a-input(:value="client.vlan.name" disabled)

				a-form-model-item(label="S/N БН")
					a-input(:value="client.balancer && client.balancer.serialNumber" disabled)

				a-form-model-item(label="Тип сервиса")
					a-input(:value="client.serviceType.name" disabled)

				a-form-model-item(label="Клиент")
					a-input(:value="client.client.name" disabled)

				template(v-for="contact, index of client.clientPersons")
					a-form-model-item(:label="`ФИО КЛ клиента ${index + 1}`")
						a-input(:value="combineFIO(contact)" disabled)
					a-form-model-item(:label="`Телефон КЛ клиента ${index + 1}`")
						a-input(:value="contact.phone" disabled)

				template(v-for="sim, index of client.sims")
					a-form-model-item(:label="`СИМ ${index + 1}`")
						a-row(:gutter="6")
							a-col(:span="5")
								a-input(disabled :value="sim.tariffPlanName" placeholder="Тариф")
							a-col(:span="11")
								a-input(disabled :value="sim.iccid" placeholder="iccid")
							a-col(:span="8")
								a-input(disabled :value="sim.ip" placeholder="IP")


				a-form-model-item(label="Комментарий из заказа")
					a-textarea(autoSize :value="client.comments" disabled :maxLength="4000")
			
		div(v-else) Заказ не прикреплен
</template>

<script>
import { mapActions, mapState } from 'vuex'
import moment from 'moment'
import { BnStatusTicket } from '@/common'
import { get } from 'lodash'

export default {
	props: {
		ticket: Object,
		client: Object,
		loadingClient: Boolean,
		disabled: Boolean,
		isPage: Boolean,
	},
	data: () => ({
		form: {
			troubleDate: null,
			balancerStateID: null,
			troubleTypeID: null,
			comments: null,
			vlan: null,
			sn: null,
			severity: null,
		},
		defaultValue: moment(),
	}),
	async created() {
		await Promise.all([
			this.loadTicketTypes(),
			this.load_ticket_severity(),
		])

		if(this.ticket) {
			// this.form.setFieldsValue({
			// 	vlan: this.ticket.vlan.name,
			// 	sn: this.ticket.balancer.serialNumber,
			// 	comments: this.ticket.comments,
			// 	data: moment()
			// })

			// this.form.vlan = this.ticket.vlan.name
			// this.form.sn = this.ticket.balancer.serialNumber
			this.form.comments = this.ticket.comments
			this.form.balancerStateID = this.ticket.balancerState.id
			this.form.troubleTypeID = this.ticket.troubleType.id
			this.form.troubleDate = moment(this.ticket.troubleDate)
			this.form.severity = get(this.ticket, 'severity.id')
		}
	},
	computed: {
		...mapState('constant', ['ticket_types', 'ticket_severity']),
		modelState: {
			get() {
				return this.form.balancerStateID || '-'
			},
			set(value) {
				this.form.balancerStateID = value
			}
		},
		status_bn() {
			return [
				{
					id: BnStatusTicket.Online,
					name: 'В сети'
				},
				{
					id: BnStatusTicket.Offline,
					name: 'Не в сети'
				}
			]
		},
		formItemOptions() {
			return {
				rules: [{ required: true, message: 'Заполните обязательное поле!' }]
			}
		},
		rules() {
			return {
				severity: [{
					required: true,
					message: 'Выберите приоритет'
				}],
				troubleDate: [
					{
						required: true,
						message: 'Выберите дату',
					}
				],
				troubleTypeID: [
					{
						required: true,
						message: 'Выберите причину обращения',
					}
				],
				balancerStateID: [
					{
						required: true,
						message: 'Выберите статус БН'
					}
				]
				// vlan: [
				// 	{
				// 		required: !this.form.sn,
				// 		message: 'Введите VLAN или S/N БН',
				// 	},
				// ],
				// sn: [
				// 	{
				// 		required: !this.form.vlan,
				// 		message: 'Введите VLAN или S/N БН',
				// 	},
				// ]
			}
		}
	},
	methods: {
		...mapActions('constant', ['loadTicketTypes', 'load_ticket_severity']),
		setDirty() {
			this.$emit('dirty')
		},
		disabledDate(current) {
			return current && current > moment().add(1, 'day').startOf('day')
		},
		combineFIO(contact) {
			return ['lastName', 'firstName', 'middleName'].map(key => contact[key]).filter(Boolean).join(' ')
		},
		loadClient() {
			const { vlan, sn } = this.form

			if(!(vlan || sn)) {
				this.$notification.error({ message: 'Введите VLAN или S/N БН' })
				return
			}

			this.$emit('loadClient', { vlan, sn })
			this.form.vlan = null
			this.form.sn = null
		}
	}
}
</script>