<template>
    <div class="list">
        <slot/>
    </div>
</template>

<style lang="scss" scoped>
.list {
    display: flex;
    flex-direction: column;
    margin-bottom: 24px;
}
</style>