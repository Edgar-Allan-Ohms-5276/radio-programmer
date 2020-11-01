<template>
  <div>
    <Topbar />
    <div id="app">
      <EntryPoint />
      <p>
        Created by the
        <component
          :is="linkType"
          href="https://edgarallanohms.com"
          target="_blank"
          ><img
            style="vertical-align: middle; display: inline"
            class="eao-menu-img"
            src="/assets/eao_bird_circle.png"
            height="20px"
          />
          Edgar Allan Ohms</component
        >
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import Topbar from "./components/topbar/Topbar.vue";
import EntryPoint from "./components/EntryPoint.vue";
import "./App.scss";
import { Route } from "vue-router";

@Component({
  components: {
    Topbar,
    EntryPoint,
  },
})
export default class App extends Vue {
  linkType =
    "kiosk" in this.$route.query && this.$route.query["kiosk"] === "true"
      ? "span"
      : "a";

  @Watch("$route")
  onPropertyChanged(route: Route) {
    this.linkType =
      "kiosk" in route.query && route.query["kiosk"] === "true" ? "span" : "a";
  }
}
</script>
