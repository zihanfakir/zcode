/**
 * CRC-16-CCITT (Polynomial: 0x1021, Init: 0xFFFF)
 * Used in Z-Code for packet integrity verification.
 */

const CRC_TABLE = new Uint16Array(256);

// Precompute CRC table
for (let i = 0; i < 256; i++) {
  let curr = (i << 8) & 0xFFFF;
  for (let j = 0; j < 8; j++) {
    if ((curr & 0x8000) !== 0) {
      curr = ((curr << 1) ^ 0x1021) & 0xFFFF;
    } else {
      curr = (curr << 1) & 0xFFFF;
    }
  }
  CRC_TABLE[i] = curr;
}

export class CRC16 {
  public static calculate(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      const tableIndex = ((crc >> 8) ^ byte) & 0xFF;
      crc = ((crc << 8) ^ CRC_TABLE[tableIndex]) & 0xFFFF;
    }
    return crc;
  }

  public static append(data: Uint8Array): Uint8Array {
    const crc = this.calculate(data);
    const result = new Uint8Array(data.length + 2);
    result.set(data, 0);
    result[data.length] = (crc >> 8) & 0xFF;
    result[data.length + 1] = crc & 0xFF;
    return result;
  }

  public static verify(dataWithCrc: Uint8Array): boolean {
    if (dataWithCrc.length < 2) return false;
    const data = dataWithCrc.slice(0, dataWithCrc.length - 2);
    const expectedCrc = (dataWithCrc[dataWithCrc.length - 2] << 8) | dataWithCrc[dataWithCrc.length - 1];
    const actualCrc = this.calculate(data);
    return expectedCrc === actualCrc;
  }
}
