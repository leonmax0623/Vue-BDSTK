<template>
    <a-layout-content :style="{ padding: '0 50px', marginTop: '82px' }">
      <slot name="sub-header"/>
      
      <div class="page" :class="{'--wrap': wrap}">
        <slot/>
      </div>
    </a-layout-content>
</template>

<script>
export default {
  props: {
    wrap: {
      type: Boolean
    }
  }
}
</script>

<style lang="scss" scoped>
  .page {
    // min-height: 380px;

    &.--wrap {
      background: #fff;
      padding: 24px;
    }
  }
</style>
