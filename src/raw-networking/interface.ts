import { Cap, Device } from "cap"
import os from "os"

export interface NetworkInterface {
    name: string;
    id: string;
}

export function getInterfaces(): NetworkInterface[] {
    const devices = Cap.deviceList()
    const list: NetworkInterface[] = []
    for (const device of devices) {
        list.push({
            id: device.name,
            name: device["description"] || device.name
        })
    }
    return list
}

function getDevice(id: string): Device | null {
    const devices = Cap.deviceList()
    for (const device of devices) {
        if (device.name === id) {
            return device
        }
    }
    return null
}

export function getInterface(id: string): NetworkInterface | null {
    const device = getDevice(id)
    if (device == null) return null
    return {
        id: device.name,
        name: device["description"] || device.name
    }
}

export function getMac(id: string): string | null {
    const device = getDevice(id)
    const ifaces = os.networkInterfaces()
    for (const iface of Object.values(ifaces)) {
        for (const addressSet of iface!!) {
            if (device.addresses.map((adinfo: any) => adinfo.addr).includes(addressSet.address)) {
                return addressSet.mac
            }
        }
    }
    return null
}