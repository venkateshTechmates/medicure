"use client";
import { useState } from "react";
import { correctedSodium, round } from "@/lib/calc";
import { Row, ResultBlock } from "./BmiBsa";

export default function CorrectedNa() {
  const [na, setNa] = useState("135");
  const [glu, setGlu] = useState("250");
  const naN = parseFloat(na);
  const gN = parseFloat(glu);
  const ok = naN > 0 && gN > 0;
  const c = ok ? correctedSodium(naN, gN) : 0;
  return (
    <div>
      <div className="field-row">
        <div className="cpoe-field"><label>Measured Na (mEq/L)</label><input value={na} onChange={e => setNa(e.target.value)} type="number" /></div>
        <div className="cpoe-field"><label>Glucose (mg/dL)</label><input value={glu} onChange={e => setGlu(e.target.value)} type="number" /></div>
      </div>
      <ResultBlock>
        <Row k="Corrected Na (Katz)" v={ok ? `${round(c, 1)} mEq/L` : "—"} />
      </ResultBlock>
    </div>
  );
}
