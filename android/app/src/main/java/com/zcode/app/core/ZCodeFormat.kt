package com.zcode.app.core

import java.nio.charset.StandardCharsets

enum class ZCodeDataType(val code: Int) {
    TEXT(0x01),
    URL(0x02);

    companion object {
        fun fromCode(code: Int): ZCodeDataType? = entries.find { it.code == code }
    }
}

data class ZCodePayload(
    val type: ZCodeDataType,
    val content: String,
    val version: Int,
    val isLocked: Boolean = false,
    val flags: Int = 0,
    val encryptedData: ByteArray? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as ZCodePayload

        if (type != other.type) return false
        if (content != other.content) return false
        if (version != other.version) return false
        if (isLocked != other.isLocked) return false
        if (flags != other.flags) return false
        if (encryptedData != null) {
            if (other.encryptedData == null) return false
            if (!encryptedData.contentEquals(other.encryptedData)) return false
        } else if (other.encryptedData != null) return false

        return true
    }

    override fun hashCode(): Int {
        var result = type.hashCode()
        result = 31 * result + content.hashCode()
        result = 31 * result + version
        result = 31 * result + isLocked.hashCode()
        result = 31 * result + flags
        result = 31 * result + (encryptedData?.contentHashCode() ?: 0)
        return result
    }
}

object ZCodeFormat {
    const val MAGIC_0 = 0x5A
    const val MAGIC_1 = 0x43
    const val VERSION_1 = 0x01

    const val FLAG_ENCRYPTED = 0x80
    const val FLAG_COMPRESSED = 0x40

    const val HEADER_BYTES = 6
    const val CRC_BYTES = 2
    const val ECC_BYTES = 14
    const val MAX_PAYLOAD = 63
    const val TOTAL_DATA_BYTES = HEADER_BYTES + MAX_PAYLOAD + CRC_BYTES // 71 bytes
    const val TOTAL_CODEWORD_BYTES = TOTAL_DATA_BYTES + ECC_BYTES // 85 bytes
    const val MAX_ENCRYPTED_PAYLOAD = 27 // 63 - 36 crypto overhead

    val URL_PREFIXES = arrayOf(
        "",
        "https://",
        "http://",
        "https://www.",
        "http://www."
    )

    fun isUrl(text: String): Boolean {
        val trimmed = text.trim()
        val regex = Regex("^(https?://|www\\.)[a-zA-Z0-9\\-._~:/?#\\[\\]@!$&'()*+,;=]+", RegexOption.IGNORE_CASE)
        return regex.containsMatchIn(trimmed)
    }

    fun packRaw(type: ZCodeDataType, flags: Int, payloadBytes: ByteArray): ByteArray {
        if (payloadBytes.size > MAX_PAYLOAD) {
            throw IllegalArgumentException("Payload exceeds limit of $MAX_PAYLOAD bytes")
        }

        val block = ByteArray(TOTAL_DATA_BYTES)
        block[0] = MAGIC_0.toByte()
        block[1] = MAGIC_1.toByte()
        block[2] = VERSION_1.toByte()
        block[3] = type.code.toByte()
        block[4] = flags.toByte()
        block[5] = payloadBytes.size.toByte()

        System.arraycopy(payloadBytes, 0, block, HEADER_BYTES, payloadBytes.size)

        for (i in (HEADER_BYTES + payloadBytes.size) until (TOTAL_DATA_BYTES - CRC_BYTES)) {
            block[i] = if (i % 2 == 0) 0xAA.toByte() else 0x55.toByte()
        }

        return block
    }

    fun pack(type: ZCodeDataType, rawContent: String): ByteArray {
        var content = if (type == ZCodeDataType.URL) rawContent.trim() else rawContent
        var flags = 0

        if (type == ZCodeDataType.URL) {
            val prefixOrder = intArrayOf(5, 3, 4, 1, 2)
            for (idx in prefixOrder) {
                val prefix = URL_PREFIXES[idx]
                if (content.startsWith(prefix, ignoreCase = true)) {
                    flags = idx
                    content = content.substring(prefix.length)
                    break
                }
            }
        }

        val payloadBytes = content.toByteArray(StandardCharsets.UTF_8)
        return packRaw(type, flags, payloadBytes)
    }

    fun unpack(dataBlock: ByteArray): ZCodePayload {
        if (dataBlock.size < HEADER_BYTES + CRC_BYTES) {
            throw IllegalArgumentException("Data block too short")
        }
        if ((dataBlock[0].toInt() and 0xFF) != MAGIC_0 || (dataBlock[1].toInt() and 0xFF) != MAGIC_1) {
            throw IllegalArgumentException("Invalid Z-Code magic")
        }

        val version = dataBlock[2].toInt() and 0xFF
        if (version != VERSION_1) {
            throw IllegalArgumentException("Unsupported Z-Code version: $version")
        }
        val typeCode = dataBlock[3].toInt() and 0xFF
        val type = ZCodeDataType.fromCode(typeCode) ?: throw IllegalArgumentException("Unknown type: $typeCode")
        val flags = dataBlock[4].toInt() and 0xFF
        val payloadLen = dataBlock[5].toInt() and 0xFF

        if (payloadLen > MAX_PAYLOAD) throw IllegalArgumentException("Invalid payload length")

        val isLocked = (flags and FLAG_ENCRYPTED) != 0

        if (isLocked) {
            val encryptedBytes = dataBlock.copyOfRange(HEADER_BYTES, HEADER_BYTES + payloadLen)
            return ZCodePayload(
                type = type,
                content = "",
                version = version,
                isLocked = true,
                flags = flags,
                encryptedData = encryptedBytes
            )
        }

        var content = String(dataBlock, HEADER_BYTES, payloadLen, StandardCharsets.UTF_8)

        if (type == ZCodeDataType.URL) {
            val prefixIndex = flags and 0x0F
            if (prefixIndex in 1 until URL_PREFIXES.size) {
                content = URL_PREFIXES[prefixIndex] + content
            }
        }

        return ZCodePayload(
            type = type,
            content = content,
            version = version,
            isLocked = false,
            flags = flags
        )
    }
}
