import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Api from './api'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import moment from 'moment'
import 'moment/locale/ru'
import VueRouterReferer from '@tozd/vue-router-referer'
import { FormModel } from 'ant-design-vue'
import 'viewerjs/dist/viewer.css'
import Viewer from 'v-viewer'
import meta from 'vue-meta'
Vue.use(meta)

moment.locale('ru')
Vue.use(FormModel)

Vue.use(Api)
Vue.use(VueRouterReferer)

Vue.use(Antd)
Vue.use(Viewer)

import '@/plugins'

Vue.config.productionTip = false

require('./utils/register-components')

Vue.prototype.$isDev = process.env.NODE_ENV === 'development'

;(async () => {
  Vue.prototype.$config = await Api.common.getAppSettings()
  console.log(Vue.prototype.$config);
  
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
})()

