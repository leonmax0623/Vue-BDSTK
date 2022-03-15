<template>
    <a-modal
        title="Настройка таблицы"
        :visible="true"
        @ok="save"
        @cancel="close"
        okText="Сохранить"
        cancelText="Отмена"
        :width="700"
        class="modal"
        :okButtonProps="okButtonProps"
    >
        <a-checkbox :indeterminate="!allChecked && checkedList.length > 0" @change="onCheckAllChange" :checked="allChecked">Все</a-checkbox>

        <div>
            <a-checkbox-group
                :options="plainOptions"
                v-model="checkedList"
            />
        </div>
    </a-modal>
</template>

<script>
export default {
    props: ['columns', 'activeColumns'],
    data() {
        return {
            checkedList: []
        }
    },
    created() {
        this.checkedList = this.activeColumns.map(x => x.title)
    },
    methods: {
        close() {
            this.$emit('close')
        },
        onCheckAllChange(e) {
            if(this.allChecked) {
                this.checkedList = []
            } else {
                this.checkedList = this.columns.map(x => x.title)
            }
        },
        save() {
            this.close()
            this.$emit('save', this.checkedList)
        }
    },
    computed: {
        plainOptions() {
            return this.columns.map((x, i) => ({
                value: x.title,
                label: x.title
            }))
        },
        allChecked() {
            return this.columns.length === this.checkedList.length
        },
        okButtonProps() {
            return {
                props: {
                    disabled: !this.checkedList.length
                }
            }
        }
    }
}
</script>

<style lang="scss" >
.modal .ant-checkbox-group label {
    display: block;
}
</style>