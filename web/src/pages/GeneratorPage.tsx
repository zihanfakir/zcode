import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Download,
  Copy,
  Share2,
  Check,
  AlertCircle,
  Link,
  FileText,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Palette,
  ArrowLeftRight,
} from "lucide-react";
import {
  ZCodeEncoder,
  ZCodeRenderer,
  ZCodeDataType,
  ZCodeFormat,
  ZCodeEncodedData,
  V1_MAX_PAYLOAD,
  V1_MAX_ENCRYPTED_PAYLOAD,
} from "@zcode/core";
import { useSiteTheme } from "../context/ThemeContext";

// Color presets for Z-Code: Defaults to B&W Classic (Black on White)
const ZCODE_COLOR_PRESETS = [
  { id: "bw-classic", name: "B&W Classic", fg: "#000000", bg: "#ffffff", desc: "Default High-Contrast" },
  { id: "bw-dark", name: "B&W Dark", fg: "#ffffff", bg: "#000000", desc: "Inverted Monochrome" },
  { id: "cyber", name: "Cyber Cyan", fg: "#00f0ff", bg: "#0a0e17", desc: "Electric Neon" },
  { id: "matrix", name: "Emerald", fg: "#10b981", bg: "#04140e", desc: "Terminal Green" },
  { id: "amber", name: "Amber Radar", fg: "#f59e0b", bg: "#140e04", desc: "Sci-Fi Radar" },
];

const RESOLUTION_OPTIONS = [512, 1024, 2048];

function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

