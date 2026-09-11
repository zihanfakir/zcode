import React from "react";
import { Shield, Sparkles } from "lucide-react";
import { useSiteTheme } from "../context/ThemeContext";

export const Footer: React.FC = () => {
  const { theme } = useSiteTheme();

  return (
    <footer className="border-t border-theme-border bg-theme-panel py-12 mt-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border flex items-center justify-center"
              style={{
                borderColor: `${theme.primary}50`,
                backgroundColor: `${theme.primary}15`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-theme-text tracking-wider">
                Z-CODE ECOSYSTEM
              </p>
              <p className="text-xs text-theme-muted">
                Custom Circular 2D Barcode Engine & Standards
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-theme-muted">
            <span className="flex items-center gap-1.5 text-theme-text">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Reed-Solomon RS(85, 71) ECC
            </span>
            <span className="flex items-center gap-1.5 text-theme-text">
              <Sparkles className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              10-Track Polar Matrix
            </span>
            <span>Version 1.0 (RFC-01)</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-theme-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-theme-muted/70 gap-4">
          <p>© 2026 Z-Code Project. Free & Open Source Standard.</p>
          <p className="font-mono">Engineered for Zihan Fakir</p>
        </div>
      </div>
    </footer>
  );
};
