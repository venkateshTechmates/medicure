"use client";
import { useState } from "react";
import CalculatorPanel from "./calculators/CalculatorPanel";
import type { CalcContext } from "./calculators/CalculatorPanel";

export default function CalculatorButton({ context, label = "Calculators", initial }: { context?: CalcContext; label?: string; initial?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)} title="Clinical calculators">
        <span aria-hidden style={{ marginRight: 4 }}>∑</span>{label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,.55)", display: "grid", placeItems: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: "min(960px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Clinical calculators</div>
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
            <CalculatorPanel ctx={context} initial={initial} />
          </div>
        </div>
      )}
    </>
  );
}
