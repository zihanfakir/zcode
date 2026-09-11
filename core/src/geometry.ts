/**
 * Z-Code Polar Geometry & Layout Specification
 */

export interface TrackConfig {
  trackIndex: number;
  radius: number;       // Normalized [0, 1]
  numSectors: number;   // Number of bits / dots on this track
  dotRadius: number;    // Normalized radius of individual circular dot
}

export interface PolarCoord {
  r: number;
  theta: number; // in radians
}

export interface CartesianCoord {
  x: number;
  y: number;
}

export class ZCodeGeometry {
  // Center finder bullseye specifications
  public static readonly INNER_BULLSEYE_RADIUS = 0.08;
  public static readonly BULLSEYE_GAP_1_RADIUS = 0.14;
  public static readonly BULLSEYE_RING_RADIUS = 0.20;
  public static readonly BULLSEYE_GAP_2_RADIUS = 0.24;

  // Orientation track
  public static readonly ORIENTATION_RADIUS = 0.27;
  public static readonly ORIENTATION_SECTORS = 32;
  public static readonly ORIENTATION_DOT_RADIUS = 0.016;

  // 32-bit Barker/synch sequence for rotational orientation detection
  public static readonly SYNC_PATTERN: readonly number[] = [
    1, 1, 1, 1, 1, 0, 0, 1,
    1, 0, 1, 0, 1, 0, 0, 0,
    1, 0, 0, 1, 0, 1, 1, 1,
    0, 0, 0, 1, 1, 0, 0, 0,
  ];

  // Outer framing ring
  public static readonly OUTER_RING_INNER_RADIUS = 0.96;
  public static readonly OUTER_RING_OUTER_RADIUS = 1.00;

  // Data tracks configuration: 10 tracks, 680 bits = 85 bytes
  public static readonly DATA_TRACKS: readonly TrackConfig[] = [
    { trackIndex: 0, radius: 0.34, numSectors: 32, dotRadius: 0.020 },
    { trackIndex: 1, radius: 0.40, numSectors: 40, dotRadius: 0.020 },
    { trackIndex: 2, radius: 0.46, numSectors: 48, dotRadius: 0.020 },
    { trackIndex: 3, radius: 0.52, numSectors: 56, dotRadius: 0.020 },
    { trackIndex: 4, radius: 0.58, numSectors: 64, dotRadius: 0.020 },
    { trackIndex: 5, radius: 0.64, numSectors: 72, dotRadius: 0.020 },
    { trackIndex: 6, radius: 0.70, numSectors: 80, dotRadius: 0.020 },
    { trackIndex: 7, radius: 0.76, numSectors: 88, dotRadius: 0.020 },
    { trackIndex: 8, radius: 0.82, numSectors: 96, dotRadius: 0.020 },
    { trackIndex: 9, radius: 0.88, numSectors: 104, dotRadius: 0.020 },
  ];

  public static readonly TOTAL_BITS = ZCodeGeometry.DATA_TRACKS.reduce(
    (sum, t) => sum + t.numSectors,
    0
  ); // 680 bits

  public static readonly TOTAL_BYTES = ZCodeGeometry.TOTAL_BITS / 8; // 85 bytes

  /**
   * Converts polar coordinates (r in [0, 1], theta in rad) to cartesian (x, y)
   * in a canvas/image of given width/height and center (cx, cy).
   */
  public static polarToCartesian(
    coord: PolarCoord,
    cx: number,
    cy: number,
    codeRadius: number,
    rotationOffset: number = 0
  ): CartesianCoord {
    const angle = coord.theta + rotationOffset;
    return {
      x: cx + coord.r * codeRadius * Math.cos(angle),
      y: cy + coord.r * codeRadius * Math.sin(angle),
    };
  }

  /**
   * Converts cartesian point (x, y) relative to center (cx, cy) to polar (r in [0, 1], theta in rad).
   */
  public static cartesianToPolar(
    x: number,
    y: number,
    cx: number,
    cy: number,
    codeRadius: number
  ): PolarCoord {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    return {
      r: dist / codeRadius,
      theta: angle,
    };
  }

  /**
   * Calculates the polar coordinate for a specific bit index in the bitstream.
   */
  public static getBitLocation(bitIndex: number): { track: TrackConfig; sector: number; coord: PolarCoord } {
    if (bitIndex < 0 || bitIndex >= ZCodeGeometry.TOTAL_BITS) {
      throw new Error(`Bit index ${bitIndex} out of range (0..${ZCodeGeometry.TOTAL_BITS - 1})`);
    }

    let remaining = bitIndex;
    for (const track of ZCodeGeometry.DATA_TRACKS) {
      if (remaining < track.numSectors) {
        const sector = remaining;
        const theta = (sector / track.numSectors) * 2 * Math.PI;
        return {
          track,
          sector,
          coord: { r: track.radius, theta },
        };
      }
      remaining -= track.numSectors;
    }

    throw new Error("Bit location calculation failure");
  }
}
