package com.zcode.app.core

import android.graphics.Bitmap
import kotlin.math.PI

data class ZCodeDecodedResult(
    val payload: ZCodePayload,
    val rotation: Float,
    val errorsCorrected: Int,
    val location: CodeLocation
)

class ZCodeDecoder {
    private val rs = ReedSolomon(ZCodeFormat.ECC_BYTES)

    fun decodeBitmap(bitmap: Bitmap): ZCodeDecodedResult {
        val gray = ZCodeDetector.toGrayscale(bitmap)
        return decodeGrayscale(gray, bitmap.width, bitmap.height)
    }

    fun decodeGrayscale(gray: ByteArray, width: Int, height: Int): ZCodeDecodedResult {
        val location = ZCodeDetector.locateCode(gray, width, height)
            ?: throw IllegalStateException("Could not detect Z-Code circular boundary in image")

        val rotation = ZCodeDetector.findOrientation(
            gray,
            width,
            height,
            location.cx,
            location.cy,
            location.radius
        )

        // Multi-pass sub-degree offsets and radius scaling
        val candidateOffsets = floatArrayOf(0f, 0.5f, -0.5f, 1.0f, -1.0f, 1.5f, -1.5f, 2.0f, -2.0f)
        val candidateRadii = floatArrayOf(1.0f, 0.99f, 1.01f, 0.98f, 1.02f)
        var lastError: Exception? = null

        for (radScale in candidateRadii) {
            val curRadius = location.radius * radScale
            for (degOffset in candidateOffsets) {
                val angle = rotation + (degOffset * PI.toFloat()) / 180f
                val bits = ZCodeDetector.sampleBits(
                    gray,
                    width,
                    height,
                    location.cx,
                    location.cy,
                    curRadius,
                    angle
                )

                try {
                    return decodeBits(bits, angle, location.copy(radius = curRadius))
                } catch (e: Exception) {
                    lastError = e
                }
            }
        }

        throw lastError ?: IllegalStateException("Failed to decode Z-Code")
    }

    fun decodeBits(
        bits: BooleanArray,
        rotation: Float = 0f,
        location: CodeLocation = CodeLocation(0f, 0f, 0f)
    ): ZCodeDecodedResult {
        if (bits.size != ZCodeGeometry.TOTAL_BITS) {
            throw IllegalArgumentException("Invalid bit length")
        }

        val receivedCodeword = ByteArray(ZCodeGeometry.TOTAL_BYTES)
        var bitIdx = 0
        for (i in 0 until ZCodeGeometry.TOTAL_BYTES) {
            var byteVal = 0
            for (b in 7 downTo 0) {
                if (bits[bitIdx++]) {
                    byteVal = byteVal or (1 shl b)
                }
            }
            receivedCodeword[i] = byteVal.toByte()
        }

        // Reed-Solomon Correction
        val correctedDataBlock = rs.decode(receivedCodeword)
        var errorsCorrected = 0
        for (i in 0 until ZCodeFormat.TOTAL_DATA_BYTES) {
            if (receivedCodeword[i] != correctedDataBlock[i]) {
                errorsCorrected++
            }
        }

        // CRC-16 Check
        val dataForCrc = correctedDataBlock.copyOfRange(0, ZCodeFormat.TOTAL_DATA_BYTES - 2)
        val expectedCrc = ((correctedDataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 2].toInt() and 0xFF) shl 8) or
                (correctedDataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 1].toInt() and 0xFF)
        val actualCrc = CRC16.calculate(dataForCrc)

        if (expectedCrc != actualCrc) {
            throw IllegalStateException("CRC-16 checksum verification failed")
        }

        val payload = ZCodeFormat.unpack(correctedDataBlock)

        return ZCodeDecodedResult(payload, rotation, errorsCorrected, location)
    }

    companion object {
        fun unlock(payload: ZCodePayload, password: String): ZCodePayload {
            if (!payload.isLocked) return payload
            val encryptedData = payload.encryptedData
                ?: throw IllegalArgumentException("Cannot unlock Z-Code: missing encrypted payload data")

            val envelope = ZCodeCrypto.unpackEnvelope(encryptedData)
            val decryptedBytes = ZCodeCrypto.decrypt(password, envelope)
            var content = String(decryptedBytes, java.nio.charset.StandardCharsets.UTF_8)

            if (payload.type == ZCodeDataType.URL) {
                val prefixIndex = payload.flags and 0x0F
                if (prefixIndex in 1 until ZCodeFormat.URL_PREFIXES.size) {
                    content = ZCodeFormat.URL_PREFIXES[prefixIndex] + content
                }
            }

            return ZCodePayload(
                type = payload.type,
                content = content,
                version = payload.version,
                isLocked = false,
                flags = payload.flags
            )
        }
    }
}
