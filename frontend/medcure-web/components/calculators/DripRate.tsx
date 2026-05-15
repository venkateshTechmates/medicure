"use client";
import { useState } from "react";
import { dripMlPerHr, dripMcgPerKgPerMin, mgHrFromMlHr, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";
import type { CalcContext } from "./CalculatorPanel";

type Direction = "rate2vol" | "vol2rate";

export default function DripRate({ ctx }: { ctx?: CalcContext }) {
  const [dir, setDir] = useState<Direction>("rate2vol");
  const [w, setW] = useState(String(ctx?.weightKg ?? ""));
  const [conc, setConc] = useState("4");
  const [val, setVal] = useState("5");

  const wN = parseFloat(w);
  const concN = parseFloat(conc);
  const valN = parseFloat(val);
  const ok = wN > 0 && concN > 0 && valN > 0;

  let mlHr = 0, mcg = 0, mgHr = 0;
  if (ok) {
    if (dir === "rate2vol") {
      mcg = valN;
      mlHr = dripMlPerHr(valN, wN, concN);
    } else {
      mlHr = valN;
      mcg = dripMcgPerKgPerMin(valN, wN, concN);
    }
    mgHr = mgHrFromMlHr(mlHr, concN);
  }

  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field">
          <label>Direction</label>
          <select value={dir} onChange={e => setDir(e.target.value as Direction)}>
            <option value="rate2vol">mcg/kg/min → mL/hr</option>
            <option value="vol2rate">mL/hr → mcg/kg/min</option>
          </select>
        </div>
        <div className="cpoe-field"><label>Weight (kg)</label><input value={w} onChange={e => setW(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Concentration (mg/mL)</label><input value={conc} onChange={e => setConc(e.target.value)} type="number" step="0.01" /></div>
        <div className="cpoe-field">
          <label>{dir === "rate2vol" ? "mcg/kg/min" : "mL/hr"}</label>
          <input value={val} onChange={e => setVal(e.target.value)} type="number" step="0.01" />
        </div>
      </div>
      <ResultBlock>
        <Row k="mcg/kg/min" v={ok ? `${round(mcg, 2)}` : "—"} />
        <Row k="mL/hr"      v={ok ? `${round(mlHr, 2)}` : "—"} />
        <Row k="mg/hr"      v={ok ? `${round(mgHr, 2)}` : "—"} />
      </ResultBlock>
    </div>
  );
}
