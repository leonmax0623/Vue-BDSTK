<template lang="pug">
	a-modal(
		:confirmLoading="loading"
		:title="`${item ? 'Редактирование' : 'Добавление'} диагностики`"
		:visible="true"
		@ok="submit"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		:width="700"
		class="modal"
	)
		a-form-model(ref="formDiag" :model="formDiag" :rules="rulesDiag" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
			a-form-model-item(label="Наименование диагностики" prop="name")
				a-input(v-model="formDiag.name")

			a-form-model-item(label="Wiki" prop="wiki")
				a-input(v-model="formDiag.wiki")

			a-form-model-item(label="Комментарий" prop="comments")
				a-textarea(v-model="formDiag.comments")

			a-form-model-item(:colon="false" prop="types")
				template(#label)
					a-checkbox(v-model="formDiag.isRequired") Обязательна

				a-select(
					v-model="formDiag.ticketTypes"
					v-if="formDiag.isRequired"
					mode="multiple"
					placeholder="Выберите неисправности"
				)
					a-select-option(v-for="item of ticket_types" :value="item.id" :key="item.id") {{item.name}}
</template>

<script>
import { mapState } from 'vuex'

export default {
	props: ['item', 'isValid'],
	data() {
		return {
			loading: false,
			formDiag: {
				name: '',
				wiki: '',
				comments: '',
				isRequired: false,
				ticketTypes: [],
			},
		}
	},
	async created() {
		if(this.item) {
			Object.keys(this.formDiag).forEach(key => {
				if(this.item[key]) {
					this.formDiag[key] = this.item[key]
				}
			})

			this.formDiag.ticketTypes = (this.item.troubleTypeRequirements || [])
				.filter(item => item.isRequired)
				.map(item => {
					return item.troubleType.id
				})
		}
	},
	computed: {
		...mapState('constant', [
			'ticket_types',
		]),
		rulesDiag() {
			return {
				name: [{ required: true, message: 'Введите наименование' }],
				wiki: [{ required: true, message: 'Введите ссылку на wiki' }],
				ticketTypes: [{
					required: this.formDiag.isRequired,
					message: 'Необходимо выбрать неисправности'
				}]
			}
		}
	},
	methods: {
		close() {
			this.$emit('close')
		},
		submit() {
			this.$refs.formDiag.validate(async valid => {
				if(!valid) {
					return
				}

				if(this.isValid && !this.isValid(this.formDiag)) {
					this.$notification.error({
						message: 'Диагностика с таким названием уже существует!'
					})
					
					return
				}

				this.loading = true

				console.log(2);

				try {
					const { ticketTypes, ...rest } = this.formDiag
					const data = {
						...rest,
						troubleTypeRequirements: this.ticket_types
							.map(troubleType => ({
								troubleType,
								isRequired: !!~ticketTypes.indexOf(troubleType.id),
							}))
					}
					
					await this.$api.ticket.addDiagnostic(data, this.item && this.item.id)
					
					this.loading = false
					
					this.close()

					this.$emit('done')

				} catch(e) {
					this.loading = false
				}
			})
		}
	},
}
</script>