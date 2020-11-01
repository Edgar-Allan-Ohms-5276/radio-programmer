<template>
  <div>
    <h1>Nevermore FMS Programmer</h1>
    <div class="nvr-prg-holder">
      <div class="nvr-prg-row">
        <Input
          label="Team Number"
          v-model="teamNumInput"
          @keypress="onlyNumber($event)"
        />
      </div>
      <div v-for="error in errors" :key="error" class="error">
        {{ error }}
      </div>
      <button class="button-large" v-on:click="startProgramRadio()">
        Program Radio
      </button>
      <h1 class="nvr-prg-seperator" v-if="radioFlasherAllowed">OR</h1>
      <button
        class="button-large"
        v-if="radioFlasherAllowed"
        v-on:click="startFlashRadio()"
      >
        Flash Radio
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";
import Input from "../../form/Input.vue";
import Select from "../../form/Select.vue";
import Checkbox from "../../form/Checkbox.vue";
import { Mode } from "../../../programming/radio";
import querystring from "querystring";
import "./NevermoreProgrammer.scss";
import { TeamEntry } from "./NevermoreProgrammerSetup.vue";
import { getFirmwarePath } from "@/firmware/firmware-provider";

@Component({
  components: {
    ArrowLeft,
    Input,
    Select,
    Checkbox,
  },
})
export default class NevermoreProgrammerKiosk extends Vue {
  Mode = Mode;

  radioFlasherAllowed = getFirmwarePath() != null;

  teamNumInput = "";

  importData: { [teamNum: string]: TeamEntry } | "network";
  wifiBand: Mode;
  firewall: boolean;
  bandwidth: boolean;
  prgmCheck: boolean;
  enddate: number;
  netInterface: string;

  errors: string[] = [];

  constructor() {
    super();
    if (
      !("wifiBand" in this.$route.query) ||
      !Object.values(Mode).includes(this.$route.query["wifiBand"] as any) ||
      !("firewall" in this.$route.query) ||
      !("bandwidth" in this.$route.query) ||
      !("enddate" in this.$route.query) ||
      !("prgmCheck" in this.$route.query) ||
      !("netInterface" in this.$route.query) ||
      !("importData" in this.$route.query)
    ) {
      throw new Error("Invalid query string");
    }

    this.wifiBand = this.$route.query["wifiBand"] as Mode;
    this.importData = this.$route.query["importData"] as any;
    if (this.importData !== "network") {
      this.importData = JSON.parse(this.importData as any);
    }
    this.firewall = this.$route.query["firewall"] === "true";
    this.bandwidth = this.$route.query["bandwidth"] === "true";
    this.enddate = parseInt(this.$route.query["enddate"].toString());
    this.prgmCheck = this.$route.query["prgmCheck"] === "true";
    this.netInterface = this.$route.query["netInterface"].toString();
  }

  startProgramRadio() {
    this.errors = [];
    if (!/\d{1,4}/.test(this.teamNumInput)) {
      this.errors.push("Invalid team number");
    }
    let teamEntry: TeamEntry | null = null;
    if (this.importData === "network") {
      this.errors.push("Network import not implemented yet");
    } else {
      console.log(Object.keys(this.importData));
      if (Object.keys(this.importData).includes(this.teamNumInput)) {
        teamEntry = this.importData[this.teamNumInput];
      }
    }
    if (teamEntry == null) {
      this.errors.push("Unable to load team entry");
    }
    if (this.errors.length > 0) {
      return;
    }
    this.$router.push(
      "/prgm?" +
        querystring.stringify({
          mode: this.wifiBand,
          teamNum: this.teamNumInput,
          ssid: teamEntry!!.ssid,
          wpaKey: teamEntry!!.wpaKey,
          enableFirewall: this.firewall,
          enableBandwidthLimit: this.bandwidth,
          enddate: this.enddate,
          performCheck: this.prgmCheck,
          kiosk: true,
        })
    );
  }

  startFlashRadio() {
    this.$router.push(
      "/flasher?" +
        querystring.stringify({
          kiosk: true,
          presetInterface: this.netInterface,
        })
    );
  }

  onlyNumber(event: any) {
    const keyCode = event.keyCode ? event.keyCode : event.which;
    if (
      ((keyCode < 48 || keyCode > 57) && keyCode !== 46) ||
      event.target.value.length >= 4
    ) {
      event.preventDefault();
    }
  }

  back() {
    this.$router.go(-1);
  }
}
</script>