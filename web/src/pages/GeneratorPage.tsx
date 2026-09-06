import React, { useState, useMemo, useRef } from "react";
import { Download, Copy, Share2, Check, AlertCircle, Link, FileText, Sparkles, Layers } from "lucide-react";
import { ZCodeEncoder, ZCodeRenderer, ZCodeDataType, ZCodeFormat } from "@zcode/core";

const THEME_PRESETS = [
  { id: "cyber", name: "Cyber Cyan", fg: "#00f0ff", bg: "#0a0e17" },
  { id: "classic", name: "Classic Ink", fg: "#0f172a", bg: "#ffffff" },
  { id: "matrix", name: "Emerald", fg: "#10b981", bg: "#04140e" },
  { id: "amber", name: "Amber Radar", fg: "#f59e0b", bg: "#140e04" },
];

const RESOLUTION_OPTIONS = [512, 1024, 2048];

export const GeneratorPage: React.FC = () => {
  const [content, setContent] = useState("Hello Zihan");
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
  const [resolution, setResolution] = useState(1024);
  const [showCenterZ, setShowCenterZ] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const encoder = useMemo(() => new ZCodeEncoder(), []);

  // Automatic type detection
  const detectedType = useMemo(() => {
    return ZCodeFormat.isUrl(content) ? ZCodeDataType.URL : ZCodeDataType.TEXT;
  }, [content]);

  // Max payload length: 31 bytes (or higher if URL prefix compression applies)
  const isTooLong = useMemo(() => {
    const encoderText = new TextEncoder();
    let textToEncode = content.trim();
    if (detectedType === ZCodeDataType.URL) {
      if (textToEncode.toLowerCase().startsWith("https://")) textToEncode = textToEncode.slice(8);
      else if (textToEncode.toLowerCase().startsWith("http://")) textToEncode = textToEncode.slice(7);
      else if (textToEncode.toLowerCase().startsWith("https://www.")) textToEncode = textToEncode.slice(12);
      else if (textToEncode.toLowerCase().startsWith("http://www.")) textToEncode = textToEncode.slice(11);
    }
    return encoderText.encode(textToEncode).length > 31;
  }, [content, detectedType]);

  // Generate encoded data and SVG
  const encodedResult = useMemo(() => {
    if (!content.trim() || isTooLong) return null;
    try {
      return encoder.encode(content);
    } catch {
      return null;
    }
  }, [content, isTooLong, encoder]);

  const svgMarkup = useMemo(() => {
    if (!encodedResult) return null;
    return ZCodeRenderer.renderToSVG(encodedResult, {
      size: 512,
      margin: 20,
      foregroundColor: selectedTheme.fg,
      backgroundColor: selectedTheme.bg,
      showCenterZ,
    });
  }, [encodedResult, selectedTheme, showCenterZ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!encodedResult) return;
    const exportSvg = ZCodeRenderer.renderToSVG(encodedResult, {
      size: resolution,
      margin: Math.round(resolution * 0.04),
      foregroundColor: selectedTheme.fg,
      backgroundColor: selectedTheme.bg,
      showCenterZ,
    });

    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zcode_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded SVG Vector!");
  };

  // Download high-resolution PNG
  const handleDownloadPNG = () => {
    if (!encodedResult) return;
    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ZCodeRenderer.renderToCanvas(ctx, encodedResult, {
      size: resolution,
      margin: Math.round(resolution * 0.04),
      foregroundColor: selectedTheme.fg,
      backgroundColor: selectedTheme.bg,
      showCenterZ,
    });

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `zcode_${resolution}px_${Date.now()}.png`;
    a.click();
    showToast(`Downloaded ${resolution}px PNG!`);
  };

  // Copy SVG markup
  const handleCopySVG = () => {
    if (!svgMarkup) return;
    navigator.clipboard.writeText(svgMarkup);
    setCopied(true);
    showToast("Copied SVG markup to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Z-Code",
          text: `Check out my custom circular Z-Code: ${content}`,
          url: window.location.href,
        });
      } catch {
        // User dismissed
      }
    } else {
      navigator.clipboard.writeText(content);
      showToast("Copied content to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Z-Code Generator
        </div>
        <h1 className="text-3xl font-extrabold text-white">Create Custom Circular Z-Code</h1>
        <p className="text-sm text-slate-400">
          Enter text or a URL to generate a scannable circular code with Reed-Solomon error correction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Controls & Input */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-5">
            {/* Input Header & Auto-Detect Badge */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Payload Input
              </label>
              <span
                className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  detectedType === ZCodeDataType.URL
                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                    : "bg-slate-800 border border-slate-700 text-slate-300"
                }`}
              >
                {detectedType === ZCodeDataType.URL ? (
                  <>
                    <Link className="w-3 h-3" /> Auto-Detected: URL
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" /> Plain Text
                  </>
                )}
              </span>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter text or paste a link (e.g. https://example.com)..."
                className={`w-full p-3.5 rounded-xl bg-slate-900 border text-sm font-mono text-white focus:outline-none focus:ring-1 transition resize-none ${
                  isTooLong
                    ? "border-red-500/80 focus:ring-red-500"
                    : "border-slate-700 focus:border-cyan-400 focus:ring-cyan-400"
                }`}
              />
              <div className="flex items-center justify-between text-xs font-mono">
                {isTooLong ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Payload exceeds 31-byte limit
                  </span>
                ) : (
                  <span className="text-slate-500">Supports up to 31 bytes UTF-8</span>
                )}
                <span className={isTooLong ? "text-red-400 font-bold" : "text-slate-400"}>
                  {content.length} characters
                </span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Quick Test Samples:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setContent("Hello Zihan")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition"
                >
                  "Hello Zihan"
                </button>
                <button
                  onClick={() => setContent("https://example.com")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition"
                >
                  "https://example.com"
                </button>
                <button
                  onClick={() => setContent("https://zcode.dev/app")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition"
                >
                  "https://zcode.dev/app"
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 space-y-4">
              {/* Theme Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Color Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t)}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs transition ${
                        selectedTheme.id === t.id
                          ? "border-cyan-400 bg-cyan-500/10 font-bold text-white shadow-sm"
                          : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0"
                        style={{ backgroundColor: t.fg }}
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Resolution & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Export Resolution
                  </label>
                  <div className="flex gap-2">
                    {RESOLUTION_OPTIONS.map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono border transition ${
                          resolution === res
                            ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {res}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Center Emblem
                  </label>
                  <button
                    onClick={() => setShowCenterZ(!showCenterZ)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono border transition flex items-center justify-between ${
                      showCenterZ
                        ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 font-semibold"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span>Stylized 'Z' Emblem</span>
                    <span>{showCenterZ ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Live Circular Preview & Downloads */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col items-center space-y-6">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
              <span className="font-mono text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Z-CODE PREVIEW
              </span>
              <span className="font-mono text-slate-500">RS(49, 39) • 10 ECC BYTES</span>
            </div>

            {/* Circular Code Visualizer Canvas / SVG */}
            <div
              className="w-full max-w-[380px] aspect-square rounded-2xl p-4 flex items-center justify-center border border-slate-800 shadow-2xl transition-all"
              style={{ backgroundColor: selectedTheme.bg }}
            >
              {svgMarkup ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Please enter valid text</p>
                  <p className="text-[11px] text-slate-500">Max length is 31 bytes</p>
                </div>
              )}
            </div>

            {/* Hidden canvas for PNG export */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Export & Action Buttons */}
            <div className="w-full space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={!encodedResult}
                  onClick={handleDownloadPNG}
                  className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG ({resolution}px)</span>
                </button>

                <button
                  disabled={!encodedResult}
                  onClick={handleDownloadSVG}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 hover:border-cyan-500/50 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Vector SVG</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  disabled={!encodedResult}
                  onClick={handleCopySVG}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 text-xs font-mono transition flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy SVG Markup</span>
                    </>
                  )}
                </button>

                <button
                  disabled={!encodedResult}
                  onClick={handleShare}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 text-xs font-mono transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Z-Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
