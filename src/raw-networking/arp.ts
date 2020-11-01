import { EtherType } from './ethernet'

export interface ArpPacket {
    hardwareType: HardwareType;
    operation: ArpOperation;
    senderHardwareAddress: string;
    senderProtocolAddress: string;
    targetHardwareAddress: string;
    targetProtocolAddress: string;

}

export enum HardwareType {
    ETHERNET = 1
}

export enum ArpOperation {
    REQUEST = 1,
    REPLY = 2
}

export function constructArpBytes(packet: ArpPacket): Buffer {
    const buf = Buffer.alloc(28)
    buf.writeUInt16BE(packet.hardwareType, 0)
    buf.writeUInt16BE(EtherType.IPv4, 2)
    buf.writeUInt8(6, 4)
    buf.writeUInt8(4, 5)
    buf.writeUInt16BE(packet.operation, 6)
    const sha = packet.senderHardwareAddress.split(":").map((hex) => parseInt(hex, 16))
    buf.writeUInt8(sha[0], 8)
    buf.writeUInt8(sha[1], 9)
    buf.writeUInt8(sha[2], 10)
    buf.writeUInt8(sha[3], 11)
    buf.writeUInt8(sha[4], 12)
    buf.writeUInt8(sha[5], 13)
    const spa = packet.senderProtocolAddress.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(spa[0], 14)
    buf.writeUInt8(spa[1], 15)
    buf.writeUInt8(spa[2], 16)
    buf.writeUInt8(spa[3], 17)
    const tha = packet.targetHardwareAddress.split(":").map((hex) => parseInt(hex, 16))
    buf.writeUInt8(tha[0], 18)
    buf.writeUInt8(tha[1], 19)
    buf.writeUInt8(tha[2], 20)
    buf.writeUInt8(tha[3], 21)
    buf.writeUInt8(tha[4], 22)
    buf.writeUInt8(tha[5], 23)
    const tpa = packet.targetProtocolAddress.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(tpa[0], 24)
    buf.writeUInt8(tpa[1], 25)
    buf.writeUInt8(tpa[2], 26)
    buf.writeUInt8(tpa[3], 27)
    return buf
}

export function deconstructArpBytes(buf: Buffer): ArpPacket {
    const htype: HardwareType = buf.readUInt16BE(0)
    //const ptype: EtherType = buf.readUInt16BE(2)
    const oper: ArpOperation = buf.readUInt16BE(6)
    const sha = [
        buf.readUInt8(8),
        buf.readUInt8(9),
        buf.readUInt8(10),
        buf.readUInt8(11),
        buf.readUInt8(12),
        buf.readUInt8(13)
    ].map((num) => num.toString(16)).join(":")
    const spa = [
        buf.readUInt8(14),
        buf.readUInt8(15),
        buf.readUInt8(16),
        buf.readUInt8(17)
    ].map((num) => num.toString()).join(".")
    const tha = [
        buf.readUInt8(18),
        buf.readUInt8(19),
        buf.readUInt8(20),
        buf.readUInt8(21),
        buf.readUInt8(22),
        buf.readUInt8(23)
    ].map((num) => num.toString(16)).join(":")
    const tpa = [
        buf.readUInt8(24),
        buf.readUInt8(25),
        buf.readUInt8(26),
        buf.readUInt8(27)
    ].map((num) => num.toString()).join(".")
    return {
        hardwareType: htype,
        operation: oper,
        senderHardwareAddress: sha,
        senderProtocolAddress: spa,
        targetHardwareAddress: tha,
        targetProtocolAddress: tpa
    }
}