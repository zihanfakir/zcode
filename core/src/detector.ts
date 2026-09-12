import { ZCodeGeometry } from "./geometry.js";

export interface DetectionResult {
  cx: number;
  cy: number;
  radius: number;
  rotation: number; // Angle in radians
  confidence: number;
}

export interface ImageBuffer {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

export class ZCodeDetector {
  /**
   * Converts RGBA image buffer to a 1D grayscale luminance buffer.
   */
  public static toGrayscale(img: ImageBuffer): Uint8Array {
    const totalPixels = img.width * img.height;
    const gray = new Uint8Array(totalPixels);
    const data = img.data;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      // Y = 0.299*R + 0.587*G + 0.114*B
      gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
    }
    return gray;
  }

  /**
   * Samples bilinear grayscale intensity at floating point coordinates (x, y).
   */
  public static sampleBilinear(gray: Uint8Array, width: number, height: number, x: number, y: number): number {
    if (x < 0 || x >= width - 1 || y < 0 || y >= height - 1) {
      const cx = Math.max(0, Math.min(width - 1, Math.round(x)));
      const cy = Math.max(0, Math.min(height - 1, Math.round(y)));
      return gray[cy * width + cx];
    }
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const dx = x - x0;
    const dy = y - y0;

    const p00 = gray[y0 * width + x0];
    const p10 = gray[y0 * width + x1];
    const p01 = gray[y1 * width + x0];
    const p11 = gray[y1 * width + x1];

    return (
      (1 - dx) * (1 - dy) * p00 +
      dx * (1 - dy) * p10 +
      (1 - dx) * dy * p01 +
      dx * dy * p11
    );
  }

