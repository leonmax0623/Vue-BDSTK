<template>
	<a-modal
        visible
        :width="700"
        @cancel="close"
	>
        <span slot="title">Письмо</span>

		<a-textarea :rows="12" v-model="value"/>

        <template slot="footer">
            <a-button @click="close">Закрыть</a-button>
        </template>
	</a-modal>
</template>

<script>
export default {
    props: ['email'],
    data() {
        return {
            value: null
        }
    },
    created() {
        this.value = this.email.body
    },
    methods: {
        close() {
            this.$emit('close')
        },
    }
}
</script>