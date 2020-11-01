<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Nevermore FMS Kiosk Setup</h1>
    <div class="nvr-prg-holder">
      <span class="warning">
        It is highly recommended to set static IPs of 192.168.1.2/24 and
        10.0.0.50/8 for the kiosk
      </span>
      <div class="nvr-prg-row">
        <Select
          label="WPA Key Import Method"
          :default="WpaKeyImportType.CSV"
          v-model="importTypeInput"
        >
          <option :value="WpaKeyImportType.CSV">
            .csv (Standard FMS export)
          </option>
          <option :value="WpaKeyImportType.NVMRE">
            .nvmre (Nevermore FMS export)
          </option>
          <option :value="WpaKeyImportType.NETWORK">Network</option>
        </Select>
      </div>

      <div
        class="nvr-prg-row nvr-bottom-space"
        v-if="importTypeInput === WpaKeyImportType.CSV"
      >
        <button v-on:click="selectCsvFile()">Select .csv file</button>
        <span v-if="importFile != null" class="nvr-selected-file"
          >Selected: {{ importFile }}</span
        >
      </div>

      <div
        class="nvr-prg-row nvr-bottom-space"
        v-if="importTypeInput === WpaKeyImportType.NVMRE"
      >
        <button v-on:click="selectNvmreFile()">Select .nvmre file</button>
        <span v-if="importFile != null" class="nvr-selected-file"
          >Selected: {{ importFile }}</span
        >
      </div>

      <div
        class="nvr-prg-row nvr-bottom-space"
        v-if="importTypeInput === WpaKeyImportType.NETWORK"
      >
        <span class="error">Network import not implemented yet</span>
      </div>

      <div class="nvr-prg-row">
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
      <div class="nvr-prg-row">
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
      <div class="nvr-prg-row">
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
import { Mode } from "../../programming/radio";
import querystring from "querystring";
import electron from "electron";
import fs from "fs";
import csv from "csv-parser";
import "./NevermoreProgrammer.scss";
import { getInterfaces, NetworkInterface } from "@/raw-networking/interface";

export enum WpaKeyImportType {
  CSV = "csv",
  NVMRE = "nvmre",
  NETWORK = "network",
}

export interface TeamEntry {
  team: number;
  ssid: string;
  wpaKey: string;
}

@Component({
  components: {
    ArrowLeft,
    Input,
    Select,
    Checkbox,
  },
})
export default class NevermoreProgrammerSetup extends Vue {
  Mode = Mode;
  WpaKeyImportType = WpaKeyImportType;

  mounted() {
    this.findNetworkAdapters();
  }

  importTypeInput: WpaKeyImportType = WpaKeyImportType.CSV;
  importFile: string | null = null;
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
    if (this.importTypeInput === WpaKeyImportType.NETWORK) {
      this.errors.push("Network import type not implemented yet");
    }
    if (
      (this.importTypeInput === WpaKeyImportType.CSV ||
        this.importTypeInput === WpaKeyImportType.NVMRE) &&
      this.importFile == null
    ) {
      this.errors.push("Select WPA Key import file");
    }
    if (this.netInterfaceInput.length < 1) {
      this.errors.push("Select a network interface");
    }
    if (this.errors.length > 0) {
      return;
    }

    const importData: { [teamNum: string]: TeamEntry } = {};

    if (this.importTypeInput === WpaKeyImportType.CSV) {
      const teams = await new Promise<TeamEntry[]>((resolve) => {
        const results: { team: string; wpaKey: string }[] = [];
        fs.createReadStream(this.importFile!!)
          .pipe(csv(["team", "wpaKey"]))
          .on("data", (data) => results.push(data))
          .on("end", () => {
            resolve(
              results.map((r) => {
                return {
                  team: parseInt(r.team),
                  ssid: r.team,
                  wpaKey: r.wpaKey,
                };
              })
            );
          });
      });
      teams.forEach((t) => {
        importData[t.team] = t;
      });
    }

    if (this.importTypeInput === WpaKeyImportType.NVMRE) {
      const teams = await new Promise<TeamEntry[]>((resolve) => {
        const results: { team: string; ssid: string; wpaKey: string }[] = [];
        fs.createReadStream(this.importFile!!)
          .pipe(csv(["team", "ssid", "wpaKey"]))
          .on("data", (data) => results.push(data))
          .on("end", () => {
            resolve(
              results.map((r) => {
                return {
                  team: parseInt(r.team),
                  ssid: r.ssid,
                  wpaKey: r.wpaKey,
                };
              })
            );
          });
      });
      teams.forEach((t) => {
        importData[t.team] = t;
      });
    }

    const importDataString =
      this.importTypeInput === WpaKeyImportType.NETWORK
        ? "network"
        : JSON.stringify(importData);

    electron.remote.getCurrentWindow().setAlwaysOnTop(true);
    electron.remote.getCurrentWindow().setKiosk(true);
    this.$router.push(
      "/programmer/nevermore/kiosk?" +
        querystring.stringify({
          importData: importDataString,
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

  selectCsvFile() {
    const files = electron.remote.dialog.showOpenDialogSync({
      title: "Select .csv",
      filters: [
        {
          name: ".csv",
          extensions: ["csv"],
        },
      ],
    });

    if (files != null && files.length === 1) {
      this.importFile = files[0];
    } else {
      this.importFile = null;
    }
  }

  selectNvmreFile() {
    const files = electron.remote.dialog.showOpenDialogSync({
      title: "Select .nvmre",
      filters: [
        {
          name: ".nvmre",
          extensions: ["nvmre"],
        },
      ],
    });

    if (files != null && files.length === 1) {
      this.importFile = files[0];
    } else {
      this.importFile = null;
    }
  }

  back() {
    this.$router.go(-1);
  }
}
</script>