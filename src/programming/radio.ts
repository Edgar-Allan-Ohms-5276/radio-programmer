import { Socket } from 'net'

const minimumFirmwareVersion = "19.0.0"
const radioIP = "192.168.1.1"
const defaultBandwidthLimit = "4000"

function getRadioData(socket: Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let receivedData = ""
    socket.on('data', (data: string) => {
      receivedData += data
      if (receivedData.match(/:/g)?.length === 3) {
        resolve(receivedData)
      }
    })
    socket.on('timeout', function () {
      socket.destroy()
      reject(Error("timeout")) // Could not connect to radio. Ensure it is connected.
    })
    socket.on('error', function () {
      socket.destroy()
      reject(Error("socket_error")) // Generic socket error
    })
    socket.connect(8888, radioIP, function () {
      console.log("Successfully connected to the Radio.")
    })
  })
}

export const ssidRegex = /^[\dA-Za-z][\d_\-A-Za-z]{0,31}$/
export const wpakeyRegex = /^[\s\S]{8,63}$/

export async function programRadio(
  mode: Mode,
  teamNum: number,
  ssid: string,
  wpakey: string,
  enableFirewall: boolean,
  enableBandwidthLimit: boolean,
  enddate: number,
  currentEventApprovalFunc: () => Promise<boolean>
): Promise<void> {
  if (teamNum < 1 || teamNum > 9999) {
    throw Error("invalid_teamNum")
  }
  if (!ssidRegex.test(ssid)) {
    throw Error("invalid_ssid")
  }
  if (wpakey !== "" && !wpakeyRegex.test(wpakey)) {
    throw Error("invalid_wpakey")
  }

  const socket = new Socket()
  socket.setEncoding('utf8')

  const data = await getRadioData(socket)

  const firmwareVersion = data.split(/:|\n/)[2].trim()
  console.log(`Firmware version: ${firmwareVersion}`)
  const firmwareVersionSplit = firmwareVersion.split(/\./)
  const allowedVersionSplit = minimumFirmwareVersion.split(/\./)
  let firmwareValid = false
  if (firmwareVersionSplit[0] > allowedVersionSplit[0]) {
    firmwareValid = true
  } else if (firmwareVersionSplit[0] === allowedVersionSplit[0]) {
    if (firmwareVersionSplit[1] > allowedVersionSplit[1]) {
      firmwareValid = true
    } else if (firmwareVersionSplit[1] === allowedVersionSplit[1]) {
      if (firmwareVersionSplit[2] >= allowedVersionSplit[2]) {
        firmwareValid = true
      }
    }
  }

  if (!firmwareValid) {
    socket.destroy()
    throw Error("old_firmware")
  }

  const date = data.split(/:|\n/)[1].trim()

  const eventEnd = parseInt(date)
  if (new Date().getTime() < eventEnd) {
    const shouldContinue = await currentEventApprovalFunc()
    if (!shouldContinue) {
      console.log("Programming canceled.")
      socket.destroy()
      throw new Error("cancel")
    }
  }


  const firewallStr = enableFirewall ? "Y" : "N"
  const bandwidthStr = enableBandwidthLimit ? defaultBandwidthLimit : ""

  let outPacket = ""
  outPacket = outPacket.concat(mode, ",")
  outPacket = outPacket.concat(teamNum.toString(), ",")
  outPacket = outPacket.concat(ssid, ",")
  outPacket = outPacket.concat(wpakey, ",")
  outPacket = outPacket.concat(firewallStr, ",")
  outPacket = outPacket.concat(bandwidthStr, ",")
  outPacket = outPacket.concat("Y", ",") // DHCP
  outPacket = outPacket.concat("0", ",")
  outPacket = outPacket.concat("0", ",")
  outPacket = outPacket.concat("Programmed_With_EAO_Programmer", ",")
  outPacket = outPacket.concat(enddate.toString())
  outPacket = outPacket.concat("\n")
  socket.write(outPacket)
  console.log("Programming Complete")
  socket.destroy()
}

export enum Mode {
  BRIDGE5 = "B5",
  BRIDGE24 = "B24",
  AP5 = "AP5",
  AP24 = "AP24"
}
