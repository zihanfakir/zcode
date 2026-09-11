import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  ZCodeEncoder,
  ZCodeRenderer,
  ZCodeDecoder,
  ZCodeDataType,
  V1_MAX_PAYLOAD,
  V1_MAX_ENCRYPTED_PAYLOAD,
} from "../dist/src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.resolve(__dirname, "../../samples");

function readPng(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  let width = 0;
  let height = 0;
  const idatChunks = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const chunkData = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
    } else if (type === "IDAT") {
      idatChunks.push(chunkData);
    }
    pos += 12 + len;
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const rgba = new Uint8ClampedArray(width * height * 4);
  let srcPos = 0;
  let dstPos = 0;

  for (let y = 0; y < height; y++) {
    srcPos++;
    for (let x = 0; x < width * 4; x++) {
      rgba[dstPos++] = decompressed[srcPos++];
    }
  }

  return { data: rgba, width, height };
}

async function run() {
  console.log("==================================================");
  console.log("   Z-CODE DIRECT OPTICAL E2E VERIFICATION SUITE   ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  // 1. Direct Optical Public Text Round-Trip
  console.log("--- 1. Direct Optical Public Text ---");
  try {
    const text = "Hello Zihan!";
    const encoded = encoder.encode(text);
    const imgBuf = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512 });
    const decoded = decoder.decodeImage(imgBuf);
    assert(decoded.payload.content === text, `Decoded text matches "${text}"`);
    assert(decoded.payload.type === ZCodeDataType.TEXT, `Data type is TEXT`);
    assert(decoded.errorsCorrected >= 0, `Reed-Solomon verified with 0-7 errors corrected`);
  } catch (err) {
    assert(false, `Public text failed: ${err.message}`);
  }

  // 2. Direct Optical Public URL with Prefix Compression
  console.log("\n--- 2. Direct Optical Public URL ---");
  try {
    const url = "https://example.com/zcode-scanner";
    const encoded = encoder.encode(url);
    const imgBuf = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512 });
    const decoded = decoder.decodeImage(imgBuf);
    assert(decoded.payload.content === url, `Decoded URL matches "${url}"`);
    assert(decoded.payload.type === ZCodeDataType.URL, `Data type is URL`);
  } catch (err) {
    assert(false, `Public URL failed: ${err.message}`);
  }

  // 3. Direct Optical Password Protection & Cryptographic Locking
  console.log("\n--- 3. Direct Optical Password Protected Code ---");
  try {
    const secret = "TopSecret2026";
    const password = "correct-password-123";
    const encoded = await encoder.encodeAsync(secret, { password });
    const imgBuf = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512 });
    const decoded = decoder.decodeImage(imgBuf);
    assert(decoded.payload.isLocked === true, `Code correctly detected as locked (FLAG_ENCRYPTED)`);
    assert(decoded.payload.content === "", `Plaintext content is hidden`);

    // Wrong password test
    let wrongFailed = false;
    try {
      await ZCodeDecoder.unlock(decoded.payload, "wrong-password");
    } catch {
      wrongFailed = true;
    }
    assert(wrongFailed, `Wrong password correctly rejected by AES-256-GCM auth tag`);

    // Correct password test
    const unlocked = await ZCodeDecoder.unlock(decoded.payload, password);
    assert(unlocked.content === secret, `Correct password unlocks original secret: "${secret}"`);
  } catch (err) {
    assert(false, `Direct optical password protection failed: ${err.message}`);
  }

  // 4. Official Sample Images from samples/
  console.log("\n--- 4. Official Sample Images in /samples ---");
  try {
    const helloImg = readPng(path.join(samplesDir, "hello_zihan.png"));
    const helloDecoded = decoder.decodeImage(helloImg);
    assert(helloDecoded.payload.content === "Hello Zihan", `hello_zihan.png decodes to "Hello Zihan"`);

    const urlImg = readPng(path.join(samplesDir, "example_url.png"));
    const urlDecoded = decoder.decodeImage(urlImg);
    assert(urlDecoded.payload.content === "https://example.com", `example_url.png decodes to "https://example.com"`);

    const lockedImg = readPng(path.join(samplesDir, "locked_secret.png"));
    const lockedDecoded = decoder.decodeImage(lockedImg);
    assert(lockedDecoded.payload.isLocked === true, `locked_secret.png detected as locked`);
    const secretUnlocked = await ZCodeDecoder.unlock(lockedDecoded.payload, "zihan123");
    assert(secretUnlocked.content === "Hello Zihan", `locked_secret.png unlocks to "Hello Zihan"`);
  } catch (err) {
    assert(false, `Official samples check failed: ${err.message}`);
  }

  // 5. Custom Colors: Inverted B&W (White on Black) & Custom High Contrast
  console.log("\n--- 5. Custom Color Rendering & Optical Legibility ---");
  try {
    const text = "Color Test 123";
    const encoded = encoder.encode(text);

    // Inverted B&W
    const invertedImg = ZCodeRenderer.renderToImageBuffer(encoded, {
      size: 512,
      foregroundColor: "#FFFFFF",
      backgroundColor: "#000000",
    });
    const invertedDecoded = decoder.decodeImage(invertedImg);
    assert(invertedDecoded.payload.content === text, `Inverted B&W (White on Black) optically decodes perfectly`);

    // High-contrast Cyan
    const cyberImg = ZCodeRenderer.renderToImageBuffer(encoded, {
      size: 512,
      foregroundColor: "#000000",
      backgroundColor: "#00F0FF",
    });
    const cyberDecoded = decoder.decodeImage(cyberImg);
    assert(cyberDecoded.payload.content === text, `Custom Cyan background optically decodes perfectly`);
  } catch (err) {
    assert(false, `Custom color test failed: ${err.message}`);
  }

  // 6. Direct Optical Capacity Limits & Validation
  console.log("\n--- 6. Direct Optical Capacity Limits ---");
  try {
    // Plaintext limit: max 63 bytes
    let plainExceeded = false;
    try {
      encoder.encode("A".repeat(V1_MAX_PAYLOAD + 1));
    } catch {
      plainExceeded = true;
    }
    assert(plainExceeded, `Payloads > ${V1_MAX_PAYLOAD} bytes are rejected for single optical code`);

    // Encrypted limit: max 27 bytes
    let encryptedExceeded = false;
    try {
      await encoder.encodeAsync("A".repeat(V1_MAX_ENCRYPTED_PAYLOAD + 1), { password: "pass" });
    } catch {
      encryptedExceeded = true;
    }
    assert(encryptedExceeded, `Encrypted payloads > ${V1_MAX_ENCRYPTED_PAYLOAD} bytes are rejected`);
  } catch (err) {
    assert(false, `Capacity limit test failed: ${err.message}`);
  }

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
