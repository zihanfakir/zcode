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

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    hostname = parsed.hostname;
    protocol = parsed.protocol;
    path = parsed.pathname + parsed.search + parsed.hash;
    isHttps = protocol === "https:";
    isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  } catch {
    hostname = url;
    protocol = "unknown";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Untrusted Link Verification</h3>
              <p className="text-xs text-slate-400">Review link destination before proceeding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Security alert banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">Safety Notice:</p>
              <p className="mt-0.5 text-slate-400">
                Z-Code never automatically opens links. Make sure you recognize the destination domain
                before clicking continue.
              </p>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Destination Domain
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {isHttps ? (
                    <>
                      <Lock className="w-3 h-3 text-emerald-400" /> HTTPS Secure
                    </>
                  ) : (
                    <span className="text-amber-400">Insecure HTTP</span>
                  )}
                </span>
              </div>
              <div className="font-mono text-base font-bold text-cyan-300 break-all">
                {hostname || "Unknown Host"}
              </div>
              {path && path !== "/" && (
                <div className="text-xs font-mono text-slate-400 break-all">
                  Path: <span className="text-slate-300">{path}</span>
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
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Full Scanned URL:
              </label>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 break-all select-all">
                {url}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                Copy Link
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOpen}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <span>Open Link</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
