<template>
	<div class="subheader">
		<div class="title">
			<slot name="title">{{title}}</slot>
			<slot name="title-addon"/>
		</div>

		<div class="addon">
			<slot/>
		</div>
	</div>
</template>

<script>
export default {
  props: ['title']
}
</script>

<style lang="scss" scoped>
	.subheader {
		display: flex;
		margin-top: 40px;
		margin-bottom: 40px;
		align-items: flex-end;

		.title {
			padding-left: 40px;
			font-size: 32px;
		}

		.addon {
			margin-left: auto;
			margin-bottom: 4px;
		}
	}
</style>