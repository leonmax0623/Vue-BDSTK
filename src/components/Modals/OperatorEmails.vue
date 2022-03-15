<template>
	<a-modal
        visible
        @cancel="close"
        :width="700"
	>
        <span slot="title">Почтовый ящик оператора</span>

		<a-list itemLayout="horizontal" :dataSource="emails">
            <a-list-item slot="renderItem" slot-scope="item, index">
                <a-button slot="actions" @click="open(item)">Открыть</a-button>

                <a-list-item-meta
                    :title="`${item.subject} от ${getDate(item)}`"
                    :description="item.to"
                >
                    <a-avatar
                        v-if="item.received"
                        slot="avatar"
                        icon="arrow-down"
                        size="large"
                        :style="{backgroundColor: '#f76d6d'}"
                    />
                    
                    <a-avatar
                        v-else
                        slot="avatar"
                        icon="arrow-up"
                        size="large"
                        :style="{backgroundColor: '#44d46e'}"
                    />
                </a-list-item-meta>
            </a-list-item>
        </a-list>

        <template slot="footer">
            <a-button @click="close">Закрыть</a-button>
            <!-- <a-button type="primary" :disabled="disabled" @click="save" :loading="loading">Отправить на активацию</a-button> -->
        </template>
	</a-modal>
</template>

<script>
import dayjs from 'dayjs'

export default {
    props: ['emails'],
    methods: {
        getDate(item) {
            return dayjs(item.sent).format('DD.MM.YYYY')
        },
        close() {
            this.$emit('close')
        },
        open(email) {
            this.$bus.$emit('modal', {
                component: 'EmailPreview',
                options: {
                    email
                }
            })
        }
    }
}
</script>