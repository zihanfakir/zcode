import test from "node:test";
import assert from "node:assert/strict";

import { GaloisField } from "../src/gf.js";
import { ReedSolomon } from "../src/reedsolomon.js";
import { CRC16 } from "../src/crc.js";
import { ZCodeFormat, ZCodeDataType } from "../src/format.js";
import { ZCodeEncoder } from "../src/encoder.js";
import { ZCodeDecoder } from "../src/decoder.js";
import { ZCodeDetector } from "../src/detector.js";
import { ZCodeRenderer } from "../src/renderer.js";
import { ZCodeGeometry } from "../src/geometry.js";

test("GaloisField GF(256) basic arithmetic", () => {
  const gf = new GaloisField();

  // Identity and inverse
  assert.equal(gf.add(0x55, 0x55), 0);
  assert.equal(gf.sub(0xAA, 0xAA), 0);
  assert.equal(gf.mul(1, 0x42), 0x42);
  assert.equal(gf.mul(0, 0x42), 0);

  // Multiplicative inverse
  for (let i = 1; i < 256; i++) {
    const inv = gf.inv(i);
    assert.equal(gf.mul(i, inv), 1, `Failed inverse for ${i}`);
  }

  // Division
  assert.equal(gf.div(0x80, 0x02), 0x40);
  assert.equal(gf.div(0x42, 0x42), 1);
});

test("CRC-16 calculation and tamper verification", () => {
  const data = new TextEncoder().encode("Hello Zihan");
  const crc = CRC16.calculate(data);
  assert.ok(crc > 0);

  const appended = CRC16.append(data);
  assert.equal(CRC16.verify(appended), true);

  // Tamper with one byte
  appended[2] ^= 0x01;
  assert.equal(CRC16.verify(appended), false);
});

test("Reed-Solomon RS(49, 39) with 10 ECC bytes corrects up to 5 errors", () => {
  const rs = new ReedSolomon(10);
  const originalData = new Uint8Array(39);
  for (let i = 0; i < 39; i++) {
    originalData[i] = (i * 7 + 13) & 0xFF;
  }

  const codeword = rs.encode(originalData);
  assert.equal(codeword.length, 49);

  // 0 errors
  const decoded0 = rs.decode(codeword);
  assert.deepEqual(decoded0, originalData);

  // 1 error
  const corrupted1 = new Uint8Array(codeword);
  corrupted1[5] ^= 0xFF;
  const decoded1 = rs.decode(corrupted1);
  assert.deepEqual(decoded1, originalData);

  // 3 errors
  const corrupted3 = new Uint8Array(codeword);
  corrupted3[2] ^= 0x33;
  corrupted3[15] ^= 0xAA;
  corrupted3[42] ^= 0x55;
  const decoded3 = rs.decode(corrupted3);
  assert.deepEqual(decoded3, originalData);

  // 5 errors (maximum correctable for 10 parity bytes: t = 10 / 2 = 5)
  const corrupted5 = new Uint8Array(codeword);
  corrupted5[0] ^= 0x12;
  corrupted5[10] ^= 0x34;
  corrupted5[20] ^= 0x56;
  corrupted5[30] ^= 0x78;
  corrupted5[45] ^= 0x9A;
  const decoded5 = rs.decode(corrupted5);
  assert.deepEqual(decoded5, originalData);

  // 6 errors (should fail)
  const corrupted6 = new Uint8Array(corrupted5);
  corrupted6[4] ^= 0xEF;
  assert.throws(() => {
    rs.decode(corrupted6);
  });
});

test("End-to-end Round Trip: 'Hello Zihan'", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);

  assert.equal(encoded.type, ZCodeDataType.TEXT);
  assert.equal(encoded.bytes.length, ZCodeGeometry.TOTAL_BYTES);
  assert.equal(encoded.bits.length, ZCodeGeometry.TOTAL_BITS);

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.type, ZCodeDataType.TEXT);
  assert.equal(decoded.payload.content, text);
  assert.equal(decoded.errorsCorrected, 0);
});

test("End-to-end Round Trip: 'https://example.com'", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const url = "https://example.com";
  const encoded = encoder.encode(url);

  assert.equal(encoded.type, ZCodeDataType.URL);
  assert.equal(encoded.bytes.length, ZCodeGeometry.TOTAL_BYTES);
  assert.equal(encoded.bits.length, ZCodeGeometry.TOTAL_BITS);

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.type, ZCodeDataType.URL);
  assert.equal(decoded.payload.content, url);
  assert.equal(decoded.errorsCorrected, 0);
});

test("Error Recovery under damage: 'Hello Zihan' with corrupted bits", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);

  // Corrupt bits across 3 different bytes in different tracks
  const damagedBits = [...encoded.bits];
  // Corrupt in track 0
  damagedBits[10] = !damagedBits[10];
  damagedBits[11] = !damagedBits[11];
  // Corrupt in track 3
  damagedBits[150] = !damagedBits[150];
  // Corrupt in track 5
  damagedBits[270] = !damagedBits[270];

  const decoded = decoder.decodeBits(damagedBits);
  assert.equal(decoded.payload.content, text);
  assert.ok(decoded.errorsCorrected > 0, "Should report corrected errors");
});

test("SVG Renderer outputs valid circular geometry", () => {
  const encoder = new ZCodeEncoder();
  const encoded = encoder.encode("Hello Zihan");

  const svg = ZCodeRenderer.renderToSVG(encoded, { size: 512 });
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("</svg>"));
  assert.ok(svg.includes("<circle")); // Concentric rings and dots
  assert.ok(svg.includes("viewBox=\"0 0 512 512\""));
});

test("Optical Scan Round-Trip: 'Hello Zihan' at 0 deg rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: 0 });

  const gray = ZCodeDetector.toGrayscale(image);
  const loc = ZCodeDetector.locateCode(gray, image.width, image.height);
  if (loc) {
    const rot = ZCodeDetector.findOrientation(gray, image.width, image.height, loc.cx, loc.cy, loc.radius);
    console.log("DETECTION DEBUG:", { loc, rotDeg: (rot * 180) / Math.PI });
  }

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.TEXT);
  assert.equal(result.payload.content, text);
});

test("Optical Scan Round-Trip: 'https://example.com' at 90 deg rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const url = "https://example.com";
  const encoded = encoder.encode(url);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: Math.PI / 2 });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.URL);
  assert.equal(result.payload.content, url);
});

test("Optical Scan Round-Trip: 'Hello Zihan' at 180 deg rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: Math.PI });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.TEXT);
  assert.equal(result.payload.content, text);
});

test("Optical Scan Round-Trip: 'Hello Zihan' at 270 deg rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: (3 * Math.PI) / 2 });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.TEXT);
  assert.equal(result.payload.content, text);
});

test("Optical Scan Round-Trip: 'Hello Zihan' at 45 deg diagonal rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const encoded = encoder.encode(text);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: Math.PI / 4 });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.TEXT);
  assert.equal(result.payload.content, text);
});

test("Optical Scan Round-Trip: 'https://example.com' at 135 deg diagonal rotation", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const url = "https://example.com";
  const encoded = encoder.encode(url);
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: (3 * Math.PI) / 4 });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.type, ZCodeDataType.URL);
  assert.equal(result.payload.content, url);
});


