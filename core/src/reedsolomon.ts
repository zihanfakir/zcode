import { GaloisField, defaultGF } from "./gf.js";

/**
 * Systematic Reed-Solomon Codec over GF(256).
 * Handles both encoding and full error-correction decoding via Berlekamp-Massey,
 * Chien search, and Forney algorithm.
 */
export class ReedSolomon {
  private gf: GaloisField;
  public readonly numEccBytes: number;
  private generatorPoly: Uint8Array;

  constructor(numEccBytes: number, gf: GaloisField = defaultGF) {
    if (numEccBytes <= 0 || numEccBytes >= 255) {
      throw new Error(`Invalid number of ECC bytes: ${numEccBytes}`);
    }
    this.gf = gf;
    this.numEccBytes = numEccBytes;
    this.generatorPoly = this.buildGenerator(numEccBytes);
  }

  /**
   * Builds the generator polynomial g(x) = prod_{i=0}^{numEccBytes-1} (x - alpha^i)
   */
  private buildGenerator(eccLen: number): Uint8Array {
    let g: Uint8Array = new Uint8Array([1]);
    for (let i = 0; i < eccLen; i++) {
      const term = new Uint8Array([1, this.gf.exp(i)]);
      g = this.gf.polyMul(g, term);
    }
    return g;
  }

  /**
   * Systematic encode: takes data bytes of length k, returns full codeword
   * of length k + numEccBytes (data followed by parity bytes).
   */
  public encode(data: Uint8Array): Uint8Array {
    const padded = new Uint8Array(data.length + this.numEccBytes);
    padded.set(data, 0);

    const { remainder } = this.gf.polyDiv(padded, this.generatorPoly);

    const codeword = new Uint8Array(data.length + this.numEccBytes);
    codeword.set(data, 0);
    codeword.set(remainder, data.length);
    return codeword;
  }

