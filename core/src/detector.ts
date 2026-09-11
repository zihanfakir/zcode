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
   * Detects Z-Code circular boundary and center from a grayscale image.
   */
  public static locateCode(gray: Uint8Array, width: number, height: number): { cx: number; cy: number; radius: number } | null {
    let sum = 0;
    let minLum = 255;
    let maxLum = 0;
    const sampleStep = Math.max(1, Math.floor(gray.length / 4000));
    let sampleCount = 0;
    for (let i = 0; i < gray.length; i += sampleStep) {
      const v = gray[i];
      sum += v;
      if (v < minLum) minLum = v;
      if (v > maxLum) maxLum = v;
      sampleCount++;
    }

    if (maxLum - minLum < 18) {
      return null;
    }

    const avgThresh = (minLum + maxLum) / 2;
    const contrast = maxLum - minLum;

    // Helper: Cross-verify vertically at column cx
    const checkVertical = (cx: number, approxY: number, hDiskLen: number) => {
      const colX = Math.round(cx);
      if (colX < 2 || colX >= width - 2) return null;

      let runLength = 0;
      let isDark = gray[colX] < avgThresh;
      const runs: Array<{ isDark: boolean; length: number; startY: number }> = [];

      for (let y = 0; y < height; y++) {
        const dark = gray[y * width + colX] < avgThresh;
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
        if (
          runs[i].isDark &&
          !runs[i + 1].isDark &&
          runs[i + 2].isDark &&
          !runs[i + 3].isDark &&
          runs[i + 4].isDark
        ) {
          const r0 = runs[i].length;
          const r1 = runs[i + 1].length;
          const r2 = runs[i + 2].length;
          const r3 = runs[i + 3].length;
          const r4 = runs[i + 4].length;

          const unit = (r0 + r1 + r3 + r4) / 4;
          if (unit >= 1.5) {
            const centerRatio = r2 / unit;
            if (centerRatio >= 1.3 && centerRatio <= 4.2) {
              const vertCy = runs[i + 2].startY + r2 / 2;
              if (Math.abs(vertCy - approxY) <= Math.max(hDiskLen, r2) * 0.8) {
                const aspectDiff = Math.abs(hDiskLen - r2) / Math.max(hDiskLen, r2);
                if (aspectDiff < 0.40) {
                  const estRadius = (r0 + r1 + r2 + r3 + r4) / 0.40;
                  return { cy: vertCy, radius: estRadius, vDiskLen: r2 };
                }
              }
            }
          }
        }
      }
      return null;
    };

    // Horizontal scanning for 1:1:2.6:1:1 candidate bullseye
    const stepY = Math.max(2, Math.floor(height / 180));
    const verifiedCandidates: Array<{ cx: number; cy: number; radius: number; diskLen: number }> = [];

    for (let y = stepY * 2; y < height - stepY * 2; y += stepY) {
      let runLength = 0;
      let isDark = gray[y * width] < avgThresh;
      const runs: Array<{ isDark: boolean; length: number; startX: number }> = [];

      for (let x = 0; x < width; x++) {
        const dark = gray[y * width + x] < avgThresh;
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
        if (
          runs[i].isDark &&
          !runs[i + 1].isDark &&
          runs[i + 2].isDark &&
          !runs[i + 3].isDark &&
          runs[i + 4].isDark
        ) {
          const r0 = runs[i].length;
          const r1 = runs[i + 1].length;
          const r2 = runs[i + 2].length;
          const r3 = runs[i + 3].length;
          const r4 = runs[i + 4].length;

          const unit = (r0 + r1 + r3 + r4) / 4;
          if (unit >= 1.5) {
            const diff0 = Math.abs(r0 - unit) / unit;
            const diff1 = Math.abs(r1 - unit) / unit;
            const diff3 = Math.abs(r3 - unit) / unit;
            const diff4 = Math.abs(r4 - unit) / unit;
            const centerRatio = r2 / unit;

            if (diff0 < 0.70 && diff1 < 0.70 && diff3 < 0.70 && diff4 < 0.70 && centerRatio >= 1.3 && centerRatio <= 4.2) {
              const hCx = runs[i + 2].startX + r2 / 2;
              const vertMatch = checkVertical(hCx, y, r2);
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
          (c) => Math.hypot(c.cx - anchor.cx, c.cy - anchor.cy) <= anchor.diskLen * 0.8
        );
        if (cluster.length > bestCluster.length) {
          bestCluster = cluster;
        }
      }

      const clusterToUse = bestCluster.length > 0 ? bestCluster : verifiedCandidates;
      const approxCx = clusterToUse.reduce((s, c) => s + c.cx, 0) / clusterToUse.length;
      const approxCy = clusterToUse.reduce((s, c) => s + c.cy, 0) / clusterToUse.length;
      const approxR = clusterToUse.reduce((s, c) => s + c.radius, 0) / clusterToUse.length;

      const refined = this.refineCircle(gray, width, height, approxCx, approxCy, approxR, contrast);
      if (refined) return refined;

      return {
        cx: approxCx,
        cy: approxCy,
        radius: approxR,
      };
    }

    // Fallback: Viewfinder center and multiple candidate radii (ideal for live camera scanning)
    const viewCenterRadius = Math.min(width, height) * 0.38;
    const centerRefined = this.refineCircle(gray, width, height, width / 2, height / 2, viewCenterRadius, contrast);
    if (centerRefined) return centerRefined;

    return null;
  }

  /**
   * Refines circle center and radius using radial edge casting from outside margin inward.
   */
  private static refineCircle(
    gray: Uint8Array,
    width: number,
    height: number,
    approxCx: number,
    approxCy: number,
    approxRadius: number,
    contrast: number = 60
  ): { cx: number; cy: number; radius: number } | null {
    const numRays = 36;
    const edgePoints: Array<{ x: number; y: number; r: number }> = [];
    const minGrad = Math.max(15, contrast * 0.20);

    for (let k = 0; k < numRays; k++) {
      const angle = (k * 2 * Math.PI) / numRays;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Search from outside margin inwards toward center
      const maxR = Math.min(Math.min(width, height) * 0.49, approxRadius * 1.25);
      const minR = approxRadius * 0.75;

      for (let r = maxR; r >= minR; r -= 1.0) {
        const x1 = approxCx + (r - 2) * cosA;
        const y1 = approxCy + (r - 2) * sinA;
        const x2 = approxCx + (r + 2) * cosA;
        const y2 = approxCy + (r + 2) * sinA;

        const valInner = this.sampleBilinear(gray, width, height, x1, y1);
        const valOuter = this.sampleBilinear(gray, width, height, x2, y2);
        // Outer ring outer edge: outer is light (margin), inner is dark (outer ring)
        const grad = valOuter - valInner;

        if (grad > minGrad) {
          edgePoints.push({
            x: approxCx + r * cosA,
            y: approxCy + r * sinA,
            r,
          });
          break; // First edge encountered from outside is the true outer framing ring!
        }
      }
    }

    if (edgePoints.length >= 8) {
      const avgR = edgePoints.reduce((sum, p) => sum + p.r, 0) / edgePoints.length;
      return {
        cx: approxCx,
        cy: approxCy,
        radius: avgR,
      };
    }

    return null;
  }

  /**
   * Finds rotation angle theta0 using 1D circular cross-correlation around the orientation track.
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

    // Sample intensities around orientation ring with 3-point radial peak
    for (let deg = 0; deg < numSamples; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      const vCenter = 255 - this.sampleBilinear(gray, width, height, cx + orientRadius * cosA, cy + orientRadius * sinA);
      const vInner = 255 - this.sampleBilinear(gray, width, height, cx + (orientRadius - dotR * 0.5) * cosA, cy + (orientRadius - dotR * 0.5) * sinA);
      const vOuter = 255 - this.sampleBilinear(gray, width, height, cx + (orientRadius + dotR * 0.5) * cosA, cy + (orientRadius + dotR * 0.5) * sinA);

      sampledIntensities[deg] = Math.max(vCenter, vInner, vOuter);
    }

    // Cross-correlate against the 32-bit SYNC_PATTERN
    let bestDeg = 0;
    let maxCorrelation = -Infinity;

    for (let shift = 0; shift < numSamples; shift++) {
      let corr = 0;
      for (let bitIdx = 0; bitIdx < ZCodeGeometry.ORIENTATION_SECTORS; bitIdx++) {
        const bitAngleDeg = (bitIdx * 360) / ZCodeGeometry.ORIENTATION_SECTORS;
        const sampleIdx = ((Math.round(shift + bitAngleDeg) % numSamples) + numSamples) % numSamples;
        const expectedBit = ZCodeGeometry.SYNC_PATTERN[bitIdx];
        const weight = expectedBit === 1 ? 1.0 : -0.8;
        corr += sampledIntensities[sampleIdx] * weight;
      }

      // Key pip bonus
      const keyRad = (shift * Math.PI) / 180;
      const keyX = cx + (0.235 * radius) * Math.cos(keyRad);
      const keyY = cy + (0.235 * radius) * Math.sin(keyRad);
      const keyVal = 255 - this.sampleBilinear(gray, width, height, keyX, keyY);
      corr += keyVal * 1.5;

      if (corr > maxCorrelation) {
        maxCorrelation = corr;
        bestDeg = shift;
      }
    }

    return (bestDeg * Math.PI) / 180;
  }

  /**
   * Samples bits from all data tracks using polar sampling and adaptive thresholding.
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

    // Reference black and white levels from bullseye
    const centerDark = 255 - this.sampleBilinear(gray, width, height, cx, cy);
    const gapDark = 255 - this.sampleBilinear(gray, width, height, cx + radius * 0.11, cy);
    const refContrast = Math.max(20, centerDark - gapDark);

    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const trackRadius = track.radius * radius;
      const numSectors = track.numSectors;

      const trackValues = new Float32Array(numSectors);
      let minVal = Infinity;
      let maxVal = -Infinity;

      for (let s = 0; s < numSectors; s++) {
        const angle = rotationAngle + (s / numSectors) * 2 * Math.PI;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const dotOffset = track.dotRadius * radius * 0.4;

        const valCenter = 255 - this.sampleBilinear(gray, width, height, cx + trackRadius * cosA, cy + trackRadius * sinA);
        const val1 = 255 - this.sampleBilinear(gray, width, height, cx + (trackRadius + dotOffset) * cosA, cy + (trackRadius + dotOffset) * sinA);
        const val2 = 255 - this.sampleBilinear(gray, width, height, cx + (trackRadius - dotOffset) * cosA, cy + (trackRadius - dotOffset) * sinA);

        const avgVal = (valCenter * 2 + val1 + val2) / 4;
        trackValues[s] = avgVal;

        if (avgVal < minVal) minVal = avgVal;
        if (avgVal > maxVal) maxVal = avgVal;
      }

      const trackContrast = maxVal - minVal;
      if (trackContrast < refContrast * 0.25) {
        // Track is homogeneous
        const isAllDark = maxVal > (gapDark + refContrast * 0.55);
        for (let s = 0; s < numSectors; s++) {
          bits.push(isAllDark);
        }
      } else {
        const threshold = minVal + trackContrast * 0.45;
        for (let s = 0; s < numSectors; s++) {
          bits.push(trackValues[s] >= threshold);
        }
      }
    }

    return bits;
  }
}
