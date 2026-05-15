"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SearchResult {
  kind: "patient" | "order" | "lab" | "note";
  title: string;
  sub: string;
  url: string;
}

const KIND_ICONS: Record<string, string> = {
  patient: "👤",
  order:   "💊",
  lab:     "🧪",
  note:    "📝",
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl-K toggles
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQ(""); setResults([]); setActive(0); }
  }, [open]);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}&take=8`);
        setResults(r.results);
        setActive(0);
      } catch { setResults([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  function go(r: SearchResult) {
    setOpen(false);
    router.push(r.url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
  }

  if (!open) return null;
  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.55)", zIndex: 1000, display: "grid", placeItems: "start center", paddingTop: 80 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: 600, maxWidth: "92vw", padding: 0, boxShadow: "0 30px 80px -20px rgba(14,17,22,0.5)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search patients, orders, labs, notes…"
            style={{ flex: 1, border: 0, outline: "none", fontSize: 15, fontFamily: "inherit", background: "transparent" }}
          />
          <kbd style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f4f6f9", border: "1px solid var(--line)" }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {q.length < 2 && <div className="muted" style={{ padding: 24, fontSize: 12, textAlign: "center" }}>Type at least 2 characters to search…</div>}
          {q.length >= 2 && results.length === 0 && <div className="muted" style={{ padding: 24, fontSize: 12, textAlign: "center" }}>No results for &ldquo;{q}&rdquo;</div>}
          {results.map((r, i) => (
            <button
              key={`${r.url}-${i}`}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex", gap: 12, width: "100%", textAlign: "left",
                padding: "12px 16px", border: 0, borderBottom: "1px solid var(--line)",
                background: i === active ? "#fafbfc" : "transparent",
                cursor: "pointer", alignItems: "center"
              }}
            >
              <span style={{ fontSize: 18 }}>{KIND_ICONS[r.kind] ?? "•"}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</div>
              </span>
              <span className="muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.05 }}>{r.kind}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, padding: "10px 16px", fontSize: 10, color: "var(--ink-mute)", borderTop: "1px solid var(--line)" }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
