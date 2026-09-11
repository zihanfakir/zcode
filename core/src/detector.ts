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
    // Strategy 1: Center candidate detection using concentric bullseye ratio (1:1:2.5:1:1)
    // Scan horizontal lines at regular step
    const stepY = Math.max(2, Math.floor(height / 160));

    // Compute dynamic binarization threshold (Otsu-like or global average)
    let sum = 0;
    const sampleStep = Math.max(1, Math.floor(gray.length / 4000));
    let sampleCount = 0;
    for (let i = 0; i < gray.length; i += sampleStep) {
      sum += gray[i];
      sampleCount++;
    }
    const avgThresh = sum / sampleCount;

    // Fast concentric candidate search
    const candidates: Array<{ x: number; y: number; estimatedR: number; centerDiskLen: number }> = [];

    for (let y = stepY * 4; y < height - stepY * 4; y += stepY) {
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

      // Check sequences of 5 runs: [Dark, Light, Dark, Light, Dark]
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
          const r2 = runs[i + 2].length; // Center disk
          const r3 = runs[i + 3].length;
          const r4 = runs[i + 4].length;

          // Expected ratio: ~1 : 1 : 2.6 : 1 : 1
          const unit = (r0 + r1 + r3 + r4) / 4;
          if (unit >= 2) {
            const diff0 = Math.abs(r0 - unit) / unit;
            const diff1 = Math.abs(r1 - unit) / unit;
            const diff3 = Math.abs(r3 - unit) / unit;
            const diff4 = Math.abs(r4 - unit) / unit;
            const centerRatio = r2 / unit;

            if (diff0 < 0.65 && diff1 < 0.65 && diff3 < 0.65 && diff4 < 0.65 && centerRatio >= 1.5 && centerRatio <= 4.0) {
              const centerX = runs[i + 2].startX + r2 / 2;
              // Center bullseye total diameter is 0.40 * codeRadius (from -0.20 to +0.20)
              const estimatedCodeRadius = (r0 + r1 + r2 + r3 + r4) / 0.40;
              candidates.push({ x: centerX, y, estimatedR: estimatedCodeRadius, centerDiskLen: r2 });
            }
          }
        }
      }
    }

    // If candidate found via bullseye scan:
    if (candidates.length > 0) {
      // Find candidate with maximum center disk chord length (closest to true horizontal center diameter)
      let bestCandidate = candidates[0];
      for (const c of candidates) {
        if (c.centerDiskLen > bestCandidate.centerDiskLen) {
          bestCandidate = c;
        }
      }

      // Refine (cx, cy) using orthogonal cross-sections of the central disk
      const approxCx = bestCandidate.x;
      const approxCy = bestCandidate.y;

      let leftX = approxCx;
      while (leftX > 1 && gray[Math.round(approxCy) * width + Math.round(leftX)] < avgThresh) {
        leftX--;
      }
      let rightX = approxCx;
      while (rightX < width - 2 && gray[Math.round(approxCy) * width + Math.round(rightX)] < avgThresh) {
        rightX++;
      }
      const refinedCx = (leftX + rightX) / 2;

      let topY = approxCy;
      while (topY > 1 && gray[Math.round(topY) * width + Math.round(refinedCx)] < avgThresh) {
        topY--;
      }
      let bottomY = approxCy;
      while (bottomY < height - 2 && gray[Math.round(bottomY) * width + Math.round(refinedCx)] < avgThresh) {
        bottomY++;
      }
      const refinedCy = (topY + bottomY) / 2;

      // Refine radius via radial ray casting from refined center
      const refined = this.refineCircle(gray, width, height, refinedCx, refinedCy, bestCandidate.estimatedR);
      if (refined) return refined;

      return {
        cx: refinedCx,
        cy: refinedCy,
        radius: bestCandidate.estimatedR,
      };
    }

    // Fallback strategy: Image center and bounding box (for cropped scans / screenshots)
    const fallbackRadius = Math.min(width, height) * 0.45;
    const fallbackRefined = this.refineCircle(gray, width, height, width / 2, height / 2, fallbackRadius);
    if (fallbackRefined) return fallbackRefined;

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
    approxRadius: number
  ): { cx: number; cy: number; radius: number } | null {
    const numRays = 36;
    const edgePoints: Array<{ x: number; y: number; r: number }> = [];

    for (let k = 0; k < numRays; k++) {
      const angle = (k * 2 * Math.PI) / numRays;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Search from outside margin inwards toward center
      const maxR = approxRadius * 1.25;
      const minR = approxRadius * 0.80;

      for (let r = maxR; r >= minR; r -= 1.0) {
        const x1 = approxCx + (r - 2) * cosA;
        const y1 = approxCy + (r - 2) * sinA;
        const x2 = approxCx + (r + 2) * cosA;
        const y2 = approxCy + (r + 2) * sinA;

        const valInner = this.sampleBilinear(gray, width, height, x1, y1);
        const valOuter = this.sampleBilinear(gray, width, height, x2, y2);
        // Outer ring outer edge: outer is light (margin), inner is dark (outer ring)
        const grad = valOuter - valInner;

        if (grad > 80 && valInner < 128 && valOuter > 128) {
          edgePoints.push({
            x: approxCx + r * cosA,
            y: approxCy + r * sinA,
            r,
          });
          break; // First edge encountered from outside is the true outer framing ring!
        }
      }
    }

    if (edgePoints.length >= 12) {
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
    const numSamples = 360;
    const sampledIntensities = new Float32Array(numSamples);

    // Sample intensities around orientation ring (inverted so dark dots = high value)
    for (let deg = 0; deg < numSamples; deg++) {
      const rad = (deg * Math.PI) / 180;
      const x = cx + orientRadius * Math.cos(rad);
      const y = cy + orientRadius * Math.sin(rad);
      sampledIntensities[deg] = 255 - this.sampleBilinear(gray, width, height, x, y);
    }

    // Cross-correlate against the 32-bit SYNC_PATTERN
    // Angle per sync bit = 360 / 32 = 11.25 degrees
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

      // Also check directional key pip at orientation angle = 0, radius = 0.235 * radius
      const keyRad = (shift * Math.PI) / 180;
      const keyX = cx + (0.235 * radius) * Math.cos(keyRad);
      const keyY = cy + (0.235 * radius) * Math.sin(keyRad);
      const keyVal = 255 - this.sampleBilinear(gray, width, height, keyX, keyY);
      corr += keyVal * 1.5; // Bonus for alignment with directional key pip

      if (corr > maxCorrelation) {
        maxCorrelation = corr;
        bestDeg = shift;
      }
    }

    return (bestDeg * Math.PI) / 180;
  }

  /**
   * Samples bits from all 7 data tracks using polar sampling and adaptive thresholding.
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

    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const trackRadius = track.radius * radius;
      const numSectors = track.numSectors;

      // Sample dark intensity (255 - luminance) for each sector
      const trackValues = new Float32Array(numSectors);
      let minVal = Infinity;
      let maxVal = -Infinity;

      for (let s = 0; s < numSectors; s++) {
        const angle = rotationAngle + (s / numSectors) * 2 * Math.PI;

        // Multi-point sampling around expected dot center (cross shape)
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

      // Adaptive threshold for this specific track
      const threshold = minVal + (maxVal - minVal) * 0.45;

      for (let s = 0; s < numSectors; s++) {
        bits.push(trackValues[s] >= threshold);
      }
    }

    return bits;
  }
}
