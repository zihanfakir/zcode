package com.zcode.app.core

import android.graphics.Bitmap
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.math.sqrt

data class Point2D(val x: Float, val y: Float)

data class CodeLocation(
    val cx: Float,
    val cy: Float,
    val radius: Float,
    val axisRatio: Float = 1.0f,
    val tiltAngle: Float = 0f
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

        return ((1f - dx) * (1f - dy) * p00 +
                dx * (1f - dy) * p10 +
                (1f - dx) * dy * p01 +
                dx * dy * p11)
    }

    fun computeIntegralImage(gray: ByteArray, width: Int, height: Int): IntArray {
        val stride = width + 1
        val integral = IntArray((width + 1) * (height + 1))

        for (y in 0 until height) {
            var rowSum = 0
            val srcRowOffset = y * width
            val dstRowOffset = (y + 1) * stride + 1

            for (x in 0 until width) {
                rowSum += gray[srcRowOffset + x].toInt() and 0xFF
                integral[dstRowOffset + x] = integral[dstRowOffset - stride + x] + rowSum
            }
        }
        return integral
    }

    fun getLocalMean(integral: IntArray, width: Int, height: Int, x: Int, y: Int, winSize: Int): Float {
        val stride = width + 1
        val x1 = maxOf(0, x - winSize)
        val y1 = maxOf(0, y - winSize)
        val x2 = minOf(width, x + winSize + 1)
        val y2 = minOf(height, y + winSize + 1)

        val sum = integral[y2 * stride + x2] - integral[y1 * stride + x2] - integral[y2 * stride + x1] + integral[y1 * stride + x1]
        val area = (x2 - x1) * (y2 - y1)
        return sum.toFloat() / area.toFloat()
    }

    fun fitCircleKasa(points: List<Point2D>): CodeLocation? {
        val n = points.size
        if (n < 6) return null

        var sx = 0.0
        var sy = 0.0
        var sx2 = 0.0
        var sy2 = 0.0
        var sxy = 0.0
        var sz = 0.0
        var sxz = 0.0
        var syz = 0.0

        for (p in points) {
            val x = p.x.toDouble()
            val y = p.y.toDouble()
            val z = x * x + y * y
            sx += x
            sy += y
            sx2 += x * x
            sy2 += y * y
            sxy += x * y
            sz += z
            sxz += x * z
            syz += y * z
        }

        val a11 = sx2
        val a12 = sxy
        val a13 = sx
        val a21 = sxy
        val a22 = sy2
        val a23 = sy
        val a31 = sx
        val a32 = sy
        val a33 = n.toDouble()

        val d = a11 * (a22 * a33 - a23 * a32) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 - a22 * a31)
        if (abs(d) < 1e-7) return null

        val d1 = sxz * (a22 * a33 - a23 * a32) - a12 * (syz * a33 - a23 * sz) + a13 * (syz * a32 - a22 * sz)
        val d2 = a11 * (syz * a33 - a23 * sz) - sxz * (a21 * a33 - a23 * a31) + a13 * (a21 * sz - syz * a31)
        val d3 = a11 * (a22 * sz - syz * a32) - a12 * (a21 * sz - syz * a31) + sxz * (a21 * a32 - a22 * a31)

        val A = d1 / d
        val B = d2 / d
        val C = d3 / d

        val cx = (A / 2.0).toFloat()
        val cy = (B / 2.0).toFloat()
        val rSq = C + (cx.toDouble() * cx.toDouble()) + (cy.toDouble() * cy.toDouble())
        if (rSq <= 0.0) return null

        var sumR = 0.0
        var sumC = 0.0
        var sumS = 0.0
        for (p in points) {
            val dx = (p.x - cx).toDouble()
            val dy = (p.y - cy).toDouble()
            val r = hypot(dx, dy)
            val th = atan2(dy, dx)
            sumR += r
            sumC += r * cos(2.0 * th)
            sumS += r * sin(2.0 * th)
        }
        val R0 = sumR / n
        val c2 = (2.0 * sumC) / n
        val s2 = (2.0 * sumS) / n
        val amp = hypot(c2, s2)
        val phi = (atan2(s2, c2) / 2.0).toFloat()
        val majorA = (R0 + amp).toFloat()
        val minorB = maxOf(5.0, R0 - amp).toFloat()
        val axisRatio = (minorB / majorA).coerceIn(0.60f, 1.0f)

        return CodeLocation(cx, cy, majorA, axisRatio, phi)
    }

    fun getAffinePoint(
        cx: Float,
        cy: Float,
        r: Float,
        theta: Float,
        axisRatio: Float = 1.0f,
        tiltAngle: Float = 0f
    ): Point2D {
        if (axisRatio >= 0.985f) {
            return Point2D(cx + r * cos(theta), cy + r * sin(theta))
        }
        val psi = theta - tiltAngle
        val dxPrime = r * cos(psi)
        val dyPrime = axisRatio * r * sin(psi)
        val cosPhi = cos(tiltAngle)
        val sinPhi = sin(tiltAngle)
        return Point2D(
            cx + dxPrime * cosPhi - dyPrime * sinPhi,
            cy + dxPrime * sinPhi + dyPrime * cosPhi
        )
    }

    /**
     * Stage 1: Ultra-Fast Reticle-Guided Inward Scan.
     * Directly locks onto the circular Z-Code centered in the viewfinder in < 1.5ms.
     */
    fun detectReticleGuided(gray: ByteArray, width: Int, height: Int): CodeLocation? {
        val midX = width / 2
        val midY = height / 2
        val minDim = minOf(width, height)
        val searchWin = (minDim * 0.08f).toInt()

        var seedX = midX
        var seedY = midY
        var bestScore = Float.NEGATIVE_INFINITY
        var dy = -searchWin
        while (dy <= searchWin) {
            var dx = -searchWin
            while (dx <= searchWin) {
                val lum = gray[(midY + dy) * width + (midX + dx)].toInt() and 0xFF
                val dist = hypot(dx.toDouble(), dy.toDouble()).toFloat()
                val score = (255f - lum) - dist * 2.5f
                if (score > bestScore) {
                    bestScore = score
                    seedX = midX + dx
                    seedY = midY + dy
                }
                dx += 3
            }
            dy += 3
        }

        val numRays = 36
        val edgePoints = mutableListOf<Point2D>()
        val maxR = minDim * 0.49f
        val minR = maxOf(25f, minDim * 0.08f)

        for (k in 0 until numRays) {
            val angle = (k * 2f * PI.toFloat()) / numRays
            val cosA = cos(angle)
            val sinA = sin(angle)

            var r = maxR
            while (r >= minR) {
                val xIn = seedX + (r - 2f) * cosA
                val yIn = seedY + (r - 2f) * sinA
                val xOut = seedX + (r + 2f) * cosA
                val yOut = seedY + (r + 2f) * sinA

                if (xIn >= 2f && xIn < width - 2 && yIn >= 2f && yIn < height - 2 &&
                    xOut >= 2f && xOut < width - 2 && yOut >= 2f && yOut < height - 2) {
                    val valIn = sampleBilinear(gray, width, height, xIn, yIn)
                    val valOut = sampleBilinear(gray, width, height, xOut, yOut)
                    val grad = valOut - valIn

                    if (grad > 18f) {
                        edgePoints.add(Point2D(seedX + r * cosA, seedY + r * sinA))
                        break
                    }
                }
                r -= 1.0f
            }
        }

        if (edgePoints.size < 14) return null

        val fitted = fitCircleKasa(edgePoints) ?: return null
        val (cx, cy, radius) = fitted
        if (radius < minDim * 0.08f || radius > minDim * 0.54f) return null

        val coreLuma = sampleBilinear(gray, width, height, cx, cy)
        val gapLuma = (
            sampleBilinear(gray, width, height, cx + radius * 0.11f, cy) +
            sampleBilinear(gray, width, height, cx - radius * 0.11f, cy) +
            sampleBilinear(gray, width, height, cx, cy + radius * 0.11f) +
            sampleBilinear(gray, width, height, cx, cy - radius * 0.11f)
        ) / 4f

        val ringLuma = (
            sampleBilinear(gray, width, height, cx + radius * 0.17f, cy) +
            sampleBilinear(gray, width, height, cx - radius * 0.17f, cy) +
            sampleBilinear(gray, width, height, cx, cy + radius * 0.17f) +
            sampleBilinear(gray, width, height, cx, cy - radius * 0.17f)
        ) / 4f

        if (gapLuma - coreLuma < 8f || gapLuma - ringLuma < 6f) {
            return null
        }

        return fitted
    }

    /**
     * Stage 2: Robust Full-Image Adaptive Scanline Finder Search.
     */
    fun locateCode(gray: ByteArray, width: Int, height: Int): CodeLocation? {
        val fastResult = detectReticleGuided(gray, width, height)
        if (fastResult != null) {
            return fastResult
        }

        val integral = computeIntegralImage(gray, width, height)
        val localWin = maxOf(12, minOf(width, height) / 24)
        val stepY = maxOf(2, height / 160)

        fun checkVertical(colX: Int, approxY: Float, hDiskLen: Float): Triple<Float, Float, Float>? {
            if (colX < 2 || colX >= width - 2) return null

            var runLength = 0
            var isDark = (gray[colX].toInt() and 0xFF) < getLocalMean(integral, width, height, colX, 0, localWin) * 0.92f
            val runs = mutableListOf<Triple<Boolean, Int, Int>>()

            for (y in 0 until height) {
                val thresh = getLocalMean(integral, width, height, colX, y, localWin) * 0.92f
                val dark = (gray[y * width + colX].toInt() and 0xFF) < thresh
                if (dark == isDark) {
                    runLength++
                } else {
                    runs.add(Triple(isDark, runLength, y - runLength))
                    isDark = dark
                    runLength = 1
                }
            }
            runs.add(Triple(isDark, runLength, height - runLength))

            for (i in 0..(runs.size - 5)) {
                if (runs[i].first && !runs[i + 1].first && runs[i + 2].first && !runs[i + 3].first && runs[i + 4].first) {
                    val r0 = runs[i].second.toFloat()
                    val r1 = runs[i + 1].second.toFloat()
                    val r2 = runs[i + 2].second.toFloat()
                    val r3 = runs[i + 3].second.toFloat()
                    val r4 = runs[i + 4].second.toFloat()

                    val unit = (r0 + r1 + r3 + r4) / 4f
                    if (unit >= 1.2f) {
                        val centerRatio = r2 / unit
                        if (centerRatio in 1.1f..4.8f) {
                            val vertCy = runs[i + 2].third + r2 / 2f
                            if (abs(vertCy - approxY) <= maxOf(hDiskLen, r2) * 1.0f) {
                                val estRadius = (r0 + r1 + r2 + r3 + r4) / 0.40f
                                return Triple(vertCy, estRadius, r2)
                            }
                        }
                    }
                }
            }
            return null
        }

        data class Candidate(val cx: Float, val cy: Float, val radius: Float, val diskLen: Float)
        val verifiedCandidates = mutableListOf<Candidate>()

        var y = stepY * 2
        while (y < height - stepY * 2) {
            var runLength = 0
            var isDark = (gray[y * width].toInt() and 0xFF) < getLocalMean(integral, width, height, 0, y, localWin) * 0.92f
            val runs = mutableListOf<Triple<Boolean, Int, Int>>()

            for (x in 0 until width) {
                val thresh = getLocalMean(integral, width, height, x, y, localWin) * 0.92f
                val dark = (gray[y * width + x].toInt() and 0xFF) < thresh
                if (dark == isDark) {
                    runLength++
                } else {
                    runs.add(Triple(isDark, runLength, x - runLength))
                    isDark = dark
                    runLength = 1
                }
            }
            runs.add(Triple(isDark, runLength, width - runLength))

            for (i in 0..(runs.size - 5)) {
                if (runs[i].first && !runs[i + 1].first && runs[i + 2].first && !runs[i + 3].first && runs[i + 4].first) {
                    val r0 = runs[i].second.toFloat()
                    val r1 = runs[i + 1].second.toFloat()
                    val r2 = runs[i + 2].second.toFloat()
                    val r3 = runs[i + 3].second.toFloat()
                    val r4 = runs[i + 4].second.toFloat()

                    val unit = (r0 + r1 + r3 + r4) / 4f
                    if (unit >= 1.2f) {
                        val centerRatio = r2 / unit
                        val diff04 = abs(r0 - r4) / maxOf(r0, r4)
                        val diff13 = abs(r1 - r3) / maxOf(r1, r3)

                        if (diff04 < 0.65f && diff13 < 0.65f && centerRatio in 1.1f..4.8f) {
                            val hCx = runs[i + 2].third + r2 / 2f
                            val vertMatch = checkVertical(Math.round(hCx), y.toFloat(), r2)
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
                    hypot(it.cx - anchor.cx, it.cy - anchor.cy) <= anchor.diskLen * 1.5f
                }
                if (cluster.size > bestCluster.size) {
                    bestCluster = cluster
                }
            }

            val clusterToUse = if (bestCluster.isNotEmpty()) bestCluster else verifiedCandidates
            val approxCx = clusterToUse.map { it.cx }.average().toFloat()
            val approxCy = clusterToUse.map { it.cy }.average().toFloat()
            val approxR = clusterToUse.map { it.radius }.average().toFloat()

            val maxPossibleR = minOf(approxR * 1.30f, approxCx - 4f, approxCy - 4f, width - approxCx - 4f, height - approxCy - 4f)
            val minPossibleR = maxOf(15f, approxR * 0.70f)

            val numRays = 36
            val edgePoints = mutableListOf<Point2D>()
            for (k in 0 until numRays) {
                val angle = (k * 2f * PI.toFloat()) / numRays
                val cosA = cos(angle)
                val sinA = sin(angle)

                var r = maxPossibleR
                while (r >= minPossibleR) {
                    val xIn = approxCx + (r - 2f) * cosA
                    val yIn = approxCy + (r - 2f) * sinA
                    val xOut = approxCx + (r + 2f) * cosA
                    val yOut = approxCy + (r + 2f) * sinA

                    if (xIn >= 2f && xIn < width - 2 && yIn >= 2f && yIn < height - 2 &&
                        xOut >= 2f && xOut < width - 2 && yOut >= 2f && yOut < height - 2) {
                        val valIn = sampleBilinear(gray, width, height, xIn, yIn)
                        val valOut = sampleBilinear(gray, width, height, xOut, yOut)
                        val grad = valOut - valIn

                        if (grad > 18f) {
                            edgePoints.add(Point2D(approxCx + r * cosA, approxCy + r * sinA))
                            break
                        }
                    }
                    r -= 1.0f
                }
            }

            if (edgePoints.size >= 10) {
                val refined = fitCircleKasa(edgePoints)
                if (refined != null && refined.radius >= 20f) return refined
            }

            if (approxR >= 20f) {
                return CodeLocation(approxCx, approxCy, approxR)
            }
        }

        return null
    }

    /**
     * Finds rotation angle using Zero-Mean Normalized Cross-Correlation (ZNCC)
     * around the orientation track with plateau midpoint resolution.
     */
    fun findOrientation(
        gray: ByteArray,
        width: Int,
        height: Int,
        cx: Float,
        cy: Float,
        radius: Float,
        axisRatio: Float = 1.0f,
        tiltAngle: Float = 0f
    ): Float {
        val orientR = ZCodeGeometry.ORIENTATION_RADIUS * radius
        val dotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * radius
        val numSamples = 360
        val sampledIntensities = FloatArray(numSamples)

        var meanIntensity = 0f
        for (deg in 0 until numSamples) {
            val rad = (deg * PI.toFloat()) / 180f

            val ptCenter = getAffinePoint(cx, cy, orientR, rad, axisRatio, tiltAngle)
            val ptInner = getAffinePoint(cx, cy, orientR - dotR * 0.5f, rad, axisRatio, tiltAngle)
            val ptOuter = getAffinePoint(cx, cy, orientR + dotR * 0.5f, rad, axisRatio, tiltAngle)

            val vCenter = 255f - sampleBilinear(gray, width, height, ptCenter.x, ptCenter.y)
            val vInner = 255f - sampleBilinear(gray, width, height, ptInner.x, ptInner.y)
            val vOuter = 255f - sampleBilinear(gray, width, height, ptOuter.x, ptOuter.y)

            val v = maxOf(vCenter, maxOf(vInner, vOuter))
            sampledIntensities[deg] = v
            meanIntensity += v
        }
        meanIntensity /= numSamples.toFloat()

        for (deg in 0 until numSamples) {
            sampledIntensities[deg] -= meanIntensity
        }

        val scores = FloatArray(numSamples)
        var maxCorr = Float.NEGATIVE_INFINITY
        var bestIdx = 0

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
            val keyPt = getAffinePoint(cx, cy, 0.235f * radius, keyRad, axisRatio, tiltAngle)
            val keyVal = (255f - sampleBilinear(gray, width, height, keyPt.x, keyPt.y)) - meanIntensity
            corr += keyVal * 1.5f

            scores[shift] = corr
            if (corr > maxCorr) {
                maxCorr = corr
                bestIdx = shift
            }
        }

        var left = bestIdx
        var right = bestIdx
        val tol = maxOf(10f, abs(maxCorr) * 0.02f)

        while (scores[((left - 1) % numSamples + numSamples) % numSamples] >= maxCorr - tol && (bestIdx - left) < 10) {
            left--
        }
        while (scores[((right + 1) % numSamples + numSamples) % numSamples] >= maxCorr - tol && (right - bestIdx) < 10) {
            right++
        }

        val avgDeg = ((left + right) / 2f % numSamples + numSamples) % numSamples
        return (avgDeg * PI.toFloat()) / 180f
    }

    /**
     * Samples bits using Local Radial Differential Sampling (Dot vs. Inter-track Gaps).
     */
    fun sampleBits(
        gray: ByteArray,
        width: Int,
        height: Int,
        cx: Float,
        cy: Float,
        radius: Float,
        rotation: Float,
        axisRatio: Float = 1.0f,
        tiltAngle: Float = 0f
    ): BooleanArray {
        val bits = BooleanArray(ZCodeGeometry.TOTAL_BITS)
        var bitIdx = 0
        val gapOffset = 0.030f * radius

        val ptCenterRef = getAffinePoint(cx, cy, 0f, 0f, axisRatio, tiltAngle)
        val ptGapRef = getAffinePoint(cx, cy, radius * 0.11f, 0f, axisRatio, tiltAngle)
        val centerDark = 255f - sampleBilinear(gray, width, height, ptCenterRef.x, ptCenterRef.y)
        val gapDark = 255f - sampleBilinear(gray, width, height, ptGapRef.x, ptGapRef.y)
        val refContrast = maxOf(15f, centerDark - gapDark)

        for (track in ZCodeGeometry.DATA_TRACKS) {
            val trackR = track.radius * radius
            val numSectors = track.numSectors
            val dotContrasts = FloatArray(numSectors)

            var meanContrast = 0f
            for (s in 0 until numSectors) {
                val angle = rotation + (s.toFloat() / numSectors) * 2f * PI.toFloat()

                val ptCenter = getAffinePoint(cx, cy, trackR, angle, axisRatio, tiltAngle)
                val ptInner = getAffinePoint(cx, cy, trackR - gapOffset, angle, axisRatio, tiltAngle)
                val ptOuter = getAffinePoint(cx, cy, trackR + gapOffset, angle, axisRatio, tiltAngle)

                val valCenter = sampleBilinear(gray, width, height, ptCenter.x, ptCenter.y)
                val valInnerGap = sampleBilinear(gray, width, height, ptInner.x, ptInner.y)
                val valOuterGap = sampleBilinear(gray, width, height, ptOuter.x, ptOuter.y)
                val valBg = (valInnerGap + valOuterGap) / 2f

                val contrast = valBg - valCenter
                dotContrasts[s] = contrast
                meanContrast += contrast
            }
            meanContrast /= numSectors.toFloat()

            val winSize = maxOf(3, numSectors / 8)
            for (s in 0 until numSectors) {
                var localSum = 0f
                var count = 0
                for (dw in -winSize..winSize) {
                    val idx = ((s + dw) % numSectors + numSectors) % numSectors
                    localSum += dotContrasts[idx]
                    count++
                }
                val localMeanContrast = localSum / count.toFloat()
                val dynamicThreshold = maxOf(refContrast * 0.30f, localMeanContrast * 0.40f)
                bits[bitIdx++] = dotContrasts[s] > dynamicThreshold
            }
        }

        return bits
    }
}
