import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  ShieldCheck,
  History,
  Trash2,
  Compass,
  FileText,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { ZCodeDecoder, ZCodeDataType, ZCodeDecodedResult, ZCodeEncoder, ZCodeRenderer } from "@zcode/core";
import { SafeLinkModal } from "../components/SafeLinkModal";

interface HistoryItem {
  id: string;
  type: ZCodeDataType;
  content: string;
  timestamp: number;
  rotationDeg: number;
  errorsCorrected: number;
}

export const ScannerPage: React.FC = () => {
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [decodedResult, setDecodedResult] = useState<ZCodeDecodedResult | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Safe link modal state
  const [safeLinkUrl, setSafeLinkUrl] = useState<string | null>(null);
  const [isSafeLinkOpen, setIsSafeLinkOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("zcode_scan_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const decoder = useRef(new ZCodeDecoder()).current;
  const encoder = useRef(new ZCodeEncoder()).current;

  // Save history to localStorage
  const addToHistory = useCallback((res: ZCodeDecodedResult) => {
    const item: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: res.payload.type,
      content: res.payload.content,
      timestamp: Date.now(),
      rotationDeg: Math.round((res.rotation * 180) / Math.PI),
      errorsCorrected: res.errorsCorrected,
    };
    setHistory((prev) => {
      // Avoid duplicate consecutive entries
      if (prev.length > 0 && prev[0].content === item.content) return prev;
      const updated = [item, ...prev.slice(0, 19)];
      localStorage.setItem("zcode_scan_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Process a canvas / image buffer
  const processFrame = useCallback(
    (canvas: HTMLCanvasElement): boolean => {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      try {
        const result = decoder.decodeImage({
          data: imgData.data,
          width: canvas.width,
          height: canvas.height,
        });

        if (result) {
          setDecodedResult(result);
          setDecodeError(null);
          addToHistory(result);

          // If URL, open SafeLinkModal
          if (result.payload.type === ZCodeDataType.URL) {
            setSafeLinkUrl(result.payload.content);
            setIsSafeLinkOpen(true);
          }
          return true;
        }
      } catch {
        // Frame did not contain a readable code
      }
      return false;
    },
    [decoder, addToHistory]
  );

  // Camera Scanning Loop
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setCameraError(
        "Could not access camera. Please allow camera permissions or upload an image file instead."
      );
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, startCamera, stopCamera]);

  // Video scan interval timer
  useEffect(() => {
    if (!cameraActive) return;

    const interval = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw square crop from center of video frame
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - minDim) / 2;
      const sy = (video.videoHeight - minDim) / 2;

      canvas.width = 512;
      canvas.height = 512;
      ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 512, 512);

      processFrame(canvas);
    }, 250);

    scanIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [cameraActive, processFrame]);

  // Handle uploaded image file
  const handleFileUpload = (file: File) => {
    setIsDecoding(true);
    setDecodeError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsDecoding(false);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const success = processFrame(canvas);
        setIsDecoding(false);

        if (!success) {
          setDecodeError("Could not detect or decode a valid circular Z-Code in this image.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Test with pre-generated sample vectors
  const handleTestSample = (text: string) => {
    setIsDecoding(true);
    setDecodeError(null);

    try {
      const enc = encoder.encode(text);
      const imgBuf = ZCodeRenderer.renderToImageBuffer(enc, { size: 512, margin: 24 });
      const result = decoder.decodeImage(imgBuf);
      setDecodedResult(result);
      addToHistory(result);

      if (result.payload.type === ZCodeDataType.URL) {
        setSafeLinkUrl(result.payload.content);
        setIsSafeLinkOpen(true);
      }
    } catch (err) {
      setDecodeError((err as Error).message);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopyText = () => {
    if (!decodedResult) return;
    navigator.clipboard.writeText(decodedResult.payload.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("zcode_scan_history");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Z-Code Scanner & Decoder
        </div>
        <h1 className="text-3xl font-extrabold text-white">Scan Circular Z-Code</h1>
        <p className="text-sm text-slate-400">
          Point your camera at a circular Z-Code or upload an image to decode with Reed-Solomon correction.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setScanMode("camera")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            scanMode === "camera"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera</span>
        </button>

        <button
          onClick={() => setScanMode("upload")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            scanMode === "upload"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image / File</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Viewfinder / Upload Dropzone */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            {scanMode === "camera" ? (
              <div className="space-y-4">
                {/* Camera Viewport */}
                <div className="relative aspect-square w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-black border border-slate-700 shadow-2xl flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : cameraError ? (
                    <div className="p-6 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      Initializing camera stream...
                    </div>
                  )}

                  {/* Circular Targeting Reticle & Laser */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Outer circular guide */}
                      <div className="w-3/4 h-3/4 rounded-full border-2 border-dashed border-cyan-400/60 flex items-center justify-center relative glow-cyan-sm">
                        {/* Center crosshair */}
                        <div className="w-8 h-8 rounded-full border border-cyan-300/80 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        </div>

                        {/* Animated scanning line */}
                        <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-laser shadow-[0_0_8px_#00f0ff]"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Align code inside circular reticle</span>
                  <button
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Upload / Drag & Drop Mode */
              <div className="space-y-4">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="flex flex-col items-center justify-center aspect-square max-w-md mx-auto border-2 border-dashed border-slate-700 hover:border-cyan-400/80 rounded-3xl p-8 cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition group"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                    <Upload className="w-8 h-8 text-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-white mb-1">
                    Drag & Drop Z-Code Image
                  </span>
                  <span className="text-xs text-slate-400 text-center max-w-xs">
                    or click to browse from device (.PNG, .JPG, .SVG, .WEBP)
                  </span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Quick Demo Test Buttons */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Instant 1-Click Verification Samples:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTestSample("Hello Zihan")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 transition"
                >
                  Test "Hello Zihan"
                </button>
                <button
                  onClick={() => handleTestSample("https://example.com")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-blue-300 transition"
                >
                  Test "https://example.com"
                </button>
              </div>
            </div>

            {/* Hidden canvas for video processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Right Column: Decoded Result & History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Decoded Result Card */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Decoded Output
              </span>
              {decodedResult && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  CRC-16 Verified
                </span>
              )}
            </div>

            {isDecoding ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Analyzing circular matrix...</p>
              </div>
            ) : decodedResult ? (
              <div className="space-y-4">
                {/* Type & metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold ${
                      decodedResult.payload.type === ZCodeDataType.URL
                        ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                        : "bg-slate-800 border border-slate-700 text-slate-200"
                    }`}
                  >
                    {decodedResult.payload.type === ZCodeDataType.URL ? (
                      <>
                        <LinkIcon className="w-3.5 h-3.5" /> URL Link
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" /> Plain Text
                      </>
                    )}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Orientation: {Math.round((decodedResult.rotation * 180) / Math.PI)}°
                  </span>

                  {decodedResult.errorsCorrected > 0 && (
                    <span className="text-[11px] font-mono text-amber-300">
                      • {decodedResult.errorsCorrected} errors repaired by RS
                    </span>
                  )}
                </div>

                {/* Content text */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-slate-100 break-all select-all leading-relaxed">
                  {decodedResult.payload.content}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleCopyText}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  {decodedResult.payload.type === ZCodeDataType.URL && (
                    <button
                      onClick={() => {
                        setSafeLinkUrl(decodedResult.payload.content);
                        setIsSafeLinkOpen(true);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </button>
                  )}
                </div>
              </div>
            ) : decodeError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-400" /> Decode Error
                </p>
                <p>{decodeError}</p>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 text-slate-500 text-xs">
                <Compass className="w-8 h-8 mx-auto text-slate-600" />
                <p>Waiting for code scan...</p>
              </div>
            )}
          </div>

          {/* Scan History */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                Recent Scans ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No recent scans yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === ZCodeDataType.URL) {
                        setSafeLinkUrl(item.content);
                        setIsSafeLinkOpen(true);
                      } else {
                        navigator.clipboard.writeText(item.content);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-mono font-semibold ${
                          item.type === ZCodeDataType.URL ? "text-cyan-400" : "text-slate-300"
                        }`}
                      >
                        {item.type === ZCodeDataType.URL ? "URL" : "TEXT"}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-300 truncate">{item.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safe Link Inspector Modal */}
      {safeLinkUrl && (
        <SafeLinkModal
          url={safeLinkUrl}
          isOpen={isSafeLinkOpen}
          onClose={() => setIsSafeLinkOpen(false)}
        />
      )}
    </div>
  );
};
