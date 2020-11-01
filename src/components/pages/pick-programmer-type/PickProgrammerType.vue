<template>
  <div>
    <h1 class="pick-programmer-type-title">Pick Programmer Type:</h1>
    <div class="pick-programmer-type-options">
      <button
        class="button-large"
        v-on:click="changePage('/programmer/standard')"
      >
        Standard
      </button>
      <button
        class="button-large"
        v-on:click="changePage('/programmer/offseason/setup')"
      >
        Offseason FMS
      </button>
      <button
        class="button-large"
        v-on:click="changePage('/programmer/nevermore/setup')"
      >
        Nevermore FMS
      </button>
      <button
        class="button-large"
        :class="{'button-disabled': !radioFlasherAllowed}"
        v-on:click="radioFlasherAllowed && changePage('/flasher')"
      >
        Radio Flasher
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import "./PickProgrammerType.scss";

@Component
export default class PickProgrammerType extends Vue {
  changePage(page: string) {
    this.$router.push(page);
  }
  
  get radioFlasherAllowed() {
    return true
  }
}
</script>