"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { RecentPatient } from "@/lib/types";

interface SearchResult {
  kind: "patient" | "order" | "lab" | "note";
  title: string;
  sub: string;
  url: string;
}

const KIND_ICONS: Record<string, string> = {
  patient: "P",
  order:   "O",
  lab:     "L",
  note:    "N",
};

export default function UniversalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<RecentPatient[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on "/" keypress (when no input is focused).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (t && (t as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click-outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    api<RecentPatient[]>("/api/recents").then(setRecents).catch(() => setRecents([]));
  }, [open]);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}&take=6`);
        setResults(r.results);
        setActive(0);
      } catch { setResults([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const flat: { url: string; label: string }[] = [
    ...recents.map(r => ({ url: `/patients/${r.mrn}`, label: r.fullName })),
    ...results.map(r => ({ url: r.url, label: r.title })),
  ];

  function go(url: string) {
    setOpen(false);
    setQ("");
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && flat[active]) { e.preventDefault(); go(flat[active].url); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  const grouped = {
    patients: results.filter(r => r.kind === "patient"),
    orders:   results.filter(r => r.kind === "order"),
    labs:     results.filter(r => r.kind === "lab"),
    notes:    results.filter(r => r.kind === "note"),
  };

  let cursor = 0;
  function activeFor(i: number) { const r = cursor === i; return r; }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="searchbox" style={{ width: 280 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          ref={inputRef}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Search patients, MRN, DOB, phone…"
        />
        <span style={{ color: "var(--ink-mute)", fontSize: 10, fontWeight: 700 }}>/</span>
      </div>
      {open && (
        <div className="card" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 420, maxWidth: "92vw", padding: 0, zIndex: 900,
          boxShadow: "0 20px 60px -16px rgba(14,17,22,0.4)", overflow: "hidden",
        }}>
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {q.length < 2 && (
              <Section title="Recent patients">
                {recents.length === 0 && <Empty>No recent patients.</Empty>}
                {recents.slice(0, 5).map((r) => {
                  const idx = cursor++;
                  return (
                    <Row key={`rec-${r.id}`} kind="recent" title={r.fullName}
                         sub={`MRN ${r.mrn} · ${r.ward}/${r.bed || "—"}`}
                         active={active === idx} onMouseEnter={() => setActive(idx)}
                         onClick={() => go(`/patients/${r.mrn}`)} />
                  );
                })}
              </Section>
            )}
            {q.length >= 2 && (
              <>
                {grouped.patients.length > 0 && (
                  <Section title="Patients">
                    {grouped.patients.map(r => {
                      const idx = recents.length + results.indexOf(r);
                      return <Row key={`p-${r.url}`} kind="patient" title={r.title} sub={r.sub}
                                  active={active === idx} onMouseEnter={() => setActive(idx)}
                                  onClick={() => go(r.url)} />;
                    })}
                  </Section>
                )}
                {grouped.orders.length > 0 && (
                  <Section title="Orders">
                    {grouped.orders.map(r => {
                      const idx = recents.length + results.indexOf(r);
                      return <Row key={`o-${r.url}`} kind="order" title={r.title} sub={r.sub}
                                  active={active === idx} onMouseEnter={() => setActive(idx)}
                                  onClick={() => go(r.url)} />;
                    })}
                  </Section>
                )}
                {grouped.labs.length > 0 && (
                  <Section title="Labs">
                    {grouped.labs.map(r => {
                      const idx = recents.length + results.indexOf(r);
                      return <Row key={`l-${r.url}`} kind="lab" title={r.title} sub={r.sub}
                                  active={active === idx} onMouseEnter={() => setActive(idx)}
                                  onClick={() => go(r.url)} />;
                    })}
                  </Section>
                )}
                {grouped.notes.length > 0 && (
                  <Section title="Notes">
                    {grouped.notes.map(r => {
                      const idx = recents.length + results.indexOf(r);
                      return <Row key={`n-${r.url}`} kind="note" title={r.title} sub={r.sub}
                                  active={active === idx} onMouseEnter={() => setActive(idx)}
                                  onClick={() => go(r.url)} />;
                    })}
                  </Section>
                )}
                {results.length === 0 && <Empty>No results for &ldquo;{q}&rdquo;</Empty>}
              </>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 12px",
                        fontSize: 10, color: "var(--ink-mute)", borderTop: "1px solid var(--line)" }}>
            <span>↑↓ navigate · ↵ open · esc close</span>
            <span>Press ⌘K for command palette</span>
          </div>
        </div>
      )}
    </div>
  );

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: 0.06, color: "var(--ink-mute)" }}>{title}</div>
        {children}
      </div>
    );
  }
  function Empty({ children }: { children: React.ReactNode }) {
    return <div className="muted" style={{ padding: 16, fontSize: 12, textAlign: "center" }}>{children}</div>;
  }
  function Row({ kind, title, sub, active, onClick, onMouseEnter }:
    { kind: string; title: string; sub: string; active: boolean; onClick: () => void; onMouseEnter: () => void }) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        style={{
          display: "flex", gap: 10, width: "100%", textAlign: "left",
          padding: "8px 14px", border: 0, borderBottom: "1px solid var(--line)",
          background: active ? "#fafbfc" : "transparent", cursor: "pointer", alignItems: "center"
        }}
      >
        <span style={{ width: 20, height: 20, borderRadius: 6, background: "#f4f6f9",
                       display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>
          {KIND_ICONS[kind] ?? "•"}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
        </span>
      </button>
    );
  }
}
