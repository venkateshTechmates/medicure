"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  mode: "audio" | "video";
  peer: { name: string; role: string; pic: string };
  onClose: () => void;
}

export default function CallModal({ open, mode, peer, onClose }: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [status, setStatus] = useState<"dialing" | "connected">("dialing");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setStatus("dialing");
    setElapsed(0);

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video" ? { width: 640, height: 360 } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localRef.current && mode === "video") {
          localRef.current.srcObject = stream;
        }
        setTimeout(() => !cancelled && setStatus("connected"), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not access devices");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [open, mode]);

  useEffect(() => {
    if (status !== "connected") return;
    tickRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [status]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach(t => (t.enabled = !next));
  }

  function toggleVideo() {
    const next = !videoOff;
    setVideoOff(next);
    streamRef.current?.getVideoTracks().forEach(t => (t.enabled = !next));
  }

  function end() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    onClose();
  }

  if (!open) return null;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      onClick={end}
      style={{ position: "fixed", inset: 0, background: "rgba(8,12,18,0.82)", zIndex: 1000, display: "grid", placeItems: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 720, maxWidth: "92vw", background: "#101521", color: "#e6edf5", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #1f2735" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundImage: `url(${peer.pic})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div>
              <div style={{ fontWeight: 600 }}>{peer.name}</div>
              <div style={{ fontSize: 12, color: "#8a97ad" }}>{peer.role}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#8a97ad" }}>
            {mode === "video" ? "Video call" : "Audio call"} · {status === "dialing" ? "Ringing…" : `${mm}:${ss}`}
          </div>
        </div>

        <div style={{ position: "relative", background: "#000", aspectRatio: "16 / 9", display: "grid", placeItems: "center" }}>
          {mode === "video" ? (
            <>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${peer.pic})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(18px) brightness(0.45)" }} />
              <div style={{ position: "relative", textAlign: "center", color: "#e6edf5" }}>
                <div style={{ width: 110, height: 110, borderRadius: "50%", margin: "0 auto 12px", backgroundImage: `url(${peer.pic})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 0 0 4px rgba(255,255,255,0.1)" }} />
                <div style={{ fontSize: 16 }}>{status === "dialing" ? "Connecting…" : "Connected"}</div>
              </div>
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                style={{ position: "absolute", right: 14, bottom: 14, width: 180, height: 110, borderRadius: 10, objectFit: "cover", background: "#1a2332", border: "2px solid rgba(255,255,255,0.15)" }}
              />
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#e6edf5" }}>
              <div style={{ width: 140, height: 140, borderRadius: "50%", margin: "0 auto 14px", backgroundImage: `url(${peer.pic})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 0 0 6px rgba(255,226,107,0.18)" }} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>{peer.name}</div>
              <div style={{ fontSize: 13, color: "#8a97ad", marginTop: 4 }}>{status === "dialing" ? "Calling…" : `Audio call · ${mm}:${ss}`}</div>
            </div>
          )}
          {error && (
            <div style={{ position: "absolute", left: 14, top: 14, padding: "8px 12px", background: "#3a1820", color: "#ffb3bf", borderRadius: 8, fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "16px 18px", borderTop: "1px solid #1f2735" }}>
          <button
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            style={ctrlBtn(muted ? "#3a1820" : "#1c2536", muted ? "#ffb3bf" : "#e6edf5")}
          >
            {muted ? "🔇" : "🎤"}
          </button>
          {mode === "video" && (
            <button
              onClick={toggleVideo}
              title={videoOff ? "Camera on" : "Camera off"}
              style={ctrlBtn(videoOff ? "#3a1820" : "#1c2536", videoOff ? "#ffb3bf" : "#e6edf5")}
            >
              {videoOff ? "📷✕" : "📹"}
            </button>
          )}
          <button onClick={end} title="End call" style={ctrlBtn("#c92f4b", "#fff")}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function ctrlBtn(bg: string, color: string): React.CSSProperties {
  return {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: bg,
    color,
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    display: "grid",
    placeItems: "center",
  };
}
