import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import PickProgrammerType from "./components/pages/pick-programmer-type/PickProgrammerType.vue"
import Error from "./components/pages/error/Error.vue"
import FlashRadio from "./components/pages/flash-radio/FlashRadio.vue"
import Prgm from "./components/pages/prgm/Prgm.vue"
import StandardProgrammer from "./components/pages/standard-programmer/StandardProgrammer.vue"
import OffseasonProgrammerSetup from "./components/pages/offseason-programmer/OffseasonProgrammerSetup.vue"
import OffseasonProgrammerKiosk from "./components/pages/offseason-programmer/OffseasonProgrammerKiosk.vue"
import NevermoreProgrammerSetup from "./components/pages/nevermore-programmer/NevermoreProgrammerSetup.vue"
import NevermoreProgrammerKiosk from "./components/pages/nevermore-programmer/NevermoreProgrammerKiosk.vue"
import electron from 'electron'
import LongPress from 'vue-directive-long-press'
 
Vue.directive('long-press', LongPress)


Vue.config.productionTip = false

const routes = [
  { path: "/", component: PickProgrammerType },
  { path: "/error", component: Error },
  { path: "/prgm", component: Prgm },
  { path: "/flasher", component: FlashRadio },
  { path: "/programmer/standard", component: StandardProgrammer },
  { path: "/programmer/offseason/setup", component: OffseasonProgrammerSetup },
  { path: "/programmer/offseason/kiosk", component: OffseasonProgrammerKiosk },
  { path: "/programmer/nevermore/setup", component: NevermoreProgrammerSetup },
  { path: "/programmer/nevermore/kiosk", component: NevermoreProgrammerKiosk }
];

const router = new VueRouter({
  routes,
});

// Block going from kiosk to setup
router.beforeEach((to, from, next) => {
  if (from.fullPath.includes("/kiosk") && to.fullPath.includes("/setup")) {
    next(false)
    return
  }
  next()
})

Vue.use(VueRouter)

new Vue({
  render: h => h(App),
  router
}).$mount('#app')

document.addEventListener('click', function (event: any) {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault()
    electron.shell.openExternal(event.target.href)
  }
})
