import React from "react";
import { BookOpen, Code2, Cpu, Layers } from "lucide-react";

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-primary/10 border border-theme-primary/30 text-theme-primary text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          Technical Documentation
        </div>
        <h1 className="text-3xl font-extrabold text-theme-text tracking-tight">
          Z-Code Developer Guide & Specification
        </h1>
        <p className="text-sm text-theme-muted">
          Complete protocol reference, mathematical constants, and code examples for embedding Z-Code.
        </p>
      </div>

      {/* Binary Packet Structure */}
      <section className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
        <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
          <Layers className="w-4 h-4 text-theme-primary" />
          1. Binary Packet Frame (85 Bytes Codeword • 680 Bits)
        </h2>
        <p className="text-xs text-theme-muted leading-relaxed">
          Every standard Z-Code V1 contains exactly 85 bytes (680 bits) across 10 concentric orbital tracks:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-theme-text">
            <thead className="border-b border-theme-border text-theme-muted uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Offset</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60 text-[11px]">
              <tr>
                <td className="py-2 px-3 text-theme-primary">0..1</td>
                <td className="py-2 px-3">2 Bytes</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Magic Header</td>
                <td className="py-2 px-3 text-theme-muted">0x5A, 0x43 ('Z', 'C')</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">2</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Version</td>
                <td className="py-2 px-3 text-theme-muted">0x01 (Version 1)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">3</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Data Type</td>
                <td className="py-2 px-3 text-theme-muted">0x01 = Plain Text, 0x02 = URL</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">4</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Flags</td>
                <td className="py-2 px-3 text-theme-muted">
                  Bit 7: 0x80 (FLAG_ENCRYPTED); Bits 3..0: URL prefix compression (0..4)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">5</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Payload Length</td>
                <td className="py-2 px-3 text-theme-muted">Number of content bytes (0..63)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">6..68</td>
                <td className="py-2 px-3">63 Bytes</td>
                <td className="py-2 px-3 font-semibold text-theme-text">Payload & Pad</td>
                <td className="py-2 px-3 text-theme-muted">
                  Public mode: UTF-8 payload (up to 63B) • Protected mode: [Salt 8B][IV 12B][Tag 16B][Ciphertext (up to 27B)]
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-theme-primary">69..70</td>
                <td className="py-2 px-3">2 Bytes</td>
                <td className="py-2 px-3 font-semibold text-theme-text">CRC-16</td>
                <td className="py-2 px-3 text-theme-muted">CRC-16-CCITT (poly 0x1021, init 0xFFFF) over bytes 0..68</td>
              </tr>
              <tr className="bg-emerald-500/10">
                <td className="py-2 px-3 text-emerald-400">71..84</td>
                <td className="py-2 px-3">14 Bytes</td>
                <td className="py-2 px-3 font-semibold text-emerald-300">Reed-Solomon Parity</td>
                <td className="py-2 px-3 text-theme-muted">RS(85, 71) parity over GF(256), corrects up to 7 corrupted bytes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mathematical Constants & Crypto */}
      <section className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
        <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
          <Cpu className="w-4 h-4 text-theme-primary" />
          2. Mathematical & Cryptographic Architecture
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-1.5">
            <span className="text-theme-muted block text-[11px]">Galois Field Irreducible Poly</span>
            <span className="text-theme-primary font-bold text-sm">p(x) = x⁸ + x⁴ + x³ + x² + 1</span>
            <span className="text-theme-muted block text-[10px]">0x11D / 285 decimal</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-1.5">
            <span className="text-theme-muted block text-[11px]">Reed-Solomon RS(85, 71)</span>
            <span className="text-theme-primary font-bold text-sm">α = 2 (0x02), g(x) = Π (x - αⁱ)</span>
            <span className="text-theme-muted block text-[10px]">Degree 14 (i = 0 to 13) • 7 errors correctable</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-1.5">
            <span className="text-theme-muted block text-[11px]">Key Derivation Function</span>
            <span className="text-amber-400 font-bold text-sm">PBKDF2-HMAC-SHA256</span>
            <span className="text-theme-muted block text-[10px]">100,000 iterations • 64-bit random salt</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-1.5">
            <span className="text-theme-muted block text-[11px]">Authenticated Encryption</span>
            <span className="text-amber-400 font-bold text-sm">AES-256-GCM (128-bit Tag)</span>
            <span className="text-theme-muted block text-[10px]">96-bit random IV • zero plaintext leakage</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-1.5 sm:col-span-2">
            <span className="text-theme-muted block text-[11px]">Direct Optical High-Reliability Architecture</span>
            <span className="text-emerald-400 font-bold text-sm">Instant 1-Frame Optical Recovery • 100% Offline</span>
            <span className="text-theme-muted block text-[10px]">Zero network dependency • Reed-Solomon RS(85, 71) error correction with CRC-16 integrity verification</span>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
        <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
          <Code2 className="w-4 h-4 text-theme-primary" />
          3. Developer SDK Usage (TypeScript / JavaScript)
        </h2>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <p className="text-theme-muted mb-1.5 font-sans">Encode with Password Protection:</p>
            <pre className="p-4 rounded-xl bg-theme-card border border-theme-border text-theme-text overflow-x-auto">
{`import { ZCodeEncoder, ZCodeRenderer } from "@zcode/core";

const encoder = new ZCodeEncoder();

// Encrypt payload with AES-256-GCM using PBKDF2 master key
const lockedData = await encoder.encode("Confidential Data", {
  password: "user-secret-passphrase",
});

// Render circular SVG
const svg = ZCodeRenderer.renderToSVG(lockedData, {
  size: 512,
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  showCenterZ: true,
});`}
            </pre>
          </div>

          <div>
            <p className="text-theme-muted mb-1.5 font-sans">Decode and Unlock in Scanner:</p>
            <pre className="p-4 rounded-xl bg-theme-card border border-theme-border text-theme-text overflow-x-auto">
{`import { ZCodeDecoder } from "@zcode/core";

const decoder = new ZCodeDecoder();
const result = decoder.decodeImage(imageBuffer);

if (result.payload.isLocked) {
  console.log("Code is password protected! Requesting password...");
  
  // Authenticated decryption via Web Crypto API:
  const unlocked = await ZCodeDecoder.unlock(result.payload, userEnteredPassword);
  console.log("Decrypted payload:", unlocked.content);
} else {
  console.log("Public payload:", result.payload.content);
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
