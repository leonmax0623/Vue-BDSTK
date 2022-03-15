<template lang="pug">
	div
</template>

<script>
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'

export default {
	props: {
		json: {
			required: true,
		},
	},
	data: () => ({
		editor: null,
		options: {
			mode: 'view'
		}
	}),
	mounted() {
		this.editor = new JSONEditor(this.$el, this.options, this.json)
	}
}
</script>