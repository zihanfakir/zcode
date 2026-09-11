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
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  ZCodeDecoder,
  ZCodeDataType,
  ZCodeDecodedResult,
  ZCodeEncoder,
  ZCodeRenderer,
} from "@zcode/core";
import { SafeLinkModal } from "../components/SafeLinkModal";

interface HistoryItem {
  id: string;
  type: ZCodeDataType;
  content: string;
  timestamp: number;
  rotationDeg: number;
  errorsCorrected: number;
  isLocked?: boolean;
}

export const ScannerPage: React.FC = () => {
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [decodedResult, setDecodedResult] = useState<ZCodeDecodedResult | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Password unlocking state
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

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

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Save history to localStorage
  const addToHistory = useCallback((res: ZCodeDecodedResult) => {
    if (res.payload.isLocked) return;

    const item: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: res.payload.type,
      content: res.payload.content,
      timestamp: Date.now(),
      rotationDeg: Math.round((res.rotation * 180) / Math.PI),
      errorsCorrected: res.errorsCorrected,
      isLocked: false,
    };
    setHistory((prev) => {
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
          setDecodedResult((prev) => {
            // Do not wipe if user is currently looking at or typing password for this locked code
            if (prev?.payload.isLocked && result.payload.isLocked) {
              return prev;
            }
            if (result.payload.isLocked) {
              setUnlockPassword("");
              setUnlockError(null);
            }
            return result;
          });
          setDecodeError(null);

          if (!result.payload.isLocked) {
            addToHistory(result);

            // If URL, open SafeLinkModal
            if (result.payload.type === ZCodeDataType.URL) {
              setSafeLinkUrl(result.payload.content);
              setIsSafeLinkOpen(true);
            }
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Camera Scanning Loop with robust device fallbacks (iOS Safari, Android Chrome, WebView)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires HTTPS or is not supported by your browser.");
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // 1. Try ideal rear camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch {
      try {
        // 2. Fallback without resolution constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
        });
      } catch {
        try {
          // 3. Fallback to any available camera
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err: any) {
          if (!isMountedRef.current) return;
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setCameraError("Camera permission was denied. Please allow camera permissions in your browser or device settings.");
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setCameraError("No camera device found on this device.");
          } else {
            setCameraError(`Camera error: ${err.message || err.name || "Access failed"}. Please check permissions.`);
          }
          setCameraActive(false);
          return;
        }
      }
    }

    if (!isMountedRef.current || !stream) {
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.setAttribute("autoplay", "true");
      video.setAttribute("muted", "true");
      try {
        await video.play();
      } catch {
        // Autoplay handled
      }
      if (isMountedRef.current) {
        setCameraActive(true);
      }
    }
  }, [facingMode, stopCamera]);

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

    let isScanning = false;

    const interval = window.setInterval(() => {
      if (decodedResult?.payload.isLocked || isSafeLinkOpen) return;
      if (isScanning) return;
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      isScanning = true;
      try {
        const minDim = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - minDim) / 2;
        const sy = (video.videoHeight - minDim) / 2;

        if (canvas.width !== 512 || canvas.height !== 512) {
          canvas.width = 512;
          canvas.height = 512;
        }
        ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 512, 512);

        processFrame(canvas);
      } finally {
        isScanning = false;
      }
    }, 250);

    scanIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [cameraActive, processFrame, decodedResult?.payload.isLocked, isSafeLinkOpen]);

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
    setUnlockPassword("");
    setUnlockError(null);

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

  // Test with pre-generated locked sample vector
  const handleTestLockedSample = async () => {
    setIsDecoding(true);
    setDecodeError(null);
    setUnlockPassword("");
    setUnlockError(null);

    try {
      const enc = await encoder.encode("Hello Zihan", { password: "zihan123" });
      const imgBuf = ZCodeRenderer.renderToImageBuffer(enc, { size: 512, margin: 24 });
      const result = decoder.decodeImage(imgBuf);
      setDecodedResult(result);
    } catch (err) {
      setDecodeError((err as Error).message);
    } finally {
      setIsDecoding(false);
    }
  };

  // Unlock password-protected Z-Code
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!decodedResult || !decodedResult.payload.isLocked) return;
    if (!unlockPassword.trim()) {
      setUnlockError("Please enter the decryption password.");
      return;
    }

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const unlockedPayload = await ZCodeDecoder.unlock(
        decodedResult.payload,
        unlockPassword
      );
      const updatedResult: ZCodeDecodedResult = {
        ...decodedResult,
        payload: unlockedPayload,
      };
      setDecodedResult(updatedResult);

      if (unlockedPayload.type === ZCodeDataType.URL) {
        setSafeLinkUrl(unlockedPayload.content);
        setIsSafeLinkOpen(true);
      }
    } catch {
      setUnlockError("Incorrect password or corrupted data. Decryption failed.");
    } finally {
      setIsUnlocking(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-primary/10 border border-theme-primary/30 text-theme-primary text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Direct Optical Scanner & Decoder
        </div>
        <h1 className="text-3xl font-extrabold text-theme-text">Scan Circular Z-Code</h1>
        <p className="text-sm text-theme-muted">
          Point your camera at a circular Z-Code or upload an image for instant 1-frame decoding with Reed-Solomon RS(85, 71) error correction.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center space-x-2 border-b border-theme-border pb-4">
        <button
          onClick={() => setScanMode("camera")}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            scanMode === "camera"
              ? "bg-theme-primary text-theme-bg shadow-md shadow-theme-primary/20"
              : "bg-theme-card text-theme-muted hover:text-theme-text hover:bg-theme-panel border border-theme-border"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera</span>
        </button>

        <button
          onClick={() => setScanMode("upload")}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            scanMode === "upload"
              ? "bg-theme-primary text-theme-bg shadow-md shadow-theme-primary/20"
              : "bg-theme-card text-theme-muted hover:text-theme-text hover:bg-theme-panel border border-theme-border"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Viewfinder / Upload Dropzone */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
            {scanMode === "camera" ? (
              <div className="space-y-4">
                {/* Camera Viewport */}
                <div className="relative aspect-square w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-black border border-theme-border shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                  />

                  {!cameraActive && cameraError && (
                    <div className="p-6 text-center space-y-3 z-10">
                      <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-xs text-theme-muted font-medium">{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-theme-primary text-theme-bg text-xs font-bold"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {!cameraActive && !cameraError && (
                    <div className="text-xs text-theme-muted flex items-center gap-2 z-10">
                      <RefreshCw className="w-4 h-4 animate-spin text-theme-primary" />
                      Initializing camera stream...
                    </div>
                  )}

                  {/* Circular Targeting Reticle & Laser */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Outer circular guide */}
                      <div className="w-3/4 h-3/4 rounded-full border-2 border-dashed border-theme-primary/60 flex items-center justify-center relative">
                        {/* Center crosshair */}
                        <div className="w-8 h-8 rounded-full border border-theme-primary/80 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-theme-primary"></div>
                        </div>

                        {/* Animated scanning line */}
                        <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-theme-primary to-transparent animate-scan-laser"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex items-center justify-between text-xs text-theme-muted pt-1">
                  <span>Align code inside circular reticle</span>
                  <button
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                    className="px-3 py-1.5 rounded-lg bg-theme-card hover:bg-theme-panel border border-theme-border text-theme-text transition flex items-center gap-1.5"
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
                  className="flex flex-col items-center justify-center aspect-square max-w-md mx-auto border-2 border-dashed border-theme-border hover:border-theme-primary/80 rounded-3xl p-8 cursor-pointer bg-theme-card/40 hover:bg-theme-card/70 transition group"
                >
                  <div className="w-16 h-16 rounded-full bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                    <Upload className="w-8 h-8 text-theme-primary" />
                  </div>
                  <span className="text-sm font-bold text-theme-text mb-1">
                    Drag & Drop Z-Code Image
                  </span>
                  <span className="text-xs text-theme-muted text-center max-w-xs">
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
            <div className="border-t border-theme-border pt-4 space-y-2">
              <span className="text-[11px] font-mono text-theme-muted uppercase tracking-wider">
                Instant 1-Click Verification Samples:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap">
                <button
                  onClick={() => handleTestSample("Hello Zihan")}
                  className="whitespace-nowrap px-3 py-2 rounded-xl bg-theme-card hover:bg-theme-panel border border-theme-border text-xs font-mono text-theme-primary transition active:scale-95"
                >
                  Test "Hello Zihan"
                </button>
                <button
                  onClick={() => handleTestSample("https://example.com")}
                  className="whitespace-nowrap px-3 py-2 rounded-xl bg-theme-card hover:bg-theme-panel border border-theme-border text-xs font-mono text-blue-400 transition active:scale-95"
                >
                  Test "https://example.com"
                </button>
                <button
                  onClick={handleTestLockedSample}
                  className="whitespace-nowrap px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono text-amber-400 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Test "🔒 Locked Secret"
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
          <div className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-theme-primary" />
                Decoded Output
              </span>
              {decodedResult && (
                <div className="flex items-center gap-2">
                  {decodedResult.payload.isLocked ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Password Protected
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                      CRC-16 & RS Verified
                    </span>
                  )}
                </div>
              )}
            </div>

            {isDecoding ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-theme-primary mx-auto" />
                <p className="text-xs text-theme-muted font-mono">Analyzing circular matrix...</p>
              </div>
            ) : decodedResult ? (
              decodedResult.payload.isLocked ? (
                /* LOCKED PASSWORD PROMPT */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                      <Lock className="w-3.5 h-3.5" /> 🔒 Protected Z-Code
                    </span>
                    <span className="text-[11px] font-mono text-theme-muted flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-theme-primary" />
                      Orientation: {Math.round((decodedResult.rotation * 180) / Math.PI)}°
                    </span>
                    {decodedResult.errorsCorrected > 0 && (
                      <span className="text-[11px] font-mono text-amber-300">
                        • {decodedResult.errorsCorrected} errors repaired by RS
                      </span>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-theme-text">🔒 This Z-Code is password protected.</h3>
                      <p className="text-xs text-theme-muted max-w-xs mx-auto">
                        The payload is encrypted with AES-256-GCM. Enter the decryption password to unlock the content.
                      </p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-3 pt-2">
                      <div className="relative max-w-sm mx-auto">
                        <input
                          type={showUnlockPassword ? "text" : "password"}
                          value={unlockPassword}
                          onChange={(e) => setUnlockPassword(e.target.value)}
                          placeholder="Enter password..."
                          autoFocus
                          className="w-full py-2.5 px-3.5 pr-10 rounded-xl bg-theme-card border border-theme-border focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono text-theme-text focus:outline-none placeholder-theme-muted shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition"
                        >
                          {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {unlockError && (
                        <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300 flex items-center justify-center gap-1.5 font-mono animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{unlockError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUnlocking}
                        className="w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                      >
                        {isUnlocking ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Decrypting with Web Crypto...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-3.5 h-3.5" />
                            <span>Unlock Z-Code</span>
                          </>
                        )}
                      </button>
                    </form>

                    <p className="text-[10px] text-theme-muted font-mono pt-1">
                      🛡️ 100% Client-Side Decryption • Password never sent over the network
                    </p>
                  </div>
                </div>
              ) : (
                /* UNLOCKED / PUBLIC OUTPUT */
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Type & metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold ${
                        decodedResult.payload.type === ZCodeDataType.URL
                          ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                          : "bg-theme-card border border-theme-border text-theme-text"
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

                    {decodedResult.payload.flags !== undefined && (decodedResult.payload.flags & 0x80) !== 0 && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 font-bold">
                        <Unlock className="w-3 h-3" /> AES-256-GCM Unlocked
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-theme-muted flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-theme-primary" />
                      Orientation: {Math.round((decodedResult.rotation * 180) / Math.PI)}°
                    </span>

                    {decodedResult.errorsCorrected > 0 && (
                      <span className="text-[11px] font-mono text-amber-300">
                        • {decodedResult.errorsCorrected} errors repaired by RS
                      </span>
                    )}
                  </div>

                  {/* Content text */}
                  <div className="p-4 rounded-xl bg-theme-card border border-theme-border font-mono text-xs sm:text-sm text-theme-text break-all select-all leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                    {decodedResult.payload.content}
                  </div>

                  {/* Action buttons (Mobile-friendly full tap targets) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <button
                      onClick={handleCopyText}
                      className="min-h-[44px] py-2.5 px-3 rounded-xl bg-theme-card hover:bg-theme-panel border border-theme-border text-xs font-medium text-theme-text transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-theme-muted" />
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
                        className="min-h-[44px] py-2.5 px-4 rounded-xl bg-theme-primary hover:opacity-90 text-theme-bg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-theme-primary/20 active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Link</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : decodeError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-400" /> Decode Error
                </p>
                <p>{decodeError}</p>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 text-theme-muted text-xs">
                <Compass className="w-8 h-8 mx-auto text-theme-muted/60" />
                <p>Waiting for code scan...</p>
              </div>
            )}
          </div>

          {/* Scan History */}
          <div className="p-6 rounded-2xl bg-theme-panel border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
                <History className="w-4 h-4 text-theme-primary" />
                Recent Scans ({history.length})
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[11px] text-theme-muted hover:text-red-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-4">No recent scans yet.</p>
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
                    className="p-3 rounded-xl bg-theme-card/70 hover:bg-theme-card border border-theme-border hover:border-theme-primary/40 cursor-pointer transition space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-mono font-semibold ${
                          item.type === ZCodeDataType.URL ? "text-theme-primary" : "text-theme-text"
                        }`}
                      >
                        {item.type === ZCodeDataType.URL ? "URL" : "TEXT"}
                      </span>
                      <span className="text-theme-muted text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-theme-muted group-hover:text-theme-text truncate">{item.content}</div>
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
