<template lang="pug">
	Page.wrap
		SubHeader(slot="sub-header" title="Администрирование")
		
		a-tabs(class="--nogap" v-model="tab" @change="handleTab")
			a-button(v-if="tab === 'DIAGS'" slot="tabBarExtraContent" type="primary" @click="addDiag()" icon="plus") Новая диагностика
			a-button(v-if="tab === 'TYPES'" slot="tabBarExtraContent" type="primary" @click="addType()" icon="plus") Новая неисправность
			a-button(v-if="tab === 'REASONS'" slot="tabBarExtraContent" type="primary" @click="addReason()" icon="plus") Новый закрывающий комментарий

			a-tab-pane(tab="Диагностики" key="DIAGS")
				a-card
					a-list(:data-source="ticket_diagnostics || []" :loading="fetching_ticket_diagnostics")
						template(#renderItem="item")
							a-list-item
								a-list-item-meta(
									:description="item.comments"
								)
									template(#title)
										a-tag(slot="title" :color="item.isRequired ? 'red' : 'blue'") {{item.name}}

										a(:href="item.wiki" v-if="item.wiki" target="_blank")
											a-icon(type="exclamation-circle")
											span(style="margin-left: 6px") wiki
								
								a-button(slot="actions" @click="addDiag(item)") Изменить
								a-popconfirm(
									slot="actions"
									placement="left"
									title="Подтвердите удаление"
									ok-text="Удалить"
									cancel-text="Отмена"
									@confirm="removeDiag(item)"
								)
									a-button(:loading="!!~loading.removeDiag.indexOf(item.id)") Удалить
						
			a-tab-pane(tab="Неисправности" key="TYPES")
				a-card(:loading="fetching_ticket_types")
					a-list(:data-source="ticket_types")
						template(#renderItem="item")
							a-list-item
								a-list-item-meta(
									:title="item.name"
									:description="item.comments"
								)
								
								a-button(slot="actions" @click="addType(item)") Изменить
								a-popconfirm(
									slot="actions"
									placement="left"
									title="Подтвердите удаление"
									ok-text="Удалить"
									cancel-text="Отмена"
									@confirm="removeType(item)"
								)
									a-button(:loading="!!~loading.removeType.indexOf(item.id)") Удалить
			a-tab-pane(tab="Закрывающие комментарии" key="REASONS")
				a-card(:loading="fetching_ticket_reasons")
					a-list(:data-source="ticket_reasons")
						template(#renderItem="item")
							a-list-item
								a-list-item-meta(
									:title="item.name"
									:description="item.comments"
								)
								
								a-button(slot="actions" @click="addReason(item)") Изменить
								a-popconfirm(
									slot="actions"
									placement="left"
									title="Подтвердите удаление"
									ok-text="Удалить"
									cancel-text="Отмена"
									@confirm="removeReason(item)"
								)
									a-button(:loading="!!~loading.removeReasons.indexOf(item.id)") Удалить
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { merge } from 'lodash'

export default {
	metaInfo: {
		title: 'HD — Администратор'
	},
	data: () => ({
		tab: null,
		loading: {
			removeDiag: [],
			removeType: [],
			removeReasons: [],
		},
		
	}),
	async created() {
		const { tab = 'DIAGS' } = this.$route.query

		this.tab = tab

		await Promise.all([
			this.loadTicketDiagnostics(),
			this.loadTicketTypes(),
			this.load_ticket_reasons(),
		])
	},
	computed: {
		...mapState('constant', [
			'ticket_diagnostics',
			'ticket_types',
			'ticket_reasons',
			'fetching_ticket_diagnostics',
			'fetching_ticket_types',
			'fetching_ticket_reasons',
		]),
	},
	methods: {
		...mapActions('constant', ['loadTicketDiagnostics', 'loadTicketTypes', 'load_ticket_reasons']),
		handleTab(tab) {
			this.$qs({ tab })
		},
		async removeDiag({ id }) {
			this.loading.removeDiag.push(id)

			try {
				await this.$api.ticket.removeDiag(id)
				this.$message.success('Диагностика удалена')
			} catch(e) {
				this.$message.error('Невозможно удалить элемент')
			} finally {
				const index = this.loading.removeDiag.indexOf(id)

				if(~index) {
					this.loading.removeDiag.splice(index, 1)

					this.loadTicketDiagnostics(true)
				}
			}
		},
		async removeType({ id }) {
			this.loading.removeType.push(id)

			try {
				await this.$api.ticket.removeTroubleType(id)
				this.$message.success('Тип обращения удален')
			} catch(e) {
				this.$message.error('Невозможно удалить элемент')
			} finally {
				const index = this.loading.removeType.indexOf(id)

				if(~index) {
					this.loading.removeType.splice(index, 1)

					this.loadTicketTypes(true)
				}
			}

		},
		async removeReason({ id }) {
			this.loading.removeReasons.push(id)

			try {
				await this.$api.ticket.removeReason(id)
				this.$message.success('Закрывающий комментарий удален')
			} catch(e) {
				this.$message.error('Невозможно удалить элемент')
			} finally {
				const index = this.loading.removeReasons.indexOf(id)

				if(~index) {
					this.loading.removeReasons.splice(index, 1)

					this.load_ticket_reasons(true)
				}
			}

		},
		async addDiag(item) {
			this.$modal({
				component: 'EditDiagnostic',
				options: {
					item,
					isValid: form => {
						return form.name === item.name || !this.ticket_diagnostics.find(x => x.name === form.name)
					}
				},
				on: {
					done: () => {
						this.$message.success('Диагностика добавлена')
						this.loadTicketDiagnostics(true)
					}
				}
			})	
		},
		async addType(item) {
			this.$modal({
				component: 'EditTicketType',
				options: {
					item,
					isValid: form => {
						return form.name === item.name || !this.ticket_types.find(x => x.name === form.name)
					}
				},
				on: {
					done: () => {
						this.$message.success('Тип обращения добавлен')
						this.loadTicketTypes(true)
					},
				}
			})	
		},
		async addReason(item) {
			this.$modal({
				component: 'EditCloseComment',
				options: {
					item
				},
				on: {
					done: () => {
						this.$message.success('Закрывающий комментарий добавлен')
						this.load_ticket_reasons(true)
					}
				}
			})	
		}
	}

}
</script>