  /**
   * Decodes a received codeword. Corrects up to floor(numEccBytes / 2) symbol errors.
   * Returns corrected data bytes (first length - numEccBytes bytes).
   * Throws an error if too many errors are present.
   */
  public decode(receivedCodeword: Uint8Array): Uint8Array {
    const n = receivedCodeword.length;
    const k = n - this.numEccBytes;
    if (k <= 0) {
      throw new Error(`Codeword length ${n} must be greater than ECC bytes ${this.numEccBytes}`);
    }

    // 1. Calculate syndromes: S_i = r(alpha^i) for i = 0 .. numEccBytes - 1
    const syndromes = new Uint8Array(this.numEccBytes);
    let hasError = false;
    for (let i = 0; i < this.numEccBytes; i++) {
      const s = this.gf.polyEval(receivedCodeword, this.gf.exp(i));
      syndromes[i] = s;
      if (s !== 0) hasError = true;
    }

    if (!hasError) {
      return receivedCodeword.slice(0, k);
    }

    // 2. Berlekamp-Massey algorithm to find error locator polynomial Lambda(x)
    // S(x) = S[0] + S[1]*x + ... + S[2t-1]*x^(2t-1)
    let lambda: Uint8Array = new Uint8Array([1]);
    let b: Uint8Array = new Uint8Array([1]);
    let l = 0;

    for (let i = 0; i < this.numEccBytes; i++) {
      // Discrepancy delta = sum_{j=0}^l (lambda_j * S_{i - j})
      let delta = syndromes[i];
      for (let j = 1; j <= l; j++) {
        if (j < lambda.length) {
          delta ^= this.gf.mul(lambda[lambda.length - 1 - j], syndromes[i - j]);
        }
      }

      // Shift b by multiplying by x
      const bShifted = new Uint8Array(b.length + 1);
      bShifted.set(b, 0);

      if (delta !== 0) {
        const scaledB = this.gf.polyScale(bShifted, delta);
        const newLambda = this.gf.polyAdd(lambda, scaledB);

        if (2 * l <= i) {
          b = this.gf.polyScale(lambda, this.gf.inv(delta));
          l = i + 1 - l;
        } else {
          b = bShifted;
        }
        lambda = newLambda;
      } else {
        b = bShifted;
      }
    }

    const numErrors = l;
    if (numErrors > Math.floor(this.numEccBytes / 2)) {
      throw new Error(`Too many errors to correct: found ${numErrors}, max correctable is ${Math.floor(this.numEccBytes / 2)}`);
    }

    // 3. Chien search: find roots of Lambda(x)
    // An error at index pos (from 0 to n-1) corresponds to root at alpha^-(n - 1 - pos)
    const errorPositions: number[] = [];
    for (let pos = 0; pos < n; pos++) {
      const power = (n - 1 - pos) % 255;
      const invAlpha = this.gf.exp((255 - power) % 255);
      // Evaluate Lambda at invAlpha:
      // Note: Lambda in BM is Lambda(x) = 1 + L_1*x + ...
      // In poly array, lambda[lambda.length - 1] is constant term 1
      let val = 0;
      let xPower = 1;
      for (let deg = 0; deg < lambda.length; deg++) {
        const coef = lambda[lambda.length - 1 - deg];
        val ^= this.gf.mul(coef, xPower);
        xPower = this.gf.mul(xPower, invAlpha);
      }

      if (val === 0) {
        errorPositions.push(pos);
      }
    }

    if (errorPositions.length !== numErrors) {
      throw new Error(`Could not find all error roots (${errorPositions.length} found, expected ${numErrors})`);
    }

    // 4. Forney algorithm to compute error values
    // Error evaluator Omega(x) = (S(x) * Lambda(x)) mod x^(numEccBytes)
    // S_poly: syndromes in ascending powers S[0] + S[1]*x + ...
    const sLen = syndromes.length;
    const omega = new Uint8Array(sLen);
    for (let i = 0; i < sLen; i++) {
      let sum = 0;
      for (let j = 0; j <= i && j < lambda.length; j++) {
        const lCoef = lambda[lambda.length - 1 - j];
        const sCoef = syndromes[i - j];
        sum ^= this.gf.mul(lCoef, sCoef);
      }
      omega[i] = sum;
    }

    // Correct codeword
    const corrected = new Uint8Array(receivedCodeword);
    for (const pos of errorPositions) {
      const power = (n - 1 - pos) % 255;
      const xiInv = this.gf.exp((255 - power) % 255); // alpha^-j

      // Omega(alpha^-j)
      let omegaVal = 0;
      let xPower = 1;
      for (let i = 0; i < omega.length; i++) {
        omegaVal ^= this.gf.mul(omega[i], xPower);
        xPower = this.gf.mul(xPower, xiInv);
      }

      // Lambda'(x): formal derivative evaluated at xiInv
      // (sum_{i odd} Lambda_i * x^(i - 1))
      let lambdaPrimeVal = 0;
      let dPower = 1;
      for (let deg = 1; deg < lambda.length; deg += 2) {
        const coef = lambda[lambda.length - 1 - deg];
        lambdaPrimeVal ^= this.gf.mul(coef, dPower);
        dPower = this.gf.mul(dPower, this.gf.mul(xiInv, xiInv));
      }

      if (lambdaPrimeVal === 0) {
        throw new Error("Derivative evaluated to zero in Forney algorithm");
      }

      const xi = this.gf.exp(power);
      const errorMagnitude = this.gf.mul(xi, this.gf.div(omegaVal, lambdaPrimeVal));
      corrected[pos] ^= errorMagnitude;
    }

    // 5. Verify corrected codeword syndromes
    for (let i = 0; i < this.numEccBytes; i++) {
      if (this.gf.polyEval(corrected, this.gf.exp(i)) !== 0) {
        throw new Error("Failed post-correction syndrome verification");
      }
    }

    return corrected.slice(0, k);
  }
}
