"use client";
import { useEffect, useRef, useState } from "react";
import { startVideoCall, type TelehealthSession } from "@/lib/telehealth";

interface VideoCallProps {
  roomId: string;
  onEnd?: () => void;
}

export default function VideoCall({ roomId, onEnd }: VideoCallProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<TelehealthSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!localRef.current) return;
      try {
        const session = await startVideoCall(roomId, localRef.current, {
          onRemoteStream: (stream) => {
            if (remoteRef.current) {
              remoteRef.current.srcObject = stream;
              remoteRef.current.play().catch(() => {});
            }
            setConnected(true);
          },
          onPeerJoined: () => setConnected(true),
          onPeerLeft: () => setConnected(false),
          onError: (err) => setError(err instanceof Error ? err.message : String(err)),
        });
        if (cancelled) {
          await session.hangup();
          return;
        }
        sessionRef.current = session;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start video");
      }
    })();
    return () => {
      cancelled = true;
      sessionRef.current?.hangup();
      sessionRef.current = null;
    };
  }, [roomId]);

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    sessionRef.current?.setMicEnabled(next);
  }
  function toggleCam() {
    const next = !camOn;
    setCamOn(next);
    sessionRef.current?.setCamEnabled(next);
  }
  async function hangup() {
    await sessionRef.current?.hangup();
    sessionRef.current = null;
    onEnd?.();
  }

  return (
    <div className="card panel" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Telehealth visit</h2>
        <span style={{ fontSize: 12, fontWeight: 700, color: connected ? "var(--good)" : "var(--warn)" }}>
          {connected ? "● Connected" : "● Waiting for peer…"}
        </span>
      </div>

      <div style={{ position: "relative", background: "#0b0d12", borderRadius: 10, overflow: "hidden", aspectRatio: "16 / 9" }}>
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: connected ? "block" : "none" }}
        />
        {!connected && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#dfe3ea", fontSize: 14 }}>
            Connecting…
          </div>
        )}
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          style={{
            position: "absolute", bottom: 10, right: 10, width: "22%", minWidth: 120, maxWidth: 220,
            borderRadius: 8, border: "2px solid rgba(255,255,255,0.4)", background: "#000",
            aspectRatio: "16 / 9", objectFit: "cover"
          }}
        />
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--bad)", fontWeight: 700 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        <button className="btn" onClick={toggleMic}>{micOn ? "Mute" : "Unmute"}</button>
        <button className="btn" onClick={toggleCam}>{camOn ? "Camera off" : "Camera on"}</button>
        <button className="btn" style={{ background: "var(--bad)", color: "#fff", borderColor: "var(--bad)" }} onClick={hangup}>
          Hang up
        </button>
      </div>
    </div>
  );
}
