# Z-Code Specification (Version 1.0)
**Document Status**: Official Release (RFC-ZCODE-01)  
**Author**: Z-Code Working Group  
**Classification**: Open Standard for Circular 2D Barcode Systems  

---

## 1. Abstract
Z-Code is an optical, circular 2D machine-readable matrix code designed for high recognizability, aesthetic minimalism, and robust scanning resilience. Unlike conventional rectilinear barcodes (such as standard QR Codes or Data Matrix), Z-Code uses concentric polar coordinate tracks, a concentric locator bullseye, an asymmetric orientation synchronization track, and systematic Reed-Solomon error correction over Galois Field $\text{GF}(2^8)$.

---

## 2. Visual Structure & Polar Geometry

The Z-Code symbol is strictly bounded within a circular disc of normalized radius $R = 1.0$. All geometric elements are defined in polar coordinates $(r, \theta)$ relative to the center origin $(0, 0)$, where $r \in [0, 1.0]$ and $\theta \in [0, 2\pi)$.

```
                      . - ~ ~ ~ - .
                  . '  Outer Ring  ' .
                /      Data Track 6    \
               /       Data Track 5     \
              |        Data Track 4      |
             |         Data Track 3       |
             |      Orientation Track     |
             |          (Bullseye)        |
             |             ( Z )          |
             |      Orientation Track     |
             |         Data Track 3       |
              |        Data Track 4      |
               \       Data Track 5     /
                \      Data Track 6    /
                  . '  Outer Ring  ' .
                      ' - ~ ~ ~ - '
```

### 2.1 Central Locator (Bullseye Anchor)
The center of the code contains a multi-ring concentric anchor providing rapid, scale-invariant centroid detection:
1. **Inner Core Disk**: Solid dark circle, radius $0.0 \le r \le 0.08$. Optionally contains the brand 'Z' vector insignia.
2. **First Spacer Gap**: Clear/light ring, $0.08 < r \le 0.14$ (width $0.06$).
3. **Concentric Locator Ring**: Solid dark circular band, $0.14 < r \le 0.20$ (width $0.06$).
4. **Buffer Gap**: Clear/light band, $0.20 < r \le 0.24$ (width $0.04$).

*Cross-sectional Signature*: Any slice cutting through the center produces the radial ratio $1 : 1 : 2.67 : 1 : 1$, which uniquely identifies the center regardless of tilt or orientation.

### 2.2 Orientation & Synchronization Track
- **Nominal Radius**: $r = 0.27$
- **Total Sectors**: 32 angular positions ($\Delta\theta = 2\pi / 32 = 11.25^\circ$)
- **Module Form**: Circular dots of radius $0.016$
- **Synch Pattern**: 32-bit Barker-optimized sequence:
  `[1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0]`
- **Directional Key Marker**: An asymmetrical triangular key pip positioned at $\theta = 0^\circ, r = 0.235$ breaks $180^\circ$ ambiguities and provides immediate coarse azimuth locking.

### 2.3 Data Tracks (Version 1 - Standard)
The payload and parity codewords are encoded across 10 concentric data tracks:

| Track # | Normalized Radius ($r$) | Number of Sectors ($N_i$) | Sector Step ($\Delta\theta$) | Module Radius ($r_{dot}$) |
|:-------:|:-----------------------:|:-------------------------:|:----------------------------:|:-------------------------:|
| Track 0 | 0.34 | 32 dots | $11.250^\circ$ | 0.020 |
| Track 1 | 0.40 | 40 dots | $9.000^\circ$ | 0.020 |
| Track 2 | 0.46 | 48 dots | $7.500^\circ$ | 0.020 |
| Track 3 | 0.52 | 56 dots | $6.429^\circ$ | 0.020 |
| Track 4 | 0.58 | 64 dots | $5.625^\circ$ | 0.020 |
| Track 5 | 0.64 | 72 dots | $5.000^\circ$ | 0.020 |
| Track 6 | 0.70 | 80 dots | $4.500^\circ$ | 0.020 |
| Track 7 | 0.76 | 88 dots | $4.091^\circ$ | 0.020 |
| Track 8 | 0.82 | 96 dots | $3.750^\circ$ | 0.020 |
| Track 9 | 0.88 | 104 dots | $3.462^\circ$ | 0.020 |

