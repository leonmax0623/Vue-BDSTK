<template lang="pug">
	Page.as25jn223j5n
		SubHeader(slot="sub-header" title="Управление ролями")

		ATable(
			bordered
			:loading="loading"
			:dataSource="dataSource"
			:columns="columns"
			:scroll="scroll"
		)
			template(v-for="access of accessList" :slot="access.name")
				ATooltip(:title="access.name" @click.native="remove(access)") {{access.comments}}

			template(#title v-if="isDev")
				.form
					AInput.form__control(placeholder="Ключ" v-model="form.name")
					AInput.form__control(placeholder="Комментарий" v-model="form.comments")

					AButton.form__button(:disabled="!(form.name && form.comments)" @click="createRole") Добавить

			template(v-for="col of accessList" :slot="`content-${col.name}`" slot-scope="text, record")
				a-select(
					:value="getValueForCol(record.accessLevel.find(x => x.id === col.id))"
					@change="handleChange(record, col, $event)"
					readonly
					style="margin-left: auto; width: 120px;"
				)
					a-select-option(:value="item.value" v-for="item of options" :key="item.value") {{item.title}}
</template>

<script>
const AccessType = {
	Full: 1,
	ReadOnly: 2,
	None: 3,
}

export default {
	metaInfo: {
		title: 'Доступ'
	},
	data: () => ({
		accessList: null,
		groups: null,
		loading: false,

		form: {
			name: '',
			comments: ''
		}
	}),
	async created() {
		this.loading = true
		this.fetch(true)
		this.loading = false
	},
	computed: {
		isDev() {
			return process.env.NODE_ENV === 'development'
		},
		scroll() {
			return {
				x: 1600
			}
		},
		options() {
			return [
				{
					title: 'Управление',
					value: AccessType.Full,
					isCurrent: col => col.access && !col.readOnly,
					serverValue: {
						access: true,
						readOnly: false,
					},
					process: async (depId, accessId) => this.$api.company.grantAccess(depId, accessId, false)
				},
				{
					title: 'Чтение',
					value: AccessType.ReadOnly,
					isCurrent: col => col.access && col.readOnly,
					serverValue: {
						access: true,
						readOnly: true,
					},
					process: async (depId, accessId) => this.$api.company.grantAccess(depId, accessId, true)
				},
				{
					title: 'Закрыто',
					value: AccessType.None,
					isCurrent: col => !col.access,
					serverValue: {
						access: false,
						readOnly: false
					},
					process: async (depId, accessId) => this.$api.company.revokeAccess(depId, accessId)
				}
			]
		},
		dataSource() {
			return this.groups
		},
		columns() {
			if(!this.accessList)
				return null

			const access = this.accessList
				.map((item, index) => {
					return {
						key: index,
						access: item,
						slots: {
							title: item.name
						},
						scopedSlots: {
							customRender: `content-${item.name}`,
						},
						dataIndex: 'value',
						width: 200,
					}
				})

			return [
				{
					title: '',
					dataIndex: 'name',
					width: 160,
					fixed: true,
				},
				...access,
			]
		}
	},
	methods: {
		remove(access) {
			if(!this.isDev) {
				return
			}
			
			this.$confirm({
				title: 'Удалить право доступа?',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					await this.$api.access.remove(access.id)
					await this.fetch()
				},
				onCancel() {},
			});
		},
		async createRole() {
			await this.$api.access.create(this.form)
			await this.fetch()

			this.form.name = ''
			this.form.comments = ''
		},
		async fetch(initial) {
			this.accessList = null
			this.groups = null

			;[
				this.accessList,
				this.groups
			] = await Promise.all([
				this.$api.access.getList(),
				this.$api.company.getDepartmentAccessFull()
			])
		},
		getValueForCol(col) {
			return this.options.find(x => x.isCurrent(col)).value
		},
		async handleChange(dep, col, value) {
			const val = this.options.find(x => x.value === value)

			this.loading = true

			dep.accessLevel.forEach(item => {
				if(item.id === col.id) {
					this.$set(item, 'access', val.serverValue.access)
					this.$set(item, 'readOnly', val.serverValue.readOnly)
				}
			})

			this.$store.commit('app/updateAccessLevels', {
				id: col.id,
				value: val.serverValue
			})

			await val.process(dep.id, col.id)

			this.loading = false


			this.$nextTick(() => {
				this.loading = false
			})
		}
	}
}
</script>

<style lang="scss" scoped>

// .as25jn223j5n .ant-table-content {
// 	overflow: auto;
// }

.form {
	display: flex;

	&__control,
	&__button {
		margin-left: 12px;
	}
}
</style>