import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ZCodeDecoder, ZCodeDataType } from "../src/index.js";

const samplesDir = path.resolve(process.cwd(), "../samples");

function readPng(filePath: string) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  let width = 0;
  let height = 0;
  const idatChunks: Buffer[] = [];

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
    srcPos++; // skip filter byte
    for (let x = 0; x < width * 4; x++) {
      rgba[dstPos++] = decompressed[srcPos++];
    }
  }

  return { data: rgba, width, height };
}

test("Decode official sample: hello_zihan.png", () => {
  const decoder = new ZCodeDecoder();
  const img = readPng(path.join(samplesDir, "hello_zihan.png"));
  const result = decoder.decodeImage(img);

  assert.equal(result.payload.type, ZCodeDataType.TEXT);
  assert.equal(result.payload.content, "Hello Zihan");
});

test("Decode official sample: example_url.png", () => {
  const decoder = new ZCodeDecoder();
  const img = readPng(path.join(samplesDir, "example_url.png"));
  const result = decoder.decodeImage(img);

  assert.equal(result.payload.type, ZCodeDataType.URL);
  assert.equal(result.payload.content, "https://example.com");
});

test("Decode official sample: locked_secret.png (Password Protected)", async () => {
  const decoder = new ZCodeDecoder();
  const img = readPng(path.join(samplesDir, "locked_secret.png"));
  const result = decoder.decodeImage(img);

  assert.equal(result.payload.isLocked, true);
  assert.equal(result.payload.content, "");

  // Wrong password should fail
  await assert.rejects(async () => {
    await ZCodeDecoder.unlock(result.payload, "wrong_password");
  });

  // Correct password should unlock payload
  const unlocked = await ZCodeDecoder.unlock(result.payload, "zihan123");
  assert.equal(unlocked.isLocked, false);
  assert.equal(unlocked.content, "Hello Zihan");
});