**Total Capacity**: $32 + 40 + 48 + 56 + 64 + 72 + 80 + 88 + 96 + 104 = 680$ binary modules = **85 bytes**.

### 2.4 Outer Framing Ring
- **Inner Radius**: $0.96$
- **Outer Radius**: $1.00$
- Acts as the circular physical boundary, perspective bounding ellipse reference, and background separator. Includes 4 registration micro-notches at $0^\circ, 90^\circ, 180^\circ, 270^\circ$.

---

## 3. Binary Packet Format & Framing

The 85 bytes ($680$ bits) are organized into a strict deterministic frame:

```
+-----------+---------+-----------+-------+------------+------------------+---------+--------+------------------+
| Magic (2) | Ver (1) | Type (1)  | Flags | Length (1) | Payload (0..63B) | Pad (B) | CRC-16 | RS Parity (14B)  |
| 0x5A 0x43 |  0x01   | 0x01/0x02 | (1B)  |  0 to 63   |    Bytes/Envelope| Pattern |  (2B)  |   ECC Codewords  |
+-----------+---------+-----------+-------+------------+------------------+---------+--------+------------------+
|<------------------------------ 71 Data Bytes (k = 71) ----------------------------->|<- 14 Parity (2t) ->|
|<-------------------------------- Total Codeword (n = 85) ------------------------------------------------>|
```

### 3.1 Field Descriptions
1. **Magic Header** (Bytes 0..1): `0x5A, 0x43` (ASCII `'Z'`, `'C'`).
2. **Version** (Byte 2): `0x01` (Version 1).
3. **Data Type** (Byte 3):
   - `0x01` = Plain UTF-8 Text
   - `0x02` = URL / Link
4. **Flags** (Byte 4):
   - **Bit 7 (`0x80`)**: `FLAG_ENCRYPTED`
     - `0` = Public Z-Code (unencrypted)
     - `1` = Password-Protected Z-Code (AES-256-GCM encrypted envelope)
   - **Bits 3..0**: URL protocol prefix compression:
     - `0`: None (raw URL in payload)
     - `1`: `"https://"` (strips 8 characters from payload)
     - `2`: `"http://"` (strips 7 characters)
     - `3`: `"https://www."` (strips 12 characters)
     - `4`: `"http://www."` (strips 11 characters)
5. **Payload Length** (Byte 5): Integer $L \in [0, 63]$ indicating the byte length of the variable payload.
6. **Payload Data** (Bytes 6 .. $5 + L$):
   - In Public Mode: Raw UTF-8 encoded string (up to 63 bytes).
   - In Password-Protected Mode: Packed binary envelope `[Salt 8B][IV 12B][Tag 16B][Ciphertext]` (up to 63 bytes; max 27 bytes plaintext ciphertext).
7. **Deterministic Padding** (Bytes $6 + L$ .. 68): Alternating byte pattern `0xAA, 0x55, 0xAA, ...` up to offset 68.
8. **CRC-16-CCITT** (Bytes 69..70): 16-bit checksum with polynomial $0x1021$ and initial value $0xFFFF$ calculated across Bytes 0..68.
9. **Reed-Solomon Parity** (Bytes 71..84): 14 parity bytes generated over the 71 data bytes.

---

## 4. Error Detection and Correction

### 4.1 Galois Field Specification
- Field: $\text{GF}(2^8)$
- Primitive Irreducible Polynomial:
  $$p(x) = x^8 + x^4 + x^3 + x^2 + 1 \quad (285 \text{ decimal, } 0x11D)$$
- Generator Root: $\alpha = 2$ ($0x02$)

### 4.2 Generator Polynomial
For $2t = 14$ parity bytes:
$$g(x) = \prod_{i=0}^{13} (x - \alpha^i)$$

