import React from "react";
import { Sparkles, Compass, ShieldCheck, Eye, Lock } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          The Z-Code Philosophy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Reinventing the 2D Barcode for the Circular World
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Standard QR codes were invented in 1994 for industrial automotive part bins.
          Thirty years later, Z-Code reimagines optical encoding with pure circular aesthetics,
          polar coordinate mathematics, and modern resilience.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Why Circular?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Smartwatches, app icons, camera lenses, badges, coins, vinyl records, and futuristic radar displays
            are all inherently circular. Conventional square QR codes look jarring when pasted onto circular objects.
            Z-Code harmonizes with circular surfaces and luxury branding.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Reed-Solomon RS(49, 39)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Using algebraic coding theory over Galois Field GF(256), Z-Code embeds 10 parity bytes across 7 concentric
            tracks. If your printed code gets smudged, torn, or scratched, the decoder mathematically computes the exact
            error locations and repairs the data without losing a single bit.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Polar Optical Detector</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The computer vision detector utilizes a concentric bullseye signature (1:1:2.6:1:1 radial ratio)
            combined with an asymmetric 32-bit Barker orientation synchronization ring. It recovers rotation
            angles with sub-degree accuracy, unwarping perspective distortion cleanly.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Untrusted Link Safety</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            QR codes frequently expose users to malicious redirects ("QRishing"). In the Z-Code ecosystem,
            scanned links are treated as untrusted input. The scanner displays the destination domain, protocol,
            and safety breakdown, never opening links without conscious user confirmation.
          </p>
        </div>
      </div>

      {/* Anatomy Diagram Box */}
      <div className="p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white text-center sm:text-left">
          Anatomy of a Z-Code Symbol
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 block">1. Central Bullseye</span>
            <p className="text-slate-400">
              Concentric rings at radius 0.08 to 0.20 R. Symmetrical along all radii to provide rapid
              scale-invariant centroid localization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 block">2. Orientation Ring</span>
            <p className="text-slate-400">
              Ring at 0.27 R with 32 Barker sectors and a directional key pip. Breaks rotational symmetry
              to define 0° azimuth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 block">3. Concentric Data Tracks</span>
            <p className="text-slate-400">
              7 orbital rings containing 392 circular dots with uniform linear dot pitch (32 to 80 dots
              per track).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
