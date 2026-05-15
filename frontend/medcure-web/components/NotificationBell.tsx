"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { onNotification, startRealtime, type NotificationPayload } from "@/lib/realtime";

interface NotifItem {
  id: number;
  kind: string;
  title: string;
  body: string;
  severity: "info" | "warn" | "bad" | "good";
  url: string;
  createdAt: string;
  readAt?: string | null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [total, setTotal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const r = await api<{ total: number; items: NotifItem[] }>("/api/notifications?take=20");
      setItems(r.items);
      setTotal(r.items.filter(i => !i.readAt).length);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    refresh();
    startRealtime();
    const unsub = onNotification((n: NotificationPayload) => {
      setItems(prev => [{ ...n, readAt: null } as NotifItem, ...prev].slice(0, 50));
      setTotal(t => t + 1);
    });
    function clickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", clickAway);
    return () => { unsub(); document.removeEventListener("mousedown", clickAway); };
  }, []);

  async function markOne(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, readAt: new Date().toISOString() } : i));
    setTotal(t => Math.max(0, t - 1));
    await api(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }
  async function markAll() {
    setItems(prev => prev.map(i => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setTotal(0);
    await api("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="icon-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#fafbfc",
          border: "1px solid var(--line)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {total > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "var(--bad)", color: "#fff",
            fontSize: 10, fontWeight: 800, lineHeight: 1,
            padding: "3px 5px", borderRadius: 999, minWidth: 16, textAlign: "center"
          }}>{total > 99 ? "99+" : total}</span>
        )}
      </button>

      {open && (
        <div className="card" style={{
          position: "absolute", right: 0, top: 44, width: 360, maxHeight: 480, overflowY: "auto",
          padding: 0, boxShadow: "0 20px 50px -10px rgba(14,17,22,0.25)", zIndex: 999
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 700 }}>Notifications</div>
            {total > 0 && <button className="btn" style={{ fontSize: 11, padding: "4px 8px" }} onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 && <div className="muted" style={{ padding: 20, fontSize: 12, textAlign: "center" }}>You&apos;re all caught up.</div>}
          {items.map(n => (
            <Link key={n.id} href={n.url || "#"} onClick={() => markOne(n.id)}
              style={{
                display: "block", padding: "12px 14px",
                borderBottom: "1px solid var(--line)",
                background: n.readAt ? "transparent" : "#fffbe6",
                textDecoration: "none", color: "var(--ink)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className={`pill ${n.severity === "bad" ? "bad" : n.severity === "warn" ? "warn" : n.severity === "good" ? "good" : "info"}`} style={{ fontSize: 10 }}>
                  <span className="pdot" />{n.kind}
                </span>
                <span className="muted" style={{ fontSize: 10 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{n.body}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
