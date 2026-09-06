# Z-Code: Next-Generation Circular 2D Barcode Ecosystem

[![Tests](https://img.shields.io/badge/tests-15%20passed-brightgreen.svg)](#test-suite)
[![Standard](https://img.shields.io/badge/spec-RFC--ZCODE--01-cyan.svg)](spec/SPECIFICATION.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Z-Code** is an open, modern, circular 2D machine-readable matrix code ecosystem. Unlike traditional square QR codes designed thirty years ago for industrial automotive bins, Z-Code is engineered from first principles with **concentric polar coordinates**, **circular module dots**, an **asymmetric orientation synchronization track**, and **Reed-Solomon RS(49, 39) error correction** over Galois Field $\text{GF}(256)$.

---

## Ecosystem Architecture

```
z-code/
├── core/                       # Shared Zero-Dependency Core Engine (TypeScript)
│   ├── src/
│   │   ├── format.ts           # Binary packet protocol & URL prefix compression
│   │   ├── gf.ts               # Galois Field GF(2^8) math (0x11D irreducible poly)
│   │   ├── reedsolomon.ts      # Reed-Solomon encoder & Berlekamp-Massey decoder
│   │   ├── crc.ts              # CRC-16-CCITT integrity verification
│   │   ├── geometry.ts         # Polar coordinate layout & 7 concentric data tracks
│   │   ├── encoder.ts          # Text/URL -> Binary codeword -> Bitstream
│   │   ├── renderer.ts         # Bitstream -> SVG & Canvas vector/raster generation
│   │   ├── detector.ts         # Computer Vision: circle locator & 360° orientation
│   │   └── decoder.ts          # Polar bit sampling -> RS error repair -> Payload
│   └── test/                   # Comprehensive automated test suite
│
├── web/                        # Responsive Modern Web Application (Vite + React + Tailwind)
│   ├── src/
│   │   ├── pages/              # Home, Generator, Scanner, About, Docs
│   │   └── components/         # Viewfinder, SafeLinkModal, Color themes, SVG/PNG export
│   └── dist/                   # Production-ready web bundle
│
├── android/                    # Native Android App (Kotlin + Jetpack Compose + CameraX)
│   ├── app/src/main/java/com/zcode/app/
│   │   ├── core/               # Direct Kotlin mirror of Z-Code specification
│   │   └── ui/                 # Generator, CameraX Scanner, History, Settings
│
├── spec/
│   └── SPECIFICATION.md        # Official RFC-ZCODE-01 Technical Standard
│
└── samples/                    # Official pre-generated vector and raster samples
    ├── hello_zihan.svg
    ├── hello_zihan.png
    ├── example_url.svg
    └── example_url.png
```

---

## Key Features & Innovations

### 1. Completely Circular Visual Identity
- Fits strictly within a circular disc.
- Uses **concentric orbital data tracks** with uniform linear dot spacing.
- Central **locator bullseye** provides scale-invariant centroid detection ($1:1:2.67:1:1$ cross-sectional ratio).
- **Asymmetrical 32-bit Barker synchronization ring** and directional key pip enable rapid $360^\circ$ rotation lock.

### 2. Reed-Solomon RS(49, 39) Error Correction
- Uses Galois Field $\text{GF}(2^8)$ with primitive polynomial $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ ($0x11D$).
- 10 parity bytes correct up to **5 completely corrupted bytes** (up to 40 damaged bits).
- Repaired automatically even if the code is smudged, torn, blurred, or tilted.

### 3. Untrusted Link Security Sandbox
- Scanned links are strictly treated as untrusted input.
- **Never automatically navigates to any URL without user interaction.**
- Provides a **Safe Link Inspector** displaying the protocol, destination hostname, and path with an explicit confirmation step before opening.

---

## Binary Packet Format (Version 1.0)

Every standard Z-Code V1 contains 49 bytes (392 bits):

| Offset | Length | Field | Description |
|:------:|:------:|:-----:|:------------|
| 0..1 | 2 Bytes | Magic Header | `0x5A, 0x43` (ASCII `'Z'`, `'C'`) |
| 2 | 1 Byte | Version | `0x01` (Version 1) |
| 3 | 1 Byte | Data Type | `0x01` = Plain Text, `0x02` = URL |
| 4 | 1 Byte | Flags | Prefix compression (`1` = `https://`, `2` = `http://`, etc.) |
| 5 | 1 Byte | Length | Payload byte length ($0 \le L \le 31$) |
| 6..36 | 31 Bytes | Payload & Pad | UTF-8 content bytes with deterministic padding |
| 37..38 | 2 Bytes | CRC-16 | CRC-16-CCITT checksum over bytes 0..36 |
| 39..48 | 10 Bytes | RS Parity | Reed-Solomon RS(49, 39) error-correction codewords |

---

## Quickstart & Verification

### 1. Run Core Test Suite
```bash
cd core
npm test
```
**Test Results**: 15 test suites verify:
- GF(256) math
- Reed-Solomon error correction under artificial corruption
- CRC-16 checksum integrity
- Full optical image raster round-trip at 0°, 45°, 90°, 135°, 180°, and 270°
- Direct decoding from official `hello_zihan.png` and `example_url.png`

### 2. Run Web Application
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

**Web Features**:
- **Generator**: Live real-time preview, high-res PNG (up to 2048px), SVG vector export, clipboard copy, theme presets.
- **Scanner**: Web camera live stream with circular HUD reticle, image upload drag-and-drop, Safe Link modal, scan history.

### 3. Build Production Bundle
```bash
cd web
npm run build
```

---

## Official Reference Vectors

### Vector 1: Plain Text
- **Payload**: `"Hello Zihan"`
- **Type**: `0x01` (TEXT)
- **Codeword Hex** (49 bytes):  
  `5A 43 01 01 00 0B 48 65 6C 6C 6F 20 5A 69 68 61 6E AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 D7 FC 19 C1 B7 D3 C8 F2 B8 D9 3F 29`
- **Rendered Files**: `samples/hello_zihan.svg`, `samples/hello_zihan.png`

### Vector 2: URL
- **Payload**: `"https://example.com"`
- **Type**: `0x02` (URL)
- **Codeword Hex** (49 bytes):  
  `5A 43 01 02 01 0B 65 78 61 6D 70 6C 65 2E 63 6F 6D AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 DD B8 B4 DA B0 59 A3 8C 15 FA B6 D1`
- **Rendered Files**: `samples/example_url.svg`, `samples/example_url.png`

---

## License
MIT License © 2026 Z-Code Project. Built for Zihan Fakir.
