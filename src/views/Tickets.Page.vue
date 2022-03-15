<template lang="pug">
	Page.wrap
		SubHeader(slot="sub-header")
			a-skeleton(slot="title" active :loading="!ticket" :paragraph="false" :title="{ width: 120 }")
				span Тикет 
				span(v-if="ticket") \#{{ticket.number}}


		a-row(:gutter="16" v-if="ticket")
			a-col(:span="16")
				a-tabs(type="card" class="--nogap" v-model="tab" @change="tabChange")
					template(#tabBarExtraContent)
						template(v-if="ticket.responsible.departmentID")
							span Инженер: 
							ATag {{ticket.responsible.name}}
						
						AButton(
							v-if="!ticket.responsible.departmentID || ticket.responsible.departmentID !== user.id && getAccess('HD-Tickets-Actor').isFullAccess"
							type="primary"
							@click="applyResponsible"
							:loading="loading.responsible"
							size="small"
						) Взять в работу

					a-tab-pane(tab="Информация" key="TICKET")
						a-card
							TicketForm(
								isPage
								ref="ticketForm"
								:disabled="wereClosedOneTime || !getAccess('HD-Tickets').isFullAccess"
								:client="client"
								:ticket="ticket"
								@loadClient="handleLoadClient"
								:loadingClient="loadingClient"
								@dirty="setDirty"
							)

							a-row(type="flex" justify="end")
								a-button(v-if="!wereClosedOneTime && getAccess('HD-Tickets').isFullAccess" :disabled="!isChanged" type="primary" @click="saveChanges" :loading="saving") Сохранить

					a-tab-pane(tab="Диагностика" key="DIAGNOSTICS")
						a-card(
							:tab-list="diagnosticTabList"
							:active-tab-key="activeDiagnosticTab"
							@tabChange="key => activeDiagnosticTab = key"
						)
							template(v-if="activeDiagnosticTab === 'diagnostics'")
								template(v-for="item of requiredDiagnostics")
									TicketDiagnosticCard(
										required
										:name="item.name"
										:wiki="item.wiki"
										:desc="item.comments"
									)
										template(#extra)
											a-button(@click="diagModal(item.id)" type="danger") Ожидает добавления

								template(v-if="ticket.diags && ticket.diags.length")
									template(v-for="diag of ticket.diags")
										TicketDiagnosticCard(
											:required="diag.diagnostics.isRequired"
											:name="diag.diagnostics.name"
											:wiki="diag.diagnostics.wiki"
											:comments="diag.comments"
											:desc="diag.diagnostics.comments"
											:extra="diag.creator.departmentName"
											:fileInfo="diag.fileInfo"
											:downloadingDocs="downloadingDocs"
											@download="download"
										)
										a-divider

								a-row(type="flex" justify="end")
									a-button(v-if="getAccess('HD-Tickets').isFullAccess" type="primary" @click="diagModal()") Добавить диагностику

							template(v-if="activeDiagnosticTab === 'checkState'")
								TicketTests(
									:ticketId="ticket.id"
									:tests="ticket.tests || []"
									@refetch="refetch"
								)

					a-tab-pane(tab="Данные по инциденту" key="incidentData" v-if="hasBeelineTicket")
						a-card(v-if="incidentLoading" loading) loading
						template(v-else)
							a-card.nopadding(title="Основные параметры")
								a-table(v-bind.once="incidentTable" :pagination="false")
									template(#paramKey="paramKey, item")
										.property(:class="{ '--children': item.isChild }") {{paramKey}}
							a-card.nopadding(title="Структура")
								Json(:json="incidentData")

					a-tab-pane(tab="Третья линия" key="3line" v-if="step3line")
						a-card
							a-form-model(:label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" class="--label-left")
								a-form-model-item(label="Bitrate")
									a-input(:value="get(step3line, 'props.Bitrate.value')" disabled)
								a-form-model-item(label="Rtt")
									a-input(:value="get(step3line, 'props.Rtt.value')" disabled)
								a-form-model-item(label="Jitter")
									a-input(:value="get(step3line, 'props.Jitter.value')" disabled)

								.group
									.group__name.ant-col.ant-col-4 Lose
									.group__content
										a-form-model-item(label="M1")
											a-input(:value="get(step3line, 'props.LoseM1.value')" disabled)
										a-form-model-item(label="M2")
											a-input(:value="get(step3line, 'props.LoseM2.value')" disabled)
										a-form-model-item(label="M3")
											a-input(:value="get(step3line, 'props.LoseM3.value')" disabled)
										a-form-model-item(label="M4")
											a-input(:value="get(step3line, 'props.LoseM4.value')" disabled)

								a-form-model-item(label="Комментарий")
									a-textarea(:value="step3line.comments" :autoSize="{ minRows: 4, maxRows: 12 }" disabled)

								
								a-form-model-item(label="Файлы")
									span(v-if="!step3line.files || !step3line.files.length") Файлы отсутствуют
									div(v-if="step3line.files")
										template(v-for="file of step3line.files")
											a-button(
												style="margin-bottom: 2px;"
												size="small"
												@click="download(file)"
												:key="file.id"
												:loading="!!~downloadingDocs.indexOf(file.id)"
											) {{file.name}} - {{$formatSize(file.size)}}
					

			a-col(:span="8")
				div(style="display: flex; align-items: center")
					a-button(type="link" size="large")
						RouterLink(to="/ticket")
							a-icon(type="arrow-left" style="margin-right: 6px;")
							span К списку тикетов


					
					a-tag(color="blue" v-if="customProperty('BEELINE_STATE')") {{customProperty('BEELINE_STATE', 'value')}} — {{customProperty('BEELINE_TICKET_ID', 'value')}}

					a-select(:loading="!statusList || loadingStatus" :disabled="loadingStatus || !getAccess('HD-Tickets-Status').isFullAccess" :value="ticket.currentStatus.id" style="margin-left: auto; width: 200px;" @change="handleStatus")
						a-select-option(:value="item.id" v-for="item of statusList" :key="item.id")
							TicketStatus(style="margin-left: auto;" :status="item")

				div
					a-card(style="margin-bottom: 12px;" v-for="step, index of steps" :key="step.id")
						div(slot="title")
							span(:style="step.creator.departmentID === 2073 ? { color: 'purple' } : {}") {{step.creator.departmentName}}
							a-tag(style="margin-left: 12px") {{$date.full(step.date)}}
						div(slot="extra")
							a-row
								a-icon(type="arrow-right")
								TicketStatus(style="margin-left: 6px;" :status="step.status")

						div(v-if="step.comments && (step.status.id === $config.tickets.status.open ? index : true)" style="margin-bottom: 6px;") {{step.comments}}

						div(v-if="step.files")
							template(v-for="file of step.files")
								a-button(
									style="margin-bottom: 2px;"
									size="small"
									@click="download(file)"
									:key="file.id"
									:loading="!!~downloadingDocs.indexOf(file.id)"
								) {{file.name}} - {{$formatSize(file.size)}}

					TicketComment(
						:allowClose="allowClose"
						v-if="!isClosed"
						:ticket="ticket"
						@saved="reload"
						:hideCloseCheck="getAccess('HD-Tickets').isReadOnlyAccess"
					)

					viewer.viewer(@inited="onImageInit" :images="images" ref="viewer" :options="options")
						template(slot-scope="scope")
							img(ref="img" v-for="img of scope.images" :src="img")

					
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import mime from 'mime'
import saveFile from 'file-saver'
import { get, sortBy } from 'lodash'
import { isBefore, parseISO } from 'date-fns'

export default {
	metaInfo() {
		return {
			title: `HD — тикет #${this.ticket ? this.ticket.number : ''}`
		}
	},
	data: () => ({
		tab: null,
		ticket: null,
		loadingStatus: false,
		downloadingDocs: [],
		client: null,
		saving: false,
		loadingClient: false,
		isChanged: false,
		loading: {
			responsible: false,
		},
		images: [],
		incidentData: null,
		incidentLoading: false,
		hasBeelineTicket: false,
		activeDiagnosticTab: 'diagnostics'
	}),
	async created() {
		const { tab = 'TICKET' } = this.$route.query

		this.tab = tab

		await Promise.all([
			this.loadTicketTypes(),
			this.loadTicketStatuses(),
			this.loadTicketDiagnostics(),
			this.load_ticket_reasons(),
		])

		const { ticketId } = this.$route.params
		
		await this.refetch()
		this.client = this.ticket.order
	},
	computed: {
		...mapState('constant', [
			'ticket_types',
			'ticket_statuses',
			'ticket_diagnostics',
			'fetching_ticket_reasons',
			'ticket_reasons',
		]),
		...mapState('auth', ['user']),
		...mapGetters('app', ['getAccess']),
		diagnosticTabList() {
			return [
				{
					key: 'diagnostics',
					tab: 'Диагностики',
				},
				{
					key: 'checkState',
					tab: 'Проверка состояния оборудования',
				},
			]
		},
		incidentTable() {
			return {
				columns: [
					{
						title: 'Параметр',
						dataIndex: 'paramKey',
						scopedSlots: { customRender: 'paramKey' },
					}, {
						title: 'Описание',
						dataIndex: 'description',
					},
					{
						title: 'Данные',
						dataIndex: 'value'
					},
				],
				dataSource: [
					{
						key: 'ticketType',
						paramKey: 'ticketType',
						description: 'Тип ТТ',
						value: get(this.incidentData, 'header.ticketType')
					},
					{
						key: 'priorityNo',
						paramKey: 'priorityNo',
						description: 'Приоритет',
						value: get(this.incidentData, 'header.priorityNo')
					},
					{
						key: 'serviceState',
						paramKey: 'serviceState',
						description: 'Состояние услуги',
						value: get(this.incidentData, 'serviceState.serviceState')
					},
					{
						key: 'respGroup',
						paramKey: 'respGroup',
						description: 'Группа сотрудников',
						value: get(this.incidentData, 'responsibles.respGroup')
					},
					{
						key: 'Incident',
						paramKey: 'Incident',
						description: 'Инцидент',
						value: null
					},
					{
						isChild: true,
						key: 'grpId',
						paramKey: 'grpId',
						description: 'Группа услуг',
						value: get(this.incidentData, 'incident.grpId')
					},
					{
						isChild: true,
						key: 'servTypeId',
						paramKey: 'servTypeId',
						description: 'Тип услуги',
						value: get(this.incidentData, 'incident.servTypeId')
					},
					{
						isChild: true,
						key: 'troubleTypeId',
						paramKey: 'troubleTypeId',
						description: 'Тип проблемы',
						value: get(this.incidentData, 'incident.troubleTypeId')
					},
					{
						isChild: true,
						key: 'directionId',
						paramKey: 'directionId',
						description: 'Направление',
						value: get(this.incidentData, 'incident.directionId')
					},
				]
			}
		},
		steps() {
			return this.ticket.steps
		},
		step3line() {
			console.log(JSON.parse(JSON.stringify(this.steps)))
			const step = this.steps.find(x => x.status.id === this.$config.tickets.status.line3 && x.customProperties.length)

			if(step) {
				step.props = step.customProperties
					.reduce((acc, prop) => {

						if(prop.name === 'Bittrate') {
							return acc
						}

						return {
							...acc,
							[prop.name]: prop
						}
					}, {})
			}


			return step
		},
		options() {
			return {
				navbar: false,
				title: false,
				toolbar: {
					zoomIn: 4,
					zoomOut: 4,
					oneToOne: 0,
					reset: 4,
					play: {
						show: 4,
						size: 'large',
					},
					rotateLeft: 4,
					rotateRight: 4,
					flipHorizontal: 4,
					flipVertical: 4,
				},
				hide: () => {
					this.images = []
				}
			}
		},
		allowClose() {
			return !this.requiredDiagnostics.length
		},
		requiredDiagnostics() {
			if(!this.ticket_diagnostics) {
				return []
			}

			const res = this.ticket_diagnostics
				.filter(x => {
					return (
						x.isRequired &&
						!this.ticket.diags.some(item => item.diagnostics.id === x.id) &&
						x.troubleTypeRequirements.some(item => {
							return item.isRequired && this.ticket.troubleType.id === item.troubleType.id
						})
					)
				})

			return res
		},
		wereClosedOneTime() {
			return this.steps.some(x => x.status.isFinishStatus)
		},
		isClosed() {
			return this.ticket.currentStatus.id === this.$config.tickets.status.closed
		},
		statusList() {
			if(!this.ticket_statuses) {
				return false
			}

			const arr = this.ticket_statuses.filter(x => x.id !== this.$config.tickets.status.closed)

			if(!arr.find(x => x.id === this.ticket.currentStatus.id)) {
				arr.push(this.ticket.currentStatus)
			}

			return arr
		}
	},
	methods: {
		get,
		customProperty(name, field = 'displayName') {
			const prop = (get(this.ticket, `customProperties`) || [])
				.find(x => x.name === name)

			return prop && prop[field]
		},
		...mapActions('constant', [
			'loadTicketTypes',
			'loadTicketStatuses',
			'loadTicketDiagnostics',
			'load_ticket_reasons',
		]),
		onImageInit() {
			console.log('v init');
		},
		isImage(name) {
			const ext = name.match(/(\.[^.]+)$/)[0]

			return ~['.jpeg', '.jpg', '.png', '.bmp'].indexOf(ext)
		},
		async applyResponsible() {
			this.loading.responsible = true
			try {
				await this.$api.ticket.applyResponsible([
					{
						ticketID: this.ticket.id
					}
				])

			} catch(e) {
			} finally {
				this.loading.responsible = false
				this.refetch()
			}
		},
		diagModal(id) {
			this.$modal({
				component: 'AddDiagnosticToTicket',
				options: {
					id,
					ticket: this.ticket,
				},
				on: {
					save: () => this.refetch()
				}
			})
		},
		setDirty() {
			this.isChanged = true
		},
		async handleLoadClient({ vlan, sn }) {
			this.client = null
			this.setDirty()

			try {
				this.loadingClient = true
				const item = await this.$api.ticket.findClient({ vlan, sn })
				this.client = item.order
			} catch(e) {
				// this.$notification.error({ message: 'Данные не найдены' })
			} finally {
				this.loadingClient = false
			}
		},
		saveChanges() {
			const $formRef = this.$refs.ticketForm.$refs.formRef
			const form = this.$refs.ticketForm.form


			$formRef.validate(async valid => {
				if(!valid) {
					return
				}

			
				if(!this.client) {
					this.$notification.error({ message: 'Необходимо прикрепить заказ' })

					return
				}

				this.saving = true
				await this.$api.ticket.updateTicket(this.ticket.id, {
					troubleDate: form.troubleDate.toDate(),
					comments: form.comments,
					balancerState: {
						id: form.balancerStateID,
					},
					troubleTypeID: form.troubleTypeID,
					orderID: this.client.id,
					severityID: form.severity,
				})
				this.saving = false
				
				this.$message.success('Изменения сохранены')
			})
		},
		async download(file) {
			this.downloadingDocs.push(file.id)

			const fileContent = await this.$api.ticket.getTicketFile(this.ticket.id, file.id)

			const blob = new Blob([fileContent], {
				type: mime.getType(file.name)
			})

			const download = () => saveFile(blob, file.name)

			if(this.isImage(file.name)) {
				// this.$modal({
				// 	component: 'ImageViewer',
				// 	options: {
				// 		image: URL.createObjectURL(blob)
				// 	},
				// 	on: {
				// 		download
				// 	}
				// })
				this.images.push(URL.createObjectURL(blob))
				this.$refs.viewer.$viewer.show()
				// this.$nextTick(() => {
				// 	const v = this.$refs.img[0].$viewer
				// 	console.log(v);
				// })
			} else {
				download()
			}


			const index = this.downloadingDocs.findIndex(id => id === file.id)

			if(~index) {
				this.downloadingDocs.splice(index, 1)
			}
		},
		async handleStatus(statusID) {
			const process = async (data = {}, files) => {
				this.loadingStatus = true
	
				const response = await this.$api.ticket.addStep(this.ticket.id, {
					statusID,
					ticketID: this.ticket.id,
					...data
				})
				
				if(files && files.length) {
					const filePromises = files.map(file => {
						const formData = new FormData()
						formData.append('file', file)
						return this.$api.ticket.attachFileToStep(this.ticket.id, response.id, formData)
					})

					await Promise.all(filePromises)
				}
	
				this.refetch()
	
				this.loadingStatus = false

				return response
			}


			// 3-line
			if(statusID === this.$config.tickets.status.line3 && !this.steps.find(x => x.status.id === this.$config.tickets.status.line3)) {
				this.$modal({
					component: 'Setup3Line',
					options: {
						process: async ({ form, names }) => {
							const { comments, files, ...rest } = form

							const customProperties = Object
								.keys(rest)
								.map(key => ({
									name: key,
									displayName: names[key],
									value: form[key]
								}))

							await process({
								customProperties,
								comments
							}, files)
						}
					}
				})
			} else {
				process()
			}
		},
		async refetch() {
			this.reload(await this.$api.ticket.getTicketById(this.$route.params.ticketId))

			const beelineId = this.customProperty('BEELINE_TICKET_ID', 'value')

			this.hasBeelineTicket = !!beelineId

			if(beelineId) {
				this.incidentLoading = true
				this.incidentData = null

				try {
					this.incidentData = await this.$api.ticket.getBeelineTicket(beelineId)
				} catch(e) {
					console.error(e)
				} finally {
					this.incidentLoading = false
				}

			}
		},
		reload(ticket) {
			if(!this.ticket) {
				this.ticket = ticket
			} else {
				Object
					.keys(ticket)
					.forEach(key => this.$set(this.ticket, key, ticket[key]))
			}

			this.ticket.steps = this.ticket.steps
				.sort((a, b) => {
					if(isBefore(parseISO(a.date), parseISO(b.date))) {
						return -1
					} else {
						return 1
					}
				})
		},
		tabChange(tab) {
			this.$qs({ tab })
		}
	}
}
</script>

<style scoped lang="scss">
.viewer {
	display: none;
}


.group {
	display: flex;

	&__content {
		flex-grow: 1;
	}
}

.property {
	&.--children {
		padding-left: 20px;
	}
}
</style>