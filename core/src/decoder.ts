import { CRC16 } from "./crc.js";
import { ZCodeDetector, ImageBuffer } from "./detector.js";
import { ZCodeFormat, ZCodePayload, ZCodeDataType, URL_PREFIXES, V1_TOTAL_DATA_BYTES, V1_ECC_BYTES } from "./format.js";
import { ZCodeGeometry } from "./geometry.js";
import { ReedSolomon } from "./reedsolomon.js";
import { ZCodeCrypto } from "./crypto.js";


export interface ZCodeDecodedResult {
  payload: ZCodePayload;
  rotation: number;         // Detected rotation in radians
  errorsCorrected: number;  // Number of Reed-Solomon symbol errors repaired
  location: {
    cx: number;
    cy: number;
    radius: number;
  };
}

export class ZCodeDecoder {
  private rs: ReedSolomon;

  constructor() {
    this.rs = new ReedSolomon(V1_ECC_BYTES);
  }

  /**
   * Decodes Z-Code from an ImageBuffer (RGBA data from Canvas, Video Frame, or Image file).
   */
  public decodeImage(image: ImageBuffer): ZCodeDecodedResult {
    const gray = ZCodeDetector.toGrayscale(image);
    return this.decodeGrayscale(gray, image.width, image.height);
  }

  /**
   * Decodes Z-Code from a grayscale luminance buffer.
   */
  public decodeGrayscale(gray: Uint8Array, width: number, height: number): ZCodeDecodedResult {
    // 1. Locate center and radius of circular code
    const location = ZCodeDetector.locateCode(gray, width, height);
    if (!location) {
      throw new Error("Could not detect Z-Code circular boundary in image");
    }

    // 2. Find orientation angle
    const rotation = ZCodeDetector.findOrientation(
      gray,
      width,
      height,
      location.cx,
      location.cy,
      location.radius
    );

    // 3. Multi-pass sub-degree angle, radius scale, and sub-pixel center jitter
    const candidateOffsets = [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.0, -2.0];
    const candidateRadii = [1.0, 0.99, 1.01, 0.98, 1.02];
    const centerJitters = [
      { dx: 0, dy: 0 },
      { dx: 0.5, dy: 0 }, { dx: -0.5, dy: 0 },
      { dx: 0, dy: 0.5 }, { dx: 0, dy: -0.5 },
      { dx: 1.0, dy: 0 }, { dx: -1.0, dy: 0 },
      { dx: 0, dy: 1.0 }, { dx: 0, dy: -1.0 },
    ];
    let lastError: Error | null = null;

    for (const jitter of centerJitters) {
      const curCx = location.cx + jitter.dx;
      const curCy = location.cy + jitter.dy;

      for (const radScale of candidateRadii) {
        const curRadius = location.radius * radScale;
        for (const degOffset of candidateOffsets) {
          const angle = rotation + (degOffset * Math.PI) / 180;
          const bits = ZCodeDetector.sampleBits(
            gray,
            width,
            height,
            curCx,
            curCy,
            curRadius,
            angle
          );

          try {
            return this.decodeBits(bits, angle, { cx: curCx, cy: curCy, radius: curRadius });
          } catch (err) {
            lastError = err as Error;
          }
        }
      }
    }

    throw lastError ?? new Error("Failed to decode Z-Code from image");
  }

  /**
   * Decodes a boolean bit array directly.
   */
  public decodeBits(
    bits: boolean[],
    rotation: number = 0,
    location = { cx: 0, cy: 0, radius: 0 }
  ): ZCodeDecodedResult {
    if (bits.length !== ZCodeGeometry.TOTAL_BITS) {
      throw new Error(`Invalid bit length: ${bits.length} != ${ZCodeGeometry.TOTAL_BITS}`);
    }

    // Assemble bits into bytes
    const receivedCodeword = new Uint8Array(ZCodeGeometry.TOTAL_BYTES);
    let bitIdx = 0;
    for (let i = 0; i < ZCodeGeometry.TOTAL_BYTES; i++) {
      let byte = 0;
      for (let b = 7; b >= 0; b--) {
        if (bits[bitIdx++]) {
          byte |= (1 << b);
        }
      }
      receivedCodeword[i] = byte;
    }

    // 5. Reed-Solomon Error Correction
    let correctedDataBlock: Uint8Array;
    let errorsCorrected = 0;

    try {
      correctedDataBlock = this.rs.decode(receivedCodeword);
      // Count differing bytes between received and corrected
      for (let i = 0; i < V1_TOTAL_DATA_BYTES; i++) {
        if (receivedCodeword[i] !== correctedDataBlock[i]) {
          errorsCorrected++;
        }
      }
    } catch (rsErr) {
      throw new Error(`Reed-Solomon error correction failed: ${(rsErr as Error).message}`);
    }

    // 6. Verify CRC-16 Checksum
    const dataForCrc = correctedDataBlock.slice(0, V1_TOTAL_DATA_BYTES - 2);
    const expectedCrc = (correctedDataBlock[V1_TOTAL_DATA_BYTES - 2] << 8) | correctedDataBlock[V1_TOTAL_DATA_BYTES - 1];
    const actualCrc = CRC16.calculate(dataForCrc);

    if (expectedCrc !== actualCrc) {
      throw new Error(`CRC-16 checksum verification failed (expected 0x${expectedCrc.toString(16)}, got 0x${actualCrc.toString(16)})`);
    }

    // 7. Unpack payload
    const payload = ZCodeFormat.unpack(correctedDataBlock);

    return {
      payload,
      rotation,
      errorsCorrected,
      location,
    };
  }

  /**
   * Unlocks a password-protected ZCodePayload using AES-256-GCM authenticated decryption.
   */
  public static async unlock(payload: ZCodePayload, password: string): Promise<ZCodePayload> {
    if (!payload.isLocked) {
      return payload;
    }

    if (!payload.encryptedData) {
      throw new Error("Cannot unlock Z-Code: missing encrypted payload data.");
    }

    // Unpack envelope: salt (8B), iv (12B), tag (16B), ciphertext
    const envelope = ZCodeCrypto.unpackEnvelope(payload.encryptedData);

    // Decrypt via Web Crypto AES-256-GCM
    const decryptedBytes = await ZCodeCrypto.decrypt(password, envelope);

    // Decode plaintext
    const decoder = new TextDecoder("utf-8");
    let content = decoder.decode(decryptedBytes);

    // Apply URL prefix expansion if necessary
    if (payload.type === ZCodeDataType.URL && payload.flags !== undefined) {
      const prefixIndex = payload.flags & 0x0F;
      if (prefixIndex > 0 && prefixIndex < URL_PREFIXES.length) {
        content = URL_PREFIXES[prefixIndex] + content;
      }
    }

    return {
      type: payload.type,
      content,
      version: payload.version,
      isLocked: false,
      flags: payload.flags,
    };
  }

  /**
   * Instance helper to unlock a password-protected payload.
   */
  public async unlock(payload: ZCodePayload, password: string): Promise<ZCodePayload> {
    return ZCodeDecoder.unlock(payload, password);
  }
}

