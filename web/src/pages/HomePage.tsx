import React, { useState, useMemo } from "react";
import { QrCode, Scan, ShieldCheck, RefreshCw, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { ZCodeEncoder, ZCodeRenderer } from "@zcode/core";
import { NavPage } from "../components/Navbar";

interface HomePageProps {
  onNavigate: (page: NavPage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [demoInput, setDemoInput] = useState("Hello Zihan");

  const encoder = useMemo(() => new ZCodeEncoder(), []);

  const svgData = useMemo(() => {
    try {
      const encoded = encoder.encode(demoInput || "Z-Code");
      return ZCodeRenderer.renderToSVG(encoded, {
        size: 340,
        margin: 16,
        foregroundColor: "#00f0ff",
        backgroundColor: "#0a0e17",
      });
    } catch {
      return null;
    }
  }, [demoInput, encoder]);

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Circular 2D Barcode
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Ditch the Square. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                  Welcome to Z-Code.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Z-Code is an entirely custom, circular 2D optical code format with its own polar geometry,
                binary framing protocol, Reed-Solomon error correction, and 360° rotation invariance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate("generator")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 group"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate Z-Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate("scanner")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5"
                >
                  <Scan className="w-4 h-4 text-cyan-400" />
                  <span>Scan / Upload Code</span>
                </button>
              </div>

              {/* Quick perks */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> 100% Circular Geometry
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Reed-Solomon RS(49, 39)
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-sky-400" /> 360° Rotation Invariance
                </span>
              </div>
            </div>

            {/* Right interactive live card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-20 group-hover:opacity-30 blur transition"></div>

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                    <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      LIVE ENGINE PREVIEW
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">RFC-ZCODE-01</span>
                  </div>

                  {/* Circular Code Render */}
                  <div className="flex items-center justify-center p-4 bg-[#0a0e17] rounded-2xl border border-slate-800/80 aspect-square">
                    {svgData ? (
                      <div
                        className="w-full h-full max-w-[280px] max-h-[280px] flex items-center justify-center transition-all duration-300"
                        dangerouslySetInnerHTML={{ __html: svgData }}
                      />
                    ) : (
                      <div className="text-xs text-red-400">Payload length exceeds V1 limit</div>
                    )}
                  </div>

                  {/* Interactive input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium flex justify-between">
                      <span>Type to test live:</span>
                      <span className="font-mono text-[10px] text-cyan-400">{demoInput.length}/31 chars</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value.slice(0, 31))}
                        placeholder="Type text or URL..."
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-emerald-400">✓ Valid Codeword</span>
                    <button
                      onClick={() => onNavigate("generator")}
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      Open Full Generator →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered From First Principles
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Z-Code is not a skin or wrapper over standard QR codes. It is a completely distinct,
            mathematically pure circular 2D matrix code designed for the modern world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pure Polar Geometry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bits are arranged on 7 concentric orbital tracks with uniform linear dot spacing,
              enclosed by an outer framing bezel and an inner concentric bullseye anchor.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Reed-Solomon RS(49, 39)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              10 parity bytes over Galois Field GF(256) correct up to 5 completely corrupted bytes
              (up to 40 damaged bits). Scratches, blurs, and dirt are automatically healed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">360° Rotation Invariance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A 32-bit Barker-synch orientation ring and directional key pip allow the computer
              vision detector to compute orientation at any angle with sub-degree accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">Standard QR Code vs. Z-Code</h3>
            <p className="text-xs text-slate-400">
              Why circular barcodes offer distinctive advantages for modern brand identity and products.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Standard QR Code</th>
                  <th className="py-3 px-4 text-cyan-400">Z-Code (RFC-01)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Visual Shape</td>
                  <td className="py-3.5 px-4 text-slate-400">Square with 3 corners</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">100% Circular Disc & Rings</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Coordinate System</td>
                  <td className="py-3.5 px-4 text-slate-400">Cartesian (X, Y Grid)</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">Polar (r, θ Concentric Tracks)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Orientation Detection</td>
                  <td className="py-3.5 px-4 text-slate-400">3 square corner finders</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">Concentric Bullseye + Barker Synch</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Module Shape</td>
                  <td className="py-3.5 px-4 text-slate-400">Square blocks</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">Circular dot modules</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Error Correction</td>
                  <td className="py-3.5 px-4 text-slate-400">Reed-Solomon</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">Reed-Solomon RS(49, 39) + CRC-16</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-white">Untrusted Link Safety</td>
                  <td className="py-3.5 px-4 text-slate-400">Often auto-redirected</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Safe Link Inspector (Mandatory user confirmation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">Ready to create or scan a Z-Code?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Try encoding custom text or a website URL, export high-resolution PNG or SVG vector files,
              or scan an existing code using your web camera.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate("generator")}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              Open Generator
            </button>
            <button
              onClick={() => onNavigate("scanner")}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              Open Scanner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
