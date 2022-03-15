<template>
    <div class="status-wrap mr">
        <a-popover placement="topLeft">
            <template slot="content">
                <div class="status-info">
                    <div v-for="type of types" :key="type" class="status-info-item">
                        <div 
                            class="status-item"
                            :class="{ [`--${type}`]: true }"
                        />
                        <div>
                            {{OrderStatusName[type]}}
                        </div>

                    </div>
                </div>
            </template>
            
            <template slot="title">
                <div style="text-align: right; margin: 4px 0;">Типы уведомлений:</div>
            </template>

            <div class="status" @click="toggleNotificationsDrawer(true)">
                <div 
                    v-for="type of currentTypes"
                    :key="type"
                    class="status-item"
                    :class="{ [`--${type}`]: true }"
                />
            </div>
        </a-popover>
        <!-- <a-button type="primary" icon="bell" @click="toggleNotificationsDrawer(true)"></a-button> -->

        <a-drawer
            title="Уведомления"
            placement="right"
            @close="toggleNotificationsDrawer(false)"
            :visible="notificationsDrawerEnabled"
            :width="400"
        >

            <a-empty v-if="!notifications.length" description="Нет новых уведомлений"/>

            <template v-else>
                <template v-for="(item, i) of notifications">
                    <a-alert
                        
                        :key="i"
                        :message="item.message"
                        :description="formatDate(item.createdDate)"
                        type="info"
                        showIcon
                        style="margin-bottom: 8px;"
                        closable
                        @close="onClose(item, i)"
                        class="type"
                        :class="{ [`--${typeByName(item.notificationTypeID)}`]: true }"
                    />
                </template>
                
            </template>

        </a-drawer>
    </div>
</template>

<script>
import dayjs from 'dayjs'
import { mapState, mapMutations } from 'vuex'
import { OrderStatus, OrderStatusName } from '@/common'

export default {
    data() {
        return {
            notificationsDrawerEnabled: false,
            OrderStatusName
        }
    },
    methods: {
        ...mapMutations('notifications', ['addNotification']),
        toggleNotificationsDrawer(visible) {
            this.notificationsDrawerEnabled = visible
        },
        formatDate(date) {
            return dayjs(date).format('DD.MM.YYYY HH:mm:ss')
        },
        onClose(item, i) {
            this.$bus.$emit('notification-remove', item.id)
        },
        typeByName(id) {
            return this.types.find(type => {
                return OrderStatus[type] === id
            })
        }
    },
    computed: {
        ...mapState('notifications', ['notifications']),
        currentTypes() {
            return this.types.filter(type => {
                return this.notifications.some(x => x.notificationTypeID === OrderStatus[type])
            })
        },
        types() {
            return Object.keys(OrderStatus)
        }
    }
}
</script>

<style lang="scss" scoped>

    @mixin status-colors ($field) {
        &.--Canceled {
            #{$field}-color: #fff;
        }

        &.--Preparation {
            #{$field}-color: purple;
        }

        &.--Created {
            #{$field}-color: #ff0000;
        }
        
        &.--OnSign {
            #{$field}-color: #ffc000;
        }
        
        &.--Signed {
            #{$field}-color: #ffff00;
        }
        
        &.--SimOnActivation {
            #{$field}-color: #92d050;
        }
        
        &.--SimActivated {
            #{$field}-color: #00b0f0;
        }
        
        &.--HardwarePreparation {
            #{$field}-color: #002060;
        }
        
        &.--ReadyToDelivery {
            #{$field}-color: #7030a0;
        }
        
        &.--Delivery {
            #{$field}-color: #99ff66;
        }
        
        &.--ChannelEnabled {
            #{$field}-color: #c00000;
        }

        &.--ChannelOnService {
            #{$field}-color: #FF6978;
        }
        
        &.--ChannelOffService {
            #{$field}-color: #388697;
        }
        
        &.--ChannelOnDisabling {
            #{$field}-color: #242423;
        }
        
        &.--ChannelDisabled {
            #{$field}-color: #DBE4EE;
        }
        
        &.--ChannelOnTransfer {
            #{$field}-color: #F17300;
        }
        
        &.--ChannelTransfered {
            #{$field}-color: #054A91;
        }

        &.--SimDelivered {
            #{$field}-color: #EBBAB9;
        }

        &.--EquipDelivered {
            #{$field}-color: #C9C5BA;
        }
    }

    .status {
        margin-right: 6px;
        display: flex;
        border-radius: 2px;
        overflow: hidden;
        cursor: pointer;

        &-info {
            width: 500px;
        }

        &-info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 8px;
            background: rgba(#000, .05);
            border-radius: 4px;

            &:hover {
                background: rgba(#000, .1);
            }

            
            &:not(:last-child) {
                margin-bottom: 4px;
            }
        }

        &-wrap {
            display: flex;
            align-items: center;
        }

        &-item {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid rgba(#fff, .4);

            &:not(:last-child) {
                margin-right: 4px;
            }

            @include status-colors(background);
        }
    }

    .type {
        $field: border;
        #{$field}: 2px solid;

        @include status-colors($field);
        
    }
</style>