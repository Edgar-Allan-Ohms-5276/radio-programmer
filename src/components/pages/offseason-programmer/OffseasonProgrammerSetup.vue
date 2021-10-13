<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Offseason FMS Kiosk Setup</h1>
    <div class="ofs-prg-holder">
      <span class="warning" v-if="cantSetStaticIp != null">
        Unable to set static ips because {{ cantSetStaticIp }}. Please manually
        set ips 192.168.1.2/24 and 10.0.0.50/8 for the kiosk
      </span>
      <span class="success" v-if="cantSetStaticIp == null">
        Static ips will be automatically set
      </span>
      <div class="ofs-prg-row">
        <Input label="SSID" v-model="ssidInput" />
        <Input label="WPA Key" v-model="wpaKeyInput" />
      </div>
      <div class="ofs-prg-row">
        <Select
          label="Wifi Band"
          :default="Mode.BRIDGE5"
          v-model="wifiBandInput"
        >
          <option :value="Mode.BRIDGE5">5GHz Bridge</option>
          <option :value="Mode.BRIDGE24">2.4GHz Bridge</option>
        </Select>
        <Select label="Event Duration" default="0" v-model="eventDurationInput">
          <option :value="0">None</option>
          <option :value="1">1 day</option>
          <option :value="2">2 days</option>
          <option :value="3">3 days</option>
        </Select>
      </div>
      <div class="ofs-prg-row">
        <Select
          label="Network Interface"
          default=""
          v-model="netInterfaceInput"
        >
          <option value="" disabled>Select an interface</option>
          <option
            v-for="netad in networkAdapters"
            :key="netad.id"
            :value="netad.id"
          >
            {{ netad.name }}
          </option>
        </Select>
      </div>
      <div class="ofs-prg-row">
        <Checkbox
          label="Enable Firewall"
          :default="true"
          v-model="firewallInput"
        />
        <Checkbox
          label="Enable Bandwidth Limit"
          :default="true"
          v-model="bandwidthInput"
        />
        <Checkbox
          label="Enable Program Double-Check (requires static ips)"
          :default="true"
          v-model="prgmCheckInput"
        />
      </div>
      <div v-for="error in errors" :key="error" class="error">
        {{ error }}
      </div>
      <button class="button-large" v-on:click="startKiosk()">
        Start Kiosk
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
import querystring from "querystring";
import { becomeKiosk } from "../../../kioskify";
import { canSetStaticIp, setStaticIp } from "../../../staticip";
import "./OffseasonProgrammer.scss";
import { getInterfaces, NetworkInterface } from "@/raw-networking/interface";

@Component({
  components: {
    ArrowLeft,
    Input,
    Select,
    Checkbox,
  },
})
export default class OffseasonProgrammerSetup extends Vue {
  Mode = Mode;
  cantSetStaticIp = canSetStaticIp();

  mounted() {
    this.findNetworkAdapters();
  }

  ssidInput = "";
  wpaKeyInput = "";
  wifiBandInput: Mode = Mode.BRIDGE5;
  firewallInput = true;
  bandwidthInput = true;
  prgmCheckInput = true;
  eventDurationInput = 0;
  netInterfaceInput = "";

  networkAdapters: NetworkInterface[] = [];

  errors: string[] = [];

  async startKiosk() {
    this.errors = [];
    if (!ssidRegex.test(this.ssidInput)) {
      this.errors.push("Invalid SSID");
    }
    if (!wpakeyRegex.test(this.wpaKeyInput)) {
      this.errors.push("Invalid WPA Key");
    }
    if (this.netInterfaceInput.length < 1) {
      this.errors.push("Select a network interface");
    }
    if (this.errors.length > 0) {
      return;
    }

    becomeKiosk(this.networkAdapters.filter((i) => i.id === this.netInterfaceInput)[0]);

    this.$router.push(
      "/programmer/offseason/kiosk?" +
        querystring.stringify({
          ssid: this.ssidInput,
          wpaKey: this.wpaKeyInput,
          wifiBand: this.wifiBandInput,
          firewall: this.firewallInput,
          bandwidth: this.bandwidthInput,
          prgmCheck: this.prgmCheckInput,
          enddate:
            this.eventDurationInput &&
            Date.now() + this.eventDurationInput * 24 * 60 * 60 * 1000,
          netInterface: this.netInterfaceInput,
          kiosk: true,
        })
    );
  }

  async findNetworkAdapters() {
    this.networkAdapters = getInterfaces();
  }

  back() {
    this.$router.go(-1);
  }
}
</script>