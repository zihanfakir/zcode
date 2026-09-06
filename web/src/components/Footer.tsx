import React from "react";
import { Shield, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-[#070a10] py-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wider">
                Z-CODE ECOSYSTEM
              </p>
              <p className="text-xs text-slate-400">
                Custom Circular 2D Barcode Engine & Standards
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Reed-Solomon RS(49, 39) ECC
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Polar Coordinate Matrix
            </span>
            <span>Version 1.0 (RFC-01)</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Z-Code Project. Free & Open Source Standard.</p>
          <p className="font-mono">Engineered for Zihan Fakir</p>
        </div>
      </div>
    </footer>
  );
};
