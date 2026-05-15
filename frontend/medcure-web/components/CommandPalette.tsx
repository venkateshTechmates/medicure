"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PaletteAction } from "@/lib/types";

interface SearchResult {
  kind: "patient" | "order" | "lab" | "note";
  title: string;
  sub: string;
  url: string;
}

interface PaletteItem {
  id: string;
  label: string;
  sub?: string;
  kind: "nav" | "action" | "patient" | "order" | "lab" | "note";
  url: string;
  hint?: string;
}

const KIND_ICONS: Record<string, string> = {
  nav:     ">",
  action:  "*",
  patient: "P",
  order:   "O",
  lab:     "L",
  note:    "N",
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [actions, setActions] = useState<PaletteAction[]>([]);
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
    if (!open) { setQ(""); setResults([]); setActive(0); return; }
    setTimeout(() => inputRef.current?.focus(), 30);
    if (actions.length === 0) {
      api<PaletteAction[]>("/api/palette/actions").then(setActions).catch(() => setActions([]));
    }
  }, [open, actions.length]);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}&take=6`);
        setResults(r.results);
      } catch { setResults([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const items: PaletteItem[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const acts: PaletteItem[] = actions
      .filter(a => !needle || fuzzy(a.label.toLowerCase(), needle))
      .map(a => ({
        id: a.id, label: a.label, kind: a.kind, url: a.url ?? "#",
        sub: a.kind === "nav" ? "Navigate" : "Action", hint: a.hint ?? undefined,
      }));
    const cross: PaletteItem[] = results.map(r => ({
      id: r.url, label: r.title, sub: r.sub, kind: r.kind, url: r.url,
    }));
    return [...acts.slice(0, 12), ...cross];
  }, [actions, results, q]);

  useEffect(() => { setActive(0); }, [items.length]);

  function go(item: PaletteItem) {
    setOpen(false);
    if (item.url && item.url !== "#") router.push(item.url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
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
        style={{ width: 620, maxWidth: "92vw", padding: 0, boxShadow: "0 30px 80px -20px rgba(14,17,22,0.5)", overflow: "hidden" }}
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
            placeholder="Jump to a page, action, patient…"
            style={{ flex: 1, border: 0, outline: "none", fontSize: 15, fontFamily: "inherit", background: "transparent" }}
          />
          <kbd style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f4f6f9", border: "1px solid var(--line)" }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {items.length === 0 && (
            <div className="muted" style={{ padding: 24, fontSize: 12, textAlign: "center" }}>
              {q ? `No results for “${q}”` : "Type to filter actions, or 2+ chars to search."}
            </div>
          )}
          {items.map((r, i) => (
            <button
              key={`${r.id}-${i}`}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex", gap: 12, width: "100%", textAlign: "left",
                padding: "10px 16px", border: 0, borderBottom: "1px solid var(--line)",
                background: i === active ? "#fafbfc" : "transparent",
                cursor: "pointer", alignItems: "center"
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: "#f4f6f9",
                display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700
              }}>{KIND_ICONS[r.kind] ?? "•"}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</div>
                {r.sub && <div className="muted" style={{ fontSize: 11, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</div>}
              </span>
              {r.hint && <kbd style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f4f6f9", border: "1px solid var(--line)" }}>{r.hint}</kbd>}
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

// Subsequence fuzzy match: every character in needle appears in haystack in order.
function fuzzy(haystack: string, needle: string): boolean {
  let i = 0;
  for (const c of haystack) {
    if (c === needle[i]) i++;
    if (i >= needle.length) return true;
  }
  return i >= needle.length;
}
