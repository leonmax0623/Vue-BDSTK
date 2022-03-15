<template>
    <div class="list-item">
        <div class="list-item__title">{{title}}</div>

        <div class="list-item__content">
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
    .list-item {
        display: flex;
        margin-bottom: 12px;

        &__title {
            min-width: 160px;
            color: rgba(#000, .6);
        }

        &__content {

        }
    }
</style>