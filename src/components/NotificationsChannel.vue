<template>
    <div class="root" v-if="channelNotifications.length">
        <div class="root__content">
            <a-icon type="info-circle" class="warn" />
            <div class="links">
                <router-link :to="`/orders/${note.objectID}`" class="note" v-for="note of channelNotifications" :key="note.id">
                    <div v-html="format(note.message)"/>

                    <!-- <a-button v-if="getAccess('Notifications.Status').isFullAccess" @click.prevent="$bus.$emit('notification-remove', note.id)" shape="circle" icon="close" size="small" style="margin-left:6px; font-size: 12px;"/> -->
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
    props: ['type'],
    computed: {
        ...mapState('notifications', ['notifications']),
		...mapGetters('app', ['getAccess']),
        channelNotifications() {
            return _.uniqBy(this.notifications.filter(x => ~_.castArray(this.type).indexOf(x.notificationTypeID)), 'objectID')
        }
    },
    methods: {
        format(str) {
            return str.replace(/(#|№).?[0-9]+.?[0-9]+?/gi, e => `<strong style="font-size: 12px;">${e}</strong>`)
        }
    }
}
</script>

<style lang="scss" scoped>
    .root {
        // margin-top: 76px;
        // margin-bottom: calc(-76px - 20px);
        display: flex;
        align-items: center;
        justify-content: center;

        &__content {
            min-height: 32px;
            width: 100%;
            max-width: 92%;
            display: flex;
        }
    }

    .warn {
        align-self: center;
        font-size: 18px;
        margin-right: 16px;
        color: #ff4040;
    }

    .links {
        display: flex;
        // flex-wrap: wrap;
        overflow-x: auto;
    }

    .note {
        background: #eaeaea;
        margin: 4px 0;
        display: flex;
        align-items: center;
        border-radius: 3px;
        text-decoration: none;
        color: #666;
        padding: 0 12px;
        font-size: 12px;
        border: 1px solid #aaa;
        flex-shrink: 0;

        &:hover {
            opacity: .6;
        }

        &:not(:last-child) {
            margin-right: 4px;
        }
    }
</style>