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
import { ZCodeCrypto } from "../src/crypto.js";

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

test("Reed-Solomon RS(85, 71) with 14 ECC bytes corrects up to 7 errors", () => {
  const rs = new ReedSolomon(14);
  const originalData = new Uint8Array(71);
  for (let i = 0; i < 71; i++) {
    originalData[i] = (i * 7 + 13) & 0xFF;
  }

  const codeword = rs.encode(originalData);
  assert.equal(codeword.length, 85);

  // 0 errors
  const decoded0 = rs.decode(codeword);
  assert.deepEqual(decoded0, originalData);

  // 1 error
  const corrupted1 = new Uint8Array(codeword);
  corrupted1[5] ^= 0xFF;
  const decoded1 = rs.decode(corrupted1);
  assert.deepEqual(decoded1, originalData);

  // 4 errors
  const corrupted4 = new Uint8Array(codeword);
  corrupted4[2] ^= 0x33;
  corrupted4[15] ^= 0xAA;
  corrupted4[42] ^= 0x55;
  corrupted4[60] ^= 0x77;
  const decoded4 = rs.decode(corrupted4);
  assert.deepEqual(decoded4, originalData);

  // 7 errors (maximum correctable for 14 parity bytes: t = 14 / 2 = 7)
  const corrupted7 = new Uint8Array(codeword);
  corrupted7[0] ^= 0x12;
  corrupted7[10] ^= 0x34;
  corrupted7[20] ^= 0x56;
  corrupted7[30] ^= 0x78;
  corrupted7[45] ^= 0x9A;
  corrupted7[65] ^= 0xBC;
  corrupted7[80] ^= 0xDE;
  const decoded7 = rs.decode(corrupted7);
  assert.deepEqual(decoded7, originalData);

  // 8 errors (should fail)
  const corrupted8 = new Uint8Array(corrupted7);
  corrupted8[4] ^= 0xEF;
  assert.throws(() => {
    rs.decode(corrupted8);
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

test("ZCodeCrypto: AES-256-GCM + PBKDF2 encryption, decryption & tampering", async () => {
  const password = "correct-horse-battery-staple";
  const plaintext = new TextEncoder().encode("TopSecret123");

  const envelope = await ZCodeCrypto.encrypt(password, plaintext);
  assert.equal(envelope.salt.length, 8);
  assert.equal(envelope.iv.length, 12);
  assert.equal(envelope.tag.length, 16);
  assert.equal(envelope.ciphertext.length, plaintext.length);

  // Success with correct password
  const decrypted = await ZCodeCrypto.decrypt(password, envelope);
  assert.deepEqual(decrypted, plaintext);

  // Failure with wrong password
  await assert.rejects(async () => {
    await ZCodeCrypto.decrypt("wrong-password", envelope);
  });

  // Failure with corrupted ciphertext
  const tamperedCiphertext = new Uint8Array(envelope.ciphertext);
  tamperedCiphertext[0] ^= 0x01;
  await assert.rejects(async () => {
    await ZCodeCrypto.decrypt(password, { ...envelope, ciphertext: tamperedCiphertext });
  });

  // Failure with corrupted auth tag
  const tamperedTag = new Uint8Array(envelope.tag);
  tamperedTag[0] ^= 0x01;
  await assert.rejects(async () => {
    await ZCodeCrypto.decrypt(password, { ...envelope, tag: tamperedTag });
  });

  // Envelope packing/unpacking
  const packed = ZCodeCrypto.packEnvelope(envelope);
  assert.equal(packed.length, 36 + plaintext.length);
  const unpacked = ZCodeCrypto.unpackEnvelope(packed);
  assert.deepEqual(unpacked.salt, envelope.salt);
  assert.deepEqual(unpacked.iv, envelope.iv);
  assert.deepEqual(unpacked.tag, envelope.tag);
  assert.deepEqual(unpacked.ciphertext, envelope.ciphertext);
});

test("Password-Protected Z-Code End-to-End: 'Hello Zihan'", async () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const password = "mySecretKey";

  const encoded = await encoder.encode(text, { password });
  assert.equal(encoded.isLocked, true);
  assert.equal(encoded.bytes.length, ZCodeGeometry.TOTAL_BYTES);
  assert.equal(encoded.bits.length, ZCodeGeometry.TOTAL_BITS);

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.isLocked, true);
  assert.equal(decoded.payload.content, "");

  // Wrong password fails
  await assert.rejects(async () => {
    await ZCodeDecoder.unlock(decoded.payload, "wrongKey");
  });

  // Correct password unlocks content
  const unlocked = await ZCodeDecoder.unlock(decoded.payload, password);
  assert.equal(unlocked.isLocked, false);
  assert.equal(unlocked.content, text);
});

test("Password-Protected Z-Code End-to-End: 'https://example.com'", async () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const url = "https://example.com";
  const password = "urlPassword123";

  const encoded = await encoder.encode(url, { password });
  assert.equal(encoded.isLocked, true);

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.isLocked, true);
  assert.equal(decoded.payload.content, "");

  const unlocked = await ZCodeDecoder.unlock(decoded.payload, password);
  assert.equal(unlocked.isLocked, false);
  assert.equal(unlocked.type, ZCodeDataType.URL);
  assert.equal(unlocked.content, url);
});

test("Password-Protected Optical Scan Round-Trip", async () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const text = "Hello Zihan";
  const password = "scanPassword456";

  const encoded = await encoder.encode(text, { password });
  const image = ZCodeRenderer.renderToImageBuffer(encoded, { size: 512, rotationAngle: Math.PI / 3 });

  const result = decoder.decodeImage(image);
  assert.equal(result.payload.isLocked, true);
  assert.equal(result.payload.content, "");

  const unlocked = await ZCodeDecoder.unlock(result.payload, password);
  assert.equal(unlocked.isLocked, false);
  assert.equal(unlocked.content, text);
});

test("Longest URL prefix compression: 'https://www.' is not shadowed by 'https://'", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const url = "https://www.google.com";
  const encoded = encoder.encode(url);

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.type, ZCodeDataType.URL);
  assert.equal(decoded.payload.flags, 3); // Prefix 3 is "https://www."
  assert.equal(decoded.payload.content, url);
});

test("Text payload whitespace preservation (no unwanted trimming)", () => {
  const encoder = new ZCodeEncoder();
  const decoder = new ZCodeDecoder();

  const spacedText = "  leading and trailing  ";
  const encoded = encoder.encode(spacedText, { forceType: ZCodeDataType.TEXT });

  const decoded = decoder.decodeBits(encoded.bits);
  assert.equal(decoded.payload.content, spacedText);
});

test("GaloisField edge cases: empty polyMul and small dividend polyDiv", () => {
  const gf = new GaloisField();
  const empty1 = gf.polyMul(new Uint8Array(0), new Uint8Array([1, 2, 3]));
  assert.equal(empty1.length, 0);

  // Dividend length 2 < divisor length 4
  const dividend = new Uint8Array([5, 6]);
  const divisor = new Uint8Array([1, 2, 3, 4]);
  const divRes = gf.polyDiv(dividend, divisor);
  assert.equal(divRes.quotient.length, 0);
  assert.equal(divRes.remainder.length, 3); // divisor.length - 1
  assert.deepEqual(Array.from(divRes.remainder), [0, 5, 6]);
});
