package com.zcode.app.core

data class TrackConfig(
    val trackIndex: Int,
    val radius: Float,
    val numSectors: Int,
    val dotRadius: Float
)

object ZCodeGeometry {
    const val INNER_BULLSEYE_RADIUS = 0.08f
    const val BULLSEYE_GAP_1_RADIUS = 0.14f
    const val BULLSEYE_RING_RADIUS = 0.20f
    const val BULLSEYE_GAP_2_RADIUS = 0.24f

    const val ORIENTATION_RADIUS = 0.27f
    const val ORIENTATION_SECTORS = 32
    const val ORIENTATION_DOT_RADIUS = 0.016f

    val SYNC_PATTERN = intArrayOf(
        1, 1, 1, 1, 1, 0, 0, 1,
        1, 0, 1, 0, 1, 0, 0, 0,
        1, 0, 0, 1, 0, 1, 1, 1,
        0, 0, 0, 1, 1, 0, 0, 0
    )

    const val OUTER_RING_INNER_RADIUS = 0.96f
    const val OUTER_RING_OUTER_RADIUS = 1.00f

    val DATA_TRACKS = arrayOf(
        TrackConfig(0, 0.34f, 32, 0.024f),
        TrackConfig(1, 0.43f, 40, 0.024f),
        TrackConfig(2, 0.52f, 48, 0.024f),
        TrackConfig(3, 0.61f, 56, 0.024f),
        TrackConfig(4, 0.70f, 64, 0.024f),
        TrackConfig(5, 0.79f, 72, 0.024f),
        TrackConfig(6, 0.88f, 80, 0.024f)
    )

    val TOTAL_BITS = DATA_TRACKS.sumOf { it.numSectors } // 392 bits
    val TOTAL_BYTES = TOTAL_BITS / 8 // 49 bytes
}
