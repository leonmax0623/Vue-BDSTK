<template>
  <!-- <div id="app"> -->
    <router-view/>
  <!-- </div> -->
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  data: () => ({
    //
  }),

  created() {
    this.$bus.$on('401', x => {
      this.removeToken()
      this.$router.push({ name: 'Auth' })
    })
  },
  methods: {
    ...mapMutations('auth', ['removeToken'])
  }
};
</script>

<style lang="scss">
.ant-calendar-date-panel .ant-calendar-header > div > a {
  &.ant-calendar-prev-month-btn {
    margin-left: 16px;
  }
  &.ant-calendar-next-month-btn {
    margin-right: 16px;
  }
}
.--red {
  color: #d86363;
}

.--green {
  color: #73ab4a;
}

.--blue {
  color: #2263de;
}

.center {
  text-align: center;
}
.ant-table-bordered .ant-table-thead > tr > th {
  text-align: center;
}

  .simpleform {
    .ant-form-item {
      margin-bottom: 0;
    }
    .ant-form-explain {
      position: absolute;
      top: calc(100% - 2px);
      font-size: 12px;
    }
  }

  .ant-select-disabled .ant-select-selection-selected-value,
  .ant-input.ant-input-disabled,
  .ant-input-number-input:disabled {
    color: #666 !important;
  }

  // .warp .ant-table td {
  //   white-space: nowrap;
  //   overflow: hidden;
  // }

  html, body {
    // overflow: hidden;
  }

  .--no-content-gap .ant-collapse-content-box {
    padding: 0 !important;
  }

  .ant-table-content {
    background: #fff;
  }

  .ant-form.--label-left .ant-form-item-label {
    text-align: left;
  }

  .mr {
    margin-right: 8px !important;
  }

  .mb {
    margin-bottom: 12px;
  }

  .actions {
        display: flex;
        align-items: center;

        > *:not(:last-child) {
            margin-right: 12px;
        }
  }

  .ant-tabs.--nogap > .ant-tabs-bar {
    margin-bottom: 0;
  }

  .no-events {
    pointer-events: none;
  }

  .pointer {
    cursor: pointer !important;
  }

  .collapse-noborder {
      background: #fff;
      .ant-collapse-content {
        border-top: none;
      }
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }
  .items-end {
    align-items: flex-end;
  }

  .filler {
    flex-grow: 1;
  }

  .relative {
    position: relative;
  }

  .ant-card.nopadding .ant-card-body {
    padding: 0;
  }
</style>

