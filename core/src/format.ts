/**
 * Z-Code Binary Protocol & Packet Format Specification
 */

export enum ZCodeDataType {
  TEXT = 0x01,
  URL = 0x02,
}

export interface ZCodePayload {
  type: ZCodeDataType;
  content: string;
  version: number;
}

export const ZCODE_MAGIC_0 = 0x5A; // 'Z'
export const ZCODE_MAGIC_1 = 0x43; // 'C'
export const ZCODE_VERSION_1 = 0x01;

// Packet structural constants for Version 1
export const V1_MAX_PAYLOAD_BYTES = 30;
export const V1_DATA_HEADER_BYTES = 6; // [Magic0, Magic1, Version, DataType, Flags, PayloadLen]
export const V1_CRC_BYTES = 2;
export const V1_ECC_BYTES = 10;
export const V1_DATA_BLOCK_BYTES = V1_DATA_HEADER_BYTES + V1_MAX_PAYLOAD_BYTES + V1_CRC_BYTES; // 6 + 30 + 2 = 38 bytes
// Total codeword: 38 + 10 = 48 bytes = 384 bits or 49 bytes = 392 bits.
// Let's align exactly with our 7 data tracks (32 + 40 + 48 + 56 + 64 + 72 + 80 = 392 bits = 49 bytes):
// 49 bytes = 39 data bytes (6 header + 31 payload + 2 CRC) + 10 ECC bytes!
export const V1_MAX_PAYLOAD = 31;
export const V1_TOTAL_DATA_BYTES = 39; // 6 header + 31 max payload + 2 CRC = 39 bytes
export const V1_TOTAL_CODEWORD_BYTES = 49; // 39 data + 10 ECC = 49 bytes = 392 bits!

export const URL_PREFIXES = [
  "",                 // 0: None
  "https://",         // 1
  "http://",          // 2
  "https://www.",     // 3
  "http://www.",      // 4
];

export class ZCodeFormat {
  /**
   * Detects whether text looks like a URL.
   */
  public static isUrl(text: string): boolean {
    const trimmed = text.trim();
    return /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+/i.test(trimmed) ||
           /^www\.[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+/i.test(trimmed);
  }

  /**
   * Serializes a text or URL payload into a 39-byte unencoded data block (before ECC).
   */
  public static pack(type: ZCodeDataType, rawContent: string): Uint8Array {
    let content = rawContent.trim();
    let flags = 0;

    if (type === ZCodeDataType.URL) {
      // Check for prefix compression
      for (let i = 1; i < URL_PREFIXES.length; i++) {
        const prefix = URL_PREFIXES[i];
        if (content.toLowerCase().startsWith(prefix)) {
          flags = i;
          content = content.slice(prefix.length);
          break;
        }
      }
    }

    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(content);

    if (payloadBytes.length > V1_MAX_PAYLOAD) {
      throw new Error(
        `Payload length (${payloadBytes.length} bytes) exceeds Z-Code V1 limit of ${V1_MAX_PAYLOAD} bytes.`
      );
    }

    const block = new Uint8Array(V1_TOTAL_DATA_BYTES);
    block[0] = ZCODE_MAGIC_0;
    block[1] = ZCODE_MAGIC_1;
    block[2] = ZCODE_VERSION_1;
    block[3] = type;
    block[4] = flags;
    block[5] = payloadBytes.length;

    // Copy payload
    block.set(payloadBytes, V1_DATA_HEADER_BYTES);

    // Deterministic padding
    for (let i = V1_DATA_HEADER_BYTES + payloadBytes.length; i < V1_TOTAL_DATA_BYTES - V1_CRC_BYTES; i++) {
      block[i] = (i % 2 === 0) ? 0xAA : 0x55;
    }

    return block;
  }

  /**
   * Unpacks a verified 39-byte data block into a ZCodePayload object.
   */
  public static unpack(dataBlock: Uint8Array): ZCodePayload {
    if (dataBlock.length < V1_DATA_HEADER_BYTES + V1_CRC_BYTES) {
      throw new Error("Invalid data block size");
    }

    if (dataBlock[0] !== ZCODE_MAGIC_0 || dataBlock[1] !== ZCODE_MAGIC_1) {
      throw new Error("Invalid Z-Code magic header");
    }

    const version = dataBlock[2];
    if (version !== ZCODE_VERSION_1) {
      throw new Error(`Unsupported Z-Code version: ${version}`);
    }

    const type = dataBlock[3] as ZCodeDataType;
    if (type !== ZCodeDataType.TEXT && type !== ZCodeDataType.URL) {
      throw new Error(`Unknown data type: ${type}`);
    }

    const flags = dataBlock[4];
    const payloadLen = dataBlock[5];

    if (payloadLen > V1_MAX_PAYLOAD) {
      throw new Error(`Invalid payload length: ${payloadLen}`);
    }

    const payloadRaw = dataBlock.slice(V1_DATA_HEADER_BYTES, V1_DATA_HEADER_BYTES + payloadLen);
    const decoder = new TextDecoder("utf-8");
    let content = decoder.decode(payloadRaw);

    if (type === ZCodeDataType.URL) {
      const prefixIndex = flags & 0x0F;
      if (prefixIndex > 0 && prefixIndex < URL_PREFIXES.length) {
        content = URL_PREFIXES[prefixIndex] + content;
      }
    }

    return {
      type,
      content,
      version,
    };
  }
}
