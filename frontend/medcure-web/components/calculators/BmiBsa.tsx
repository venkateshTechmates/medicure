"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { bmi, bsaDubois, bmiCategory, round } from "@/lib/calc";
import type { CalcContext } from "./CalculatorPanel";

export default function BmiBsa({ ctx }: { ctx?: CalcContext }) {
  const [h, setH] = useState(String(ctx?.heightCm ?? ""));
  const [w, setW] = useState(String(ctx?.weightKg ?? ""));
  const hN = parseFloat(h);
  const wN = parseFloat(w);
  const ok = hN > 0 && wN > 0;
  const b = ok ? bmi(hN, wN) : 0;
  const bsa = ok ? bsaDubois(hN, wN) : 0;
  const cat = ok ? bmiCategory(b) : null;
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Height (cm)</label><input value={h} onChange={e => setH(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Weight (kg)</label><input value={w} onChange={e => setW(e.target.value)} type="number" /></div>
      </div>
      <ResultBlock>
        <Row k="BMI"  v={ok ? `${round(b, 1)} kg/m²` : "—"} pill={cat && <StatusPill kind={cat.kind}>{cat.label}</StatusPill>} />
        <Row k="BSA (DuBois)" v={ok ? `${round(bsa, 2)} m²` : "—"} />
      </ResultBlock>
    </div>
  );
}

export function ResultBlock({ children }: { children: React.ReactNode }) {
  return <div className="info-block" style={{ marginTop: 14 }}>{children}</div>;
}
export function Row({ k, v, pill }: { k: string; v: string; pill?: React.ReactNode }) {
  return (
    <div className="info-row">
      <span className="k">{k}</span>
      <span className="v">{v} {pill}</span>
    </div>
  );
}
