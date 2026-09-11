package com.zcode.app.core

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

data class ZCodeEncodedData(
    val type: ZCodeDataType,
    val content: String,
    val bytes: ByteArray,
    val bits: BooleanArray,
    val isLocked: Boolean = false
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ZCodeEncodedData

        if (type != other.type) return false
        if (content != other.content) return false
        if (!bytes.contentEquals(other.bytes)) return false
        if (!bits.contentEquals(other.bits)) return false
        if (isLocked != other.isLocked) return false

        return true
    }

    override fun hashCode(): Int {
        var result = type.hashCode()
        result = 31 * result + content.hashCode()
        result = 31 * result + bytes.contentHashCode()
        result = 31 * result + bits.contentHashCode()
        result = 31 * result + isLocked.hashCode()
        return result
    }
}

class ZCodeEncoder {
    private val rs = ReedSolomon(ZCodeFormat.ECC_BYTES)

    fun encode(
        content: String,
        password: String? = null,
        forceType: ZCodeDataType? = null
    ): ZCodeEncodedData {
        if (password.isNullOrEmpty()) {
            return encodeUnprotected(content, forceType)
        }
        return encodeProtected(content, password, forceType)
    }

    private fun encodeUnprotected(content: String, forceType: ZCodeDataType? = null): ZCodeEncodedData {
        val type = forceType ?: if (ZCodeFormat.isUrl(content)) ZCodeDataType.URL else ZCodeDataType.TEXT
        val dataBlock = ZCodeFormat.pack(type, content)

        // CRC-16
        val dataForCrc = dataBlock.copyOfRange(0, ZCodeFormat.TOTAL_DATA_BYTES - 2)
        val crc = CRC16.calculate(dataForCrc)
        dataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 2] = ((crc ushr 8) and 0xFF).toByte()
        dataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 1] = (crc and 0xFF).toByte()

        // Reed-Solomon Parity (14 bytes) -> 85 bytes total codeword
        val fullCodeword = rs.encode(dataBlock)

        // Expand to bits (680 bits)
        val bits = BooleanArray(ZCodeGeometry.TOTAL_BITS)
        var bitIdx = 0
        for (b in fullCodeword) {
            val byteVal = b.toInt() and 0xFF
            for (i in 7 downTo 0) {
                bits[bitIdx++] = ((byteVal ushr i) and 1) == 1
            }
        }

        return ZCodeEncodedData(type, content, fullCodeword, bits, isLocked = false)
    }

    private fun encodeProtected(
        content: String,
        password: String,
        forceType: ZCodeDataType? = null
    ): ZCodeEncodedData {
        val type = forceType ?: if (ZCodeFormat.isUrl(content)) ZCodeDataType.URL else ZCodeDataType.TEXT
        var textToEncrypt = if (type == ZCodeDataType.URL) content.trim() else content
        var flags = ZCodeFormat.FLAG_ENCRYPTED

        if (type == ZCodeDataType.URL) {
            val prefixOrder = intArrayOf(3, 4, 1, 2)
            for (idx in prefixOrder) {
                val prefix = ZCodeFormat.URL_PREFIXES[idx]
                if (textToEncrypt.startsWith(prefix, ignoreCase = true)) {
                    flags = flags or idx
                    textToEncrypt = textToEncrypt.substring(prefix.length)
                    break
                }
            }
        }

        val plaintextBytes = textToEncrypt.toByteArray(java.nio.charset.StandardCharsets.UTF_8)
        if (plaintextBytes.size > ZCodeFormat.MAX_ENCRYPTED_PAYLOAD) {
            throw IllegalArgumentException(
                "Payload exceeds maximum password-protected limit of ${ZCodeFormat.MAX_ENCRYPTED_PAYLOAD} bytes"
            )
        }

        val envelope = ZCodeCrypto.encrypt(password, plaintextBytes)
        val packedEnvelope = ZCodeCrypto.packEnvelope(envelope)

        val dataBlock = ZCodeFormat.packRaw(type, flags, packedEnvelope)

        // CRC-16
        val dataForCrc = dataBlock.copyOfRange(0, ZCodeFormat.TOTAL_DATA_BYTES - 2)
        val crc = CRC16.calculate(dataForCrc)
        dataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 2] = ((crc ushr 8) and 0xFF).toByte()
        dataBlock[ZCodeFormat.TOTAL_DATA_BYTES - 1] = (crc and 0xFF).toByte()

        // Reed-Solomon Parity
        val fullCodeword = rs.encode(dataBlock)

        // Expand to bits
        val bits = BooleanArray(ZCodeGeometry.TOTAL_BITS)
        var bitIdx = 0
        for (b in fullCodeword) {
            val byteVal = b.toInt() and 0xFF
            for (i in 7 downTo 0) {
                bits[bitIdx++] = ((byteVal ushr i) and 1) == 1
            }
        }

        return ZCodeEncodedData(type, content, fullCodeword, bits, isLocked = true)
    }


    fun renderBitmap(
        data: ZCodeEncodedData,
        size: Int = 512,
        fgColor: Int = Color.rgb(15, 23, 42),
        bgColor: Int = Color.WHITE,
        margin: Int = 24,
        showCenterZ: Boolean = false
    ): Bitmap {
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        canvas.drawColor(bgColor)

        val cx = size / 2f
        val cy = size / 2f
        val codeRadius = (size / 2f) - margin

        val fgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = fgColor
            style = Paint.Style.FILL
        }

        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = fgColor
            style = Paint.Style.STROKE
        }

        // 1. Outer Ring
        val outerRadius = ((ZCodeGeometry.OUTER_RING_INNER_RADIUS + ZCodeGeometry.OUTER_RING_OUTER_RADIUS) / 2f) * codeRadius
        val outerWidth = (ZCodeGeometry.OUTER_RING_OUTER_RADIUS - ZCodeGeometry.OUTER_RING_INNER_RADIUS) * codeRadius
        strokePaint.strokeWidth = outerWidth
        canvas.drawCircle(cx, cy, outerRadius, strokePaint)

        // 2. Central Bullseye
        val innerR = ZCodeGeometry.INNER_BULLSEYE_RADIUS * codeRadius
        val ringR = ((ZCodeGeometry.BULLSEYE_GAP_1_RADIUS + ZCodeGeometry.BULLSEYE_RING_RADIUS) / 2f) * codeRadius
        val ringW = (ZCodeGeometry.BULLSEYE_RING_RADIUS - ZCodeGeometry.BULLSEYE_GAP_1_RADIUS) * codeRadius
        strokePaint.strokeWidth = ringW
        canvas.drawCircle(cx, cy, ringR, strokePaint)
        canvas.drawCircle(cx, cy, innerR, fgPaint)

        // Stylized 'Z'
        if (showCenterZ) {
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = bgColor
                style = Paint.Style.STROKE
                strokeWidth = innerR * 0.28f
                strokeCap = Paint.Cap.ROUND
                strokeJoin = Paint.Join.ROUND
            }
            val zSize = innerR * 0.95f
            val path = Path().apply {
                moveTo(cx - zSize * 0.5f, cy - zSize * 0.55f)
                lineTo(cx + zSize * 0.5f, cy - zSize * 0.55f)
                lineTo(cx - zSize * 0.4f, cy + zSize * 0.55f)
                lineTo(cx + zSize * 0.5f, cy + zSize * 0.55f)
            }
            canvas.drawPath(path, bgPaint)
        }

        // 3. Orientation Track
        val orientR = ZCodeGeometry.ORIENTATION_RADIUS * codeRadius
        val orientDotR = ZCodeGeometry.ORIENTATION_DOT_RADIUS * codeRadius

        for (i in 0 until ZCodeGeometry.ORIENTATION_SECTORS) {
            if (ZCodeGeometry.SYNC_PATTERN[i] == 1) {
                val theta = (i.toFloat() / ZCodeGeometry.ORIENTATION_SECTORS) * 2f * PI.toFloat()
                canvas.drawCircle(cx + orientR * cos(theta), cy + orientR * sin(theta), orientDotR, fgPaint)
            }
        }

        // Key pip at 0 degrees
        val keyPipR = codeRadius * 0.235f
        canvas.drawCircle(cx + keyPipR, cy, orientDotR * 1.5f, fgPaint)

        // 4. Data Tracks
        var bitIdx = 0
        for (track in ZCodeGeometry.DATA_TRACKS) {
            val r = track.radius * codeRadius
            val dotR = track.dotRadius * codeRadius

            for (s in 0 until track.numSectors) {
                if (data.bits[bitIdx++]) {
                    val theta = (s.toFloat() / track.numSectors) * 2f * PI.toFloat()
                    canvas.drawCircle(cx + r * cos(theta), cy + r * sin(theta), dotR, fgPaint)
                }
            }
        }

        return bitmap
    }
}
