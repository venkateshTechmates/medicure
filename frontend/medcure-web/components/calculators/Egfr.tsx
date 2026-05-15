"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { egfr2021, ckdStage, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";
import type { CalcContext } from "./CalculatorPanel";

export default function Egfr({ ctx }: { ctx?: CalcContext }) {
  const [scr, setScr] = useState(String(ctx?.scrMgDl ?? ""));
  const [age, setAge] = useState(String(ctx?.age ?? ""));
  const [sex, setSex] = useState<string>(ctx?.sex ?? "M");
  const scrN = parseFloat(scr);
  const ageN = parseInt(age);
  const ok = scrN > 0 && ageN > 0;
  const e = ok ? egfr2021(scrN, ageN, sex) : 0;
  const stage = ok ? ckdStage(e) : null;
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Serum creatinine (mg/dL)</label><input value={scr} onChange={ev => setScr(ev.target.value)} type="number" step="0.01" /></div>
        <div className="cpoe-field"><label>Age (years)</label><input value={age} onChange={ev => setAge(ev.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Sex</label><select value={sex} onChange={ev => setSex(ev.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div>
      </div>
      <ResultBlock>
        <Row k="eGFR (CKD-EPI 2021)" v={ok ? `${round(e, 1)} mL/min/1.73m²` : "—"} pill={stage && <StatusPill kind={stage.kind}>{stage.label}</StatusPill>} />
      </ResultBlock>
    </div>
  );
}
