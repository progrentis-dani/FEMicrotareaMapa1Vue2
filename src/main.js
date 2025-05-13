import 'core-js/stable' // ← polyfills ES6/ES7 para navegadores antiguos como iOS 9
import 'regenerator-runtime/runtime' // ← soporte para async/await

import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
