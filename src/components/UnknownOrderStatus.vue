<template lang="pug">
	a-card
		a-form-model(ref="formRef" :model="form" :rules="rules" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" class="--label-left")
			a-form-model-item(:label="dateLabel" prop="date")
				a-date-picker(:disabled-date="disabledDate" v-model="form.date" placeholder="" :locale="$lang.locale" :disabled="disabled")
			
			a-button(type='primary' @click="save" :loading="loading" v-if="!disabled") Сохранить
</template>

<script>
import moment from 'moment'
import { findLastIndex } from 'lodash'

export default {
	props: {
		order: {},
		status: {},
		disabled: Boolean,
		statusHistory: Array,
		queue: Array,
	},
	data() {
		return {
			form: {
				date: null,
			},
			loading: false,
		}
	},
	created() {
		const currentIndex = this.queue.findIndex(x => x.id === this.order.currentStatus.id)
		const targetIndex = this.queue.findIndex(x => x.id === this.status.id)

		if(currentIndex > targetIndex) {
			const newIndex = findLastIndex(this.statusHistory, x => x.id === this.status.id)

			this.form.date = moment(this.statusHistory[newIndex + 1].activateFrom)
		}
	},
	computed: {
		dateLabel() {
			const index = this.queue.findIndex(x => x.id === this.status.id)

			return this.queue[index + 1].name
		},
		rules() {
			return {
				date: [
					{
						required: true,
						message: 'Выберите дату',
					}
				],
			}
		},
	},
	methods: {
		disabledDate(current) {
			return current && current > moment().add(1, 'day').startOf('day')
		},

		save() {
			this.$refs.formRef.validate(async valid => {
				if(!valid) {
					return
				}

				this.loading = true
				await this.$api.order.changeStatus(this.order.id, this.order.expectedStatus.id, this.form.date.toDate())
				this.loading = false
				this.$bus.$emit('route:reload')
			})
		}
	}
}
</script>