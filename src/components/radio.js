import { Socket } from 'net'

var minimumFirmwareVersion = "19.0.0"
var radioIP = "192.168.1.1"
var defaultBandwidthLimit = "4000"

async function programRadio(mode, teamNum, ssid, wpakey, enableFirewall, enableBandwidthLimit, enddate, currentEventApprovalFunc) {
  const socket = new Socket()
  socket.setEncoding('utf8')


  const data = await new Promise((resolve, reject) => {
    var receivedData = ""
    socket.on('data', (data) => {
      receivedData += data
      if (receivedData.match(/:/g).length === 3) {
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

  var firmwareVersion = data.split(/:|\n/)[2].trim()
  console.log(`Firmware version: ${firmwareVersion}`)
  var firmwareVersionSplit = firmwareVersion.split(/\./)
  var allowedVersionSplit = minimumFirmwareVersion.split(/\./)
  var firmwareValid = false
  if (firmwareVersionSplit[0] == allowedVersionSplit[0]) {
    if (parseInt(firmwareVersionSplit[1]) > parseInt(allowedVersionSplit[1])) {
      firmwareValid = true
    } else if (firmwareVersionSplit[1] == allowedVersionSplit[1] && parseInt(firmwareVersionSplit[2]) >= parseInt(allowedVersionSplit[2])) {
      firmwareValid = true
    }
  }

  if (!firmwareValid) {
    socket.destroy()
    throw Error("old_firmware")
  }

  var date = data.split(/:|\n/)[1].trim()

    eventEnd = parseInt(date)
    if (new Date().getTime() < eventEnd) {
      const shouldContinue = await currentEventApprovalFunc()
      if (!shouldContinue) {
        console.log("Programming canceled.")
        socket.destroy()
        throw new Error("cancel")
      }
    }


    var firewall = enableFirewall ? "Y" : "N"
    var bandwidth = enableBandwidthLimit ? defaultBandwidthLimit : ""

    var outPacket = ""
    outPacket = outPacket.concat(mode, ",")
    outPacket = outPacket.concat(teamNum, ",")
    outPacket = outPacket.concat(ssid, ",")
    outPacket = outPacket.concat(wpakey, ",")
    outPacket = outPacket.concat(firewall, ",")
    outPacket = outPacket.concat(bandwidth, ",")
    outPacket = outPacket.concat("Y", ",") // DHCP
    outPacket = outPacket.concat("0", ",")
    outPacket = outPacket.concat("0", ",")
    outPacket = outPacket.concat("Programmed_With_EAO_Programmer", ",")
    outPacket = outPacket.concat(enddate)
    outPacket = outPacket.concat("\n")
    socket.write(outPacket)
    console.log("Programming Complete")
    socket.destroy()
}
