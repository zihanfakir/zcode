import { ImageBuffer } from "./detector.js";
import { ZCodeEncodedData } from "./encoder.js";
import { ZCodeGeometry } from "./geometry.js";

export interface RenderOptions {
  size?: number;             // Width/Height in px (default 512)
  foregroundColor?: string; // Default: "#0F172A" (rich dark slate)
  backgroundColor?: string; // Default: "#FFFFFF"
  margin?: number;           // Margin in px (default 24)
  showCenterZ?: boolean;     // Stylized Z glyph in center (default true)
  rotationAngle?: number;    // In radians (default 0)
}

export class ZCodeRenderer {
  /**
   * Renders Z-Code to a clean, scalable SVG string.
   */
  public static renderToSVG(data: ZCodeEncodedData, options: RenderOptions = {}): string {
    const size = options.size ?? 512;
    const fg = options.foregroundColor ?? "#0F172A";
    const bg = options.backgroundColor ?? "#FFFFFF";
    const margin = options.margin ?? 24;
    const showZ = options.showCenterZ ?? true;
    const rot = options.rotationAngle ?? 0;

    const cx = size / 2;
    const cy = size / 2;
    const codeRadius = (size / 2) - margin;

    const parts: string[] = [];

    // Header & Background
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`
    );
    parts.push(`<rect width="${size}" height="${size}" fill="${bg}" rx="${size / 16}" />`);

    // Group with rotation around center
    const rotDeg = (rot * 180) / Math.PI;
    parts.push(`<g transform="rotate(${rotDeg} ${cx} ${cy})">`);

    // 1. Outer Framing Ring
    const outerRingRadius = ((ZCodeGeometry.OUTER_RING_INNER_RADIUS + ZCodeGeometry.OUTER_RING_OUTER_RADIUS) / 2) * codeRadius;
    const outerStrokeWidth = (ZCodeGeometry.OUTER_RING_OUTER_RADIUS - ZCodeGeometry.OUTER_RING_INNER_RADIUS) * codeRadius;
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${outerRingRadius.toFixed(2)}" fill="none" stroke="${fg}" stroke-width="${outerStrokeWidth.toFixed(2)}" />`
    );

