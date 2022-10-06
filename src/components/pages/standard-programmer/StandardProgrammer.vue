<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Standard Programmer</h1>
    <div class="std-prg-holder">
      <div class="std-prg-row">
        <Input
          label="Team Number"
          v-model="teamNumInput"
          @keypress="onlyNumber($event)"
        />
        <Input label="WPA Key (optional)" v-model="wpaKeyInput" />
      </div>
      <div class="std-prg-row">
        <Input label="Robot Name (optional)" v-model="robotNameInput" />
        <Select label="Wifi Band" :default="Mode.AP5" v-model="wifiBand">
          <option :value="Mode.AP5">5GHz Access Point</option>
          <option :value="Mode.AP24">2.4GHz Access Point</option>
        </Select>
      </div>
      <div class="std-prg-row">
        <Checkbox label="Enable Firewall" v-model="firewallInput" />
        <Checkbox label="Enable Bandwidth Limit" v-model="bandwidthInput" />
      </div>
      <div v-for="error in errors" :key="error" class="error">
        {{ error }}
      </div>
      <button class="button-large" v-on:click="startProgramRadio()">
        Program Radio
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
import { Mode, ssidRegex, wpakeyRegex } from "../../../programming/radio";
import querystring from "querystring"
import "./StandardProgrammer.scss";

@Component({
  components: {
    ArrowLeft,
    Input,
    Select,
    Checkbox,
  },
})
export default class StandardProgrammer extends Vue {
  Mode = Mode;

  teamNumInput = "";
  wpaKeyInput = "";
  robotNameInput = "";
  wifiBand: Mode = Mode.AP5;
  firewallInput = false;
  bandwidthInput = false;

  errors: string[] = [];

  async startProgramRadio() {
    this.errors = [];
    if (!(/\d{1,4}/.test(this.teamNumInput))) {
      this.errors.push("Invalid team number")
    }
    if (this.robotNameInput !== "" && !ssidRegex.test(this.robotNameInput)) {
      this.errors.push("Invalid robot name")
    }
    const ssid = `${this.teamNumInput}${this.robotNameInput && "-"}${this.robotNameInput}`
    if (this.wpaKeyInput !== "" && !wpakeyRegex.test(this.wpaKeyInput)) {
      this.errors.push("Invalid WPA Key")
    }
    if (this.errors.length > 0) {
      return
    }
    this.$router.push("/prgm?" + querystring.stringify({
      mode: this.wifiBand,
      teamNum: this.teamNumInput,
      ssid: ssid,
      wpaKey: this.wpaKeyInput,
      enableFirewall: this.firewallInput,
      enableBandwidthLimit: this.bandwidthInput,
      enddate: 0,
      useEnterprise: false,
      username: "",
      performCheck: false
    }))
  }

  onlyNumber(event: any) {
    const keyCode = event.keyCode ? event.keyCode : event.which;
    if (((keyCode < 48 || keyCode > 57) && keyCode !== 46) || event.target.value.length >= 4) {
      event.preventDefault();
    }
  }

  back() {
    this.$router.go(-1);
  }
}
</script>