### 4.3 Recovery Capability
- Maximum Correctable Byte Errors:
  $$t = \left\lfloor \frac{2t}{2} \right\rfloor = 7 \text{ corrupted bytes}$$
  Up to 56 random bit errors across 7 separate bytes (or entire damaged sectors of the visual disc) are repaired with zero data loss.
- CRC-16 verification ensures that undetected false positives are $< 1.5 \times 10^{-5}$.

---

## 5. Cryptographic Password Protection & Lock Feature

Z-Code defines an official, standard password-protection scheme ensuring confidentiality and authenticity:

1. **Authenticated Encryption**:
   - Algorithm: **AES-256-GCM** (Galois/Counter Mode).
   - Key Length: 256 bits (32 bytes).
   - Nonce / IV: 96 bits (12 bytes), generated via cryptographically secure pseudo-random number generator (`crypto.getRandomValues`).
   - Authentication Tag: 128 bits (16 bytes), guarantees integrity and authenticity.
2. **Key Derivation Function**:
   - Algorithm: **PBKDF2-HMAC-SHA256**.
   - Iterations: **100,000 rounds**.
   - Salt: 64 bits (8 bytes), uniquely generated per code.
3. **Zero Plaintext Leakage**:
   - The password is NEVER stored inside the Z-Code symbol or transmitted anywhere.
   - Without the correct passphrase, the payload cannot be decrypted or identified.
4. **Encrypted Envelope Structure**:
   ```
   [Salt: 8 Bytes] [IV: 12 Bytes] [Auth Tag: 16 Bytes] [Ciphertext: N Bytes]
   ```
   Total crypto overhead: 36 bytes. Max ciphertext in V1: 27 bytes.

---

## 6. Security & Untrusted URL Handling

1. **Untrusted Input Mandate**:
   All decoded data from any camera, photo, or file upload MUST be treated as untrusted input.
2. **No Automatic Redirection**:
   Scanners MUST NEVER automatically execute or open any URL in a web browser or external app without explicit user confirmation.
3. **Safe Link Inspection**:
   When a URL is scanned, the application MUST:
   - Clearly display the complete URL string.
   - Show the domain hostname and protocol (e.g. `https://example.com`).
   - Require an explicit user action (e.g. clicking an "Open Link" button) before navigating.
4. **Script Sanitization**:
   Decoded plain text MUST NEVER be rendered as raw HTML or executed through `eval()` or `dangerouslySetInnerHTML`.


---

## 7. Reference Test Vectors

### Vector 1: Plain Text
- **Input**: `"Hello Zihan"`
- **Type**: `0x01` (TEXT)
- **Codeword Hex** (49 bytes):
  `5A 43 01 01 00 0B 48 65 6C 6C 6F 20 5A 69 68 61 6E AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 D7 FC 19 C1 B7 D3 C8 F2 B8 D9 3F 29`

### Vector 2: URL
- **Input**: `"https://example.com"`
- **Type**: `0x02` (URL)
- **Codeword Hex** (49 bytes):
  `5A 43 01 02 01 0B 65 78 61 6D 70 6C 65 2E 63 6F 6D AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 DD B8 B4 DA B0 59 A3 8C 15 FA B6 D1`

---

## 8. Direct Optical Architecture & Offline Guarantees

Z-Code V1 is designed strictly as a pure, direct, single-frame circular optical 2D barcode:
1. **Instant 1-Frame Optical Recovery**:
   - Decoding occurs in a single camera frame or static image buffer upload with zero multi-frame sequencing or accumulating buffer state.
2. **Deterministic Payload Limits**:
   - Direct Unencrypted Payload: $\le 63$ bytes (UTF-8 plain text or URL with prefix compression).
   - Direct Encrypted Payload: $\le 27$ bytes (AES-256-GCM authenticated ciphertext with PBKDF2 100,000 rounds).
3. **100% Offline Resilience**:
   - Zero network, zero server, zero cloud dependencies.
   - Forward Error Correction: Reed-Solomon RS(85, 71) repairing up to 7 corrupted bytes (56 bits) in real time.
   - Integrity: CRC-16-CCITT integrity verification per codeword.
