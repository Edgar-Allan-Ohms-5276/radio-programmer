export enum EtherType {
    IPv4 = 0x0800,
    ARP = 0x0806
}

export interface EthernetHeader {
    sourceMac: string;
    destMac: string;
    etherType: EtherType;
}

export function constructEthernetHeaderBytes(header: EthernetHeader): Buffer {
    const buf = Buffer.alloc(14)
    const dst = header.destMac.split(":").map((hex) => parseInt(hex, 16))
    buf.writeUInt8(dst[0], 0)
    buf.writeUInt8(dst[1], 1)
    buf.writeUInt8(dst[2], 2)
    buf.writeUInt8(dst[3], 3)
    buf.writeUInt8(dst[4], 4)
    buf.writeUInt8(dst[5], 5)
    const src = header.sourceMac.split(":").map((hex) => parseInt(hex, 16))
    buf.writeUInt8(src[0], 6)
    buf.writeUInt8(src[1], 7)
    buf.writeUInt8(src[2], 8)
    buf.writeUInt8(src[3], 9)
    buf.writeUInt8(src[4], 10)
    buf.writeUInt8(src[5], 11)
    buf.writeUInt16BE(header.etherType, 12)
    return buf
}

export function deconstructEthernetHeaderBytes(buf: Buffer): EthernetHeader {
    const dst = [
        buf.readUInt8(0),
        buf.readUInt8(1),
        buf.readUInt8(2),
        buf.readUInt8(3),
        buf.readUInt8(4),
        buf.readUInt8(5),
    ].map((num) => num.toString(16)).join(":")
    const src = [
        buf.readUInt8(6),
        buf.readUInt8(7),
        buf.readUInt8(8),
        buf.readUInt8(9),
        buf.readUInt8(10),
        buf.readUInt8(11)
    ].map((num) => num.toString(16)).join(":")
    const ethTyp: EtherType = buf.readUInt16BE(12)
    return {
        destMac: dst,
        sourceMac: src,
        etherType: ethTyp
    }
}