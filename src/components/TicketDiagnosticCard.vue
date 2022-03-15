<template lang="pug">
	a-card(style="margin-bottom: 12px;")
		template(#title)
			a-tag(:color="required ? 'red' : 'blue'") {{name}}
			a(v-if="wiki" :href="wiki" target="_blank")
				a-icon(type="exclamation-circle")
				span(style="margin-left: 6px") wiki

		p(v-if="comments") {{comments}}
		a-divider(v-if="comments && desc")
		p(v-if="desc") {{desc}}

		a-button(
			slot="actions"
			icon="cloud-download"
			v-if="fileInfo"
			@click="$emit('download', fileInfo)"
			:loading="!!~downloadingDocs.indexOf(fileInfo.id)"
		) {{fileInfo.name}} 

		slot(name="extra" slot="extra")
			span {{extra}}
</template>

<script>
export default {
	props: {
		downloadingDocs: Array,
		required: Boolean,
		wiki: String,
		name: String,
		comments: String,
		desc: String,
		extra: String,
		fileInfo: {},
	}
}
</script>