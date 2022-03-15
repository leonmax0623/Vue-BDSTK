<template>
    <div v-if="rendered">
        <slot/>
    </div>
</template>

<script>
export default {
    data() {
        return {
            rendered: true
        }
    },
    mounted() {
        this.$on('child:reload', () => {
            this.rendered = false
            this.$nextTick(() => {
                this.rendered = true
            })
        })
    }

}
</script>