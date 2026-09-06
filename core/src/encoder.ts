import { CRC16 } from "./crc.js";
import { ZCodeDataType, ZCodeFormat, V1_TOTAL_DATA_BYTES, V1_ECC_BYTES } from "./format.js";
import { ZCodeGeometry } from "./geometry.js";
import { ReedSolomon } from "./reedsolomon.js";

export interface ZCodeEncodedData {
  type: ZCodeDataType;
  content: string;
  bytes: Uint8Array;       // 49 bytes
  bits: boolean[];         // 392 bits
}

export class ZCodeEncoder {
  private rs: ReedSolomon;

  constructor() {
    this.rs = new ReedSolomon(V1_ECC_BYTES);
  }

  /**
   * Encodes a string (URL or plain text) into a full Z-Code binary codeword and bitstream.
   */
  public encode(content: string, forceType?: ZCodeDataType): ZCodeEncodedData {
    const type = forceType ?? (ZCodeFormat.isUrl(content) ? ZCodeDataType.URL : ZCodeDataType.TEXT);

    // 1. Pack data block (39 bytes total: header + payload + pad + 2 bytes for CRC)
    const dataBlock = ZCodeFormat.pack(type, content);

    // 2. Compute CRC-16 over the first 37 bytes (header + payload + pad)
    const dataForCrc = dataBlock.slice(0, V1_TOTAL_DATA_BYTES - 2);
    const crc = CRC16.calculate(dataForCrc);
    dataBlock[V1_TOTAL_DATA_BYTES - 2] = (crc >> 8) & 0xFF;
    dataBlock[V1_TOTAL_DATA_BYTES - 1] = crc & 0xFF;

    // 3. Generate Reed-Solomon Parity (10 bytes) -> 49 bytes total codeword
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
    };
  }
}
