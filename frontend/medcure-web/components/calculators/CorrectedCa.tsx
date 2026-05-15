"use client";
import { useState } from "react";
import { correctedCalcium, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";

export default function CorrectedCa() {
  const [ca, setCa] = useState("8.0");
  const [alb, setAlb] = useState("3.0");
  const caN = parseFloat(ca);
  const albN = parseFloat(alb);
  const ok = caN > 0 && albN > 0;
  const c = ok ? correctedCalcium(caN, albN) : 0;
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Total Ca (mg/dL)</label><input value={ca} onChange={e => setCa(e.target.value)} type="number" step="0.01" /></div>
        <div className="cpoe-field"><label>Albumin (g/dL)</label><input value={alb} onChange={e => setAlb(e.target.value)} type="number" step="0.01" /></div>
      </div>
      <ResultBlock>
        <Row k="Corrected Ca (Payne)" v={ok ? `${round(c, 2)} mg/dL` : "—"} />
      </ResultBlock>
    </div>
  );
}
