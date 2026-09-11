/**
 * Galois Field GF(2^8) Arithmetic for Z-Code Reed-Solomon Error Correction.
 * Primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1 (0x11D / 285)
 * Generator: alpha = 2 (0x02)
 */

export class GaloisField {
  public static readonly FIELD_SIZE = 256;
  public static readonly PRIMITIVE_POLY = 0x11D; // 285

  public readonly expTable = new Uint8Array(512);
  public readonly logTable = new Uint8Array(256);

  constructor() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.expTable[i] = x;
      this.logTable[x] = i;
      x <<= 1;
      if (x & 0x100) {
        x ^= GaloisField.PRIMITIVE_POLY;
      }
    }
    // Duplicate exp table to handle overflow without modulo in multiplication
    for (let i = 255; i < 512; i++) {
      this.expTable[i] = this.expTable[i - 255];
    }
    this.logTable[0] = 0; // By convention
  }

  public add(a: number, b: number): number {
    return (a ^ b) & 0xFF;
  }

  public sub(a: number, b: number): number {
    return (a ^ b) & 0xFF;
  }

  public mul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.expTable[this.logTable[a] + this.logTable[b]];
  }

  public div(a: number, b: number): number {
    if (b === 0) throw new Error("GF division by zero");
    if (a === 0) return 0;
    const diff = this.logTable[a] - this.logTable[b] + 255;
    return this.expTable[diff % 255];
  }

  public inv(a: number): number {
    if (a === 0) throw new Error("GF inversion of zero");
    return this.expTable[255 - this.logTable[a]];
  }

  public exp(power: number): number {
    return this.expTable[((power % 255) + 255) % 255];
  }

  public log(a: number): number {
    if (a === 0) throw new Error("GF logarithm of zero");
    return this.logTable[a];
  }

  /**
   * Evaluate polynomial at point x in GF(256)
   * poly[0] is highest degree coefficient: poly[0]*x^(n-1) + ... + poly[n-1]
   */
  public polyEval(poly: Uint8Array | number[], x: number): number {
    let y = 0;
    for (let i = 0; i < poly.length; i++) {
      y = this.mul(y, x) ^ poly[i];
    }
    return y;
  }

  public polyAdd(p: Uint8Array | number[], q: Uint8Array | number[]): Uint8Array {
    const len = Math.max(p.length, q.length);
    const result = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const pIdx = i + p.length - len;
      const qIdx = i + q.length - len;
      const pVal = pIdx >= 0 ? p[pIdx] : 0;
      const qVal = qIdx >= 0 ? q[qIdx] : 0;
      result[i] = pVal ^ qVal;
    }
    return result;
  }

  public polyMul(p: Uint8Array | number[], q: Uint8Array | number[]): Uint8Array {
    if (p.length === 0 || q.length === 0) {
      return new Uint8Array(0);
    }
    const result = new Uint8Array(p.length + q.length - 1);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < q.length; j++) {
        result[i + j] ^= this.mul(p[i], q[j]);
      }
    }
    return result;
  }

  public polyScale(poly: Uint8Array | number[], scalar: number): Uint8Array {
    const result = new Uint8Array(poly.length);
    for (let i = 0; i < poly.length; i++) {
      result[i] = this.mul(poly[i], scalar);
    }
    return result;
  }

  /**
   * Polynomial division over GF(256).
   * Returns { quotient, remainder }.
   */
  public polyDiv(
    dividend: Uint8Array | number[],
    divisor: Uint8Array | number[]
  ): { quotient: Uint8Array; remainder: Uint8Array } {
    if (divisor.length === 0 || divisor[0] === 0) {
      throw new Error("GF division by zero or invalid divisor polynomial");
    }

    const remainderLen = divisor.length - 1;
    if (dividend.length < divisor.length) {
      const remainder = new Uint8Array(remainderLen);
      remainder.set(dividend, remainderLen - dividend.length);
      return {
        quotient: new Uint8Array(0),
        remainder,
      };
    }

    const out = new Uint8Array(dividend);
    const divisorLead = divisor[0];
    const divisorLeadInv = this.inv(divisorLead);

    for (let i = 0; i <= out.length - divisor.length; i++) {
      const coef = this.mul(out[i], divisorLeadInv);
      if (coef !== 0) {
        for (let j = 0; j < divisor.length; j++) {
          out[i + j] ^= this.mul(divisor[j], coef);
        }
      }
    }

    return {
      quotient: out.slice(0, out.length - remainderLen),
      remainder: out.slice(out.length - remainderLen),
    };
  }
}

export const defaultGF = new GaloisField();
