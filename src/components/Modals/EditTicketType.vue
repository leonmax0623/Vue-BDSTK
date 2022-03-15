<template lang="pug">
	a-modal(
		:confirmLoading="loading"
		:title="`${item ? 'Редактирование' : 'Добавление'} неисправности`"
		:visible="true"
		@ok="submit"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		:width="700"
		class="modal"
	)
		a-form-model(ref="form" :model="form" :rules="rulesDiag" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
			a-form-model-item(label="Наименование" prop="name")
				a-input(v-model="form.name")

			a-form-model-item(label="Комментарий" prop="comments")
				a-textarea(v-model="form.comments")
</template>

<script>

export default {
	props: ['item', 'isValid'],
	data() {
		return {
			loading: false,
			form: {
				name: '',
				comments: '',
			},
		}
	},
	async created() {
		if(this.item) {
			Object.keys(this.form).forEach(key => {
				this.form[key] = this.item[key]
			})
		}
	},
	computed: {
		rulesDiag() {
			return {
				name: [{ required: true, message: 'Введите наименование' }],
			}
		}
	},
	methods: {
		close() {
			this.$emit('close')
		},
		submit() {
			this.$refs.form.validate(async valid => {
				if(!valid) {
					return
				}

				if(this.isValid && !this.isValid(this.form)) {
					this.$notification.error({
						message: 'Неисправность с таким названием уже существует!'
					})
					
					return
				}

				this.loading = true

				try {
					await this.$api.ticket.addTroubleType(this.form, this.item && this.item.id)
					
					this.close()

					this.$emit('done')
				} catch(e) {

				} finally {
					this.loading = false
				}

				
			})
		}
	},
}
</script>