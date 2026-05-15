"use client";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import { anionGap, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";

export default function AnionGap() {
  const [na, setNa] = useState("140");
  const [cl, setCl] = useState("104");
  const [hco3, setHco3] = useState("24");
  const [k, setK] = useState("");
  const naN = parseFloat(na);
  const clN = parseFloat(cl);
  const hN = parseFloat(hco3);
  const kN = k ? parseFloat(k) : undefined;
  const ok = naN > 0 && clN > 0 && hN > 0;
  const g = ok ? anionGap(naN, clN, hN, kN) : 0;
  const kind: "good" | "warn" | "bad" = g >= 8 && g <= 12 ? "good" : g > 12 ? "warn" : "info";
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Na (mEq/L)</label><input value={na} onChange={e => setNa(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Cl (mEq/L)</label><input value={cl} onChange={e => setCl(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>HCO₃ (mEq/L)</label><input value={hco3} onChange={e => setHco3(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>K (optional)</label><input value={k} onChange={e => setK(e.target.value)} type="number" /></div>
      </div>
      <ResultBlock>
        <Row k="Anion gap" v={ok ? `${round(g, 1)} mEq/L` : "—"} pill={ok && <StatusPill kind={kind}>{g > 12 ? "elevated" : "normal"}</StatusPill>} />
      </ResultBlock>
    </div>
  );
}
