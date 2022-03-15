<template>
	<Page wrap>
		<SubHeader slot="sub-header" :title="parentId ? `Редактирование заявки #${request ? request.number : ''}` : 'Создание заявки'"/>

		<RequestForm :loading="loading" ref="RequestForm" @submit="handleSubmit" :readonly="!!parentId">
			<a-form-item :wrapper-col="{ span: 12, offset: 3 }" slot="header">
				<a-upload
					name="file"
					@change="pickFile"
					:beforeUpload="() => false"
				>
					<a-button> <a-icon type="upload" /> Загрузить файл Excel </a-button>
				</a-upload>
			</a-form-item>

			<a-form-item :wrapper-col="{ span: 12, offset: 3 }" slot="footer">
				<a-button type="outline" html-type="button" class="mr" @click="$router.push('/requests' + (parentId ? '/' + parentId : ''))">
					Отмена
				</a-button>
				<a-button type="primary" html-type="submit">
					{{parentId ? 'Сохранить заявку' : 'Создать заявку'}}
				</a-button>
			</a-form-item>
		</RequestForm>
	</Page>
</template>

<script>
import excel from 'read-excel-file'
import _ from 'lodash'
import { PaymentType, AddressType, PersonType } from '@/common'

export default {
	data() {
		 return {
			loading: false,
			file: null,
			request: null,
		 }
	},
	async created() {
		if(this.parentId) {
			try {
				this.request = await this.$api.request.getRequestById(this.parentId);
	
				this.$nextTick(this.init);
			} catch (e) {
				this.$message.error('Произошла ошибка');
			}
		}
	},
	computed: {
		parentId() {
			return this.$route.params.parentId
		},
		formRef() {
			return this.$refs.RequestForm
		} 
	},
	methods: {
		init() {
			setTimeout(() => {
				this.formRef.form.setFieldsValue({
					projectNumber: this.request.projectNumber,
					abonent: this.request.abonent.id,
					regionType: this.request.regionType.id,
					channelAddress: this.request.addresses.find(x => x.typeID === AddressType.Channel).address1,
					balancerType: this.request.balancerType.id,
					serviceType: this.request.serviceType.id,
					clientName: this.request.client.name,
					clientPersonName: this.request.clientPersons.find(x => x.typeID === PersonType.Client).firstName,
					clientPersonPhone: this.request.clientPersons.find(x => x.typeID === PersonType.Client).phone,
					deliveryAddress: this.request.addresses.find(x => x.typeID === AddressType.Delivery).address1,
					deliveryPerson: this.request.clientPersons.find(x => x.typeID === PersonType.Delivery).firstName,
					onceFee: this.request.fees.find(x => x.typeID === PaymentType.SinglePayment).value,
					periodicFee: this.request.fees.find(x => x.typeID === PaymentType.PeriodicPayment).value,
					transferChannel: this.request.transferChannel,
					comments: this.request.comments
				})
			})
		},
		pickFile({ file }) {
			if(!file || file.status === 'removed') {
				this.file = null
				return
			}

			this.file = file

			excel(file)
				.then(([header, _row]) => {
					const row = _row.map(str => {
						if(!str) {
							return null
						}

						return String(str)
					})

					const order = [
						'abonent',
						'regionType',
						'channelAddress',
						'projectNumber',
						'balancerType',
						'serviceType',
						'clientName',
						'clientPersonName',
						'clientPersonPhone',
						'deliveryAddress',
						'deliveryPerson',
						'onceFee',
						'periodicFee',
						'transferChannel',
						'comments'
					]
					
					const [
						abonent,
						regionType,
						channelAddress,
						projectNumber,
						balancerType,
						serviceType,
						clientName,
						clientPersonName,
						clientPersonPhone,
						deliveryAddress,
						deliveryPerson,
						onceFee,
						periodicFee,
						transferChannel,
						comments
					] = row

					const form = {
						abonent: abonent ? _.get(this.formRef.abonents.find(x => x.name.toLowerCase().includes(abonent.toLowerCase())), 'id') : null,
						balancerType: balancerType ? _.get(this.formRef.bns.find(x => x.name.toLowerCase().includes(balancerType.toLowerCase())), 'id') : null,
						serviceType: serviceType ? _.get(this.formRef.services.find(x => x.name.toLowerCase().includes(serviceType.toLowerCase())), 'id') : null,
						regionType: regionType ? _.get(this.formRef.regions.find(x => x.name.toLowerCase().includes(regionType.toLowerCase())), 'id') : null,

						channelAddress,
						projectNumber,
						clientName,
						clientPersonName,
						clientPersonPhone,
						deliveryAddress,
						deliveryPerson,
						onceFee,
						periodicFee,
						transferChannel,
						comments
					}

					const errors = Object.keys(form).filter(key => !form[key])

					if(errors.length) [
						this.$notification.error({
							message: `Не установлены поля: ${errors.map(field => header[order.indexOf(field)]).join(', ')}`
						})
					]


					const val = _.omitBy(form, x => !x)

					this.formRef.form.setFieldsValue(val)
				})
				.catch((e) => {
					this.$notification.error({
						message: 'Файл не поддерживается'
					})
				})
		},
		async handleSubmit(e) {
			e.preventDefault();

			this.formRef.form.validateFieldsAndScroll(async (err, form) => {
				if(err) {
					return
				}

				const data = {
					abonent: _.find(this.formRef.abonents, x => x.id === form.abonent),
					addresses: [
						{
							typeID: AddressType.Channel,
							address1: form.channelAddress,
						},
						{
							typeID: AddressType.Delivery,
							address1: form.deliveryAddress,
						},
					],
					projectNumber: String(form.projectNumber),
					balancerType: _.find(this.formRef.bns, x => x.id === form.balancerType),
					serviceType: _.find(this.formRef.services, x => x.id === form.serviceType),
					regionType: _.find(this.formRef.regions, x => x.id === form.regionType),
					fees: [
						{
							typeID: PaymentType.PeriodicPayment,
							value: +form.periodicFee
						},
						{
							typeID: PaymentType.SinglePayment,
							value: +form.onceFee
						},
					],
					client: {
						name: form.clientName
					},
					clientPersons: [
						{
							typeID: PersonType.Client,
							phone: form.clientPersonPhone,
							firstName: form.clientPersonName
						},
						{
							typeID: PersonType.Delivery,
							firstName: form.deliveryPerson
						},
					],
					transferChannel: form.transferChannel,
					comments: form.comments
				}

				this.loading = true

				if(this.parentId) {
					await this.$api.request.updateRequest(this.parentId, data)

					if(this.file) {
						const formData = new FormData()
						formData.append('file', this.file)

						await this.$api.order.uploadFile(this.parentId, 3, formData)
					}

					this.$router.push({
						name: 'Requests.Page',
						params: { id: this.parentId }
					})

				} else {
					const { id } = await this.$api.request.createRequest(data)

					if(this.file) {
						const formData = new FormData()
						formData.append('file', this.file)

						await this.$api.order.uploadFile(id, 3, formData)
					}

					this.$router.push({
						name: 'Requests.Page',
						params: { id }
					})
				}

				

				this.loading = false
			});
		}
	},

}
</script>