import { ZCodeEncoder, ZCodeDecoder, ZCodeDetector, ZCodeRenderer } from "../dist/src/index.js";

const encoder = new ZCodeEncoder();
const decoder = new ZCodeDecoder();
const encoded = encoder.encode("Hello Zihan");

console.log("=== TEST 1: Standard 512x512 ImageBuffer ===");
const standardBuf = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, margin: 24 });
try {
  const res = decoder.decodeImage(standardBuf);
  console.log("Standard decode SUCCESS:", res.payload.content);
} catch (e) {
  console.error("Standard decode FAILED:", e.message);
}

console.log("\n=== TEST 2: Code rendered with 'Z' glyph in center ===");
const withZ = {
  data: new Uint8ClampedArray(standardBuf.data),
  width: standardBuf.width,
  height: standardBuf.height,
};
const cx = 256;
const cy = 256;
for (let dx = -15; dx <= 15; dx++) {
  const yTop = cy - 15;
  const idxTop = (yTop * 512 + (cx + dx)) * 4;
  withZ.data[idxTop] = 255;
  withZ.data[idxTop + 1] = 255;
  withZ.data[idxTop + 2] = 255;

  const yBottom = cy + 15;
  const idxBottom = (yBottom * 512 + (cx + dx)) * 4;
  withZ.data[idxBottom] = 255;
  withZ.data[idxBottom + 1] = 255;
  withZ.data[idxBottom + 2] = 255;
}
for (let step = -15; step <= 15; step++) {
  const x = cx - step;
  const y = cy + step;
  const idx = (y * 512 + x) * 4;
  withZ.data[idx] = 255;
  withZ.data[idx + 1] = 255;
  withZ.data[idx + 2] = 255;
}

try {
  const res = decoder.decodeImage(withZ);
  console.log("With 'Z' glyph SUCCESS:", res.payload.content);
} catch (e) {
  console.error("With 'Z' glyph FAILED:", e.message);
}

console.log("\n=== TEST 3: Code smaller (350x350 inside 512x512) ===");
const smallBuf = ZCodeRenderer.renderToImageBuffer(encoded, { size: 350, margin: 16 });
const cameraFrame = {
  data: new Uint8ClampedArray(512 * 512 * 4),
  width: 512,
  height: 512,
};
cameraFrame.data.fill(240);
const offsetX = Math.floor((512 - 350) / 2);
const offsetY = Math.floor((512 - 350) / 2);

for (let y = 0; y < 350; y++) {
  for (let x = 0; x < 350; x++) {
    const srcIdx = (y * 350 + x) * 4;
    const dstIdx = ((y + offsetY) * 512 + (x + offsetX)) * 4;
    cameraFrame.data[dstIdx] = smallBuf.data[srcIdx];
    cameraFrame.data[dstIdx + 1] = smallBuf.data[srcIdx + 1];
    cameraFrame.data[dstIdx + 2] = smallBuf.data[srcIdx + 2];
    cameraFrame.data[dstIdx + 3] = 255;
  }
}

try {
  const gray = ZCodeDetector.toGrayscale(cameraFrame);
  const loc = ZCodeDetector.locateCode(gray, 512, 512);
  console.log("Smaller code locateCode:", loc);
  const res = decoder.decodeImage(cameraFrame);
  console.log("Smaller code SUCCESS:", res.payload.content);
} catch (e) {
  console.error("Smaller code FAILED:", e.message);
}

console.log("\n=== TEST 4: Code slightly off-center (offset by 30px) ===");
const offCenterFrame = {
  data: new Uint8ClampedArray(512 * 512 * 4),
  width: 512,
  height: 512,
};
offCenterFrame.data.fill(230);
const offX = Math.floor((512 - 350) / 2) + 30;
const offY = Math.floor((512 - 350) / 2) - 20;

for (let y = 0; y < 350; y++) {
  for (let x = 0; x < 350; x++) {
    const srcIdx = (y * 350 + x) * 4;
    const dstIdx = ((y + offY) * 512 + (x + offX)) * 4;
    offCenterFrame.data[dstIdx] = smallBuf.data[srcIdx];
    offCenterFrame.data[dstIdx + 1] = smallBuf.data[srcIdx + 1];
    offCenterFrame.data[dstIdx + 2] = smallBuf.data[srcIdx + 2];
    offCenterFrame.data[dstIdx + 3] = 255;
  }
}

try {
  const gray = ZCodeDetector.toGrayscale(offCenterFrame);
  const loc = ZCodeDetector.locateCode(gray, 512, 512);
  console.log("Off-center code locateCode:", loc);
  const res = decoder.decodeImage(offCenterFrame);
  console.log("Off-center code SUCCESS:", res.payload.content);
} catch (e) {
  console.error("Off-center code FAILED:", e.message);
}

console.log("\n=== TEST 5: Camera real contrast (Dark = 60, Light = 190) ===");
const lowContrastFrame = {
  data: new Uint8ClampedArray(cameraFrame.data),
  width: 512,
  height: 512,
};
for (let i = 0; i < lowContrastFrame.data.length; i += 4) {
  const v = lowContrastFrame.data[i];
  const newV = Math.round(60 + (v / 255) * (190 - 60));
  lowContrastFrame.data[i] = newV;
  lowContrastFrame.data[i + 1] = newV;
  lowContrastFrame.data[i + 2] = newV;
}

try {
  const gray = ZCodeDetector.toGrayscale(lowContrastFrame);
  const loc = ZCodeDetector.locateCode(gray, 512, 512);
  console.log("Low contrast locateCode:", loc);
  const res = decoder.decodeImage(lowContrastFrame);
  console.log("Low contrast SUCCESS:", res.payload.content);
} catch (e) {
  console.error("Low contrast FAILED:", e.message);
}
