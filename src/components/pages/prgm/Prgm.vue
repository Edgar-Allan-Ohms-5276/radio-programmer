<template>
  <div>
    <button class="button back-button" v-on:click="back()" v-if="state !== State.REQUIRE_APPROVAL">
      <ArrowLeft /> Go Back
    </button>
    <div class="prgm-holder" v-if="state === State.PROGRAMMING">
      <h2>Programming Radio</h2>
      <p>
        Make sure the radio is plugged into the left port (labelled 18-24V POE)
      </p>
      <div
        v-for="(status, index) in statuses"
        :key="index"
        class="prgm-statuses"
      >
        {{ status.lineText }}
        <span
          v-if="!status.done"
          style="display: inline-block"
          class="loader"
        /><span
          v-else
          style="display: inline-block; color: green; margin-left: 15px"
          >✓</span
        >
      </div>
      <button class="button" v-on:click="back()">Cancel</button>
    </div>

    <div class="prgm-holder" v-if="state === State.REQUIRE_APPROVAL">
      <h2>Continue Programming Radio?</h2>
      <p>
        This radio is currently programmed for a competition that is still
        running. Are you sure you want to reprogram the radio and wipe
        competition data?
      </p>
      <div class="prgm-row">
        <button
          class="button-large"
          style="background-color: gray"
          v-on:click="continueProgramming(true)"
        >
          Yes
        </button>
        <button class="button-large" v-on:click="continueProgramming(false)">
          No
        </button>
      </div>
    </div>

    <div class="prgm-holder" v-if="state === State.DONE">
      <h2>Radio Programmed</h2>
      <p>Radio programmed successfully</p>
      <div
        v-for="(status, index) in statuses"
        :key="index"
        class="prgm-statuses"
      >
        {{ status.lineText }}
        <span
          v-if="!status.done"
          style="display: inline-block"
          class="loader"
        /><span
          v-else
          style="display: inline-block; color: green; margin-left: 15px"
          >✓</span
        >
      </div>
      <button class="button" v-on:click="back()">Done</button>
    </div>

    <div class="prgm-holder" v-if="state === State.ERROR">
      <h2>Error Programming Radio</h2>
      <p>{{ errMsg }}</p>
      <button class="button" v-on:click="startProgramming()">Try Again</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";
import { Mode, programRadio } from "../../../programming/radio";
import ping from "tcp-ping";
import "./Prgm.scss";

enum State {
  PROGRAMMING,
  REQUIRE_APPROVAL,
  DONE,
  ERROR,
}

@Component({
  components: {
    ArrowLeft,
  },
})
export default class Prgm extends Vue {
  Mode = Mode;
  State = State;

  state = State.PROGRAMMING;
  errMsg = "";

  continueProgramming: (cont: boolean) => void = () =>
    new Error("No continue set");

  constructor() {
    super();
    if (
      !("mode" in this.$route.query) ||
      !Object.values(Mode).includes(this.$route.query["mode"] as any) ||
      !("teamNum" in this.$route.query) ||
      !("ssid" in this.$route.query) ||
      !("wpaKey" in this.$route.query) ||
      !("enableFirewall" in this.$route.query) ||
      !("enableBandwidthLimit" in this.$route.query) ||
      !("enddate" in this.$route.query) ||
      !("performCheck" in this.$route.query)
    ) {
      throw new Error("Invalid query string");
    }

    this.mode = this.$route.query["mode"] as Mode;
    this.teamNum = parseInt(this.$route.query["teamNum"].toString());
    this.ssid = this.$route.query["ssid"].toString();
    this.wpaKey = this.$route.query["wpaKey"].toString();
    this.enableFirewall = this.$route.query["enableFirewall"] === "true";
    this.enableBandwidthLimit =
      this.$route.query["enableBandwidthLimit"] === "true";
    this.enddate = parseInt(this.$route.query["enddate"].toString());
    this.performCheck = this.$route.query["performCheck"] === "true";
  }

  async mounted() {
    this.resetStatuses();
    this.startProgramming();
  }

  async startProgramming() {
    try { this.continueProgramming(false) } catch {}
    this.pingActive = true;
    this.state = State.PROGRAMMING;
    this.resetStatuses();
    try {
      await this.ping("192.168.1.1", 15);
      await programRadio(
        this.mode,
        this.teamNum,
        this.ssid,
        this.wpaKey,
        this.enableFirewall,
        this.enableBandwidthLimit,
        this.enddate,
        () => {
          return new Promise((resolve) => {
            this.state = State.REQUIRE_APPROVAL;
            this.continueProgramming = (cont) => {
              this.state = State.PROGRAMMING;
              resolve(cont);
            };
          });
        }
      );

      Vue.set(this.statuses, 1, {
        lineText: "Programming data sent",
        done: true,
      });

      if (this.performCheck) {
        await this.ping(
          `10.${Math.floor(this.teamNum / 100)}.${this.teamNum % 100}.1`,
          60
        );
        Vue.set(this.statuses, 2, {
          lineText: "Verified IP settings",
          done: true,
        });
      }
      this.state = State.DONE;
    } catch (e) {
      const r = e.message;
      if (r === "timeout") {
        this.error(
          "Timed out when locating radio. Make sure it has fully booted up and is plugged into the correct port."
        );
      }
      if (r === "socket_error") {
        this.error("Unknown socket error");
      }
      if (r === "invalid_teamNum") {
        this.error("Invalid team number");
      }
      if (r === "invalid_ssid") {
        this.error("Invalid ssid");
      }
      if (r === "invalid_wpakey") {
        this.error("Invalid wpa key");
      }
      if (r === "old_firmware") {
        this.error("Firmware too old. Try flashing the radio first.");
      }
      if (r === "cancel") {
        this.back();
      }
    }
  }

  ping(host: string, maxSeconds: number): Promise<boolean> {
    const maxEndTimestamp = Date.now() + (maxSeconds*1000)
    return new Promise((resolve, reject) => {
      const attemptPing = (retry: Function) => {
        ping.probe(host, 8888, (err: Error, available: boolean) => {
          if (available) {
            Vue.set(this.statuses, 0, {
              lineText: "Located radio",
              done: true,
            });
            resolve(true);
          } else {
            if (maxEndTimestamp > Date.now()) {
              if (this.pingActive) {
                setTimeout(() => retry(retry), 1000);
              }
            } else {
              reject(new Error("timeout"));
            }
          }
        });
      };
      setTimeout(() => attemptPing(attemptPing), 1000);
    });
  }

  mode: Mode;
  teamNum: number;
  ssid: string;
  wpaKey: string;
  enableFirewall: boolean;
  enableBandwidthLimit: boolean;
  enddate: number;
  performCheck: boolean;

  pingActive = true;

  statuses: {
    lineText: string;
    done: boolean;
  }[] = [];

  resetStatuses() {
    this.statuses = [
      {
        lineText: "Locating radio",
        done: false,
      },
      {
        lineText: "Send programming data",
        done: false,
      },
    ];

    if (this.performCheck) {
      this.statuses.push({
        lineText: "Verify IP settings",
        done: false,
      });
    }
  }

  back() {
    this.pingActive = false;
    this.$router.go(-1);
  }

  error(msg: string) {
    this.state = State.ERROR;
    this.errMsg = msg;
  }
}
</script>