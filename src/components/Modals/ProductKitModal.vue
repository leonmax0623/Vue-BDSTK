<template lang="pug">
	a-modal(
		:confirmLoading="loading"
		:title="kit ? kit.name : 'Создание комплекта'"
		:visible="true"
		@ok="save"
		@cancel="close"
		okText="Сохранить"
		cancelText="Отмена"
		:width="700"
		class="modal"
	)
		template(#footer v-if="readOnly")
			AButton(@click="close") Закрыть

		AFormModel(
			ref="form"
			:model="form"
			:rules="rules"
			:label-col="{ span: 6 }"
			:wrapper-col="{ span: 18 }"
			class="--label-left"
		)
			AFormModelItem(label="Наименование" prop="name")
				AInput(v-model="form.name" :disabled="readOnly")

			AFormModelItem(label="Комментарий" prop="comments")
				ATextarea(v-model="form.comments" :auto-size="{ minRows: 3 }" :disabled="readOnly")

			AFormModelItem(label="Позиции" v-if="products")
				a-row(:gutter="16" v-if="!readOnly")
					ACol(:span="9")
						ASelect(v-model="activeProductKey" @change="selectedProduct = null")
							ASelectOption(
								v-for="key of Object.keys(products)"
								:value="key"
								:key="key"
							) {{key}}

					ACol(:span="10")
						ASelect(v-model="selectedProduct")
							ASelectOption(
								v-for="item of products[activeProductKey]"
								:value="item.product.id"
								:key="item.product.id"
							) {{item.product.name}}

					ACol(:span="4")
						AButton(type="primary" @click="addSelectedProduct" :disabled="!selectedProduct") Добавить
	
				AList(item-layout="horizontal" :data-source="form.items" :locale="$lang")
					AListItem(slot="renderItem" slot-scope="item, index")
						AListItemMeta(:title="item.productName")

						template(#extra)
							.flex
								AInputNumber(size="small" v-model="item.quantity" :min="1" :max="getMaxByProduct(item)" :disabled="readOnly")
								AButton(style="margin-left: 6px;" size="small" type="danger" @click="removeItem(item)" v-if="!readOnly") Удалить
</template>

<script>
import { groupBy, sortBy } from 'lodash'

export default {
	props: {
		kit: Object,
		readOnly: Boolean,
	},
	data() {
		return {
			loading: false,
			productsRaw: null,
			activeProductKey: null,
			selectedProduct: null,

			form: {
				name: null,
				comments: null,
				items: []
			}
		}
	},
	async created() {
		this.productsRaw = (await this.$api.product.getProductsSummary()).filter(x => x.category.name !== 'Устройства')
		this.activeProductKey = Object.keys(this.products)[0]

		if(this.kit) {
			this.form = {
				...this.kit,
				items: this.kit && this.kit.items || []
			}
		}
	},
	computed: {
		products() {
			if(!this.productsRaw) {
				return null
			}

			return groupBy(sortBy(this.productsRaw, x => x.product.name), x => x.category.name)
		},
		rules() {
			return {
				name: [{
					required: true,
					message: 'Необходимо заполнить',
				}],
			}
		},
	},
	methods: {
		getMaxByProduct(item) {
			const prod = this.productsRaw.find(x => x.product.id === item.productID)

			return prod.quantity
		},
		removeItem(item) {
			this.$confirm({
				title: 'Удалить позицию из комплекта?',
				okText: 'Удалить',
				cancelText: 'Отмена',
				onOk: async () => {
					const index = this.form.items.findIndex(x => x.productID === item.productID)
		
					if(~index) {
						this.form.items.splice(index, 1)
					}
				}
			})
		},
		addSelectedProduct() {
			const item = this.productsRaw.find(x => x.product.id === this.selectedProduct)

			this.form.items.unshift({
				productID: item.product.id,
				productName: item.product.name,
				quantity: 1,
			})
		},
		close() {
			this.$emit('close')
		},
		save() {
			this.$refs.form.validate(async valid => {
				if(!valid) {
					return
				}
				
				this.loading = true
				if(this.kit) {
					await this.$api.productKit.updateKit(this.kit.id, this.form)
				} else {
					await this.$api.productKit.createKit(this.form)
				}
				this.loading = false
				this.close()
			})
		}
	},
}
</script>