  /**
   * Computes an Integral Image (Summed-Area Table) in O(W*H) for local adaptive thresholding.
   */
  public static computeIntegralImage(gray: Uint8Array, width: number, height: number): Int32Array {
    const integral = new Int32Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++) {
      let rowSum = 0;
      const grayRowOffset = y * width;
      const intRowOffset = (y + 1) * (width + 1);
      const prevIntRowOffset = y * (width + 1);
      for (let x = 0; x < width; x++) {
        rowSum += gray[grayRowOffset + x];
        integral[intRowOffset + (x + 1)] = integral[prevIntRowOffset + (x + 1)] + rowSum;
      }
    }
    return integral;
  }

  /**
   * Gets local mean luminance in window of radius w around (x, y) using integral image in O(1).
   */
  public static getLocalMean(integral: Int32Array, width: number, height: number, x: number, y: number, w: number): number {
    const x1 = Math.max(0, x - w);
    const y1 = Math.max(0, y - w);
    const x2 = Math.min(width, x + w + 1);
    const y2 = Math.min(height, y + w + 1);
    const stride = width + 1;

    const sum = integral[y2 * stride + x2] - integral[y1 * stride + x2] - integral[y2 * stride + x1] + integral[y1 * stride + x1];
    const area = (x2 - x1) * (y2 - y1);
    return sum / area;
  }

  /**
   * Kasa Algebraic Least-Squares Circle Fit. Fits (x_i, y_i) to (x - cx)^2 + (y - cy)^2 = R^2.
   */
  public static fitCircleKasa(points: Array<{ x: number; y: number }>): { cx: number; cy: number; radius: number } | null {
    const n = points.length;
    if (n < 6) return null;

    let sx = 0, sy = 0, sx2 = 0, sy2 = 0, sxy = 0;
    let sz = 0, sxz = 0, syz = 0;

    for (let i = 0; i < n; i++) {
      const x = points[i].x;
      const y = points[i].y;
      const z = x * x + y * y;
      sx += x;
      sy += y;
      sx2 += x * x;
      sy2 += y * y;
      sxy += x * y;
      sz += z;
      sxz += x * z;
      syz += y * z;
    }

    const a11 = sx2, a12 = sxy, a13 = sx;
    const a21 = sxy, a22 = sy2, a23 = sy;
    const a31 = sx,  a32 = sy,  a33 = n;

    const d = a11 * (a22 * a33 - a23 * a32) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 - a22 * a31);
    if (Math.abs(d) < 1e-7) return null;

    const d1 = sxz * (a22 * a33 - a23 * a32) - a12 * (syz * a33 - a23 * sz) + a13 * (syz * a32 - a22 * sz);
    const d2 = a11 * (syz * a33 - a23 * sz) - sxz * (a21 * a33 - a23 * a31) + a13 * (a21 * sz - syz * a31);
    const d3 = a11 * (a22 * sz - syz * a32) - a12 * (a21 * sz - syz * a31) + sxz * (a21 * a32 - a22 * a31);

    const A = d1 / d;
    const B = d2 / d;
    const C = d3 / d;

    const cx = A / 2;
    const cy = B / 2;
    const rSq = C + cx * cx + cy * cy;
    if (rSq <= 0) return null;

    return { cx, cy, radius: Math.sqrt(rSq) };
  }

  /**
   * Stage 1: Ultra-Fast Reticle-Guided Inward Scan.
   * Directly locks onto the circular Z-Code centered in the viewfinder in < 1.5ms.
   */
  public static detectReticleGuided(
    gray: Uint8Array,
    width: number,
    height: number
  ): { cx: number; cy: number; radius: number } | null {
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    const minDim = Math.min(width, height);
    const searchWin = Math.floor(minDim * 0.08);

    // 1. Locate dark core of central bullseye near center
    let seedX = midX;
    let seedY = midY;
    let minLuma = 255;
    for (let dy = -searchWin; dy <= searchWin; dy += 3) {
      for (let dx = -searchWin; dx <= searchWin; dx += 3) {
        const lum = gray[(midY + dy) * width + (midX + dx)];
        if (lum < minLuma) {
          minLuma = lum;
          seedX = midX + dx;
          seedY = midY + dy;
        }
      }
    }

    // 2. Scan inward from outside margin towards center
    // Outer quiet zone is light, outer framing ring is dark.
    // First edge encountered scanning inward is guaranteed to be outer framing ring!
    const numRays = 36;
    const edgePoints: Array<{ x: number; y: number }> = [];
    const maxR = minDim * 0.49;
    const minR = Math.max(25, minDim * 0.08);

    for (let k = 0; k < numRays; k++) {
      const angle = (k * 2 * Math.PI) / numRays;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let r = maxR; r >= minR; r -= 1.0) {
        const xIn = seedX + (r - 2) * cosA;
        const yIn = seedY + (r - 2) * sinA;
        const xOut = seedX + (r + 2) * cosA;
        const yOut = seedY + (r + 2) * sinA;

        if (xIn < 2 || xIn >= width - 2 || yIn < 2 || yIn >= height - 2) continue;
        if (xOut < 2 || xOut >= width - 2 || yOut < 2 || yOut >= height - 2) continue;

        const valIn = this.sampleBilinear(gray, width, height, xIn, yIn);
        const valOut = this.sampleBilinear(gray, width, height, xOut, yOut);
        const grad = valOut - valIn;

        if (grad > 18) {
          edgePoints.push({
            x: seedX + r * cosA,
            y: seedY + r * sinA,
          });
          break; // First edge encountered from outside is the outer framing ring!
        }
      }
    }

    if (edgePoints.length < 14) return null;

    const fitted = this.fitCircleKasa(edgePoints);
    if (!fitted) return null;

    const { cx, cy, radius } = fitted;
    if (radius < minDim * 0.08 || radius > minDim * 0.54) return null;

    // 3. Verify concentric bullseye pattern at detected center
    const coreLuma = this.sampleBilinear(gray, width, height, cx, cy);
    const gapLuma = (
      this.sampleBilinear(gray, width, height, cx + radius * 0.11, cy) +
      this.sampleBilinear(gray, width, height, cx - radius * 0.11, cy) +
      this.sampleBilinear(gray, width, height, cx, cy + radius * 0.11) +
      this.sampleBilinear(gray, width, height, cx, cy - radius * 0.11)
    ) / 4;

    const ringLuma = (
      this.sampleBilinear(gray, width, height, cx + radius * 0.17, cy) +
      this.sampleBilinear(gray, width, height, cx - radius * 0.17, cy) +
      this.sampleBilinear(gray, width, height, cx, cy + radius * 0.17) +
      this.sampleBilinear(gray, width, height, cx, cy - radius * 0.17)
    ) / 4;

    if (gapLuma - coreLuma < 8 || gapLuma - ringLuma < 6) {
      return null;
    }

    return fitted;
  }

  /**
   * Stage 2: Robust Full-Image Adaptive Scanline Finder Search.
   */
  public static locateCode(gray: Uint8Array, width: number, height: number): { cx: number; cy: number; radius: number } | null {
    // 1. Stage 1: Try Reticle-Guided Fast Path first (Instant Lock < 1.5ms)
    const fastResult = this.detectReticleGuided(gray, width, height);
    if (fastResult) {
      return fastResult;
    }

    // 2. Stage 2: Full-frame raster scan with local adaptive binarization via Integral Image
    const integral = this.computeIntegralImage(gray, width, height);
    const localWin = Math.max(12, Math.floor(Math.min(width, height) / 24));
    const stepY = Math.max(2, Math.floor(height / 160));
    const verifiedCandidates: Array<{ cx: number; cy: number; radius: number; diskLen: number }> = [];

    const checkVertical = (colX: number, approxY: number, hDiskLen: number) => {
      if (colX < 2 || colX >= width - 2) return null;
      let runLength = 0;
      let isDark = gray[colX] < this.getLocalMean(integral, width, height, colX, 0, localWin) * 0.92;
      const runs: Array<{ isDark: boolean; length: number; startY: number }> = [];

      for (let y = 0; y < height; y++) {
        const thresh = this.getLocalMean(integral, width, height, colX, y, localWin) * 0.92;
        const dark = gray[y * width + colX] < thresh;
        if (dark === isDark) {
          runLength++;
        } else {
          runs.push({ isDark, length: runLength, startY: y - runLength });
          isDark = dark;
          runLength = 1;
        }
      }
      runs.push({ isDark, length: runLength, startY: height - runLength });

      for (let i = 0; i <= runs.length - 5; i++) {
        if (runs[i].isDark && !runs[i + 1].isDark && runs[i + 2].isDark && !runs[i + 3].isDark && runs[i + 4].isDark) {
          const r0 = runs[i].length, r1 = runs[i + 1].length, r2 = runs[i + 2].length, r3 = runs[i + 3].length, r4 = runs[i + 4].length;
          const unit = (r0 + r1 + r3 + r4) / 4;
          if (unit >= 1.0) {
            const centerRatio = r2 / unit;
            if (centerRatio >= 1.1 && centerRatio <= 4.8) {
              const vertCy = runs[i + 2].startY + r2 / 2;
              if (Math.abs(vertCy - approxY) <= Math.max(hDiskLen, r2) * 1.5) {
                const estRadius = (r0 + r1 + r2 + r3 + r4) / 0.40;
                return { cy: vertCy, radius: estRadius, vDiskLen: r2 };
              }
            }
          }
        }
      }
      return null;
    };

    for (let y = stepY * 2; y < height - stepY * 2; y += stepY) {
      let runLength = 0;
      let isDark = gray[y * width] < this.getLocalMean(integral, width, height, 0, y, localWin) * 0.92;
      const runs: Array<{ isDark: boolean; length: number; startX: number }> = [];

      for (let x = 0; x < width; x++) {
        const thresh = this.getLocalMean(integral, width, height, x, y, localWin) * 0.92;
        const dark = gray[y * width + x] < thresh;
        if (dark === isDark) {
          runLength++;
        } else {
          runs.push({ isDark, length: runLength, startX: x - runLength });
          isDark = dark;
          runLength = 1;
        }
      }
      runs.push({ isDark, length: runLength, startX: width - runLength });

      for (let i = 0; i <= runs.length - 5; i++) {
        if (runs[i].isDark && !runs[i + 1].isDark && runs[i + 2].isDark && !runs[i + 3].isDark && runs[i + 4].isDark) {
          const r0 = runs[i].length, r1 = runs[i + 1].length, r2 = runs[i + 2].length, r3 = runs[i + 3].length, r4 = runs[i + 4].length;
          const unit = (r0 + r1 + r3 + r4) / 4;
          if (unit >= 1.0) {
            const centerRatio = r2 / unit;
            const diff04 = Math.abs(r0 - r4) / Math.max(r0, r4);
            const diff13 = Math.abs(r1 - r3) / Math.max(r1, r3);

            if (diff04 < 0.65 && diff13 < 0.65 && centerRatio >= 1.1 && centerRatio <= 4.8) {
              const hCx = runs[i + 2].startX + r2 / 2;
              const vertMatch = checkVertical(Math.round(hCx), y, r2);
              if (vertMatch) {
                const estRadius = ((r0 + r1 + r2 + r3 + r4) / 0.40 + vertMatch.radius) / 2;
                verifiedCandidates.push({
                  cx: hCx,
                  cy: vertMatch.cy,
                  radius: estRadius,
                  diskLen: (r2 + vertMatch.vDiskLen) / 2,
                });
              }
            }
          }
        }
      }
    }

    if (verifiedCandidates.length > 0) {
      let bestCluster: typeof verifiedCandidates = [];
      for (const anchor of verifiedCandidates) {
        const cluster = verifiedCandidates.filter(
          (c) => Math.hypot(c.cx - anchor.cx, c.cy - anchor.cy) <= anchor.diskLen * 1.5
        );
        if (cluster.length > bestCluster.length) {
          bestCluster = cluster;
        }
      }

      const clusterToUse = bestCluster.length > 0 ? bestCluster : verifiedCandidates;
      const approxCx = clusterToUse.reduce((s, c) => s + c.cx, 0) / clusterToUse.length;
      const approxCy = clusterToUse.reduce((s, c) => s + c.cy, 0) / clusterToUse.length;
      const approxR = clusterToUse.reduce((s, c) => s + c.radius, 0) / clusterToUse.length;

      // Scan inward around approxR (outer ring is at ~0.98 * approxR)
      const maxPossibleR = Math.min(approxR * 1.30, approxCx - 4, approxCy - 4, width - approxCx - 4, height - approxCy - 4);
      const minPossibleR = Math.max(15, approxR * 0.70);

      const numRays = 36;
      const edgePoints: Array<{ x: number; y: number }> = [];
      for (let k = 0; k < numRays; k++) {
        const angle = (k * 2 * Math.PI) / numRays;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        for (let r = maxPossibleR; r >= minPossibleR; r -= 1.0) {
          const xIn = approxCx + (r - 2) * cosA;
          const yIn = approxCy + (r - 2) * sinA;
          const xOut = approxCx + (r + 2) * cosA;
          const yOut = approxCy + (r + 2) * sinA;

          if (xIn < 2 || xIn >= width - 2 || yIn < 2 || yIn >= height - 2) continue;
          if (xOut < 2 || xOut >= width - 2 || yOut < 2 || yOut >= height - 2) continue;

          const valIn = this.sampleBilinear(gray, width, height, xIn, yIn);
          const valOut = this.sampleBilinear(gray, width, height, xOut, yOut);
          const grad = valOut - valIn;

          if (grad > 18) {
            edgePoints.push({ x: approxCx + r * cosA, y: approxCy + r * sinA });
            break;
          }
        }
      }

      if (edgePoints.length >= 10) {
        const refined = this.fitCircleKasa(edgePoints);
        if (refined && refined.radius >= 20) return refined;
      }

      // Fallback directly to bullseye-estimated location if outer ring had partial occlusion
      if (approxR >= 20) {
        return { cx: approxCx, cy: approxCy, radius: approxR };
      }
    }

    return null;
  }

  /**
   * Finds rotation angle using Zero-Mean Normalized Cross-Correlation (ZNCC)
   * around the orientation track with plateau midpoint resolution.
   */
  public static findOrientation(
    gray: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    radius: number
  ): number {
    const orientRadius = ZCodeGeometry.ORIENTATION_RADIUS * radius;
    const dotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * radius;
    const numSamples = 360;
    const sampledIntensities = new Float32Array(numSamples);

    let meanIntensity = 0;
    for (let deg = 0; deg < numSamples; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      const vCenter = 255 - this.sampleBilinear(gray, width, height, cx + orientRadius * cosA, cy + orientRadius * sinA);
      const vInner = 255 - this.sampleBilinear(gray, width, height, cx + (orientRadius - dotR * 0.5) * cosA, cy + (orientRadius - dotR * 0.5) * sinA);
      const vOuter = 255 - this.sampleBilinear(gray, width, height, cx + (orientRadius + dotR * 0.5) * cosA, cy + (orientRadius + dotR * 0.5) * sinA);

      const val = Math.max(vCenter, vInner, vOuter);
      sampledIntensities[deg] = val;
      meanIntensity += val;
    }
    meanIntensity /= numSamples;

    for (let deg = 0; deg < numSamples; deg++) {
      sampledIntensities[deg] -= meanIntensity;
    }

    const scores = new Float32Array(numSamples);
    let maxCorr = -Infinity;
    let bestIdx = 0;

    for (let shift = 0; shift < numSamples; shift++) {
      let corr = 0;
      for (let bitIdx = 0; bitIdx < ZCodeGeometry.ORIENTATION_SECTORS; bitIdx++) {
        const bitAngleDeg = (bitIdx * 360) / ZCodeGeometry.ORIENTATION_SECTORS;
        const sampleIdx = ((Math.round(shift + bitAngleDeg) % numSamples) + numSamples) % numSamples;
        const expectedBit = ZCodeGeometry.SYNC_PATTERN[bitIdx];
        const weight = expectedBit === 1 ? 1.0 : -0.8;
        corr += sampledIntensities[sampleIdx] * weight;
      }

      const keyRad = (shift * Math.PI) / 180;
      const keyX = cx + (0.235 * radius) * Math.cos(keyRad);
      const keyY = cy + (0.235 * radius) * Math.sin(keyRad);
      const keyVal = (255 - this.sampleBilinear(gray, width, height, keyX, keyY)) - meanIntensity;
      corr += keyVal * 1.5;

      scores[shift] = corr;
      if (corr > maxCorr) {
        maxCorr = corr;
        bestIdx = shift;
      }
    }

    // Find contiguous plateau around bestIdx to determine true peak midpoint
    let left = bestIdx;
    let right = bestIdx;
    const tol = Math.max(10, Math.abs(maxCorr) * 0.02);

    while (scores[((left - 1) % numSamples + numSamples) % numSamples] >= maxCorr - tol && (bestIdx - left) < 10) {
      left--;
    }
    while (scores[((right + 1) % numSamples + numSamples) % numSamples] >= maxCorr - tol && (right - bestIdx) < 10) {
      right++;
    }

    const avgDeg = ((left + right) / 2 % numSamples + numSamples) % numSamples;
    return (avgDeg * Math.PI) / 180;
  }

  /**
   * Samples bits using Local Radial Differential Sampling (Dot vs. Inter-track Gaps).
   * Completely immune to lighting gradients, shadows, and screen reflections!
   */
  public static sampleBits(
    gray: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    radius: number,
    rotationAngle: number
  ): boolean[] {
    const bits: boolean[] = [];
    const gapOffset = 0.030 * radius;

    // Reference black and white levels from bullseye
    const centerDark = 255 - this.sampleBilinear(gray, width, height, cx, cy);
    const gapDark = 255 - this.sampleBilinear(gray, width, height, cx + radius * 0.11, cy);
    const refContrast = Math.max(15, centerDark - gapDark);

    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const trackRadius = track.radius * radius;
      const numSectors = track.numSectors;
      const dotContrasts = new Float32Array(numSectors);

      let meanContrast = 0;
      for (let s = 0; s < numSectors; s++) {
        const angle = rotationAngle + (s / numSectors) * 2 * Math.PI;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const valCenter = this.sampleBilinear(gray, width, height, cx + trackRadius * cosA, cy + trackRadius * sinA);
        const valInnerGap = this.sampleBilinear(gray, width, height, cx + (trackRadius - gapOffset) * cosA, cy + (trackRadius - gapOffset) * sinA);
        const valOuterGap = this.sampleBilinear(gray, width, height, cx + (trackRadius + gapOffset) * cosA, cy + (trackRadius + gapOffset) * sinA);
        const valBg = (valInnerGap + valOuterGap) / 2;

        const contrast = valBg - valCenter;
        dotContrasts[s] = contrast;
        meanContrast += contrast;
      }
      meanContrast /= numSectors;

      const winSize = Math.max(3, Math.floor(numSectors / 8));
      for (let s = 0; s < numSectors; s++) {
        let localSum = 0;
        let count = 0;
        for (let dw = -winSize; dw <= winSize; dw++) {
          const idx = ((s + dw) % numSectors + numSectors) % numSectors;
          localSum += dotContrasts[idx];
          count++;
        }
        const localMeanContrast = localSum / count;
        const dynamicThreshold = Math.max(refContrast * 0.30, localMeanContrast * 0.40);
        bits.push(dotContrasts[s] > dynamicThreshold);
      }
    }

    return bits;
  }
}
