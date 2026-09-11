import React from "react";
import { Sparkles, Compass, ShieldCheck, Eye, Lock } from "lucide-react";
import { useSiteTheme } from "../context/ThemeContext";

export const AboutPage: React.FC = () => {
  const { theme } = useSiteTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono"
          style={{
            backgroundColor: `${theme.primary}12`,
            borderColor: `${theme.primary}35`,
            color: theme.isLight ? "#000000" : theme.primary,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          The Z-Code Philosophy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-theme-text tracking-tight">
          Reinventing the 2D Barcode for the Circular World
        </h1>
        <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
          Standard QR codes were invented in 1994 for industrial automotive part bins.
          Thirty years later, Z-Code reimagines optical encoding with pure circular aesthetics,
          polar coordinate mathematics, and modern resilience.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border space-y-3 shadow-lg">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center"
            style={{
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.primary}40`,
              color: theme.primary,
            }}
          >
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-theme-text">Why Circular?</h3>
          <p className="text-xs text-theme-muted leading-relaxed">
            Smartwatches, app icons, camera lenses, badges, coins, vinyl records, and futuristic radar displays
            are all inherently circular. Conventional square QR codes look jarring when pasted onto circular objects.
            Z-Code harmonizes with circular surfaces, modern UI, and luxury branding.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-theme-text">Reed-Solomon RS(85, 71)</h3>
          <p className="text-xs text-theme-muted leading-relaxed">
            Using algebraic coding theory over Galois Field GF(256), Z-Code embeds 14 parity bytes across 10 concentric
            tracks. If your printed code gets smudged, torn, or scratched, the decoder mathematically computes the exact
            error locations and repairs up to 7 corrupted bytes (56 bits) without data loss.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border space-y-3 shadow-lg">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center"
            style={{
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.primary}40`,
              color: theme.primary,
            }}
          >
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-theme-text">Polar Optical Detector</h3>
          <p className="text-xs text-theme-muted leading-relaxed">
            The computer vision detector utilizes a concentric bullseye signature (1:1:2.67:1:1 radial ratio)
            combined with an asymmetric 32-bit Barker orientation synchronization ring. It recovers rotation
            angles with sub-degree accuracy, unwarping perspective distortion cleanly.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-theme-panel border border-theme-border space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-theme-text">Password Lock & Link Safety</h3>
          <p className="text-xs text-theme-muted leading-relaxed">
            Z-Code introduces client-side authenticated AES-256-GCM encryption with PBKDF2 key derivation.
            In addition, scanned links are treated as untrusted input: the scanner shows the full destination domain
            and protocol breakdown, never opening links without conscious user confirmation.
          </p>
        </div>
      </div>

      {/* Anatomy Diagram Box */}
      <div className="p-8 rounded-3xl bg-theme-panel border border-theme-border space-y-6 shadow-xl">
        <h3 className="text-xl font-bold text-theme-text text-center sm:text-left">
          Anatomy of a Z-Code Symbol
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-theme-text">
          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <span className="font-mono font-bold block" style={{ color: theme.primary }}>
              1. Central Bullseye
            </span>
            <p className="text-theme-muted">
              Concentric rings at radius 0.08 to 0.20 R. Symmetrical along all radii to provide rapid
              scale-invariant centroid localization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <span className="font-mono font-bold block" style={{ color: theme.primary }}>
              2. Orientation Ring
            </span>
            <p className="text-theme-muted">
              Ring at 0.26 R with 32 Barker sectors and a directional key pip at 0° azimuth. Breaks rotational symmetry
              for 360° alignment.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-2">
            <span className="font-mono font-bold block" style={{ color: theme.primary }}>
              3. Concentric Data Tracks
            </span>
            <p className="text-theme-muted">
              10 orbital rings containing 680 circular dots with uniform linear dot pitch (32 to 104 dots
              per track, totaling 85 codeword bytes).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
