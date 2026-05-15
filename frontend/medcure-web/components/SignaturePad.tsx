"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface SignaturePadHandle {
  getDataUrl: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface Props {
  height?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { height = 160, disabled, ariaLabel = "Signature pad" },
  ref
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);
  const [, force] = useState(0);

  function fit() {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const ratio = window.devicePixelRatio || 1;
    const cssW = w.clientWidth;
    const cssH = height;
    const prev = c.toDataURL();
    c.width = Math.max(1, Math.floor(cssW * ratio));
    c.height = Math.max(1, Math.floor(cssH * ratio));
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cssW, cssH);
    if (hasInk.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = prev;
    }
  }

  useEffect(() => {
    fit();
    const ro = new ResizeObserver(() => fit());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: PointerEvent | React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  }

  function onUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    force(n => n + 1);
  }

  useImperativeHandle(ref, () => ({
    getDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
    clear: () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const ratio = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();
      ctx.scale(ratio, ratio);
      hasInk.current = false;
      force(n => n + 1);
    },
    isEmpty: () => !hasInk.current,
  }));

  return (
    <div ref={wrapRef} style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        role="img"
        style={{ display: "block", width: "100%", height: `${height}px`, cursor: disabled ? "not-allowed" : "crosshair", touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {!hasInk.current && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "var(--ink-mute)", fontSize: 12 }}>
          Sign here
        </div>
      )}
    </div>
  );
});

export default SignaturePad;
