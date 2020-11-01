import fs from 'fs'

export interface FirmwareHeader {
    type: string;
    files: FirmwareFile[];
}

export interface FirmwareFile {
    name: string;
    start: number;
    length: number;
    checksum: string;
}

export async function readFirmwareHeader(path: string): Promise<FirmwareHeader> {
    const file = fs.createReadStream(path, {start: 0, end: 0xFFFF})

    await new Promise((resolve) => {
        file.on('readable', function () {
            resolve()
        })
    })

    const magicWord = file.read(2).toString()
    if (magicWord !== "CE") {
        throw Error("Not valid CE file")
    }
    const ceVersion = file.read(2).toString()
    if (ceVersion !== "01") {
        throw Error("Not valid CE version")
    }
    const deviceType = file.read(32).toString().trim()
    const numFiles = parseInt(file.read(2).toString())
    const files = []
    let pointer = 0
    for (let i = 0; i < numFiles; i++) {
        const fileName = file.read(32).toString().trim()
        const fileLength = parseInt(file.read(8).toString(), 16)
        const fileChecksum = file.read(32).toString().trim()
        const start = pointer
        pointer += fileLength
        files.push({
            name: fileName,
            start: start,
            length: fileLength,
            checksum: fileChecksum
        })
    }
    return {
        type: deviceType,
        files: files
    }
}

export async function readFirmwareFile(path: string, start: number, length: number): Promise<Buffer> {
    start += 0xFFFF + 1
    const file = fs.createReadStream(path, {start: start, highWaterMark: length})
    await new Promise((resolve) => {
        file.on('readable', function () {
            resolve()
        })
    })
    if (length !== file.bytesRead) { //Weird nodejs thing
        return readFirmwareFile(path, start, length)
    } else {
        return file.read(file.bytesRead)
    }
    
}