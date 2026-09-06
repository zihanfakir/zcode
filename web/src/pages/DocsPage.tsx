import React from "react";
import { BookOpen, Code2, Cpu, Layers } from "lucide-react";

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          Technical Documentation
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Z-Code Developer Guide & Specification
        </h1>
        <p className="text-sm text-slate-400">
          Complete protocol reference, mathematical constants, and code examples for embedding Z-Code.
        </p>
      </div>

      {/* Binary Packet Structure */}
      <section className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          1. Binary Packet Frame (49 Bytes Codeword)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Every standard Z-Code V1 contains exactly 49 bytes (392 bits) structured as follows:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Offset</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              <tr>
                <td className="py-2 px-3 text-cyan-400">0..1</td>
                <td className="py-2 px-3">2 Bytes</td>
                <td className="py-2 px-3 font-semibold text-white">Magic Header</td>
                <td className="py-2 px-3 text-slate-400">0x5A, 0x43 ('Z', 'C')</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">2</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-white">Version</td>
                <td className="py-2 px-3 text-slate-400">0x01 (Version 1)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">3</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-white">Data Type</td>
                <td className="py-2 px-3 text-slate-400">0x01 = Plain Text, 0x02 = URL</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">4</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-white">Flags</td>
                <td className="py-2 px-3 text-slate-400">URL prefix compression index (0..4)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">5</td>
                <td className="py-2 px-3">1 Byte</td>
                <td className="py-2 px-3 font-semibold text-white">Payload Length</td>
                <td className="py-2 px-3 text-slate-400">Number of UTF-8 content bytes (0..31)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">6..36</td>
                <td className="py-2 px-3">31 Bytes</td>
                <td className="py-2 px-3 font-semibold text-white">Payload & Pad</td>
                <td className="py-2 px-3 text-slate-400">UTF-8 bytes followed by 0xAA/0x55 padding</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-cyan-400">37..38</td>
                <td className="py-2 px-3">2 Bytes</td>
                <td className="py-2 px-3 font-semibold text-white">CRC-16</td>
                <td className="py-2 px-3 text-slate-400">CRC-16-CCITT (poly 0x1021, init 0xFFFF)</td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="py-2 px-3 text-emerald-400">39..48</td>
                <td className="py-2 px-3">10 Bytes</td>
                <td className="py-2 px-3 font-semibold text-emerald-300">Reed-Solomon Parity</td>
                <td className="py-2 px-3 text-slate-400">RS(49, 39) parity over GF(256), corrects 5 errors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mathematical Constants */}
      <section className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          2. Mathematical Constants
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[11px]">Galois Field Irreducible Poly</span>
            <span className="text-cyan-300 font-bold text-sm">p(x) = x⁸ + x⁴ + x³ + x² + 1</span>
            <span className="text-slate-500 block text-[10px]">0x11D / 285 decimal</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[11px]">Generator Polynomial Root</span>
            <span className="text-cyan-300 font-bold text-sm">α = 2 (0x02), g(x) = Π (x - αⁱ)</span>
            <span className="text-slate-500 block text-[10px]">Degree 10 (i = 0 to 9)</span>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          3. Developer SDK Usage (TypeScript / JavaScript)
        </h2>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <p className="text-slate-400 mb-1.5 font-sans">Encode text and render SVG:</p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto">
{`import { ZCodeEncoder, ZCodeRenderer } from "@zcode/core";

const encoder = new ZCodeEncoder();
const encoded = encoder.encode("Hello Zihan");

// Render to SVG markup string
const svg = ZCodeRenderer.renderToSVG(encoded, {
  size: 512,
  foregroundColor: "#00F0FF",
  backgroundColor: "#0A0E17",
  showCenterZ: true,
});`}
            </pre>
          </div>

          <div>
            <p className="text-slate-400 mb-1.5 font-sans">Decode an image buffer:</p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto">
{`import { ZCodeDecoder } from "@zcode/core";

const decoder = new ZCodeDecoder();
const result = decoder.decodeImage(imageBuffer);

console.log("Decoded text:", result.payload.content);
console.log("Type:", result.payload.type === 1 ? "TEXT" : "URL");
console.log("Errors repaired by RS:", result.errorsCorrected);`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
