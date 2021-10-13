import electron from "electron";
import { NetworkInterface } from "./raw-networking/interface";
import { canSetStaticIp, revertStaticIp, setStaticIp } from "./staticip";

let inKiosk = false;
let networkInterface: NetworkInterface

let oldPosition: [number, number] = [0, 0];
let oldSize: [number, number] = [0, 0];
let oldMinSize: [number, number] = [0, 0];

export function becomeKiosk(netif: NetworkInterface) {
    if (inKiosk) return
    oldPosition = electron.remote.getCurrentWindow().getPosition() as [number, number]
    oldSize = electron.remote.getCurrentWindow().getSize() as [number, number]
    oldMinSize = electron.remote.getCurrentWindow().getMinimumSize() as [number, number]

    electron.remote.getCurrentWindow().setAlwaysOnTop(true);
    electron.remote.getCurrentWindow().setPosition(0, 0);
    electron.remote.getCurrentWindow().setKiosk(true);
    electron.remote.getCurrentWindow().setMinimumSize(...electron.remote.getCurrentWindow().getSize() as [number, number]);

    if (canSetStaticIp() == null) {
        setStaticIp(netif);
    }

    inKiosk = true;
    networkInterface = netif
}

export function revertKiosk() {
    if (!inKiosk) return
    electron.remote.getCurrentWindow()?.setAlwaysOnTop(false);
    electron.remote.getCurrentWindow()?.setKiosk(false);
    electron.remote.getCurrentWindow()?.setPosition(...oldPosition);
    electron.remote.getCurrentWindow()?.setMinimumSize(...oldMinSize);
    electron.remote.getCurrentWindow()?.setSize(...oldSize);

    if (canSetStaticIp() == null) {
        revertStaticIp(networkInterface);
    }
    inKiosk = false;
}

export function isInKiosk(): boolean { return inKiosk }