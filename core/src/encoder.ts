import { CRC16 } from "./crc.js";
import {
  ZCodeDataType,
  ZCodeFormat,
  V1_TOTAL_DATA_BYTES,
  V1_ECC_BYTES,
  FLAG_ENCRYPTED,
  URL_PREFIXES,
  V1_MAX_PAYLOAD,
  V1_MAX_ENCRYPTED_PAYLOAD,
} from "./format.js";
import { ZCodeGeometry } from "./geometry.js";
import { ReedSolomon } from "./reedsolomon.js";
import { ZCodeCrypto } from "./crypto.js";

export interface ZCodeEncodedData {
  type: ZCodeDataType;
  content: string;
  bytes: Uint8Array;       // 85 bytes
  bits: boolean[];         // 680 bits
  isLocked?: boolean;
}

export interface ZCodeEncodeOptions {
  forceType?: ZCodeDataType;
  password?: string;
  fileName?: string;
}

export class ZCodeEncoder {
  private rs: ReedSolomon;

  constructor() {
    this.rs = new ReedSolomon(V1_ECC_BYTES);
  }

  /**
   * Synchronously encodes unencrypted content (up to 63 bytes direct).
   */
  public encodeSync(content: string, forceType?: ZCodeDataType): ZCodeEncodedData {
    const type = forceType ?? (ZCodeFormat.isUrl(content) ? ZCodeDataType.URL : ZCodeDataType.TEXT);

    // 1. Pack data block (71 bytes total: header + payload + pad + 2 bytes for CRC)
    const dataBlock = ZCodeFormat.pack(type, content);

    // 2. Compute CRC-16 over the first 69 bytes (header + payload + pad)
    const dataForCrc = dataBlock.slice(0, V1_TOTAL_DATA_BYTES - 2);
    const crc = CRC16.calculate(dataForCrc);
    dataBlock[V1_TOTAL_DATA_BYTES - 2] = (crc >> 8) & 0xFF;
    dataBlock[V1_TOTAL_DATA_BYTES - 1] = crc & 0xFF;

    // 3. Generate Reed-Solomon Parity (14 bytes) -> 85 bytes total codeword
    const fullCodeword = this.rs.encode(dataBlock);

    if (fullCodeword.length !== ZCodeGeometry.TOTAL_BYTES) {
      throw new Error(`Unexpected codeword length: ${fullCodeword.length} != ${ZCodeGeometry.TOTAL_BYTES}`);
    }

    // 4. Expand bytes to bits (MSB first)
    const bits: boolean[] = new Array(ZCodeGeometry.TOTAL_BITS);
    let bitIdx = 0;
    for (let i = 0; i < fullCodeword.length; i++) {
      const byte = fullCodeword[i];
      for (let b = 7; b >= 0; b--) {
        bits[bitIdx++] = ((byte >> b) & 1) === 1;
      }
    }

    return {
      type,
      content,
      bytes: fullCodeword,
      bits,
      isLocked: false,
    };
  }

  /**
   * Asynchronously encodes content, with optional password protection via AES-256-GCM + PBKDF2.
   */
  public async encodeAsync(
    content: string,
    passwordOrOptions?: string | ZCodeEncodeOptions,
    forceType?: ZCodeDataType,
    _options?: ZCodeEncodeOptions
  ): Promise<ZCodeEncodedData> {
    let password: string | undefined;
    let actualType: ZCodeDataType | undefined = forceType;

    if (typeof passwordOrOptions === "object" && passwordOrOptions !== null) {
      password = passwordOrOptions.password;
      actualType = forceType ?? passwordOrOptions.forceType;
    } else {
      password = passwordOrOptions;
    }

    const type = actualType ?? (ZCodeFormat.isUrl(content) ? ZCodeDataType.URL : ZCodeDataType.TEXT);
    const textEncoder = new TextEncoder();
    const contentBytes = textEncoder.encode(content);

    const maxDirectLimit = password ? V1_MAX_ENCRYPTED_PAYLOAD : V1_MAX_PAYLOAD;
    if (contentBytes.length > maxDirectLimit) {
      throw new Error(
        `Payload size (${contentBytes.length} bytes) exceeds maximum Direct Optical limit of ${maxDirectLimit} bytes.`
      );
    }

    if (!password) {
      return this.encodeSync(content, actualType);
    }

    let textToEncrypt = type === ZCodeDataType.URL ? content.trim() : content;
    let flags = FLAG_ENCRYPTED;

    if (type === ZCodeDataType.URL) {
      const prefixOrder = [3, 4, 1, 2];
      for (const idx of prefixOrder) {
        const prefix = URL_PREFIXES[idx];
        if (textToEncrypt.toLowerCase().startsWith(prefix)) {
          flags |= idx;
          textToEncrypt = textToEncrypt.slice(prefix.length);
          break;
        }
      }
    }

    const plaintextBytes = textEncoder.encode(textToEncrypt);

    // Encrypt payload with AES-256-GCM
    const envelope = await ZCodeCrypto.encrypt(password, plaintextBytes);
    const packedEnvelope = ZCodeCrypto.packEnvelope(envelope);

    // Pack into 71-byte data block
    const dataBlock = ZCodeFormat.packRaw(type, flags, packedEnvelope);

    // Compute CRC-16
    const dataForCrc = dataBlock.slice(0, V1_TOTAL_DATA_BYTES - 2);
    const crc = CRC16.calculate(dataForCrc);
    dataBlock[V1_TOTAL_DATA_BYTES - 2] = (crc >> 8) & 0xFF;
    dataBlock[V1_TOTAL_DATA_BYTES - 1] = crc & 0xFF;

    // Reed-Solomon Parity
    const fullCodeword = this.rs.encode(dataBlock);

    // Expand bytes to bits
    const bits: boolean[] = new Array(ZCodeGeometry.TOTAL_BITS);
    let bitIdx = 0;
    for (let i = 0; i < fullCodeword.length; i++) {
      const byte = fullCodeword[i];
      for (let b = 7; b >= 0; b--) {
        bits[bitIdx++] = ((byte >> b) & 1) === 1;
      }
    }

    return {
      type,
      content,
      bytes: fullCodeword,
      bits,
      isLocked: true,
    };
  }

  /**
   * Main entry point:
   * - encode(content) -> ZCodeEncodedData
   * - encode(content, { password }) -> Promise<ZCodeEncodedData>
   * - encode(content, { forceType }) -> ZCodeEncodedData
   */
  public encode(content: string): ZCodeEncodedData;
  public encode(content: string, options: { password: string; forceType?: ZCodeDataType; fileName?: string }): Promise<ZCodeEncodedData>;
  public encode(content: string, options: { password?: undefined; forceType?: ZCodeDataType; fileName?: string }): ZCodeEncodedData;
  public encode(content: string, options?: ZCodeEncodeOptions): ZCodeEncodedData | Promise<ZCodeEncodedData>;
  public encode(content: string, options?: ZCodeEncodeOptions): any {
    if (options?.password) {
      return this.encodeAsync(content, options.password, options.forceType, options);
    }
    return this.encodeSync(content, options?.forceType);
  }
}
