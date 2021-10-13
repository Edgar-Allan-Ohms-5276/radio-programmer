import { exec, execSync } from "child_process"
import { NetworkInterface } from "./raw-networking/interface"

export function canSetStaticIp(): string | null {
    if (!["win32"/*, "darwin", "freebsd", "linux"*/].includes(process.platform)) {
        return "platform not supported"
    }
    if (process.platform === "win32") {
        try {
            execSync("net session")
        } catch (_) {
            return "not running as administrator"
        }
    } else {
        try {
            execSync("cat /etc/sudoers")
        } catch (_) {
            return "not running as sudo"
        }
    }
    return null
}

export function setStaticIp(netif: NetworkInterface) {
    if (process.platform === "win32") {
        return windowsSetStaticIp(netif)
    }
    throw new Error("Platform not supported")
}

function windowsSetStaticIp(netif: NetworkInterface) {
    exec("getmac /fo csv /v", (e, stdout, stderr) => {
        if (e) { return console.error(e) }
        if (stderr) { return console.error(stderr) }

        //["Connection Name", "Network Adapter", "Physical Address", "Transport Name"]
        const output: string[][] = stdout.split("\r\n").filter(s => s.length > 0).map(l => l.split(",").map(c => c.replace(/\"/g, '')))
        const netIfName = output.filter(v => v[1] === netif.name)[0][0]
        exec(`netsh interface ipv4 set interface interface="${netIfName}" dhcpstaticipcoexistence=enabled `, (e, stdout, stderr) => {
            if (e) { return console.error(e) }
            if (stderr) { return console.error(stderr) }
            exec(`netsh interface ipv4 add address name="${netIfName}" 192.168.1.2/24`, (e, stdout, stderr) => {
                if (e) { return console.error(e) }
                if (stderr) { return console.error(stderr) }
                exec(`netsh interface ipv4 add address name="${netIfName}" 10.0.0.50/8`, (e, stdout, stderr) => {
                    if (e) { return console.error(e) }
                    if (stderr) { return console.error(stderr) }
                })
            })
        })
    })
}

export function revertStaticIp(netif: NetworkInterface) {
    if (process.platform === "win32") {
        return windowsRevertStaticIp(netif)
    }
    throw new Error("Platform not supported")
}

function windowsRevertStaticIp(netif: NetworkInterface) {
    exec("getmac /fo csv /v", (e, stdout, stderr) => {
        if (e) { return console.error(e) }
        if (stderr) { return console.error(stderr) }

        //["Connection Name", "Network Adapter", "Physical Address", "Transport Name"]
        const output: string[][] = stdout.split("\r\n").filter(s => s.length > 0).map(l => l.split(",").map(c => c.replace(/\"/g, '')))
        const netIfName = output.filter(v => v[1] === netif.name)[0][0]
        exec(`netsh interface ipv4 set interface interface="${netIfName}" dhcpstaticipcoexistence=disabled `, (e, stdout, stderr) => {
            if (e) { return console.error(e) }
            if (stderr) { return console.error(stderr) }
            exec(`netsh interface ipv4 delete address name="${netIfName}" 192.168.1.2`, (e, stdout, stderr) => {
                if (e) { return console.error(e) }
                if (stderr) { return console.error(stderr) }
                exec(`netsh interface ipv4 delete address name="${netIfName}" 10.0.0.50`, (e, stdout, stderr) => {
                    if (e) { return console.error(e) }
                    if (stderr) { return console.error(stderr) }
                })
            })
        })
    })
}


