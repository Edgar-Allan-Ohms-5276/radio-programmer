import { calculateOverallChecksum, constructIPv4PseudoHeaderBytes, IPProtocolType } from './ip'

export interface UdpPacket {
    srcPort: number;
    dstPort: number;
    data: Buffer;
}

export function constructUdpBytes(packet: UdpPacket, srcIP?: string, dstIP?: string): Buffer {
    const buf = Buffer.concat([Buffer.alloc(8), packet.data])
    buf.writeUInt16BE(packet.srcPort, 0)
    buf.writeUInt16BE(packet.dstPort, 2)
    buf.writeUInt16BE(buf.length, 4)
    if (srcIP != null && dstIP != null) {
        const cksum = calculateOverallChecksum(constructIPv4PseudoHeaderBytes(srcIP, dstIP, buf, IPProtocolType.UDP))
        buf.writeUInt16BE(cksum, 6)
    }
    return buf
}

// [packet, passedChecksum]
export function deconstructUdpBytes(buf: Buffer, srcIP?: string, dstIP?: string): [UdpPacket, boolean] {
    const srcPort = buf.readUInt16BE(0)
    const dstPort = buf.readUInt16BE(2)
    const totalLength = buf.readUInt16BE(4)
    const data = buf.slice(8, totalLength)
    const packet = {
        srcPort: srcPort,
        dstPort: dstPort,
        data: data
    }
    if (buf.readUInt16BE(6) !== 0x00 && srcIP != null && dstIP != null) {
        const cksum = calculateOverallChecksum(constructIPv4PseudoHeaderBytes(srcIP, dstIP, buf, IPProtocolType.UDP))
        return [packet, cksum === 0xFFFF]
    }
    return [packet, true]
}