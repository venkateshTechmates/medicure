"use client";
import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

interface Msg {
  id: string;
  role: Role;
  text: string;
  imageDataUrl?: string;
  audioUrl?: string;
  python?: string;
  pythonResult?: string;
  pythonRunning?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    loadPyodide?: (cfg?: { indexURL?: string }) => Promise<PyodideRuntime>;
    __medcurePyodide?: PyodideRuntime | Promise<PyodideRuntime>;
  }
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
}

interface PyodideRuntime {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8100";

async function askBackend(message: string, history: { role: "user" | "assistant"; text: string }[]): Promise<{ text: string; python?: string; source?: string } | null> {
  try {
    const r = await fetch(`${AI_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function loadPyodideRuntime(): Promise<PyodideRuntime> {
  if (window.__medcurePyodide) {
    const v = window.__medcurePyodide;
    return v instanceof Promise ? await v : v;
  }
  const promise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_CDN}pyodide.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(s);
      });
    }
    if (!window.loadPyodide) throw new Error("Pyodide global missing");
    const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    return py;
  })();
  window.__medcurePyodide = promise;
  const runtime = await promise;
  window.__medcurePyodide = runtime;
  return runtime;
}

function craftReply(input: string): { text: string; python?: string } {
  const q = input.trim();
  const lower = q.toLowerCase();

  if (/python|calculate|compute|bmi|gfr|dose|mg\/kg|creatinine/.test(lower)) {
    if (/bmi/.test(lower)) {
      return {
        text: "Here's a quick BMI calculator. Tweak the numbers and Run.",
        python: "weight_kg = 72\nheight_m = 1.78\nbmi = weight_kg / (height_m ** 2)\nprint(f\"BMI = {bmi:.1f}\")",
      };
    }
    if (/gfr|creatinine/.test(lower)) {
      return {
        text: "Cockcroft–Gault creatinine clearance — adjust inputs and Run.",
        python:
          "age = 64\nweight_kg = 78\nscr = 1.2  # mg/dL\nsex = 'M'\ncrcl = ((140 - age) * weight_kg) / (72 * scr)\nif sex == 'F':\n    crcl *= 0.85\nprint(f\"CrCl ≈ {crcl:.0f} mL/min\")",
      };
    }
    if (/dose|mg\/kg/.test(lower)) {
      return {
        text: "Weight-based dose calculator. Edit drug + mg/kg and Run.",
        python:
          "drug = 'Vancomycin'\nweight_kg = 78\nmg_per_kg = 15\nmax_mg = 2000\ndose = min(weight_kg * mg_per_kg, max_mg)\nprint(f\"{drug}: {dose:.0f} mg q12h (capped at {max_mg} mg)\")",
      };
    }
    return {
      text: "Drafted a Python snippet to run in-browser via Pyodide.",
      python: "import math\nx = 3\nprint(f\"sqrt({x}) = {math.sqrt(x):.4f}\")",
    };
  }

  if (/sepsis|news2/.test(lower)) {
    return { text: "NEWS2 ≥ 5 should trigger sepsis bundle review. The active alert in Messages is currently at 7 — initiate bundle within 1h." };
  }
  if (/discharge/.test(lower)) {
    return { text: "Typical discharge checklist: medication reconciliation, follow-up scheduled, patient/family teach-back, ride home confirmed, dietary review." };
  }
  if (/^(hi|hello|hey)\b/.test(lower)) {
    return { text: "Hi — I can answer clinical questions, run Python calculations (BMI, CrCl, weight-based doses), accept voice input, and read photos from your webcam." };
  }
  if (/help|what can/.test(lower)) {
    return {
      text:
        "I can:\n• Chat about clinical workflows\n• Run Python (try: 'compute BMI', 'CrCl', 'vanc dose')\n• Transcribe your voice (mic button)\n• Capture a webcam photo (camera button)",
    };
  }
  return { text: `I heard: "${q}". Try asking for a Python calc (BMI/CrCl/dose), or use the mic / camera buttons.` };
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hi — I'm the MedCure assistant. I can chat, run Python in your browser, listen to your voice, and read a webcam snapshot. Try \"compute BMI\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => () => {
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    recogRef.current?.stop();
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }

  async function send() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    const userMsg: Msg = { id: uid(), role: "user", text, imageDataUrl: pendingImage ?? undefined };
    setInput("");
    setPendingImage(null);
    setMsgs(m => [...m, userMsg]);

    const history = msgs.map(m => ({ role: m.role, text: m.text }));
    const remote = await askBackend(text || "describe this image", history);
    const reply = remote ?? craftReply(text || (pendingImage ? "describe this image" : ""));
    const assistant: Msg = { id: uid(), role: "assistant", text: reply.text, python: reply.python };
    setMsgs(m => [...m, assistant]);
    if (!reply.python) speak(reply.text);
  }

  function toggleListen() {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setMsgs(m => [...m, { id: uid(), role: "assistant", text: "Voice input isn't supported in this browser. Try Chrome or Edge." }]);
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = ev => {
      const transcript = Array.from(ev.results).map(r => r[0]?.transcript ?? "").join(" ");
      setInput(prev => (prev ? prev + " " : "") + transcript);
    };
    rec.onend = () => { setListening(false); recogRef.current = null; };
    rec.onerror = () => { setListening(false); recogRef.current = null; };
    recogRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  async function openCamera() {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
      camStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      setCameraOpen(false);
      setMsgs(m => [...m, { id: uid(), role: "assistant", text: `Camera error: ${e instanceof Error ? e.message : "unknown"}` }]);
    }
  }

  function closeCamera() {
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    camStreamRef.current = null;
    setCameraOpen(false);
  }

  function captureFrame() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 480;
    canvas.height = v.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    setPendingImage(canvas.toDataURL("image/jpeg", 0.85));
    closeCamera();
  }

  async function runPython(id: string) {
    setMsgs(m => m.map(x => x.id === id ? { ...x, pythonRunning: true, pythonResult: undefined } : x));
    const target = msgs.find(x => x.id === id);
    const code = target?.python ?? "";
    let out = "";
    try {
      const py = await loadPyodideRuntime();
      py.setStdout({ batched: (s: string) => { out += s + "\n"; } });
      py.setStderr({ batched: (s: string) => { out += "[err] " + s + "\n"; } });
      const result = await py.runPythonAsync(code);
      if (out.trim() === "" && result !== undefined && result !== null) out = String(result);
    } catch (e) {
      out = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
    setMsgs(m => m.map(x => x.id === id ? { ...x, pythonRunning: false, pythonResult: out.trim() || "(no output)" } : x));
  }

  function updatePythonCode(id: string, code: string) {
    setMsgs(m => m.map(x => x.id === id ? { ...x, python: code } : x));
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          style={{
            position: "fixed", right: 22, bottom: 22, zIndex: 800,
            width: 56, height: 56, borderRadius: "50%",
            background: "#ffe26b", color: "#0e1116", border: "none", cursor: "pointer",
            boxShadow: "0 12px 30px rgba(14,17,22,0.25)", fontSize: 22, fontWeight: 700,
          }}
        >
          AI
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed", right: 22, bottom: 22, zIndex: 800,
            width: 380, maxWidth: "94vw", height: 560, maxHeight: "85vh",
            display: "flex", flexDirection: "column",
            background: "#fff", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(14,17,22,0.28)", border: "1px solid #e5e9f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #eef1f6", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ffe26b", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>AI</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>MedCure Assistant</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Voice · Vision · Python</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }} aria-label="Close">✕</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#fbfcfe" }}>
            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.role === "user" ? "#0e1116" : "#fff",
                  color: m.role === "user" ? "#fff" : "#0e1116",
                  border: m.role === "user" ? "none" : "1px solid #e5e9f0",
                  fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap",
                }}>
                  {m.imageDataUrl && (
                    <img src={m.imageDataUrl} alt="captured" style={{ width: "100%", borderRadius: 8, marginBottom: m.text ? 6 : 0 }} />
                  )}
                  {m.text}
                  {m.python !== undefined && (
                    <div style={{ marginTop: 8, border: "1px solid #e5e9f0", borderRadius: 8, overflow: "hidden", background: "#0e1116" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#1c2536", color: "#cdd6e3", fontSize: 11 }}>
                        <span>python</span>
                        <button
                          onClick={() => runPython(m.id)}
                          disabled={m.pythonRunning}
                          style={{ background: "#ffe26b", color: "#0e1116", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        >
                          {m.pythonRunning ? "Running…" : "▶ Run"}
                        </button>
                      </div>
                      <textarea
                        value={m.python}
                        onChange={e => updatePythonCode(m.id, e.target.value)}
                        spellCheck={false}
                        style={{
                          width: "100%", minHeight: 70, border: "none", outline: "none",
                          background: "#0e1116", color: "#e6edf5",
                          fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12,
                          padding: 10, resize: "vertical",
                        }}
                      />
                      {m.pythonResult !== undefined && (
                        <div style={{ borderTop: "1px solid #1c2536", padding: 10, background: "#0a0d12", color: "#9ee6a8", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                          {m.pythonResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pendingImage && (
            <div style={{ padding: "8px 12px", borderTop: "1px solid #eef1f6", display: "flex", alignItems: "center", gap: 10, background: "#fff" }}>
              <img src={pendingImage} alt="pending" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6 }} />
              <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>Image attached</span>
              <button onClick={() => setPendingImage(null)} style={{ background: "transparent", border: "none", color: "#c92f4b", cursor: "pointer", fontSize: 12 }}>Remove</button>
            </div>
          )}

          <div style={{ borderTop: "1px solid #eef1f6", padding: 10, display: "flex", gap: 6, alignItems: "center", background: "#fff" }}>
            <button onClick={toggleListen} title={listening ? "Stop listening" : "Voice input"} style={iconBtn(listening ? "#ffe1e6" : "#f4f6f9", listening ? "#c92f4b" : "#0e1116")}>
              {listening ? "●" : "🎤"}
            </button>
            <button onClick={openCamera} title="Camera" style={iconBtn("#f4f6f9", "#0e1116")}>📷</button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={listening ? "Listening…" : "Ask anything — try 'compute BMI'"}
              style={{ flex: 1, border: "1px solid #e5e9f0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none" }}
            />
            <button onClick={send} disabled={!input.trim() && !pendingImage} style={{ background: "#ffe26b", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#0e1116" }}>
              Send
            </button>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div onClick={closeCamera} style={{ position: "fixed", inset: 0, background: "rgba(8,12,18,0.82)", zIndex: 1100, display: "grid", placeItems: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#101521", borderRadius: 14, padding: 16, color: "#e6edf5" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: 480, maxWidth: "92vw", borderRadius: 10, background: "#000" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
              <button onClick={closeCamera} style={{ background: "#1c2536", color: "#e6edf5", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button onClick={captureFrame} style={{ background: "#ffe26b", color: "#0e1116", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Capture</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function iconBtn(bg: string, color: string): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: 10, background: bg, color,
    border: "none", cursor: "pointer", fontSize: 15,
    display: "grid", placeItems: "center",
  };
}
