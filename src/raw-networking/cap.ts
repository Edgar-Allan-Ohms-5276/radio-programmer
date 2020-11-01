import { getFirmwarePath } from '@/firmware/firmware-provider'
import { FirmwareFile, readFirmwareFile, readFirmwareHeader } from '@/firmware/read-firmware'
import { Cap } from 'cap'
import { constructArpBytes, deconstructArpBytes, HardwareType, ArpOperation } from './arp'
import { constructEthernetHeaderBytes, deconstructEthernetHeaderBytes, EtherType } from './ethernet'
import { getMac } from './interface'
import { constructIPv4Bytes, deconstructIPv4Bytes, IPProtocolType } from './ip'
import { constructTftpBytes, deconstructTftpBytes, TftpOpcode, TftpErrCode, TftpPacket, TftpRQPayload, TftpAckPayload } from './tftp'
import { constructUdpBytes, deconstructUdpBytes } from './udp'

export type CloseCap = () => void
export type FileSentCallback = (fileName: string, block: number, blockTotal: number) => void
export type ArpCallback = () => void
export function startArpResponder(interfaceId: string, cb: ArpCallback): CloseCap {
    const c = new Cap()
    const filter = 'arp'
    const bufSize = 10 * 1024 * 1024
    const buffer = Buffer.alloc(65535)

    c.open(interfaceId, filter, bufSize, buffer)

    c.setMinBytes && c.setMinBytes(0)

    let closed = false
    
    c.on('packet', function (nbytes: number) {
        if (closed) return
        const arpPacket = deconstructArpBytes(buffer.slice(14, nbytes))
        if (arpPacket.operation === ArpOperation.REQUEST && arpPacket.targetProtocolAddress === "192.168.100.8") {
            console.log("Recieved ARP Request")
            const selfMac = getMac(interfaceId)
            if (selfMac == null) {
                throw new Error("Could not get MAC address")
            }
            const bytes = constructArpBytes({
                hardwareType: HardwareType.ETHERNET,
                operation: ArpOperation.REPLY,
                senderHardwareAddress: selfMac,
                senderProtocolAddress: arpPacket.targetProtocolAddress,
                targetHardwareAddress: arpPacket.senderHardwareAddress,
                targetProtocolAddress: arpPacket.senderProtocolAddress
            })
            const header = constructEthernetHeaderBytes({
                destMac: arpPacket.senderHardwareAddress,
                sourceMac: selfMac,
                etherType: EtherType.ARP
            })
            const packet = Buffer.concat([header, bytes])
            console.log("Sending ARP Reply")
            c.send(packet, packet.length)
            cb()
        }
    })
    
    return () => {
        if (!closed) {
            //c.close()
            closed = true
        }
    }
}

function constructFullTftpFrame(
    sourceMac: string,
    destMac: string,
    srcIP: string,
    dstIP: string,
    srcPort: number,
    dstPort: number,
    tftpPacket: TftpPacket
): Buffer {
    return Buffer.concat([
        constructEthernetHeaderBytes({
            destMac: destMac,
            sourceMac: sourceMac,
            etherType: EtherType.IPv4
        }),
        constructIPv4Bytes({
            srcIP: srcIP,
            dstIP: dstIP,
            protocol: IPProtocolType.UDP,
            data: constructUdpBytes({
                srcPort: srcPort,
                dstPort: dstPort,
                data: constructTftpBytes(tftpPacket)
            }, srcIP, dstIP)
        })
    ])
}