    // Subtle 4 cardinal notches on outer ring
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const notchX = cx + codeRadius * Math.cos(angle);
      const notchY = cy + codeRadius * Math.sin(angle);
      parts.push(
        `<circle cx="${notchX.toFixed(2)}" cy="${notchY.toFixed(2)}" r="${(codeRadius * 0.015).toFixed(2)}" fill="${bg}" />`
      );
    }

    // 2. Central Locator Bullseye
    const innerRadius = ZCodeGeometry.INNER_BULLSEYE_RADIUS * codeRadius;
    const bullseyeRingRadius = ((ZCodeGeometry.BULLSEYE_GAP_1_RADIUS + ZCodeGeometry.BULLSEYE_RING_RADIUS) / 2) * codeRadius;
    const bullseyeRingWidth = (ZCodeGeometry.BULLSEYE_RING_RADIUS - ZCodeGeometry.BULLSEYE_GAP_1_RADIUS) * codeRadius;

    // Middle concentric ring of bullseye
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${bullseyeRingRadius.toFixed(2)}" fill="none" stroke="${fg}" stroke-width="${bullseyeRingWidth.toFixed(2)}" />`
    );

    // Inner solid core of bullseye
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${innerRadius.toFixed(2)}" fill="${fg}" />`);

    // Stylized center 'Z' glyph
    if (showZ) {
      const zSize = innerRadius * 0.95;
      const zPath = `M ${cx - zSize * 0.5} ${cy - zSize * 0.55} ` +
                    `H ${cx + zSize * 0.5} ` +
                    `L ${cx - zSize * 0.4} ${cy + zSize * 0.55} ` +
                    `H ${cx + zSize * 0.5}`;
      parts.push(
        `<path d="${zPath}" stroke="${bg}" stroke-width="${(zSize * 0.28).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" fill="none" />`
      );
    }

    // 3. Orientation / Synch Track
    const orientRadius = ZCodeGeometry.ORIENTATION_RADIUS * codeRadius;
    const orientDotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * codeRadius;

    for (let i = 0; i < ZCodeGeometry.ORIENTATION_SECTORS; i++) {
      const bit = ZCodeGeometry.SYNC_PATTERN[i];
      if (bit === 1) {
        const theta = (i / ZCodeGeometry.ORIENTATION_SECTORS) * 2 * Math.PI;
        const ox = cx + orientRadius * Math.cos(theta);
        const oy = cy + orientRadius * Math.sin(theta);
        parts.push(
          `<circle cx="${ox.toFixed(2)}" cy="${oy.toFixed(2)}" r="${orientDotR.toFixed(2)}" fill="${fg}" />`
        );
      }
    }

    // Primary Orientation Key Marker at angle = 0 (to break symmetry and ease rapid optical orientation)
    const keyPipRadius = codeRadius * 0.235;
    const kx = cx + keyPipRadius;
    const ky = cy;
    parts.push(
      `<polygon points="${kx - orientDotR * 1.4},${ky - orientDotR * 0.9} ${kx + orientDotR * 1.8},${ky} ${kx - orientDotR * 1.4},${ky + orientDotR * 0.9}" fill="${fg}" />`
    );

    // 4. Data Tracks
    let bitIdx = 0;
    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const r = track.radius * codeRadius;
      const dotR = track.dotRadius * codeRadius;

      for (let s = 0; s < track.numSectors; s++) {
        const bit = data.bits[bitIdx++];
        if (bit) {
          const theta = (s / track.numSectors) * 2 * Math.PI;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          parts.push(
            `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dotR.toFixed(2)}" fill="${fg}" />`
          );
        }
      }
    }

    parts.push("</g>");
    parts.push("</svg>");

    return parts.join("\n");
  }

  /**
   * Renders Z-Code onto an HTML5 CanvasRenderingContext2D.
   * Works on web browsers, node-canvas, or offscreen canvas.
   */
  public static renderToCanvas(
    ctx: CanvasRenderingContext2D,
    data: ZCodeEncodedData,
    options: RenderOptions = {}
  ): void {
    const size = options.size ?? 512;
    const fg = options.foregroundColor ?? "#0F172A";
    const bg = options.backgroundColor ?? "#FFFFFF";
    const margin = options.margin ?? 24;
    const showZ = options.showCenterZ ?? true;
    const rot = options.rotationAngle ?? 0;

    const cx = size / 2;
    const cy = size / 2;
    const codeRadius = (size / 2) - margin;

    // Fill background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // 1. Outer Ring
    const outerRingRadius = ((ZCodeGeometry.OUTER_RING_INNER_RADIUS + ZCodeGeometry.OUTER_RING_OUTER_RADIUS) / 2) * codeRadius;
    const outerStrokeWidth = (ZCodeGeometry.OUTER_RING_OUTER_RADIUS - ZCodeGeometry.OUTER_RING_INNER_RADIUS) * codeRadius;
    ctx.beginPath();
    ctx.arc(0, 0, outerRingRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = fg;
    ctx.lineWidth = outerStrokeWidth;
    ctx.stroke();

    // 4 cardinal notches
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const nx = codeRadius * Math.cos(angle);
      const ny = codeRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(nx, ny, codeRadius * 0.015, 0, 2 * Math.PI);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // 2. Central Locator Bullseye
    const innerRadius = ZCodeGeometry.INNER_BULLSEYE_RADIUS * codeRadius;
    const bullseyeRingRadius = ((ZCodeGeometry.BULLSEYE_GAP_1_RADIUS + ZCodeGeometry.BULLSEYE_RING_RADIUS) / 2) * codeRadius;
    const bullseyeRingWidth = (ZCodeGeometry.BULLSEYE_RING_RADIUS - ZCodeGeometry.BULLSEYE_GAP_1_RADIUS) * codeRadius;

    ctx.beginPath();
    ctx.arc(0, 0, bullseyeRingRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = fg;
    ctx.lineWidth = bullseyeRingWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = fg;
    ctx.fill();

    // Center 'Z'
    if (showZ) {
      const zSize = innerRadius * 0.95;
      ctx.beginPath();
      ctx.moveTo(-zSize * 0.5, -zSize * 0.55);
      ctx.lineTo(zSize * 0.5, -zSize * 0.55);
      ctx.lineTo(-zSize * 0.4, zSize * 0.55);
      ctx.lineTo(zSize * 0.5, zSize * 0.55);
      ctx.strokeStyle = bg;
      ctx.lineWidth = zSize * 0.28;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // 3. Orientation Track
    const orientRadius = ZCodeGeometry.ORIENTATION_RADIUS * codeRadius;
    const orientDotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * codeRadius;
    ctx.fillStyle = fg;

    for (let i = 0; i < ZCodeGeometry.ORIENTATION_SECTORS; i++) {
      if (ZCodeGeometry.SYNC_PATTERN[i] === 1) {
        const theta = (i / ZCodeGeometry.ORIENTATION_SECTORS) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(orientRadius * Math.cos(theta), orientRadius * Math.sin(theta), orientDotR, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Primary Orientation Key Marker
    const keyPipRadius = codeRadius * 0.235;
    ctx.beginPath();
    ctx.moveTo(keyPipRadius - orientDotR * 1.4, -orientDotR * 0.9);
    ctx.lineTo(keyPipRadius + orientDotR * 1.8, 0);
    ctx.lineTo(keyPipRadius - orientDotR * 1.4, orientDotR * 0.9);
    ctx.closePath();
    ctx.fill();

    // 4. Data Tracks
    let bitIdx = 0;
    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const r = track.radius * codeRadius;
      const dotR = track.dotRadius * codeRadius;

      for (let s = 0; s < track.numSectors; s++) {
        const bit = data.bits[bitIdx++];
        if (bit) {
          const theta = (s / track.numSectors) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(r * Math.cos(theta), r * Math.sin(theta), dotR, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Pure software rasterizer to an RGBA ImageBuffer.
   */
  public static renderToImageBuffer(
    data: ZCodeEncodedData,
    options: RenderOptions = {}
  ): ImageBuffer {
    const size = options.size ?? 512;
    const margin = options.margin ?? 24;
    const rot = options.rotationAngle ?? 0;
    const cx = size / 2;
    const cy = size / 2;
    const codeRadius = (size / 2) - margin;

    const buffer = new Uint8ClampedArray(size * size * 4);
    buffer.fill(255); // White background

    const setPixel = (x: number, y: number, dark: boolean) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return;
      const idx = (y * size + x) * 4;
      const val = dark ? 0 : 255;
      buffer[idx] = val;
      buffer[idx + 1] = val;
      buffer[idx + 2] = val;
      buffer[idx + 3] = 255;
    };

    const fillDisk = (x0: number, y0: number, r: number, dark = true) => {
      const minX = Math.max(0, Math.floor(x0 - r));
      const maxX = Math.min(size - 1, Math.ceil(x0 + r));
      const minY = Math.max(0, Math.floor(y0 - r));
      const maxY = Math.min(size - 1, Math.ceil(y0 + r));
      const r2 = r * r;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - x0;
          const dy = y - y0;
          if (dx * dx + dy * dy <= r2) {
            setPixel(x, y, dark);
          }
        }
      }
    };

    const fillRing = (x0: number, y0: number, rIn: number, rOut: number, dark = true) => {
      const minX = Math.max(0, Math.floor(x0 - rOut));
      const maxX = Math.min(size - 1, Math.ceil(x0 + rOut));
      const minY = Math.max(0, Math.floor(y0 - rOut));
      const maxY = Math.min(size - 1, Math.ceil(y0 + rOut));
      const rIn2 = rIn * rIn;
      const rOut2 = rOut * rOut;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - x0;
          const dy = y - y0;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rIn2 && d2 <= rOut2) {
            setPixel(x, y, dark);
          }
        }
      }
    };

    // 1. Outer Ring
    const outerRingIn = ZCodeGeometry.OUTER_RING_INNER_RADIUS * codeRadius;
    const outerRingOut = ZCodeGeometry.OUTER_RING_OUTER_RADIUS * codeRadius;
    fillRing(cx, cy, outerRingIn, outerRingOut, true);

    // 2. Central Locator Bullseye
    const innerRadius = ZCodeGeometry.INNER_BULLSEYE_RADIUS * codeRadius;
    const bullseyeRingIn = ZCodeGeometry.BULLSEYE_GAP_1_RADIUS * codeRadius;
    const bullseyeRingOut = ZCodeGeometry.BULLSEYE_RING_RADIUS * codeRadius;

    fillRing(cx, cy, bullseyeRingIn, bullseyeRingOut, true);
    fillDisk(cx, cy, innerRadius, true);

    // 3. Orientation Track
    const orientRadius = ZCodeGeometry.ORIENTATION_RADIUS * codeRadius;
    const orientDotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * codeRadius;

    for (let i = 0; i < ZCodeGeometry.ORIENTATION_SECTORS; i++) {
      if (ZCodeGeometry.SYNC_PATTERN[i] === 1) {
        const theta = rot + (i / ZCodeGeometry.ORIENTATION_SECTORS) * 2 * Math.PI;
        fillDisk(cx + orientRadius * Math.cos(theta), cy + orientRadius * Math.sin(theta), orientDotR, true);
      }
    }

    // Primary Orientation Key Pip
    const keyPipRadius = codeRadius * 0.235;
    fillDisk(cx + keyPipRadius * Math.cos(rot), cy + keyPipRadius * Math.sin(rot), orientDotR * 1.5, true);

    // 4. Data Tracks
    let bitIdx = 0;
    for (const track of ZCodeGeometry.DATA_TRACKS) {
      const r = track.radius * codeRadius;
      const dotR = track.dotRadius * codeRadius;

      for (let s = 0; s < track.numSectors; s++) {
        const bit = data.bits[bitIdx++];
        if (bit) {
          const theta = rot + (s / track.numSectors) * 2 * Math.PI;
          fillDisk(cx + r * Math.cos(theta), cy + r * Math.sin(theta), dotR, true);
        }
      }
    }

    return {
      data: buffer,
      width: size,
      height: size,
    };
  }
}
