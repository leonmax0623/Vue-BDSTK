<template lang="pug">
	a-modal(
		:confirmLoading="loading"
		title="Выбор комплекта для добавления"
		:visible="true"
		@ok="save"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		:width="700"
		class="modal"
	)
		AList(v-if="list" item-layout="horizontal" :data-source="list" :locale="$lang")
			AListItem(slot="renderItem" slot-scope="item, index")
				AListItemMeta(:title="item.name" :description="item.comments")

				template(#extra)
					.flex
						AButton(@click="openKit(item)") Открыть
						AButton(@click="toggle(item)" :type="isSelectedKit(item) ? 'danger' : 'primary'" style="margin-left: 12px; width: 120px;") {{isSelectedKit(item) ? 'Убрать' : 'Добавить'}}
</template>

<script>

export default {
	data() {
		return {
			loading: false,
			list: null,

			selected: [],
		}
	},
	async created() {
		this.list = await this.$api.productKit.getProductKits()
	},
	computed: {
	},
	methods: {
		close() {
			this.$emit('close')
		},
		save() {
			if(!this.selected.length) {
				return this.$notification.error({ message: 'Вы не выбрали ни один комплект' })
			}

			const res = this.list.filter(x => ~this.selected.indexOf(x.id))

			this.$emit('save', res)
			this.close()
		},
		openKit(kit) {
			console.log(kit);
			this.$modal({
				component: 'ProductKitModal',
				options: {
					kit,
					readOnly: true
				}
			})
		},
		toggle(kit) {
			const index = this.selected.indexOf(kit.id)

			if(~index) {
				this.selected.splice(index, 1)
			} else {
				this.selected.push(kit.id)
			}
		},
		isSelectedKit(kit) {
			return ~this.selected.indexOf(kit.id)
		}
	},
}
</script>