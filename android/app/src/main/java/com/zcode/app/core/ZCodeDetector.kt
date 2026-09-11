package com.zcode.app.core

import android.graphics.Bitmap
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin

data class CodeLocation(
    val cx: Float,
    val cy: Float,
    val radius: Float
)

object ZCodeDetector {

    fun toGrayscale(bitmap: Bitmap): ByteArray {
        val width = bitmap.width
        val height = bitmap.height
        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

        val gray = ByteArray(width * height)
        for (i in pixels.indices) {
            val c = pixels[i]
            val r = (c shr 16) and 0xFF
            val g = (c shr 8) and 0xFF
            val b = c and 0xFF
            gray[i] = ((r * 77 + g * 150 + b * 29) shr 8).toByte()
        }
        return gray
    }

    fun sampleBilinear(gray: ByteArray, width: Int, height: Int, x: Float, y: Float): Float {
        if (x < 0f || x >= (width - 1).toFloat() || y < 0f || y >= (height - 1).toFloat()) {
            val cx = x.coerceIn(0f, (width - 1).toFloat()).toInt()
            val cy = y.coerceIn(0f, (height - 1).toFloat()).toInt()
            return (gray[cy * width + cx].toInt() and 0xFF).toFloat()
        }
        val ix = x.toInt()
        val iy = y.toInt()
        val dx = x - ix
        val dy = y - iy

        val p00 = (gray[iy * width + ix].toInt() and 0xFF).toFloat()
        val p10 = (gray[iy * width + ix + 1].toInt() and 0xFF).toFloat()
        val p01 = (gray[(iy + 1) * width + ix].toInt() and 0xFF).toFloat()
        val p11 = (gray[(iy + 1) * width + ix + 1].toInt() and 0xFF).toFloat()

        return (1f - dx) * (1f - dy) * p00 +
                dx * (1f - dy) * p10 +
                (1f - dx) * dy * p01 +
                dx * dy * p11
    }

