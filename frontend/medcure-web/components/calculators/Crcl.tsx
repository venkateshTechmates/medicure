"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { crcl, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";
import type { CalcContext } from "./CalculatorPanel";

export default function Crcl({ ctx }: { ctx?: CalcContext }) {
  const [age, setAge] = useState(String(ctx?.age ?? ""));
  const [w, setW] = useState(String(ctx?.weightKg ?? ""));
  const [scr, setScr] = useState(String(ctx?.scrMgDl ?? ""));
  const [sex, setSex] = useState<string>(ctx?.sex ?? "M");
  const ageN = parseInt(age);
  const wN = parseFloat(w);
  const scrN = parseFloat(scr);
  const ok = ageN > 0 && wN > 0 && scrN > 0;
  const cl = ok ? crcl(ageN, wN, scrN, sex) : 0;
  const kind: "good" | "warn" | "bad" = cl >= 60 ? "good" : cl >= 30 ? "warn" : "bad";
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Age</label><input value={age} onChange={e => setAge(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Weight (kg)</label><input value={w} onChange={e => setW(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>SCr (mg/dL)</label><input value={scr} onChange={e => setScr(e.target.value)} type="number" step="0.01" /></div>
        <div className="cpoe-field"><label>Sex</label><select value={sex} onChange={e => setSex(e.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div>
      </div>
      <ResultBlock>
        <Row k="CrCl (Cockcroft-Gault)" v={ok ? `${round(cl, 1)} mL/min` : "—"} pill={ok && <StatusPill kind={kind}>{cl >= 60 ? "normal" : cl >= 30 ? "moderate" : "severe"}</StatusPill>} />
      </ResultBlock>
    </div>
  );
}
