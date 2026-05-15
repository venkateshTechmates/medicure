"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { doseMgKg, doseMgM2, bsaDubois, resolveWeight, ibwKg, round } from "@/lib/calc";
import type { WeightSource } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";
import type { CalcContext } from "./CalculatorPanel";

type Mode = "mgkg" | "mgm2";

export default function DoseMgKg({ ctx }: { ctx?: CalcContext }) {
  const [mode, setMode] = useState<Mode>("mgkg");
  const [src, setSrc] = useState<WeightSource>("actual");
  const [mgPerUnit, setMgPerUnit] = useState("10");
  const [maxMg, setMaxMg] = useState("");
  const [w, setW] = useState(String(ctx?.weightKg ?? ""));
  const [h, setH] = useState(String(ctx?.heightCm ?? ""));
  const [sex, setSex] = useState<string>(ctx?.sex ?? "M");

  const wN = parseFloat(w);
  const hN = parseFloat(h);
  const mg = parseFloat(mgPerUnit);
  const cap = maxMg ? parseFloat(maxMg) : undefined;

  const usedWeight = wN > 0 && hN > 0 ? resolveWeight(src, wN, hN, sex) : wN;
  const ibw = hN > 0 ? ibwKg(hN, sex) : 0;
  const bsa = wN > 0 && hN > 0 ? bsaDubois(hN, wN) : 0;

  let total = 0;
  let capped = false;
  if (mode === "mgkg" && wN > 0 && mg > 0) {
    total = doseMgKg(mg, usedWeight, cap);
    capped = cap != null && mg * usedWeight > cap;
  } else if (mode === "mgm2" && bsa > 0 && mg > 0) {
    total = doseMgM2(mg, bsa);
    if (cap != null && total > cap) { total = cap; capped = true; }
  }

  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field">
          <label>Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
            <option value="mgkg">mg/kg</option>
            <option value="mgm2">mg/m²</option>
          </select>
        </div>
        <div className="cpoe-field">
          <label>{mode === "mgkg" ? "mg/kg" : "mg/m²"}</label>
          <input value={mgPerUnit} onChange={e => setMgPerUnit(e.target.value)} type="number" step="0.01" />
        </div>
        <div className="cpoe-field"><label>Max cap (mg, optional)</label><input value={maxMg} onChange={e => setMaxMg(e.target.value)} type="number" /></div>
      </div>
      <div className="field-row">
        <div className="cpoe-field"><label>Weight (actual, kg)</label><input value={w} onChange={e => setW(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Height (cm)</label><input value={h} onChange={e => setH(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Sex</label><select value={sex} onChange={e => setSex(e.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div>
      </div>
      {mode === "mgkg" && (
        <div className="cpoe-field">
          <label>Weight source</label>
          <select value={src} onChange={e => setSrc(e.target.value as WeightSource)}>
            <option value="actual">Actual body weight</option>
            <option value="ideal">Ideal body weight (Devine)</option>
            <option value="adjusted">Adjusted body weight (40%)</option>
          </select>
        </div>
      )}
      <ResultBlock>
        {mode === "mgkg" && <Row k="Dosing weight" v={wN > 0 && hN > 0 ? `${round(usedWeight, 1)} kg (${src})` : "—"} />}
        {mode === "mgkg" && hN > 0 && <Row k="Ideal body weight" v={`${round(ibw, 1)} kg`} />}
        {mode === "mgm2" && <Row k="BSA" v={bsa > 0 ? `${round(bsa, 2)} m²` : "—"} />}
        <Row k="Total dose" v={total > 0 ? `${round(total, 2)} mg` : "—"} pill={capped ? <StatusPill kind="warn">capped at max</StatusPill> : undefined} />
      </ResultBlock>
    </div>
  );
}
