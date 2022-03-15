<template lang="pug">
	a-modal(
		visible
		:width="700"
		@cancel="close"
		:loading="!history"
	)
		span(slot="title") История статусов заказа {{'#' + order.number}}

		template(v-if="history")
			a-row(
				style="margin-bottom: 6px;"
				v-for="item, index of history"
				:key="index + item.id"
			)
				a-col(:span="12") {{item.name === 'Канал на отключении' ? 'Дата отключения канала' : item.name}}
				a-col(:span="12")
					a-date-picker(
						:allowClear="false"
						v-model="item.activateFrom"
						placeholder="Дата"
						:locale="$lang.locale"
					)

		template(#footer)
			a-button(@click="close") Отмена
			a-button(@click="save" type="primary" :loading="loading") Сохранить
</template>

<script>
import moment from 'moment'

export default {
	props: ['order'],
	data() {
		return {
			history: null,
			loading: false,
		}
	},
	async created() {
		const history = await this.$api.order.getStatusHistory(this.order.id)

		this.history = history.map(item => {

			return {
				...item,
				activateFrom: item.activateFrom ? moment(item.activateFrom) : null
			}
		})

	},
	methods: {
		close() {
			this.$emit('close')
		},
		async save() {
			try {
				this.loading = true

				const dates = this.history.map(item => ({...item, activateFrom: item.activateFrom.toDate()}))

				await this.$api.order.saveHistoryItemsArray(this.order.id, dates)
			} catch(e) {
				console.log(e)
			} finally {
				this.loading = false
				this.close()
			}

		}
	},
}
</script>