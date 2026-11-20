const zlib = require('node:zlib')
const fs = require('node:fs')

// Simple CRC32 implementation for PNG chunks
function makeCrcTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1)
      else c = c >>> 1
    }
    table[n] = c
  }
  return table
}

const crcTable = makeCrcTable()

function crc32(buffer) {
  let c = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)
  const toHash = Buffer.concat([typeBuffer, data])
  const crc = crc32(toHash)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc, 0)
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

/**
 * Creates a valid, high-resolution RGBA PNG image buffer with brand styling
 * @param {number} width - image width (e.g. 192)
 * @param {number} height - image height (e.g. 192)
 * @param {object} color - { r, g, b } background color
 * @param {string} symbol - optional initial / symbol
 */
function createBrandedIcon(width = 192, height = 192, color = { r: 37, g: 99, b: 235 }) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  
  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData.writeUInt8(8, 8)   // 8 bits per channel
  ihdrData.writeUInt8(6, 9)   // RGBA
  ihdrData.writeUInt8(0, 10)  // deflate
  ihdrData.writeUInt8(0, 11)  // filter
  ihdrData.writeUInt8(0, 12)  // non-interlaced
  const ihdrChunk = createChunk('IHDR', ihdrData)

  // Raw image scanlines
  const rowStride = width * 4
  const rawData = Buffer.alloc((1 + rowStride) * height)

  const radius = Math.min(width, height) / 2
  const cx = width / 2
  const cy = height / 2

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowStride)
    rawData[rowOffset] = 0 // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Rounded squircle / circular icon badge
      if (dist < radius - 4) {
        // Subtle gradient
        const factor = 1 - (dist / radius) * 0.25
        rawData[pixelOffset] = Math.min(255, Math.floor(color.r * factor))
        rawData[pixelOffset + 1] = Math.min(255, Math.floor(color.g * factor))
        rawData[pixelOffset + 2] = Math.min(255, Math.floor(color.b * factor))
        rawData[pixelOffset + 3] = 255
      } else if (dist < radius) {
        // Anti-aliased border
        const alpha = Math.max(0, Math.min(255, Math.floor((radius - dist) * 64)))
        rawData[pixelOffset] = color.r
        rawData[pixelOffset + 1] = color.g
        rawData[pixelOffset + 2] = color.b
        rawData[pixelOffset + 3] = alpha
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0
        rawData[pixelOffset + 1] = 0
        rawData[pixelOffset + 2] = 0
        rawData[pixelOffset + 3] = 0
      }
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData, { level: 9 })
  const idatChunk = createChunk('IDAT', compressedData)

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

module.exports = { createBrandedIcon }

