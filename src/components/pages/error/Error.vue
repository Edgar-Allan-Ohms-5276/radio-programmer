<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Error</h1>

    <div class="error-holder">
      <p>{{ error }}</p>
      <p>{{ suggestion }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";

@Component({
  components: {
    ArrowLeft,
  },
})
export default class Error extends Vue {
  constructor() {
    super();
    const errType = this.$route.query["errType"]
    if (errType === "cap") {
      if (process.platform === "win32") {
        this.suggestion = "Make sure you have npcap installed correctly."
      } else {
        this.suggestion = "Make sure are running the radio programmer as root."
      }
    }
  }

  error = this.$route.query["error"] ?? "Unknown error"
  suggestion = ""


  async back() {
    this.$router.go(-2)
  }
}
</script>