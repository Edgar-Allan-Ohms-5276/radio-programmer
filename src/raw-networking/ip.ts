export enum IPProtocolType {
    UDP = 0x11
}

//eslint-disable-next-line
export interface IPPacket {
    srcIP: string;
    dstIP: string;
    protocol: IPProtocolType;
    data: Buffer;
}

export function calculateOverallChecksum(data: Buffer): number {
    //eslint-disable-next-line
    for (var sum = 0, i = 0; i < data.length; i += 2) {
        //eslint-disable-next-line
        var digit = (data[i] << 8) + data[i + 1];
        sum = (sum + digit) % 65535;
    }
    let ck = (~sum) & 0xFFFF
    if (ck === 0x0000) {
        ck = 0xFFFF
    }
    return ck;
}

export function constructIPv4PseudoHeaderBytes(srcIP: string, dstIP: string, packet: Buffer, protocol: IPProtocolType): Buffer {
    const buf = Buffer.alloc(12)
    const srcIPByt = srcIP.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(srcIPByt[0], 0)
    buf.writeUInt8(srcIPByt[1], 1)
    buf.writeUInt8(srcIPByt[2], 2)
    buf.writeUInt8(srcIPByt[3], 3)
    const dstIPByt = dstIP.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(dstIPByt[0], 4)
    buf.writeUInt8(dstIPByt[1], 5)
    buf.writeUInt8(dstIPByt[2], 6)
    buf.writeUInt8(dstIPByt[3], 7)
    buf.writeUInt8(0, 8)
    buf.writeUInt8(protocol, 9)
    buf.writeUInt16BE(packet.length, 10)
    return Buffer.concat([buf, packet])
}

let ipId = 0x01


export function constructIPv4Bytes(packet: IPPacket): Buffer {
    const buf = Buffer.alloc(20)
    buf.writeUInt8((0x04<<4)+(0x05), 0) // Version + IHL
    buf.writeUInt8(0x00, 1) // TOS
    buf.writeUInt16BE(buf.length+packet.data.length, 2)
    ipId += 1
    ipId %= 0xFFFF
    buf.writeUInt16BE(ipId, 4)
    buf.writeUInt16BE(0x00, 6) // Flags + FGOFST
    buf.writeUInt8(0x80, 8) //TTL
    buf.writeUInt8(packet.protocol, 9)
    const srcIPByt = packet.srcIP.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(srcIPByt[0], 12)
    buf.writeUInt8(srcIPByt[1], 13)
    buf.writeUInt8(srcIPByt[2], 14)
    buf.writeUInt8(srcIPByt[3], 15)
    const dstIPByt = packet.dstIP.split(".").map((num) => parseInt(num, 10))
    buf.writeUInt8(dstIPByt[0], 16)
    buf.writeUInt8(dstIPByt[1], 17)
    buf.writeUInt8(dstIPByt[2], 18)
    buf.writeUInt8(dstIPByt[3], 19)
    const cksum = calculateOverallChecksum(buf)
    buf.writeUInt16BE(cksum, 10)
    return Buffer.concat([buf, packet.data])
}

export function deconstructIPv4Bytes(buf: Buffer): [IPPacket, boolean] {
    const headerLength = (buf.readUInt8(0) & 0b00001111) * 4
    const totalLength = buf.readUInt16BE(2)
    const protocol = buf.readUInt8(9)
    const srcIP = [
        buf.readUInt8(12),
        buf.readUInt8(13),
        buf.readUInt8(14),
        buf.readUInt8(15)
    ].map((num) => num.toString(10)).join('.')
    const dstIP = [
        buf.readUInt8(16),
        buf.readUInt8(17),
        buf.readUInt8(18),
        buf.readUInt8(19)
    ].map((num) => num.toString(10)).join('.')
    const cksum = calculateOverallChecksum(buf.slice(0, headerLength))
    buf.writeUInt16BE(cksum, 10)
    return [{
        srcIP: srcIP,
        dstIP: dstIP,
        protocol: protocol,
        data: buf.slice(headerLength, totalLength)
    }, cksum === 0xFFFF]
}