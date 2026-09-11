import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { ZCodeEncoder, ZCodeRenderer } from "../dist/src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.resolve(__dirname, "../../samples");

function writePng(filePath, imageBuffer) {
  const { width, height, data } = imageBuffer;

  // Raw scanlines with filter byte 0 (None)
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let srcOffset = 0;
  let dstOffset = 0;

  for (let y = 0; y < height; y++) {
    rawBytes[dstOffset++] = 0; // Filter None
    for (let x = 0; x < width * 4; x++) {
      rawBytes[dstOffset++] = data[srcOffset++];
    }
  }

  const compressed = zlib.deflateSync(rawBytes);

  function makeChunk(type, dataBuf) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(dataBuf.length, 0);

    const typeBuf = Buffer.from(type, "ascii");
    const combined = Buffer.concat([typeBuf, dataBuf]);

    // CRC32
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < combined.length; i++) {
      let b = (crc ^ combined[i]) & 0xFF;
      for (let j = 0; j < 8; j++) {
        b = (b >>> 1) ^ ((b & 1) ? 0xEDB88320 : 0);
      }
      crc = (crc >>> 8) ^ b;
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, combined, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  const pngFile = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filePath, pngFile);
}

const encoder = new ZCodeEncoder();

// 1. "Hello Zihan"
const zihanData = encoder.encode("Hello Zihan");
const zihanImg = ZCodeRenderer.renderToImageBuffer(zihanData, { size: 512, margin: 24 });
writePng(path.join(samplesDir, "hello_zihan.png"), zihanImg);
console.log("Generated samples/hello_zihan.png");

// 2. "https://example.com"
const urlData = encoder.encode("https://example.com");
const urlImg = ZCodeRenderer.renderToImageBuffer(urlData, { size: 512, margin: 24 });
writePng(path.join(samplesDir, "example_url.png"), urlImg);
console.log("Generated samples/example_url.png");

// 3. Password protected: "Hello Zihan" with password "zihan123"
const lockedData = await encoder.encode("Hello Zihan", { password: "zihan123" });
const lockedImg = ZCodeRenderer.renderToImageBuffer(lockedData, { size: 512, margin: 24 });
writePng(path.join(samplesDir, "locked_secret.png"), lockedImg);
console.log("Generated samples/locked_secret.png");

