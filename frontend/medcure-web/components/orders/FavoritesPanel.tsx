"use client";
import type { FavoriteOrder, FavoritePanel } from "@/lib/types";

// PRD §14.C — sidebar that lists a clinician's favorite single orders + named panels.
// "Add" inserts a favorite into the CPOE cart; "Apply" posts the whole panel to the server.

interface Props {
  orders: FavoriteOrder[];
  panels: FavoritePanel[];
  onAddOrder: (fav: FavoriteOrder) => void;
  onApplyPanel: (panel: FavoritePanel) => void;
  onDeleteOrder?: (id: number) => void;
  onDeletePanel?: (id: number) => void;
  busyPanelId?: number | null;
}

export default function FavoritesPanel({
  orders,
  panels,
  onAddOrder,
  onApplyPanel,
  onDeleteOrder,
  onDeletePanel,
  busyPanelId,
}: Props) {
  return (
    <div className="card panel" style={{ padding: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden>⭐</span> Favorites
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 10 }}>
        Your saved orders and panels. Re-use them on any patient.
      </div>

      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-mute)", margin: "8px 0 6px" }}>
        Single orders
      </div>
      {orders.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--ink-mute)", padding: "6px 0" }}>None yet — save one with the star button.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {orders.map(f => (
            <div
              key={f.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: 8, border: "1px solid var(--line)", borderRadius: 8, background: "#fff"
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>
                  {f.orderType} · {[f.dose, f.route, f.frequency].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <button className="btn" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => onAddOrder(f)}>
                + Add
              </button>
              {onDeleteOrder && (
                <button
                  className="btn"
                  style={{ fontSize: 10, padding: "4px 6px" }}
                  onClick={() => onDeleteOrder(f.id)}
                  aria-label={`Remove favorite ${f.name}`}
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-mute)", margin: "14px 0 6px" }}>
        Order panels
      </div>
      {panels.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--ink-mute)", padding: "6px 0" }}>None yet — create one to bundle related orders.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {panels.map(p => {
            const busy = busyPanelId === p.id;
            return (
              <div
                key={p.id}
                style={{
                  padding: 10, border: "1px solid var(--line)", borderRadius: 8, background: "#fff"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>
                      {p.items.length} item{p.items.length === 1 ? "" : "s"}
                      {p.description ? ` · ${p.description}` : ""}
                    </div>
                  </div>
                  <button
                    className="btn primary"
                    style={{ fontSize: 10, padding: "4px 8px" }}
                    disabled={busy}
                    onClick={() => onApplyPanel(p)}
                  >
                    {busy ? "Applying…" : "Apply"}
                  </button>
                  {onDeletePanel && (
                    <button
                      className="btn"
                      style={{ fontSize: 10, padding: "4px 6px" }}
                      onClick={() => onDeletePanel(p.id)}
                      aria-label={`Remove panel ${p.name}`}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {p.items.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "var(--ink-mute)" }}>
                    {p.items.slice(0, 3).map(i => i.name).join(" · ")}
                    {p.items.length > 3 ? ` · +${p.items.length - 3} more` : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
