"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft01Icon, Camera01Icon, ImageAdd02Icon, Tick02Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

interface Rect { x: number; y: number; w: number; h: number; }
type DragMode = "move" | "nw" | "ne" | "sw" | "se" | null;

interface Props {
  title?: string;
  /** Called with base64 (no data-url prefix) + mime type once the user confirms the crop. */
  onDone: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

const MIN_CROP = 60; // px

export function CameraCapture({ title = "Snap your receipt", onDone, onClose }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const galleryRef   = useRef<HTMLInputElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const cropAreaRef  = useRef<HTMLDivElement>(null);
  const imgElRef     = useRef<HTMLImageElement>(null);

  const [phase, setPhase]           = useState<"camera" | "crop">("camera");
  const [captured, setCaptured]     = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);

  const [imgRect, setImgRect] = useState<Rect | null>(null); // displayed (letterboxed) image box in container px
  const [crop, setCrop]       = useState<Rect | null>(null); // crop selection in container px
  const naturalRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; orig: Rect } | null>(null);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraReady(true);
      }
    } catch {
      setCameraBlocked(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (phase === "camera") startCamera();
    return () => stopCamera();
  }, [phase, startCamera, stopCamera]);

  function captureFrame() {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    naturalRef.current = { w: canvas.width, h: canvas.height };
    stopCamera();
    setCaptured(url);
    setPhase("crop");
  }

  function onGalleryFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
        stopCamera();
        setCaptured(url);
        setPhase("crop");
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }

  // ── Crop geometry ───────────────────────────────────────────────────────────
  // Compute the letterboxed image rect inside the crop area, then seed the crop box.
  const measure = useCallback(() => {
    const area = cropAreaRef.current;
    const nat = naturalRef.current;
    if (!area || !nat.w || !nat.h) return;
    const cw = area.clientWidth, ch = area.clientHeight;
    const scale = Math.min(cw / nat.w, ch / nat.h);
    const w = nat.w * scale, h = nat.h * scale;
    const x = (cw - w) / 2, y = (ch - h) / 2;
    const rect = { x, y, w, h };
    setImgRect(rect);
    // default crop = 86% of the image, centred
    const inset = 0.07;
    setCrop({ x: x + w * inset, y: y + h * inset, w: w * (1 - inset * 2), h: h * (1 - inset * 2) });
  }, []);

  useEffect(() => {
    if (phase !== "crop") return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [phase, captured, measure]);

  function clampToImage(r: Rect, bounds: Rect): Rect {
    let { x, y, w, h } = r;
    w = Math.max(MIN_CROP, w); h = Math.max(MIN_CROP, h);
    x = Math.max(bounds.x, Math.min(x, bounds.x + bounds.w - w));
    y = Math.max(bounds.y, Math.min(y, bounds.y + bounds.h - h));
    return { x, y, w, h };
  }

  function pointerDown(mode: DragMode) {
    return (e: React.PointerEvent) => {
      if (!crop) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...crop } };
    };
  }

  function pointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !imgRect) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    const o = d.orig;
    let next: Rect;
    if (d.mode === "move") {
      next = clampToImage({ ...o, x: o.x + dx, y: o.y + dy }, imgRect);
    } else {
      let { x, y, w, h } = o;
      if (d.mode === "nw") { x = o.x + dx; y = o.y + dy; w = o.w - dx; h = o.h - dy; }
      if (d.mode === "ne") { y = o.y + dy; w = o.w + dx; h = o.h - dy; }
      if (d.mode === "sw") { x = o.x + dx; w = o.w - dx; h = o.h + dy; }
      if (d.mode === "se") { w = o.w + dx; h = o.h + dy; }
      // keep inside the image and above min size
      if (w < MIN_CROP) { if (d.mode === "nw" || d.mode === "sw") x = o.x + o.w - MIN_CROP; w = MIN_CROP; }
      if (h < MIN_CROP) { if (d.mode === "nw" || d.mode === "ne") y = o.y + o.h - MIN_CROP; h = MIN_CROP; }
      x = Math.max(imgRect.x, x); y = Math.max(imgRect.y, y);
      w = Math.min(w, imgRect.x + imgRect.w - x); h = Math.min(h, imgRect.y + imgRect.h - y);
      next = { x, y, w, h };
    }
    setCrop(next);
  }

  function pointerUp() { dragRef.current = null; }

  function retake() {
    setCaptured(null);
    setCrop(null);
    setImgRect(null);
    setCameraReady(false);
    setPhase("camera");
  }

  function useCrop() {
    const img = imgElRef.current;
    if (!img || !crop || !imgRect) return;
    const nat = naturalRef.current;
    const scale = nat.w / imgRect.w; // displayed → natural
    const sx = (crop.x - imgRect.x) * scale;
    const sy = (crop.y - imgRect.y) * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;
    const canvas = canvasRef.current!;
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext("2d")?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    onDone(url.split(",")[1], "image/jpeg");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000", fontFamily: FF }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 flex-shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", paddingBottom: 12 }}>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.14)" }}
          aria-label="Close"
        >
          <ArrowLeft01Icon size={18} color="#fff" />
        </button>
        <span className="text-[16px] font-semibold text-white">
          {phase === "camera" ? title : "Crop what SPAL should read"}
        </span>
      </div>

      {/* Stage */}
      <div className="flex-1 relative overflow-hidden" ref={cropAreaRef}>
        {phase === "camera" ? (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: cameraReady ? "block" : "none" }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
                {cameraBlocked ? (
                  <>
                    <Camera01Icon size={34} color="rgba(255,255,255,0.35)" />
                    <p className="text-white/50 text-[13px]">Camera access is off. Use the gallery button below instead.</p>
                  </>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
              </div>
            )}
            {/* subtle frame guides */}
            {cameraReady && (
              <>
                <span className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-white/45 rounded-tl-lg pointer-events-none" />
                <span className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-white/45 rounded-tr-lg pointer-events-none" />
                <span className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2 border-white/45 rounded-bl-lg pointer-events-none" />
                <span className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2 border-white/45 rounded-br-lg pointer-events-none" />
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 touch-none select-none" onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgElRef} src={captured ?? ""} alt="Captured" onLoad={measure} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            {imgRect && crop && (
              <>
                {/* Dim outside the crop box (4 panels) */}
                <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: 0, right: 0, height: crop.y }} />
                <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: crop.y + crop.h, right: 0, bottom: 0 }} />
                <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: crop.y, width: crop.x, height: crop.h }} />
                <div className="absolute bg-black/55 pointer-events-none" style={{ left: crop.x + crop.w, top: crop.y, right: 0, height: crop.h }} />

                {/* Crop box */}
                <div
                  onPointerDown={pointerDown("move")}
                  className="absolute"
                  style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: "2px solid #22C55E", boxShadow: "0 0 0 100vmax rgba(0,0,0,0)" }}
                >
                  {/* corner handles */}
                  {([["nw", "-left-2 -top-2"], ["ne", "-right-2 -top-2"], ["sw", "-left-2 -bottom-2"], ["se", "-right-2 -bottom-2"]] as const).map(([mode, pos]) => (
                    <span
                      key={mode}
                      onPointerDown={pointerDown(mode)}
                      className={`absolute w-6 h-6 rounded-full ${pos}`}
                      style={{ background: "#22C55E", border: "2px solid #fff", touchAction: "none" }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom controls */}
      {phase === "camera" ? (
        <div className="flex items-center justify-between px-8 flex-shrink-0" style={{ paddingTop: 16, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
          <button
            onClick={() => galleryRef.current?.click()}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.14)" }}
            aria-label="Choose from gallery"
          >
            <ImageAdd02Icon size={22} color="#fff" />
          </button>

          <button
            onClick={captureFrame}
            disabled={!cameraReady}
            className="w-[74px] h-[74px] rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            style={{ border: "4px solid #fff" }}
            aria-label="Capture"
          >
            <span className="w-[58px] h-[58px] rounded-full" style={{ background: "#fff" }} />
          </button>

          <div className="w-12 h-12" />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onGalleryFile(f); }} />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 flex-shrink-0" style={{ paddingTop: 14, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
          <button
            onClick={retake}
            className="flex-1 h-13 py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center active:scale-[0.98] transition-transform"
            style={{ background: "rgba(255,255,255,0.16)" }}
          >
            Retake
          </button>
          <button
            onClick={useCrop}
            className="flex-1 h-13 py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}
          >
            <Tick02Icon size={18} color="#fff" />
            Use Photo
          </button>
        </div>
      )}
    </div>
  );
}
