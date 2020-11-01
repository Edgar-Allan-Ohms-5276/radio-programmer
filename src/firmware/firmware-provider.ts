export function getFirmwarePath(): string | null {
    if (process.env.FIRMWARE === "openwrt") {
        return "flasher/openwrt-OM5PAC.bin"
    }
    return "flasher/FIRST-OM5PAC.bin"
}