export const GeneratorPage: React.FC = () => {
  const { theme } = useSiteTheme();

  const [content, setContent] = useState("Hello Zihan");
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Default color: Black on White
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [selectedPresetId, setSelectedPresetId] = useState("bw-classic");

  const [resolution, setResolution] = useState(1024);
  const [showCenterZ, setShowCenterZ] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [encodedResult, setEncodedResult] = useState<ZCodeEncodedData | null>(null);
  const [encodingError, setEncodingError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const encoder = useMemo(() => new ZCodeEncoder(), []);

  // Automatic type detection
  const detectedType = useMemo(() => {
    return ZCodeFormat.isUrl(content) ? ZCodeDataType.URL : ZCodeDataType.TEXT;
  }, [content]);

  // Direct optical payload limits: 27 bytes for encrypted mode, 63 bytes for public mode
  const directLimit = isProtected ? V1_MAX_ENCRYPTED_PAYLOAD : V1_MAX_PAYLOAD;

  // Payload byte length accounting for URL prefix compression
  const currentPayloadBytes = useMemo(() => {
    const encoderText = new TextEncoder();
    let textToEncode = detectedType === ZCodeDataType.URL ? content.trim() : content;
    if (detectedType === ZCodeDataType.URL) {
      if (textToEncode.toLowerCase().startsWith("https://www.")) textToEncode = textToEncode.slice(12);
      else if (textToEncode.toLowerCase().startsWith("http://www.")) textToEncode = textToEncode.slice(11);
      else if (textToEncode.toLowerCase().startsWith("https://")) textToEncode = textToEncode.slice(8);
      else if (textToEncode.toLowerCase().startsWith("http://")) textToEncode = textToEncode.slice(7);
    }
    return encoderText.encode(textToEncode).length;
  }, [content, detectedType]);

  const isTooLong = currentPayloadBytes > directLimit;

  // Calculate optical contrast ratio
  const contrastRatio = useMemo(() => {
    return getContrastRatio(fgColor, bgColor);
  }, [fgColor, bgColor]);

  // Preset selection handler
  const handleSelectPreset = (preset: (typeof ZCODE_COLOR_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  // Custom color handlers
  const handleFgChange = (newFg: string) => {
    setFgColor(newFg);
    setSelectedPresetId("custom");
  };

  const handleBgChange = (newBg: string) => {
    setBgColor(newBg);
    setSelectedPresetId("custom");
  };

  // One-click Invert Colors
  const handleInvertColors = () => {
    const oldFg = fgColor;
    const oldBg = bgColor;
    setFgColor(oldBg);
    setBgColor(oldFg);
    setSelectedPresetId("custom");
    showToast("Colors Inverted (⇄)");
  };

  // Asynchronously generate encoded data for single static code
  useEffect(() => {
    let isCurrent = true;

    async function generate() {
      if (!content.trim()) {
        setEncodedResult(null);
        setEncodingError(null);
        return;
      }

      if (isProtected) {
        if (!password) {
          setEncodedResult(null);
          setEncodingError("Please enter an encryption password.");
          return;
        }
        if (!confirmPassword) {
          setEncodedResult(null);
          setEncodingError("Please confirm your encryption password.");
          return;
        }
        if (password !== confirmPassword) {
          setEncodedResult(null);
          setEncodingError("Passwords do not match.");
          return;
        }
      }

      if (isTooLong) {
        setEncodedResult(null);
        setEncodingError(
          `Payload (${currentPayloadBytes} bytes) exceeds maximum Direct Optical limit of ${directLimit} bytes.`
        );
        return;
      }

      try {
        const res = await encoder.encode(content, {
          password: isProtected ? password : undefined,
        });
        if (isCurrent) {
          setEncodedResult(res);
          setEncodingError(null);
        }
      } catch (err) {
        if (isCurrent) {
          setEncodedResult(null);
          setEncodingError(err instanceof Error ? err.message : "Encoding failed");
        }
      }
    }

    generate();

    return () => {
      isCurrent = false;
    };
  }, [content, isProtected, password, confirmPassword, isTooLong, currentPayloadBytes, directLimit, encoder]);

  const svgMarkup = useMemo(() => {
    if (!encodedResult) return null;
    return ZCodeRenderer.renderToSVG(encodedResult, {
      size: 512,
      margin: 20,
      foregroundColor: fgColor,
      backgroundColor: bgColor,
      showCenterZ,
    });
  }, [encodedResult, fgColor, bgColor, showCenterZ]);

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
      foregroundColor: fgColor,
      backgroundColor: bgColor,
      showCenterZ,
    });

    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zcode_${Date.now()}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      foregroundColor: fgColor,
      backgroundColor: bgColor,
      showCenterZ,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zcode_${resolution}px_${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Downloaded ${resolution}px PNG!`);
    }, "image/png");
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
          text: `Check out this Z-Code (${detectedType}): ${content}`,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(content);
      showToast("Copied content to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-xs font-mono text-theme-muted uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span>Direct Optical 2D Barcode Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-theme-text">
          Generate Z-Code
        </h1>
        <p className="text-sm text-theme-muted mt-1 max-w-xl">
          Encode plain text or web links into a single-frame circular polar matrix barcode with Reed-Solomon RS(85, 71) error correction and optional AES-256-GCM encryption.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Controls & Data Input */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-theme-panel border border-theme-border shadow-xl space-y-5 transition-colors">
            {/* Input Header & Capacity Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                {detectedType === ZCodeDataType.URL ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium">
                    <Link className="w-3 h-3" /> URL Mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                    <FileText className="w-3 h-3" /> Text Mode
                  </span>
                )}

                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
                  <Sparkles className="w-3 h-3" /> Direct Optical
                </span>
              </div>

              {/* Character & Byte Capacity Counter */}
              <div className="text-right">
                <span
                  className={`text-xs font-mono font-semibold ${
                    isTooLong ? "text-rose-400" : "text-theme-muted"
                  }`}
                >
                  {currentPayloadBytes} / {directLimit} bytes (Direct Optical)
                </span>
              </div>
            </div>

            {/* Content Input Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-text uppercase tracking-wider block">
                Payload Content
              </label>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter text or URL (max ${directLimit} bytes)...`}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-theme-card border border-theme-border text-theme-text placeholder-theme-muted focus:outline-none focus:ring-1 text-sm font-mono transition-colors resize-y"
                style={{
                  outlineColor: theme.primary,
                }}
              />
            </div>

            {/* Password Protection Toggle & Section */}
            <div className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isProtected
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "bg-theme-panel border-theme-border text-theme-muted"
                    }`}
                  >
                    {isProtected ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                      Password Protection
                      {isProtected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-normal">
                          AES-256-GCM
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-theme-muted">
                      {isProtected
                        ? "Payload will be cryptographically locked with PBKDF2 (max 27 bytes)"
                        : "Anyone with a Z-Code scanner can read this code (max 63 bytes)"}
                    </div>
                  </div>
                </div>

                {/* Custom Styled Switch */}
                <button
                  type="button"
                  onClick={() => setIsProtected(!isProtected)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isProtected ? "bg-amber-500" : "bg-theme-panel border-theme-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isProtected ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Password Fields (shown when isProtected = true) */}
              {isProtected && (
                <div className="space-y-3 pt-2 border-t border-theme-border animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-theme-muted flex items-center justify-between">
                        <span>Encryption Password</span>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-theme-muted hover:text-theme-text transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secret password..."
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-theme-panel border border-theme-border text-theme-text placeholder-theme-muted focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-theme-muted">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-theme-panel border border-theme-border text-theme-text placeholder-theme-muted focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-400 font-medium">
                      ⚠️ Passwords do not match.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Sample Presets (Mobile scrollable) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-theme-muted">Quick Load Samples:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setContent("Hello Zihan");
                    setIsProtected(false);
                  }}
                  className="whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-mono bg-theme-card hover:bg-theme-panel border border-theme-border text-theme-muted hover:text-theme-text transition-colors active:scale-95"
                >
                  "Hello Zihan"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContent("https://example.com");
                    setIsProtected(false);
                  }}
                  className="whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-mono bg-theme-card hover:bg-theme-panel border border-theme-border text-theme-muted hover:text-theme-text transition-colors active:scale-95"
                >
                  "example.com"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContent("TopSecretZihan2026");
                    setIsProtected(true);
                    setPassword("zihan123");
                    setConfirmPassword("zihan123");
                  }}
                  className="whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-mono bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors flex items-center gap-1 active:scale-95"
                >
                  <Lock className="w-3 h-3 text-amber-400" /> "🔒 Secret"
                </button>
              </div>
            </div>

            {/* Z-Code Color Customization Section */}
            <div className="border-t border-theme-border pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                  Z-Code Color Customization
                </label>
                {/* Contrast Badge */}
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      contrastRatio >= 4.5
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : contrastRatio >= 3.0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {contrastRatio >= 4.5
                      ? "✓ Optimal Contrast"
                      : contrastRatio >= 3.0
                      ? "Good Contrast"
                      : "⚠️ Low Contrast"}{" "}
                    ({contrastRatio.toFixed(1)}:1)
                  </span>
                </div>
              </div>

              {/* 1-Click Color Presets (B&W Classic Default) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ZCODE_COLOR_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs transition ${
                        isSelected
                          ? "border-theme-text bg-theme-card font-bold text-theme-text shadow-md ring-1 ring-theme-text/20"
                          : "border-theme-border bg-theme-card hover:border-theme-muted text-theme-muted hover:text-theme-text"
                      }`}
                    >
                      <div className="flex items-center -space-x-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-theme-border shadow-inner"
                          style={{ backgroundColor: p.fg }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-theme-border shadow-inner"
                          style={{ backgroundColor: p.bg }}
                        />
                      </div>
                      <span className="text-[11px] truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Pickers: Foreground, Background, and Invert */}
              <div className="p-3.5 rounded-xl bg-theme-card border border-theme-border space-y-3">
                <div className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                  Custom Palette Pickers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                  {/* Foreground / Dot Color */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-medium text-theme-muted flex items-center justify-between">
                      <span>Dots (Foreground)</span>
                      <span className="font-mono text-[10px]">{fgColor.toUpperCase()}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => handleFgChange(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => handleFgChange(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-theme-panel border border-theme-border text-theme-text focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Swap / Invert Button */}
                  <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleInvertColors}
                      title="Invert Foreground and Background Colors"
                      className="p-2 rounded-xl border border-theme-border bg-theme-panel hover:bg-theme-card text-theme-text hover:border-theme-muted transition shadow-sm active:scale-95"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Background Color */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-medium text-theme-muted flex items-center justify-between">
                      <span>Background Color</span>
                      <span className="font-mono text-[10px]">{bgColor.toUpperCase()}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => handleBgChange(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => handleBgChange(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-theme-panel border border-theme-border text-theme-text focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Resolution & Emblem Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-theme-text uppercase tracking-wider">
                    Export Resolution
                  </label>
                  <div className="flex gap-2">
                    {RESOLUTION_OPTIONS.map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setResolution(res)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono border transition ${
                          resolution === res
                            ? "border-theme-text bg-theme-card font-bold text-theme-text shadow-sm"
                            : "bg-theme-card border-theme-border text-theme-muted hover:text-theme-text"
                        }`}
                      >
                        {res}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-theme-text uppercase tracking-wider">
                    Center Emblem
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCenterZ(!showCenterZ)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono border transition flex items-center justify-between ${
                      showCenterZ
                        ? "border-theme-text bg-theme-card font-semibold text-theme-text"
                        : "bg-theme-card border-theme-border text-theme-muted"
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
          <div className="p-6 rounded-2xl bg-theme-panel border border-theme-border flex flex-col items-center space-y-6 shadow-xl transition-colors">
            <div className="w-full flex items-center justify-between text-xs border-b border-theme-border/80 pb-3">
              {isProtected ? (
                <span className="font-mono text-amber-400 flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  🔒 PROTECTED Z-CODE
                </span>
              ) : (
                <span className="font-mono text-theme-text flex items-center gap-1.5 font-bold">
                  <Unlock className="w-3.5 h-3.5" />
                  🔓 PUBLIC Z-CODE
                </span>
              )}
              <span className="font-mono text-theme-muted">
                RS(85, 71) • 14 ECC BYTES
              </span>
            </div>

            {/* Circular Code Visualizer Canvas / SVG */}
            <div
              className="w-full max-w-[320px] sm:max-w-[380px] aspect-square rounded-2xl p-4 flex items-center justify-center border border-theme-border shadow-2xl transition-all relative overflow-hidden mx-auto"
              style={{ backgroundColor: bgColor }}
            >
              {svgMarkup ? (
                <div
                  className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-theme-text font-medium">
                    {encodingError || "Please enter valid text"}
                  </p>
                  <p className="text-[11px] text-theme-muted">
                    Capacity: {isProtected ? V1_MAX_ENCRYPTED_PAYLOAD : V1_MAX_PAYLOAD} bytes (Direct Optical V1)
                  </p>
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
                  className="min-h-[44px] px-4 py-3 rounded-xl disabled:opacity-40 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.isLight ? "#ffffff" : "#000000",
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG ({resolution}px)</span>
                </button>

                <button
                  disabled={!encodedResult}
                  onClick={handleDownloadSVG}
                  className="min-h-[44px] px-4 py-3 rounded-xl bg-theme-card hover:bg-theme-card/80 disabled:opacity-40 border border-theme-border text-theme-text font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 opacity-75" />
                  <span>Download Vector SVG</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  disabled={!encodedResult}
                  onClick={handleCopySVG}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-theme-card hover:bg-theme-card/80 disabled:opacity-40 border border-theme-border text-theme-text text-xs font-mono transition flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-theme-muted" />
                      <span>Copy SVG Markup</span>
                    </>
                  )}
                </button>

                <button
                  disabled={!encodedResult}
                  onClick={handleShare}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-theme-card hover:bg-theme-card/80 disabled:opacity-40 border border-theme-border text-theme-text text-xs font-mono transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-theme-muted" />
                  <span>Share Z-Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div
          className="fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{
            backgroundColor: theme.primary,
            color: theme.isLight ? "#ffffff" : "#000000",
          }}
        >
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
