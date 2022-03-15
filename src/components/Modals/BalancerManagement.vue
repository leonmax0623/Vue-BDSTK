<template lang="pug">
	a-modal(
		:title="modalTitle"
		:visible="true"
		:width="500"
		:footer="false"
		@cancel="close"
	)
		a-spin(:spinning="loading")
			a-form(
				:form="formOneBalancer"
				:label-col="{ span: 3 }"
				:wrapper-col="{ span: 10 }"
				class="--label-left"
			)
				h3.form-title Управление одним устройством
				a-form-item(label="S/N")
					a-input(v-decorator="['serialNumber', formItemOptions]")
				a-row
					a-col(:span="24")
						a-button(@click="takeOne" icon="minus") Удалить
						a-button(:style="{ marginLeft: '8px' }" @click="putOne" icon="plus") Добавить

			a-form(
				:form="formManyBalancers"
				:label-col="{ span: 3 }"
				:wrapper-col="{ span: 10 }"
				class="--label-left form-margin"
			)
				h3.form-title Управление группой устройств

				a-form-item(label="S/N с")
					a-input(v-decorator="['serialNumberFrom', formItemOptions]")
						
				a-form-item(label="по")
					a-input(v-decorator="['serialNumberTo', formItemOptions]")
				a-row
					a-col(:span="24")
						a-button(@click="takeSome" icon="minus") Удалить
						a-button(:style="{ marginLeft: '8px' }" @click="putSome" icon="plus") Добавить
</template>

<script>
import { ProductStatuses } from '@/common'

export default {
    props: ['device'],
	data() {
		return {
			ProductStatuses,
			loading: true,
			balancersList: [],
			serialNumbersList: []
		}
	},
	beforeCreate() {
		this.formOneBalancer = this.$form.createForm(this, { name: 'balancer_management_one' });
		this.formManyBalancers = this.$form.createForm(this, { name: 'balancer_management_many' });
	},
	async mounted() {
		this.balancersList = await this.$api.balancer.getBalancerItems(this.device.id, this.ProductStatuses.Storage)
		this.serialNumbersList = this.balancersList.map(item => item.serialNumber)
		this.loading = false
	},
	methods: {
		close() {
			this.$emit('close')
		},
		takeOne() {
			this.formOneBalancer.validateFields(async (err, form) => {
				if(err) {
					return
				}

				if(!form.serialNumber) {
					this.$notification.error({ message: 'Укажите S/N' })
					return
				}

				let item = this.balancersList.find(b => b.serialNumber === form.serialNumber)
				if(!item) {
					this.$notification.error({ message: 'S/N не найден в позиции' })
					return
				}

				this.$confirm({
					title: 'Вы уверены что хотите удалить позицию?',
					okText: 'Удалить',
					cancelText: 'Отмена',
					onOk: async () => {
						this.loading = true
						try {
							await this.$api.balancer.deleteBalancerItem(item.id)
							this.close()
							this.$emit('managed')
							this.$notification.success({ message: `S/N "${form.serialNumber}" удален` })
		
						} catch(e) {
		
						} finally {
							this.loading = false
						}
					},
				});

			})
		},
		putOne() {
			this.formOneBalancer.validateFields(async (err, form) => {
				if(err) {
					return
				}

				if(!form.serialNumber) {
					this.$notification.error({ message: 'Укажите S/N' })
					return
				}

				this.$bus.$emit('modal', {
					component: 'AddFileModal',
					options: {
						title: 'Добавление файла',
						desc: 'Прикрепите основание появление устройств на складе'
					},
					on: {
						save: async file => {
							this.loading = true

							try {
								const { resultCode: fileID } = await this.$api.file.uploadFile(this.$fileToFormData(file))
								
								let data = {
									id: 0,
									serialNumber: form.serialNumber,
									balancer: {
										id: this.device.id
									},
									fileID
								}

								await this.$api.balancer.addBalancerItem([data])
	
								this.close()
								this.$emit('managed')
								this.$notification.success({ message: `S/N "${form.serialNumber}" добавлен` })
							} catch(e) {

							} finally {
								this.loading = false
							}
						}
					}
				})

				
			})
		},


		takeSome() {
			this.formManyBalancers.validateFields(async (err, form) => {
				if(err) {
					return
				}

				if(!(form.serialNumberFrom && form.serialNumberTo)) {
					this.$notification.error({ message: 'Укажите диапазон S/N' })
					return
				}

				
				const regexp = /(\d{6,})$/gi
				let from = form.serialNumberFrom.match(regexp)
				let to = form.serialNumberTo.match(regexp)
				

				if(!(from && to)) {
					this.$notification.error({ message: 'Невалидный диапазон S/N', description: 'S/N должен заканчиваться на минимум 6 цифр' })
					return
				}

				if(parseInt(from[0]) >= parseInt(to[0])) {
					this.$notification.error({ message: 'Невалидный диапазон S/N' })
					return
				}

				this.$confirm({
					title: 'Вы уверены что хотите позиции?',
					okText: 'Удалить',
					cancelText: 'Отмена',
					onOk: async () => {
						try {
							this.loading = true
							await this.$api.balancer.deleteBalancers(this.device.id, form.serialNumberFrom, form.serialNumberTo)
							this.close()
							this.$emit('managed')
							this.$notification.success({ message: `Диапазон S/N удален` })
						} finally {
							this.loading = false
						}
					},
				});

			})
		},
		putSome() {
			this.formManyBalancers.validateFields(async (err, form) => {
				if(err) {
					return
				}

				if(!(form.serialNumberFrom && form.serialNumberTo)) {
					this.$notification.error({ message: 'Укажите диапазон S/N' })
					return
				}

				const regexp = /(\d{6,})$/gi
				let from = form.serialNumberFrom.match(regexp)
				let to = form.serialNumberTo.match(regexp)
				

				if(!(from && to)) {
					this.$notification.error({ message: 'Невалидный диапазон S/N', description: 'S/N должен заканчиваться на минимум 6 цифр' })
					return
				}

				if(parseInt(from[0]) >= parseInt(to[0])) {
					this.$notification.error({ message: 'Невалидный диапазон S/N' })
					return
				}

				try {
					this.loading = true

					this.$bus.$emit('modal', {
						component: 'AddFileModal',
						options: {
							title: 'Добавление файла',
							desc: 'Прикрепите основание появление устройств на складе'
						},
						on: {
							save: async file => {
								this.loading = true

								try {
									const { resultCode: fileID } = await this.$api.file.uploadFile(this.$fileToFormData(file))
									
									await this.$api.balancer.generateBalancers(this.device.id, form.serialNumberFrom, form.serialNumberTo, fileID)
									this.close()
									this.$emit('managed')
									this.$notification.success({ message: `Диапазон S/N добавлен` })
								} catch(e) {

								} finally {
									this.loading = false
								}
							}
						}
					})
					
					
				} finally {
					this.loading = false
				}
			})
		}
	},
	computed: {
		modalTitle() {
			return `Управление ${this.device.name}`
		},
		formItemOptions() {
			return {
				rules: [{ required: false, message: 'Заполните обязательное поле!' }]
			}
		}
	}
}
</script>

<style lang="scss">
	.form-title {
		text-align: center;
		margin: 0 0 20px 0;
	}
	.form-margin {
		margin: 30px 0 0 0;
	}
</style>