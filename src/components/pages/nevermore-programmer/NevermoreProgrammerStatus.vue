<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Programmer Status</h1>
    <div class="nvr-prg-holder">
      <div class="nvr-prg-row">
        <table class="nvr-prg-table">
          <tr>
            <th class="nvr-prg-table-sec">Team Number</th>
            <th class="nvr-prg-table-sec">Programmed At</th>
          </tr>
          <tr v-for="teamNum in Object.keys(importData)" :key="teamNum" :class="{'nvr-prg-table-row-unprogrammed': getTeamProgrammed(teamNum) == null}">
            <td class="nvr-prg-table-sec">{{ teamNum }}</td>
            <td class="nvr-prg-table-sec">{{ getTeamProgrammed(teamNum) != null ? new Date(getTeamProgrammed(teamNum)).toLocaleString() : "Not Programmed" }}</td>
          </tr>
        </table>
      </div>
      <button
        class="button-large"
        v-on:click="exit()"
      >
        Exit Kiosk
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";
import "./NevermoreProgrammer.scss";
import { TeamEntry } from "./NevermoreProgrammerSetup.vue";
import { revertKiosk } from "@/kioskify";
import { getTeamProgrammed } from "@/programming/store";

@Component({
  components: {
    ArrowLeft,
  },
})
export default class NevermoreProgrammerStatus extends Vue {
  getTeamProgrammed = getTeamProgrammed;

  importData: { [teamNum: string]: TeamEntry };

  constructor() {
    super();
    if (!("importData" in this.$route.query)) {
      throw new Error("Invalid query string");
    }
    this.importData = JSON.parse(this.$route.query["importData"] as any);
  }

  exit() {
    revertKiosk();
    this.$router.go(-2);
  }

  back() {
    this.$router.go(-1);
  }
}
</script>