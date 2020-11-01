export enum TftpOpcode {
    RRQ = 0x01,
    WRQ = 0x02,
    DATA = 0x03,
    ACK = 0x04,
    ERROR = 0x05
}

export interface TftpRQPayload {
    filename: string;
    mode: "netascii" | "octet" | "mail";
}

export interface TftpDataPayload {
    blockNum: number;
    data: Buffer;
}

export interface TftpAckPayload {
    blockNum: number;
}

export enum TftpErrCode {
    NOT_DEFINED = 0x00,
    FILE_NOT_FOUND = 0x01,
    ACCESS_VIOLATION = 0x02,
    DISK_FULL = 0x03,
    ILLEGAL = 0x04,
    UNKNOWN_TRANSFER_ID = 0x05,
    FILE_ALREADY_EXISTS = 0x06,
    NO_SUCH_USER = 0x07
}

export interface TftpErrorPayload {
    errCode: TftpErrCode;
    errMsg: string;
}

export type TftpPacket = {
    opcode: TftpOpcode;
    payload: TftpRQPayload | TftpDataPayload | TftpAckPayload | TftpErrorPayload;
}

export function constructTftpBytes(packet: TftpPacket): Buffer {
    if (packet.opcode === TftpOpcode.ACK) {
        const payload = packet.payload as TftpAckPayload
        const buf = Buffer.alloc(4)
        buf.writeUInt16BE(packet.opcode, 0)
        buf.writeUInt16BE(payload.blockNum, 2)
        return buf
    }
    if (packet.opcode === TftpOpcode.DATA) {
        const payload = packet.payload as TftpDataPayload
        const buf = Buffer.alloc(4)
        buf.writeUInt16BE(packet.opcode, 0)
        buf.writeUInt16BE(payload.blockNum, 2)
        return Buffer.concat([buf, payload.data])
    }
    if (packet.opcode === TftpOpcode.ERROR) {
        const payload = packet.payload as TftpErrorPayload
        const buf = Buffer.alloc(4)
        buf.writeUInt16BE(packet.opcode, 0)
        buf.writeUInt16BE(payload.errCode, 2)
        return Buffer.concat([
            buf, 
            Buffer.from(payload.errMsg), 
            Buffer.from([0x00])
        ])
    }
    if (packet.opcode === TftpOpcode.RRQ || packet.opcode === TftpOpcode.WRQ) {
        const payload = packet.payload as TftpRQPayload
        const buf = Buffer.alloc(2)
        buf.writeUInt16BE(packet.opcode, 0)
        return Buffer.concat([
            buf, 
            Buffer.from(payload.filename), 
            Buffer.from([0x00]), 
            Buffer.from(payload.mode), 
            Buffer.from([0x00])
        ])
    }
    throw new Error("Invalid TFTP Opcode")
}

export function deconstructTftpBytes(buf: Buffer): TftpPacket {
    const opcode = buf.readUInt16BE(0)
    if (opcode === TftpOpcode.ACK) {
        const blockNum = buf.readUInt16BE(2)
        return {
            opcode: opcode,
            payload: {
                blockNum: blockNum
            }
        }
    }
    if (opcode === TftpOpcode.DATA) {
        const blockNum = buf.readUInt16BE(2)
        const data = buf.slice(4)
        return {
            opcode: opcode,
            payload: {
                blockNum: blockNum,
                data: data
            }
        }
    }
    if (opcode === TftpOpcode.ERROR) {
        const errCode = buf.readUInt16BE(2)
        const errMsgEnd = buf.indexOf(0x00, 4)
        const errMsg = buf.slice(4, errMsgEnd).toString()
        return {
            opcode: opcode,
            payload: {
                errCode: errCode,
                errMsg: errMsg
            }
        }
    }
    if (opcode === TftpOpcode.RRQ || opcode === TftpOpcode.WRQ) {
        const filenameEnd = buf.indexOf(0x00, 2)
        const filename = buf.slice(2, filenameEnd).toString()
        const modeEnd = buf.indexOf(0x00, filenameEnd+1)
        const mode = buf.slice(filenameEnd+1, modeEnd).toString() as "netascii" | "octet" | "mail"
        return {
            opcode: opcode,
            payload: {
                filename: filename,
                mode: mode
            }
        }
    }
    throw new Error("Invalid TFTP Opcode")
}
