"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { mapPressure, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";
import type { CalcContext } from "./CalculatorPanel";

export default function MapCalc({ ctx }: { ctx?: CalcContext }) {
  const [sbp, setSbp] = useState(String(ctx?.sbp ?? ""));
  const [dbp, setDbp] = useState(String(ctx?.dbp ?? ""));
  const s = parseFloat(sbp);
  const d = parseFloat(dbp);
  const ok = s > 0 && d > 0;
  const m = ok ? mapPressure(s, d) : 0;
  const kind: "good" | "warn" | "bad" = m >= 65 && m <= 100 ? "good" : m < 65 ? "bad" : "warn";
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>SBP (mmHg)</label><input value={sbp} onChange={e => setSbp(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>DBP (mmHg)</label><input value={dbp} onChange={e => setDbp(e.target.value)} type="number" /></div>
      </div>
      <ResultBlock>
        <Row k="MAP" v={ok ? `${round(m, 1)} mmHg` : "—"} pill={ok && <StatusPill kind={kind}>{m < 65 ? "hypotensive" : m > 100 ? "elevated" : "normal"}</StatusPill>} />
      </ResultBlock>
    </div>
  );
}
