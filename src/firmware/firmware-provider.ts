let useOpenWRT = false

export function setUseOpenWRT(v: boolean) {
    console.log("Using OPENWRT: " + v)
    useOpenWRT = v
}

export function getFirmwarePath(): string | null {
    if (useOpenWRT) {
        return "resources/firmware/openwrt-OM5PAC.bin"
    }
    return "resources/firmware/FIRST-OM5PAC.bin"
}