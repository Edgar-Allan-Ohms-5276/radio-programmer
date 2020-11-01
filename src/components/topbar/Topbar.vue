<template>
  <div :class="{ 'topbar': true, 'topbar-dragable': !kioskMode }">
    <div class="topbar-logo" role="menu">
      <img
        class="eao-menu-img"
        src="/assets/eao_bird_circle.png"
        height="25px"
      />
    </div>
    <div class="right" v-if="!kioskMode">
      <button class="topbar-button" v-on:click="minimize">
        <WindowMinimizeIcon fillColor="#FFF" />
      </button>
      <button class="topbar-button" v-on:click="maxUnmax">
        <CropSquareIcon fillColor="#FFF" />
      </button>
      <button class="topbar-button close-btn" v-on:click="close">
        <CloseIcon fillColor="#FFF" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import menuActions from "./menu-functions";
import WindowMinimizeIcon from "vue-material-design-icons/WindowMinimize.vue";
import CropSquareIcon from "vue-material-design-icons/CropSquare.vue";
import CloseIcon from "vue-material-design-icons/Close.vue";
import "./Topbar.scss";
import { Route } from 'vue-router';

@Component({
  components: {
    WindowMinimizeIcon,
    CropSquareIcon,
    CloseIcon,
  },
})
export default class Topbar extends Vue {
  minimize() {
    menuActions.minimizeWindow();
  }

  maxUnmax() {
    menuActions.maxUnmaxWindow();
  }

  close() {
    menuActions.closeWindow();
  }

  kioskMode = "kiosk" in this.$route.query && this.$route.query["kiosk"] === "true"

  @Watch('$route')
  onPropertyChanged(route: Route) {
    this.kioskMode = "kiosk" in route.query && route.query["kiosk"] === "true"
  }
  
}

</script>
