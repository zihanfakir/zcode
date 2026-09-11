# Z-Code: Next-Generation Circular 2D Barcode Ecosystem

[![Tests](https://img.shields.io/badge/tests-23%20passed-brightgreen.svg)](#test-suite)
[![Standard](https://img.shields.io/badge/spec-RFC--ZCODE--01-cyan.svg)](spec/SPECIFICATION.md)
[![Encryption](https://img.shields.io/badge/crypto-AES--256--GCM-amber.svg)](spec/SPECIFICATION.md)
[![Format](https://img.shields.io/badge/format-Direct%20Optical%20V1-blue.svg)](spec/SPECIFICATION.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Z-Code** is an open, modern, circular 2D machine-readable matrix code ecosystem. Unlike traditional square QR codes designed thirty years ago for industrial automotive bins, Z-Code is engineered from first principles with **concentric polar coordinates**, **circular module dots**, an **asymmetric orientation synchronization track**, **Reed-Solomon RS(85, 71) error correction** over Galois Field $\text{GF}(256)$, and **authenticated AES-256-GCM password protection**.

---

## Ecosystem Architecture

```
z-code/
├── core/                       # Shared Zero-Dependency Core Engine (TypeScript)
│   ├── src/
│   │   ├── format.ts           # Binary packet protocol & URL prefix compression
│   │   ├── crypto.ts           # AES-256-GCM & PBKDF2-HMAC-SHA256 (Web Crypto API)
│   │   ├── gf.ts               # Galois Field GF(2^8) math (0x11D irreducible poly)
│   │   ├── reedsolomon.ts      # Reed-Solomon encoder & Berlekamp-Massey decoder
│   │   ├── crc.ts              # CRC-16-CCITT integrity verification
│   │   ├── geometry.ts         # Polar coordinate layout & 10 concentric data tracks
│   │   ├── encoder.ts          # Text/URL -> Binary codeword -> Bitstream
│   │   ├── renderer.ts         # Bitstream -> SVG & Canvas vector/raster generation
│   │   ├── detector.ts         # Computer Vision: circle locator & 360° orientation
│   │   └── decoder.ts          # Polar bit sampling -> RS error repair -> Decrypt/Payload
│   └── test/                   # Comprehensive automated test suite (20 tests passing)
│
├── web/                        # Responsive Modern Web Application (Vite + React + Tailwind)
│   ├── src/
│   │   ├── pages/              # Home, Generator, Scanner, About, Docs
│   │   └── components/         # Viewfinder, SafeLinkModal, Color themes, SVG/PNG export
│   └── dist/                   # Production-ready web bundle
│
├── android/                    # Native Android App (Kotlin + Jetpack Compose + CameraX)
│   ├── app/src/main/java/com/zcode/app/
│   │   ├── core/               # Direct Kotlin mirror of Z-Code specification & AES-GCM
│   │   └── ui/                 # Generator, CameraX Scanner, History, Settings
│
├── spec/
│   └── SPECIFICATION.md        # Official RFC-ZCODE-01 Technical Standard
│
└── samples/                    # Official pre-generated vector and raster samples
    ├── hello_zihan.svg / .png
    ├── example_url.svg / .png
    └── locked_secret.svg / .png (Password: "zihan123")
```

---

## Key Features & Innovations

### 1. Completely Circular Visual Identity
- Fits strictly within a circular disc.
- Uses **10 concentric orbital data tracks** with uniform linear dot spacing (680 bits total).
- Central **locator bullseye** provides scale-invariant centroid detection ($1:1:2.67:1:1$ cross-sectional ratio).
- **Asymmetrical 32-bit Barker synchronization ring** and directional key pip enable rapid $360^\circ$ rotation lock.

### 2. Reed-Solomon RS(85, 71) Error Correction
- Uses Galois Field $\text{GF}(2^8)$ with primitive polynomial $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ ($0x11D$).
- 14 parity bytes correct up to **7 completely corrupted bytes** (up to 56 damaged bits).
- Repaired automatically even if the code is smudged, torn, blurred, or tilted.

### 3. Cryptographic Password Protection & Lock Mode
- **Zero Plaintext Leakage**: The password is never stored inside the code or transmitted across networks.
- **Modern Authenticated Encryption**: AES-256-GCM cipher with a 128-bit authentication tag and 96-bit random IV.
- **Hardened Key Derivation**: PBKDF2-HMAC-SHA256 with **100,000 rounds** and a 64-bit random salt.
- **Client-Side Decryption**: Scanners detect protected codes, display a secure password prompt, and decrypt locally without revealing contents to unauthorized scanners.

### 4. Untrusted Link Security Sandbox
- Scanned links are strictly treated as untrusted input.
- **Never automatically navigates to any URL without user interaction.**
- Provides a **Safe Link Inspector** displaying the protocol, destination hostname, and path with an explicit confirmation step before opening.

### 5. Direct Optical V1 Standard (100% Offline)
- Direct single-frame circular optical code with zero network, server, or cloud dependencies.
- Embeds up to **63 bytes** of raw text / compressed URL, or up to **27 bytes** of AES-256-GCM encrypted ciphertext.
- Instant 1-frame optical scan and recovery.
- Maximum portability: printable, scan from any screen, camera lens, or photo.

---

## Binary Packet Format (Version 1.0)

Every standard Z-Code V1 contains 85 bytes (680 bits):

| Offset | Length | Field | Description |
|:------:|:------:|:-----:|:------------|
| 0..1 | 2 Bytes | Magic Header | `0x5A, 0x43` (ASCII `'Z'`, `'C'`) |
| 2 | 1 Byte | Version | `0x01` (Version 1) |
| 3 | 1 Byte | Data Type | `0x01` = Plain Text, `0x02` = URL |
| 4 | 1 Byte | Flags | Bit 7: `0x80` (FLAG_ENCRYPTED); Bits 3..0: URL prefix compression |
| 5 | 1 Byte | Length | Payload byte length ($0 \le L \le 63$) |
| 6..68 | 63 Bytes | Payload & Pad | Public UTF-8 bytes OR Encrypted Envelope `[Salt][IV][Tag][Ciphertext]` |
| 69..70 | 2 Bytes | CRC-16 | CRC-16-CCITT checksum over bytes 0..68 |
| 71..84 | 14 Bytes | RS Parity | Reed-Solomon RS(85, 71) error-correction codewords (corrects up to 7 bytes) |

---

## Quickstart & Verification

### 1. Run Core Test Suite
```bash
cd core
npm test
```
**Test Results**: 20 test suites verify:
- GF(256) arithmetic & CRC-16 checksum integrity
- Reed-Solomon RS(85, 71) error correction under artificial corruption
- AES-256-GCM + PBKDF2 encryption, decryption, and tamper detection
- Full optical image raster round-trip at 0°, 45°, 90°, 135°, 180°, and 270°
- Password-protected optical round-trip and decoding from official `locked_secret.png`

### 2. Run Web Application
```bash
cd web
npm run dev
```
Open `http://localhost:3000` in your browser.

**Web Features**:
- **Generator**: Live real-time preview, password protection toggle, high-res PNG (up to 2048px), SVG vector export, clipboard copy, theme presets.
- **Scanner**: Web camera live stream with circular HUD reticle, image upload drag-and-drop, password unlock prompt, Safe Link modal, scan history.

### 3. Build Production Bundle
```bash
cd web
npm run build
```

---

## Official Reference Vectors

### Vector 1: Plain Text (Public)
- **Payload**: `"Hello Zihan"`
- **Type**: `0x01` (TEXT)
- **Rendered Files**: `samples/hello_zihan.svg`, `samples/hello_zihan.png`

### Vector 2: URL (Public)
- **Payload**: `"https://example.com"`
- **Type**: `0x02` (URL)
- **Rendered Files**: `samples/example_url.svg`, `samples/example_url.png`

### Vector 3: Password Protected
- **Payload**: `"Hello Zihan"` (Encrypted with AES-256-GCM)
- **Password**: `"zihan123"`
- **Rendered Files**: `samples/locked_secret.svg`, `samples/locked_secret.png`

---

## License
MIT License © 2026 Z-Code Project. Built for Zihan Fakir.