export function startTftpResponder(interfaceId: string, fscb: FileSentCallback): CloseCap {
    const c = new Cap()
    const filter = 'dst host 192.168.100.8 and udp port 69'
    const bufSize = 10 * 1024 * 1024
    const buffer = Buffer.alloc(65535)

    c.open(interfaceId, filter, bufSize, buffer)

    c.setMinBytes && c.setMinBytes(0)

    let closed = false
    const core = (async () => {
        const path = getFirmwarePath()
        if (path == null) throw new Error("Firmware not found")
        const firmwareHeader = await readFirmwareHeader(path)

        let currentFileBlocks: Buffer[] = []
        let currentFileName = ""

        const selfMac = getMac(interfaceId)
        if (selfMac == null) {
            throw new Error("Could not get MAC address")
        }

        c.on('packet', async function (nbytes: number) {
            if (closed) return
            const ethernetHeader = deconstructEthernetHeaderBytes(buffer.slice(0, 14))
            const [ipPacket, ipStable] = deconstructIPv4Bytes(buffer.slice(14, nbytes))
            if (ipStable) {
                const [udpPacket, udpStable] = deconstructUdpBytes(ipPacket.data, ipPacket.srcIP, ipPacket.dstIP)
                if (udpStable) {
                    const tftpPacket = deconstructTftpBytes(udpPacket.data)
                    let tftpReply: TftpPacket | null = null
                    if (tftpPacket.opcode === TftpOpcode.WRQ) {
                        console.log("Recieved write request - rejecting")
                        tftpReply = {
                            opcode: TftpOpcode.ERROR,
                            payload: {
                                errCode: TftpErrCode.ILLEGAL,
                                errMsg: "Cannot write"
                            }
                        }
                    }
                    if (tftpPacket.opcode === TftpOpcode.RRQ) {
                        const payload = tftpPacket.payload as TftpRQPayload
                        if (payload.mode !== "octet") {
                            console.log("Recieved invalid read request - rejecting")
                            tftpReply = {
                                opcode: TftpOpcode.ERROR,
                                payload: {
                                    errCode: TftpErrCode.ILLEGAL,
                                    errMsg: "Only octet is allowed"
                                }
                            }
                        } else {
                            let foundFile: FirmwareFile | null = null
                            for (const file of firmwareHeader.files) {
                                if (file.name === payload.filename) {
                                    foundFile = file
                                    break
                                }
                            }
                            if (foundFile == null) {
                                console.log(`Recieved request for ${payload.filename} - not found`)
                                tftpReply = {
                                    opcode: TftpOpcode.ERROR,
                                    payload: {
                                        errCode: TftpErrCode.FILE_NOT_FOUND,
                                        errMsg: "File not in firmware"
                                    }
                                }
                            } else {
                                const fileBytes = await readFirmwareFile(path, foundFile.start, foundFile.length)
                                currentFileBlocks = []
                                currentFileName = foundFile.name
                                const maxBytes = 512
                                for (let index = 0; index < fileBytes.length; index += maxBytes) {
                                    const chunk = fileBytes.slice(index, index + maxBytes)
                                    currentFileBlocks.push(chunk)
                                }
                                console.log(`Recieved request for ${currentFileName} - sending block 1/${currentFileBlocks.length}`)
                                tftpReply = {
                                    opcode: TftpOpcode.DATA,
                                    payload: {
                                        blockNum: 1,
                                        data: currentFileBlocks[0]
                                    }
                                }
                                fscb(currentFileName, 1, currentFileBlocks.length)
                            }
                        }
                    }

                    if (tftpPacket.opcode === TftpOpcode.ACK) {
                        const payload = tftpPacket.payload as TftpAckPayload
                        if (payload.blockNum > currentFileBlocks.length) {
                            console.log(`Recieved request for block ${payload.blockNum} - rejecting`)
                            tftpReply = {
                                opcode: TftpOpcode.ERROR,
                                payload: {
                                    errCode: TftpErrCode.ACCESS_VIOLATION,
                                    errMsg: "Invalid block num"
                                }
                            }
                        } else if (payload.blockNum < currentFileBlocks.length) {
                            console.log(`Recieved ack for block ${payload.blockNum} - sending block ${payload.blockNum + 1}/${currentFileBlocks.length}`)
                            tftpReply = {
                                opcode: TftpOpcode.DATA,
                                payload: {
                                    blockNum: payload.blockNum + 1,
                                    data: currentFileBlocks[payload.blockNum]
                                }
                            }
                            fscb(currentFileName, payload.blockNum + 1, currentFileBlocks.length)
                        }
                    }

                    if (tftpReply != null) {
                        const frame = constructFullTftpFrame(
                            selfMac,
                            ethernetHeader.sourceMac,
                            "192.168.100.8",
                            ipPacket.srcIP,
                            69,
                            udpPacket.srcPort,
                            tftpReply
                        )
                        c.send(frame, frame.length)
                    }
                }
            }
        })
    })

    core()

    return () => {
        if (!closed) {
            //c.close()
            closed = true
        }
    }
}