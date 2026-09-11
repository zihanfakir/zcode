import React, { useState, useMemo } from "react";
import { QrCode, Scan, ShieldCheck, RefreshCw, Sparkles, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { ZCodeEncoder, ZCodeRenderer } from "@zcode/core";
import { NavPage } from "../components/Navbar";
import { useSiteTheme } from "../context/ThemeContext";

interface HomePageProps {
  onNavigate: (page: NavPage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { theme } = useSiteTheme();
  const [demoInput, setDemoInput] = useState("Hello Zihan");

  const encoder = useMemo(() => new ZCodeEncoder(), []);

  const svgData = useMemo(() => {
    try {
      const encoded = encoder.encode(demoInput || "Z-Code");
      return ZCodeRenderer.renderToSVG(encoded, {
        size: 340,
        margin: 16,
        foregroundColor: "#000000",
        backgroundColor: "#ffffff",
      });
    } catch {
      return null;
    }
  }, [demoInput, encoder]);

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        {/* Subtle Glow backdrop */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: theme.primary }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium"
                style={{
                  backgroundColor: `${theme.primary}12`,
                  borderColor: `${theme.primary}35`,
                  color: theme.isLight ? "#000000" : theme.primary,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Circular 2D Barcode Ecosystem
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-theme-text leading-[1.15]">
                Ditch the Square. <br />
                <span className="text-theme-text">
                  Welcome to <span style={{ color: theme.primary }}>Z-Code</span>.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-theme-muted max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Z-Code is an entirely custom circular 2D optical code format engineered from first principles with concentric polar geometry, Reed-Solomon RS(85, 71) error correction, 360° rotation invariance, and military-grade AES-256-GCM password encryption.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate("generator")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 group active:scale-95"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.isLight ? "#ffffff" : "#000000",
                  }}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate Z-Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate("scanner")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-theme-panel hover:bg-theme-card border border-theme-border text-theme-text font-semibold text-sm transition-all flex items-center justify-center gap-2.5"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Z-Code</span>
                </button>
              </div>

              {/* Key Spec Badges */}
              <div className="pt-6 border-t border-theme-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-theme-muted font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 10 Concentric Tracks (680 bits)
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Reed-Solomon RS(85, 71)
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" style={{ color: theme.primary }} /> 360° Rotation Invariance
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" /> AES-256-GCM Encryption
                </span>
              </div>
            </div>

            {/* Right interactive live card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-theme-panel border border-theme-border shadow-2xl relative group transition-colors">
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between text-xs text-theme-muted border-b border-theme-border/80 pb-3">
                    <span className="font-mono font-semibold flex items-center gap-1.5" style={{ color: theme.primary }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                      LIVE MONOCHROME PREVIEW
                    </span>
                    <span className="font-mono text-[10px] text-theme-muted">B&W Standard</span>
                  </div>

                  {/* Circular Code Render */}
                  <div className="flex items-center justify-center p-4 bg-white rounded-2xl border border-theme-border aspect-square shadow-inner">
                    {svgData ? (
                      <div
                        className="w-full h-full max-w-[280px] max-h-[280px] flex items-center justify-center transition-all duration-300 [&_svg]:w-full [&_svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: svgData }}
                      />
                    ) : (
                      <div className="text-xs text-red-500">Payload length exceeds V1 limit</div>
                    )}
                  </div>

                  {/* Interactive input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-theme-muted font-medium flex justify-between">
                      <span>Type to test live:</span>
                      <span className="font-mono text-[10px]" style={{ color: theme.primary }}>
                        {demoInput.length}/63 chars
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value.slice(0, 63))}
                        placeholder="Type text or URL..."
                        className="w-full px-3.5 py-2.5 bg-theme-card border border-theme-border rounded-xl text-xs text-theme-text font-mono focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-theme-muted">
                    <span className="text-emerald-400">✓ Valid Codeword (85B)</span>
                    <button
                      onClick={() => onNavigate("generator")}
                      className="hover:underline underline-offset-2 font-bold"
                      style={{ color: theme.primary }}
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
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-text tracking-tight">
            Engineered From First Principles
          </h2>
          <p className="text-sm text-theme-muted leading-relaxed">
            Z-Code is not a wrapper over QR codes. It is a completely distinct, mathematically pure circular 2D optical barcode designed for modern digital and physical workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border hover:border-theme-muted transition-colors space-y-4 shadow-lg">
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}40`,
                color: theme.primary,
              }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-text">Pure Polar Geometry</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Bits are arranged across 10 concentric orbital tracks (680 bits = 85 bytes) with uniform linear dot spacing, enclosed by an outer framing bezel and an inner concentric bullseye anchor.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border hover:border-theme-muted transition-colors space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-text">Reed-Solomon RS(85, 71)</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              14 parity bytes over Galois Field GF(2^8) correct up to 7 completely corrupted bytes (up to 56 damaged bits). Scratches, blurs, and occlusion are automatically healed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border hover:border-theme-muted transition-colors space-y-4 shadow-lg">
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}40`,
                color: theme.primary,
              }}
            >
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-text">360° Rotation Invariance</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              A 32-bit Barker-synch orientation ring and directional key pip allow the computer vision detector to compute orientation at any angle with sub-degree accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-theme-panel border border-theme-border space-y-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-theme-text">Standard QR Code vs. Z-Code</h3>
            <p className="text-xs text-theme-muted">
              Why circular barcodes offer distinctive advantages for modern brand identity, security, and aesthetics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-theme-muted">
              <thead className="border-b border-theme-border text-theme-muted uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Standard QR Code</th>
                  <th className="py-3 px-4 font-bold" style={{ color: theme.primary }}>
                    Z-Code (RFC-01)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60 font-mono">
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Visual Shape</td>
                  <td className="py-3.5 px-4">Square with 3 corners</td>
                  <td className="py-3.5 px-4 font-semibold text-theme-text">100% Circular Disc & Rings</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Coordinate System</td>
                  <td className="py-3.5 px-4">Cartesian (X, Y Grid)</td>
                  <td className="py-3.5 px-4 font-semibold text-theme-text">Polar (r, θ Concentric Tracks)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Default Palette</td>
                  <td className="py-3.5 px-4">Square Black & White</td>
                  <td className="py-3.5 px-4 font-semibold text-theme-text">Circular B&W + Full Customization</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Module Shape</td>
                  <td className="py-3.5 px-4">Square blocks</td>
                  <td className="py-3.5 px-4 font-semibold text-theme-text">Circular dot modules</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Error Correction</td>
                  <td className="py-3.5 px-4">Reed-Solomon</td>
                  <td className="py-3.5 px-4 font-semibold text-theme-text">Reed-Solomon RS(85, 71) + CRC-16</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Military-Grade Lock</td>
                  <td className="py-3.5 px-4">Not natively supported</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-400">AES-256-GCM + PBKDF2 Password Lock</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-semibold text-theme-text">Untrusted Link Safety</td>
                  <td className="py-3.5 px-4">Often auto-redirected</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">Safe Link Inspector (Explicit confirmation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-theme-panel border border-theme-border flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-2xl">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-theme-text">Ready to create or scan a Z-Code?</h3>
            <p className="text-xs sm:text-sm text-theme-muted max-w-xl leading-relaxed">
              Encode custom text or links in high-contrast Black & White, customize palettes, export high-res PNG or SVG vector files, or scan any code with your camera.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate("generator")}
              className="px-6 py-3 rounded-xl font-bold text-xs transition active:scale-95 shadow-md"
              style={{
                backgroundColor: theme.primary,
                color: theme.isLight ? "#ffffff" : "#000000",
              }}
            >
              Open Generator
            </button>
            <button
              onClick={() => onNavigate("scanner")}
              className="px-6 py-3 rounded-xl bg-theme-card hover:bg-theme-card/80 text-theme-text font-semibold text-xs border border-theme-border transition"
            >
              Open Scanner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
