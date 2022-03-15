<template>
	<a-modal
        visible
        :width="800"
        @cancel="close"
	>
        <span slot="title">Письмо заявки на блокировку СИМ</span>

        <List>
            <ListItem title="Тема:">{{email.subject}}</ListItem>
            <ListItem title="Кому:">{{email.to}}</ListItem>
            <ListItem title="Количество СИМ:">{{email.sims.length}}</ListItem>
        </List>

		<a-textarea :rows="12" v-model="value"/>

        <template slot="footer">
            <a-button @click="close">Закрыть</a-button>
            <a-button @click="submit" type="primary">Отправить на блокировку</a-button>
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
        submit() {
            this.$emit('complete', this.value)
        },
        close() {
            this.$emit('close')
        },
    }
}
</script>