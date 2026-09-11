import React, { useState } from "react";
import { ShieldAlert, ExternalLink, Copy, Check, X, Globe, Lock, AlertTriangle } from "lucide-react";

interface SafeLinkModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SafeLinkModal: React.FC<SafeLinkModalProps> = ({ url, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let hostname = "";
  let protocol = "";
  let path = "";
  let isHttps = false;
  let isIpAddress = false;
  let isValidWebUrl = false;
  let isBlockedScheme = false;

  const trimmed = url.trim();
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);

  try {
    const parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    protocol = parsed.protocol.toLowerCase();
    if (protocol === "https:" || protocol === "http:") {
      isValidWebUrl = true;
      isHttps = protocol === "https:";
      hostname = parsed.hostname;
      path = parsed.pathname + parsed.search + parsed.hash;
      isIpAddress =
        /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".local");
    } else {
      isBlockedScheme = true;
      protocol = parsed.protocol;
      hostname = parsed.hostname || "Unsupported scheme";
      path = parsed.pathname;
    }
  } catch {
    isValidWebUrl = false;
    hostname = trimmed;
    protocol = "unknown";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    if (!isValidWebUrl || isBlockedScheme) return;
    const safeUrl = hasScheme ? trimmed : `https://${trimmed}`;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-theme-panel border border-theme-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-card/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-text">Untrusted Link Verification</h3>
              <p className="text-xs text-theme-muted">Review link destination before proceeding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text p-1 rounded-lg hover:bg-theme-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Security alert banner */}
          <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border text-xs text-theme-text flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-theme-text">Safety Notice:</p>
              <p className="mt-0.5 text-theme-muted">
                Z-Code never automatically opens links. Make sure you recognize the destination domain
                before clicking continue.
              </p>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-theme-bg border border-theme-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted flex items-center gap-1.5 font-mono">
                  <Globe className="w-3.5 h-3.5 text-theme-primary" />
                  Destination Domain
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-theme-card border border-theme-border text-theme-text">
                  {isHttps ? (
                    <>
                      <Lock className="w-3 h-3 text-emerald-400" /> HTTPS Secure
                    </>
                  ) : (
                    <span className="text-amber-400">Insecure HTTP</span>
                  )}
                </span>
              </div>
              <div className="font-mono text-base font-bold text-theme-primary break-all">
                {hostname || "Unknown Host"}
              </div>
              {path && path !== "/" && (
                <div className="text-xs font-mono text-theme-muted break-all">
                  Path: <span className="text-theme-text">{path}</span>
                </div>
              )}
            </div>

            {isIpAddress && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Caution: This link uses a direct IP address rather than a domain name.</span>
              </div>
            )}

            {/* Complete Raw URL */}
            <div>
              <label className="text-xs font-medium text-theme-muted block mb-1.5">
                Full Scanned URL:
              </label>
              <div className="p-3 rounded-xl bg-theme-card border border-theme-border font-mono text-xs text-theme-text break-all select-all">
                {url}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-card/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-theme-border hover:border-theme-primary/50 bg-theme-panel hover:bg-theme-card text-xs font-medium text-theme-text transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-theme-muted" />
                Copy Link
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-theme-muted hover:text-theme-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOpen}
              disabled={!isValidWebUrl || isBlockedScheme}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${
                isValidWebUrl && !isBlockedScheme
                  ? "bg-theme-primary hover:opacity-90 text-theme-bg shadow-theme-primary/20"
                  : "bg-theme-panel text-theme-muted cursor-not-allowed border border-theme-border"
              }`}
            >
              <span>{isBlockedScheme ? "Blocked Protocol" : "Open Link"}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
