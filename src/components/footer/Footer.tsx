"use client";

import { useState } from "react";
import { PROFILE } from "@/data/profile";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { Copy, Check, ExternalLink, Mail, Phone } from "lucide-react";

export function Footer() {
  const { footer } = PROFILE;
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(footer.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer id="contact" className="relative border-t border-zinc-900 bg-black pt-20 pb-16 px-6 sm:px-12 overflow-hidden">
      {/* Background ambient HUD grid */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

      <div className="relative max-w-5xl mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">
              <ScrambleText entrance="observer">{footer.eyebrow}</ScrambleText>
            </span>
            <p className="mt-2 text-sm text-zinc-400 font-mono">
              {footer.note}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AVAILABLE FOR HIRE</span>
          </div>
        </div>

        {/* Email & Contact Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-2xl border border-zinc-850 bg-zinc-950/70 backdrop-blur-md">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-zinc-500">
              Direct Contact
            </span>
            <div className="text-xl sm:text-3xl font-mono font-medium text-white tracking-tight break-all">
              {footer.email}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                {footer.phone}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono uppercase tracking-[0.15em] transition-all duration-200 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{footer.copiedLabel}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>{footer.copyLabel}</span>
              </>
            )}
          </button>
        </div>

        {/* Status Tags */}
        <div className="flex flex-wrap gap-2">
          {footer.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 rounded-full border border-zinc-850 bg-zinc-950/50 text-[0.6875rem] font-mono uppercase tracking-[0.15em] text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Social Links Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-zinc-900">
          <div className="flex flex-wrap items-center gap-6">
            {footer.socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors"
              >
                <span>{social.label}</span>
                <ExternalLink className="w-3 h-3 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-300" />
              </a>
            ))}
          </div>

          <div className="text-right font-mono text-xs text-zinc-600 tracking-[0.15em] uppercase">
            <span className="text-zinc-400 font-medium">{footer.signoff[0]}</span> · {footer.signoff[1]}
          </div>
        </div>
      </div>
    </footer>
  );
}