    fun locateCode(gray: ByteArray, width: Int, height: Int): CodeLocation? {
        var sum = 0L
        var minLum = 255
        var maxLum = 0
        val sampleStep = maxOf(1, gray.size / 4000)
        var count = 0
        var i = 0
        while (i < gray.size) {
            val v = gray[i].toInt() and 0xFF
            sum += v
            if (v < minLum) minLum = v
            if (v > maxLum) maxLum = v
            count++
            i += sampleStep
        }

        if (maxLum - minLum < 18) {
            return null
        }

        val avgThresh = ((minLum + maxLum) / 2).toFloat()
        val contrast = (maxLum - minLum).toFloat()

        fun checkVertical(cx: Float, approxY: Float, hDiskLen: Float): Triple<Float, Float, Float>? {
            val colX = Math.round(cx)
            if (colX < 2 || colX >= width - 2) return null

            var runLen = 0
            var isDark = (gray[colX].toInt() and 0xFF) < avgThresh
            val runs = mutableListOf<Triple<Boolean, Int, Int>>() // isDark, length, startY

            for (y in 0 until height) {
                val dark = (gray[y * width + colX].toInt() and 0xFF) < avgThresh
                if (dark == isDark) {
                    runLen++
                } else {
                    runs.add(Triple(isDark, runLen, y - runLen))
                    isDark = dark
                    runLen = 1
                }
            }
            runs.add(Triple(isDark, runLen, height - runLen))

            for (idx in 0..(runs.size - 5)) {
                if (runs[idx].first && !runs[idx + 1].first && runs[idx + 2].first && !runs[idx + 3].first && runs[idx + 4].first) {
                    val r0 = runs[idx].second.toFloat()
                    val r1 = runs[idx + 1].second.toFloat()
                    val r2 = runs[idx + 2].second.toFloat()
                    val r3 = runs[idx + 3].second.toFloat()
                    val r4 = runs[idx + 4].second.toFloat()

                    val unit = (r0 + r1 + r3 + r4) / 4f
                    if (unit >= 1.5f) {
                        val centerRatio = r2 / unit
                        if (centerRatio in 1.3f..4.2f) {
                            val vertCy = runs[idx + 2].third + r2 / 2f
                            if (kotlin.math.abs(vertCy - approxY) <= maxOf(hDiskLen, r2) * 0.8f) {
                                val aspectDiff = kotlin.math.abs(hDiskLen - r2) / maxOf(hDiskLen, r2)
                                if (aspectDiff < 0.40f) {
                                    val estRadius = (r0 + r1 + r2 + r3 + r4) / 0.40f
                                    return Triple(vertCy, estRadius, r2)
                                }
                            }
                        }
                    }
                }
            }
            return null
        }

        val stepY = maxOf(2, height / 180)
        data class Candidate(val cx: Float, val cy: Float, val radius: Float, val diskLen: Float)
        val verifiedCandidates = mutableListOf<Candidate>()

        var y = stepY * 2
        while (y < height - stepY * 2) {
            var runLen = 0
            var isDark = (gray[y * width].toInt() and 0xFF) < avgThresh
            val runs = mutableListOf<Triple<Boolean, Int, Int>>() // isDark, length, startX

            for (x in 0 until width) {
                val dark = (gray[y * width + x].toInt() and 0xFF) < avgThresh
                if (dark == isDark) {
                    runLen++
                } else {
                    runs.add(Triple(isDark, runLen, x - runLen))
                    isDark = dark
                    runLen = 1
                }
            }
            runs.add(Triple(isDark, runLen, width - runLen))

            for (idx in 0..(runs.size - 5)) {
                if (runs[idx].first && !runs[idx + 1].first && runs[idx + 2].first && !runs[idx + 3].first && runs[idx + 4].first) {
                    val r0 = runs[idx].second.toFloat()
                    val r1 = runs[idx + 1].second.toFloat()
                    val r2 = runs[idx + 2].second.toFloat()
                    val r3 = runs[idx + 3].second.toFloat()
                    val r4 = runs[idx + 4].second.toFloat()

                    val unit = (r0 + r1 + r3 + r4) / 4f
                    if (unit >= 1.5f) {
                        val diff0 = kotlin.math.abs(r0 - unit) / unit
                        val diff1 = kotlin.math.abs(r1 - unit) / unit
                        val diff3 = kotlin.math.abs(r3 - unit) / unit
                        val diff4 = kotlin.math.abs(r4 - unit) / unit
                        val centerRatio = r2 / unit

                        if (diff0 < 0.70f && diff1 < 0.70f && diff3 < 0.70f && diff4 < 0.70f && centerRatio in 1.3f..4.2f) {
                            val hCx = runs[idx + 2].third + r2 / 2f
                            val vertMatch = checkVertical(hCx, y.toFloat(), r2)
                            if (vertMatch != null) {
                                val estRadius = ((r0 + r1 + r2 + r3 + r4) / 0.40f + vertMatch.second) / 2f
                                verifiedCandidates.add(Candidate(hCx, vertMatch.first, estRadius, (r2 + vertMatch.third) / 2f))
                            }
                        }
                    }
                }
            }
            y += stepY
        }

        if (verifiedCandidates.isNotEmpty()) {
            var bestCluster = listOf<Candidate>()
            for (anchor in verifiedCandidates) {
                val cluster = verifiedCandidates.filter {
                    hypot(it.cx - anchor.cx, it.cy - anchor.cy) <= anchor.diskLen * 0.8f
                }
                if (cluster.size > bestCluster.size) {
                    bestCluster = cluster
                }
            }

            val clusterToUse = if (bestCluster.isNotEmpty()) bestCluster else verifiedCandidates
            val approxCx = clusterToUse.map { it.cx }.average().toFloat()
            val approxCy = clusterToUse.map { it.cy }.average().toFloat()
            val approxR = clusterToUse.map { it.radius }.average().toFloat()

            val refined = refineCircle(gray, width, height, approxCx, approxCy, approxR, contrast)
            return refined ?: CodeLocation(approxCx, approxCy, approxR)
        }

        val fallbackR = minOf(width, height) * 0.38f
        return refineCircle(gray, width, height, width / 2f, height / 2f, fallbackR, contrast)
            ?: CodeLocation(width / 2f, height / 2f, fallbackR)
    }

    private fun refineCircle(
        gray: ByteArray,
        width: Int,
        height: Int,
        approxCx: Float,
        approxCy: Float,
        approxRadius: Float,
        contrast: Float = 60f
    ): CodeLocation? {
        val numRays = 36
        val edgePoints = mutableListOf<Float>()
        val minGrad = maxOf(15f, contrast * 0.20f)

        for (k in 0 until numRays) {
            val angle = (k * 2f * PI.toFloat()) / numRays
            val cosA = cos(angle)
            val sinA = sin(angle)

            val maxR = minOf(minOf(width, height) * 0.49f, approxRadius * 1.25f)
            val minR = approxRadius * 0.75f

            var r = maxR
            while (r >= minR) {
                val valInner = sampleBilinear(gray, width, height, approxCx + (r - 2f) * cosA, approxCy + (r - 2f) * sinA)
                val valOuter = sampleBilinear(gray, width, height, approxCx + (r + 2f) * cosA, approxCy + (r + 2f) * sinA)
                val grad = valOuter - valInner

                if (grad > minGrad) {
                    edgePoints.add(r)
                    break
                }
                r -= 1.0f
            }
        }

        if (edgePoints.size >= 8) {
            val avgR = edgePoints.average().toFloat()
            return CodeLocation(approxCx, approxCy, avgR)
        }
        return null
    }

