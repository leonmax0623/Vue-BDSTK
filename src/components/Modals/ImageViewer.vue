<template lang="pug">
	a-modal(
		:visible="true"
		@cancel="close"
		:width="800"
		class="modal"
		@ok="download"
		okText="Скачать"
		cancelText="Закрыть"
	)
		.img-wrap
			img.img(:src="image")
</template>

<script>

export default {
	props: ['image'],
	data() {
		return {
		}
	},
	methods: {
		close() {
			URL.revokeObjectURL(this.image)
			this.$emit('close')
		},
		download() {
			this.$emit('download')
		}
	},
}
</script>

<style lang="scss" scoped>
.img {
	max-width: 100%;

	&-wrap {
		padding: 20px;
	}
}
</style>