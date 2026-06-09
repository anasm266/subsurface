import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const sizes = [16, 32, 48, 128];
const outputDir = 'public/icons';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createIcon(size) {
  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;

    for (let x = 0; x < size; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const cx = (x + 0.5) / size;
      const cy = (y + 0.5) / size;

      const barHeight = 0.08 + 0.04 * Math.sin(cx * Math.PI * 3);
      const inBar =
        cy > 0.58 - barHeight &&
        cy < 0.58 + barHeight &&
        cx > 0.18 &&
        cx < 0.82;

      const inDot =
        Math.hypot(cx - 0.78, cy - 0.24) < 0.07;

      if (inBar || inDot) {
        raw[offset] = 245;
        raw[offset + 1] = 158;
        raw[offset + 2] = 11;
        raw[offset + 3] = 255;
      } else {
        raw[offset] = 15;
        raw[offset + 1] = 13;
        raw[offset + 2] = 11;
        raw[offset + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  writeFileSync(`${outputDir}/icon${size}.png`, createIcon(size));
}

console.log(`generated icons in ${outputDir}`);