    fun findOrientation(
        gray: ByteArray,
        width: Int,
        height: Int,
        cx: Float,
        cy: Float,
        radius: Float
    ): Float {
        val orientR = ZCodeGeometry.ORIENTATION_RADIUS * radius
        val dotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * radius
        val numSamples = 360
        val sampledIntensities = FloatArray(numSamples)

        for (deg in 0 until numSamples) {
            val rad = (deg * PI.toFloat()) / 180f
            val cosA = cos(rad)
            val sinA = sin(rad)

            val vCenter = 255f - sampleBilinear(gray, width, height, cx + orientR * cosA, cy + orientR * sinA)
            val vInner = 255f - sampleBilinear(gray, width, height, cx + (orientR - dotR * 0.5f) * cosA, cy + (orientR - dotR * 0.5f) * sinA)
            val vOuter = 255f - sampleBilinear(gray, width, height, cx + (orientR + dotR * 0.5f) * cosA, cy + (orientR + dotR * 0.5f) * sinA)

            sampledIntensities[deg] = maxOf(vCenter, maxOf(vInner, vOuter))
        }

        var bestDeg = 0
        var maxCorr = Float.NEGATIVE_INFINITY

        for (shift in 0 until numSamples) {
            var corr = 0f
            for (bitIdx in 0 until ZCodeGeometry.ORIENTATION_SECTORS) {
                val bitAngleDeg = (bitIdx * 360f) / ZCodeGeometry.ORIENTATION_SECTORS
                val sampleIdx = ((shift + Math.round(bitAngleDeg)) % numSamples + numSamples) % numSamples
                val expectedBit = ZCodeGeometry.SYNC_PATTERN[bitIdx]
                val weight = if (expectedBit == 1) 1.0f else -0.8f
                corr += sampledIntensities[sampleIdx] * weight
            }

            val keyRad = (shift * PI.toFloat()) / 180f
            val keyX = cx + (0.235f * radius) * cos(keyRad)
            val keyY = cy + (0.235f * radius) * sin(keyRad)
            val keyVal = 255f - sampleBilinear(gray, width, height, keyX, keyY)
            corr += keyVal * 1.5f

            if (corr > maxCorr) {
                maxCorr = corr
                bestDeg = shift
            }
        }

        return (bestDeg * PI.toFloat()) / 180f
    }

    fun sampleBits(
        gray: ByteArray,
        width: Int,
        height: Int,
        cx: Float,
        cy: Float,
        radius: Float,
        rotation: Float
    ): BooleanArray {
        val bits = BooleanArray(ZCodeGeometry.TOTAL_BITS)
        var bitIdx = 0

        val centerDark = 255f - sampleBilinear(gray, width, height, cx, cy)
        val gapDark = 255f - sampleBilinear(gray, width, height, cx + radius * 0.11f, cy)
        val refContrast = maxOf(20f, centerDark - gapDark)

        for (track in ZCodeGeometry.DATA_TRACKS) {
            val trackR = track.radius * radius
            val numSectors = track.numSectors
            val values = FloatArray(numSectors)

            var minVal = Float.POSITIVE_INFINITY
            var maxVal = Float.NEGATIVE_INFINITY

            for (s in 0 until numSectors) {
                val angle = rotation + (s.toFloat() / numSectors) * 2f * PI.toFloat()
                val cosA = cos(angle)
                val sinA = sin(angle)
                val dotOffset = track.dotRadius * radius * 0.4f

                val valCenter = 255f - sampleBilinear(gray, width, height, cx + trackR * cosA, cy + trackR * sinA)
                val val1 = 255f - sampleBilinear(gray, width, height, cx + (trackR + dotOffset) * cosA, cy + (trackR + dotOffset) * sinA)
                val val2 = 255f - sampleBilinear(gray, width, height, cx + (trackR - dotOffset) * cosA, cy + (trackR - dotOffset) * sinA)

                val avg = (valCenter * 2f + val1 + val2) / 4f
                values[s] = avg
                if (avg < minVal) minVal = avg
                if (avg > maxVal) maxVal = avg
            }

            val trackContrast = maxVal - minVal
            if (trackContrast < refContrast * 0.25f) {
                val isAllDark = maxVal > (gapDark + refContrast * 0.55f)
                for (s in 0 until numSectors) {
                    bits[bitIdx++] = isAllDark
                }
            } else {
                val threshold = minVal + trackContrast * 0.45f
                for (s in 0 until numSectors) {
                    bits[bitIdx++] = values[s] >= threshold
                }
            }
        }

        return bits
    }
}
