/**
 * Cryptographic Subsystem for Z-Code Password Protection
 * - Authenticated Encryption: AES-256-GCM
 * - Key Derivation: PBKDF2-HMAC-SHA256 (100,000 iterations)
 * - 64-bit random salt, 96-bit random nonce/IV, 128-bit authentication tag
 * - Zero plaintext password storage
 * - 100% client-side (Web Crypto API)
 */

export const SALT_BYTES = 8;
export const IV_BYTES = 12;
export const TAG_BYTES = 16;
export const CRYPTO_OVERHEAD = SALT_BYTES + IV_BYTES + TAG_BYTES; // 36 bytes
export const PBKDF2_ITERATIONS = 100_000;

export interface EncryptedEnvelope {
  salt: Uint8Array;       // 8 bytes
  iv: Uint8Array;         // 12 bytes
  tag: Uint8Array;        // 16 bytes
  ciphertext: Uint8Array; // variable bytes
}

export class ZCodeCrypto {
  private static getCryptoObj(): any {
    const g = globalThis as any;
    if (g.crypto) {
      return g.crypto;
    }
    try {
      if (typeof g.require === "function") {
        const nodeCrypto = g.require("node:crypto");
        return nodeCrypto?.webcrypto || nodeCrypto;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private static getSubtle(): SubtleCrypto {
    const cryptoObj = this.getCryptoObj();
    if (cryptoObj?.subtle) {
      return cryptoObj.subtle;
    }
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
  }

  /**
   * Generates cryptographically secure random bytes.
   */
  public static getRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    const cryptoObj = this.getCryptoObj();
    if (cryptoObj?.getRandomValues) {
      return cryptoObj.getRandomValues(bytes);
    }
    try {
      const g = globalThis as any;
      if (typeof g.require === "function") {
        const nodeCrypto = g.require("node:crypto");
        if (nodeCrypto?.randomFillSync) {
          nodeCrypto.randomFillSync(bytes);
          return bytes;
        }
      }
    } catch {
      // Fall through to error
    }
    throw new Error("Cryptographically secure random number generator (CSPRNG) is unavailable.");
  }

  /**
   * Derives a 256-bit AES-GCM key from a password and salt using PBKDF2-HMAC-SHA256.
   */
  public static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const subtle = this.getSubtle();
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Import raw password as key material
    const baseKey = await subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    // Derive 256-bit AES-GCM key
    return subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts plaintext bytes using AES-256-GCM.
   */
  public static async encrypt(
    password: string,
    plaintext: Uint8Array
  ): Promise<EncryptedEnvelope> {
    const subtle = this.getSubtle();
    const salt = this.getRandomBytes(SALT_BYTES);
    const iv = this.getRandomBytes(IV_BYTES);
    const key = await this.deriveKey(password, salt);

    // subtle.encrypt in AES-GCM appends the 16-byte authentication tag at the end of the ciphertext
    const encryptedBuf = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
        tagLength: 128,
      },
      key,
      plaintext as BufferSource
    );

    const encryptedBytes = new Uint8Array(encryptedBuf);
    const ciphertextLen = encryptedBytes.length - TAG_BYTES;
    const ciphertext = encryptedBytes.slice(0, ciphertextLen);
    const tag = encryptedBytes.slice(ciphertextLen);

    return {
      salt,
      iv,
      tag,
      ciphertext,
    };
  }

  /**
   * Decrypts an encrypted envelope using the provided password.
   * Throws an error if the password or authentication tag is invalid.
   */
  public static async decrypt(
    password: string,
    envelope: EncryptedEnvelope
  ): Promise<Uint8Array> {
    const subtle = this.getSubtle();
    const key = await this.deriveKey(password, envelope.salt);

    // Combine ciphertext and auth tag for WebCrypto AES-GCM
    const combined = new Uint8Array(envelope.ciphertext.length + envelope.tag.length);
    combined.set(envelope.ciphertext, 0);
    combined.set(envelope.tag, envelope.ciphertext.length);

    try {
      const decryptedBuf = await subtle.decrypt(
        {
          name: "AES-GCM",
          iv: envelope.iv as BufferSource,
          tagLength: 128,
        },
        key,
        combined as BufferSource
      );
      return new Uint8Array(decryptedBuf);
    } catch {
      throw new Error("Incorrect password or corrupted data. Decryption failed.");
    }
  }

  /**
   * Packs an encrypted envelope into a contiguous byte buffer:
   * [Salt 8B][IV 12B][Tag 16B][Ciphertext]
   */
  public static packEnvelope(envelope: EncryptedEnvelope): Uint8Array {
    const totalLen = CRYPTO_OVERHEAD + envelope.ciphertext.length;
    const packed = new Uint8Array(totalLen);
    let offset = 0;

    packed.set(envelope.salt, offset);
    offset += SALT_BYTES;

    packed.set(envelope.iv, offset);
    offset += IV_BYTES;

    packed.set(envelope.tag, offset);
    offset += TAG_BYTES;

    packed.set(envelope.ciphertext, offset);
    return packed;
  }

  /**
   * Unpacks a contiguous byte buffer back into an EncryptedEnvelope.
   */
  public static unpackEnvelope(packed: Uint8Array): EncryptedEnvelope {
    if (packed.length < CRYPTO_OVERHEAD) {
      throw new Error("Invalid encrypted envelope size: buffer too small");
    }

    let offset = 0;
    const salt = packed.slice(offset, offset + SALT_BYTES);
    offset += SALT_BYTES;

    const iv = packed.slice(offset, offset + IV_BYTES);
    offset += IV_BYTES;

    const tag = packed.slice(offset, offset + TAG_BYTES);
    offset += TAG_BYTES;

    const ciphertext = packed.slice(offset);

    return {
      salt,
      iv,
      tag,
      ciphertext,
    };
  }
}
