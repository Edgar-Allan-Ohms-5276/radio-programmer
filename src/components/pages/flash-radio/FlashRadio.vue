<template>
  <div>
    <button class="button back-button" v-on:click="back()">
      <ArrowLeft /> Go Back
    </button>
    <h1>Flash Radio</h1>

    <div class="flash-holder" v-if="state === State.SELECT_ADAPTER">
      <h2>Select your network adapter</h2>
      <div class="netad-list-container">
        <ul>
          <button
            class="netad-entry"
            v-for="netad in networkAdapters"
            :key="netad.id"
            v-on:click="flash(netad.id)"
          >
            <h3 class="netad-name">{{ netad.name }}</h3>
            <span class="netad-id">{{ netad.id }}</span>
          </button>
        </ul>
      </div>
    </div>

    <div class="flash-holder" v-if="state === State.PRE_FLASH">
      <h2>Connect your radio</h2>
      <p>Ensure your radio is turned off before connecting</p>
      <p>
        Make sure the radio is plugged into the right port (labelled 802.3af
        POE)
      </p>
      <span class="loader" />
      <button
        class="button"
        v-if="showCancel === true"
        v-on:click="cancelFlash()"
      >
        Cancel
      </button>
    </div>

    <div class="flash-holder" v-if="state === State.FLASHING">
      <h2>Flashing in progress</h2>
      <div
        v-for="(status, index) in statuses"
        :key="index"
        class="flasher-statuses"
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
      <button
        class="button"
        v-if="showCancel === true"
        v-on:click="cancelFlash()"
      >
        Cancel
      </button>
    </div>

    <div class="flash-holder" v-if="state === State.DONE">
      <h2>Flashing complete!</h2>
      <div
        v-for="(status, index) in statuses"
        :key="index"
        class="flasher-statuses"
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
      <button
        class="button"
        v-if="showCancel === true"
        v-on:click="flash(currentNetId)"
      >
        Flash another
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue";
import "./FlashRadio.scss";
import { getInterfaces, NetworkInterface } from "@/raw-networking/interface";
import {
  CloseCap,
  startArpResponder,
  startTftpResponder,
} from "@/raw-networking/cap";
import querystring from "querystring";

enum State {
  SELECT_ADAPTER,
  PRE_FLASH,
  FLASHING,
  DONE,
}

@Component({
  components: {
    ArrowLeft,
  },
})
export default class FlashRadio extends Vue {
  State = State;
  state = State.SELECT_ADAPTER;

  constructor() {
    super();
  }

  mounted() {
    this.findNetworkAdapters();
    this.resetStatuses();
    if ("presetInterface" in this.$route.query) {
      this.flash(this.$route.query["presetInterface"] as string);
    }
  }

  networkAdapters: NetworkInterface[] = [];
  currentNetId = "";
  cancelArp: CloseCap | null = null;
  cancelTftp: CloseCap | null = null;
  cancelWrite: (() => void) | null = null;
  showCancel = !("presetInterface" in this.$route.query);

  statuses: {
    lineText: string;
    done: boolean;
  }[] = [];

  resetStatuses() {
    this.statuses = [
      {
        lineText: "Waiting for fwupgrade.cfg to be requested",
        done: false,
      },
      {
        lineText: "Waiting for kernel to be requested",
        done: false,
      },
      {
        lineText: "Waiting for rootfs to be requested",
        done: false,
      },
      {
        lineText: "Waiting to write to flash",
        done: false,
      },
    ];
  }

  async findNetworkAdapters() {
    this.networkAdapters = getInterfaces();
  }

  async flash(id: string) {
    try {
      this.cancelFlash();
      this.cancelArp = startArpResponder(id, () => {
        this.state = State.FLASHING;
      });
      this.cancelTftp = startTftpResponder(id, (fileName, block, total) => {
        if (fileName === "fwupgrade.cfg") {
          Vue.set(this.statuses, 0, {
            lineText: `Sending fwupgrade.cfg (${block}/${total})`,
            done: block === total,
          });
        }
        if (fileName === "kernel") {
          Vue.set(this.statuses, 1, {
            lineText: `Sending kernel (${block}/${total})`,
            done: block === total,
          });
        }
        if (fileName === "rootfs") {
          Vue.set(this.statuses, 2, {
            lineText: `Sending rootfs (${block}/${total})`,
            done: block === total,
          });
        }

        this.cancelWrite && this.cancelWrite();
        if (
          this.statuses[0].done &&
          this.statuses[1].done &&
          this.statuses[2].done
        ) {
          Vue.set(this.statuses, 3, {
            lineText: "Writing image to flash",
            done: false,
          });
          const tID = setTimeout(() => {
            Vue.set(this.statuses, 3, {
              lineText: "Image written to flash",
              done: true,
            });
            this.flashOver();
          }, 60 * 1000);
          this.cancelWrite = () => clearTimeout(tID);
        }
      });
      this.currentNetId = id;
      this.state = State.PRE_FLASH;
    } catch (e) {
      this.$router.push(
        "/error?" +
          querystring.stringify({
            error: e.toString(),
            errType: "cap",
          })
      );
    }
  }

  async flashOver() {
    if (
      !this.statuses[0].done ||
      !this.statuses[1].done ||
      !this.statuses[2].done ||
      !this.statuses[3].done
    ) {
      return;
    }
    this.cancelArp && this.cancelArp();
    this.cancelTftp && this.cancelTftp();
    this.cancelWrite && this.cancelWrite();
    this.state = State.DONE;
  }

  async cancelFlash() {
    this.cancelArp && this.cancelArp();
    this.cancelTftp && this.cancelTftp();
    this.cancelWrite && this.cancelWrite();
    this.resetStatuses();
    this.state = State.SELECT_ADAPTER;
  }

  async back() {
    await this.cancelFlash();
    this.$router.go(-1);
  }
}
</script>