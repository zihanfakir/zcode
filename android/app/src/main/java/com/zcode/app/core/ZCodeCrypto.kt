package com.zcode.app.core

import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

data class EncryptedEnvelope(
    val salt: ByteArray,       // 8 bytes
    val iv: ByteArray,         // 12 bytes
    val tag: ByteArray,        // 16 bytes
    val ciphertext: ByteArray  // variable bytes
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as EncryptedEnvelope

        if (!salt.contentEquals(other.salt)) return false
        if (!iv.contentEquals(other.iv)) return false
        if (!tag.contentEquals(other.tag)) return false
        if (!ciphertext.contentEquals(other.ciphertext)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = salt.contentHashCode()
        result = 31 * result + iv.contentHashCode()
        result = 31 * result + tag.contentHashCode()
        result = 31 * result + ciphertext.contentHashCode()
        return result
    }
}

object ZCodeCrypto {
    const val SALT_BYTES = 8
    const val IV_BYTES = 12
    const val TAG_BYTES = 16
    const val CRYPTO_OVERHEAD = SALT_BYTES + IV_BYTES + TAG_BYTES // 36 bytes
    const val PBKDF2_ITERATIONS = 100_000

    private val secureRandom = SecureRandom()

    fun getRandomBytes(length: Int): ByteArray {
        val bytes = ByteArray(length)
        secureRandom.nextBytes(bytes)
        return bytes
    }

    fun deriveKey(password: String, salt: ByteArray): SecretKeySpec {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, 256)
        val secretKey = factory.generateSecret(spec)
        return SecretKeySpec(secretKey.encoded, "AES")
    }

    fun encrypt(password: String, plaintext: ByteArray): EncryptedEnvelope {
        val salt = getRandomBytes(SALT_BYTES)
        val iv = getRandomBytes(IV_BYTES)
        val key = deriveKey(password, salt)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec)

        val encryptedWithTag = cipher.doFinal(plaintext)
        val ciphertextLen = encryptedWithTag.size - TAG_BYTES
        val ciphertext = encryptedWithTag.copyOfRange(0, ciphertextLen)
        val tag = encryptedWithTag.copyOfRange(ciphertextLen, encryptedWithTag.size)

        return EncryptedEnvelope(salt, iv, tag, ciphertext)
    }

    fun decrypt(password: String, envelope: EncryptedEnvelope): ByteArray {
        val key = deriveKey(password, envelope.salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(128, envelope.iv)
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec)

        val combined = ByteArray(envelope.ciphertext.size + envelope.tag.size)
        System.arraycopy(envelope.ciphertext, 0, combined, 0, envelope.ciphertext.size)
        System.arraycopy(envelope.tag, 0, combined, envelope.ciphertext.size, envelope.tag.size)

        return try {
            cipher.doFinal(combined)
        } catch (e: Exception) {
            throw IllegalArgumentException("Incorrect password or corrupted data. Decryption failed.", e)
        }
    }

    fun packEnvelope(envelope: EncryptedEnvelope): ByteArray {
        val packed = ByteArray(CRYPTO_OVERHEAD + envelope.ciphertext.size)
        var offset = 0

        System.arraycopy(envelope.salt, 0, packed, offset, SALT_BYTES)
        offset += SALT_BYTES

        System.arraycopy(envelope.iv, 0, packed, offset, IV_BYTES)
        offset += IV_BYTES

        System.arraycopy(envelope.tag, 0, packed, offset, TAG_BYTES)
        offset += TAG_BYTES

        System.arraycopy(envelope.ciphertext, 0, packed, offset, envelope.ciphertext.size)
        return packed
    }

    fun unpackEnvelope(packed: ByteArray): EncryptedEnvelope {
        if (packed.size < CRYPTO_OVERHEAD) {
            throw IllegalArgumentException("Invalid encrypted envelope size: buffer too small")
        }

        var offset = 0
        val salt = packed.copyOfRange(offset, offset + SALT_BYTES)
        offset += SALT_BYTES

        val iv = packed.copyOfRange(offset, offset + IV_BYTES)
        offset += IV_BYTES

        val tag = packed.copyOfRange(offset, offset + TAG_BYTES)
        offset += TAG_BYTES

        val ciphertext = packed.copyOfRange(offset, packed.size)

        return EncryptedEnvelope(salt, iv, tag, ciphertext)
    }
}
