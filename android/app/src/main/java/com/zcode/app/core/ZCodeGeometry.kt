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
        TrackConfig(0, 0.34f, 32, 0.020f),
        TrackConfig(1, 0.40f, 40, 0.020f),
        TrackConfig(2, 0.46f, 48, 0.020f),
        TrackConfig(3, 0.52f, 56, 0.020f),
        TrackConfig(4, 0.58f, 64, 0.020f),
        TrackConfig(5, 0.64f, 72, 0.020f),
        TrackConfig(6, 0.70f, 80, 0.020f),
        TrackConfig(7, 0.76f, 88, 0.020f),
        TrackConfig(8, 0.82f, 96, 0.020f),
        TrackConfig(9, 0.88f, 104, 0.020f)
    )

    val TOTAL_BITS = DATA_TRACKS.sumOf { it.numSectors } // 680 bits
    val TOTAL_BYTES = TOTAL_BITS / 8 // 85 bytes
}
