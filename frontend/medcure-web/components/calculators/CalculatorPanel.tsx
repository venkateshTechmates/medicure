"use client";
import { useState } from "react";
import BmiBsa from "./BmiBsa";
import Egfr from "./Egfr";
import Crcl from "./Crcl";
import DoseMgKg from "./DoseMgKg";
import DripRate from "./DripRate";
import MapCalc from "./MapCalc";
import AnionGap from "./AnionGap";
import CorrectedCa from "./CorrectedCa";
import CorrectedNa from "./CorrectedNa";

export type CalcContext = {
  patientId?: number;
  age?: number;
  ageYears?: number;
  sex?: string;
  weightKg?: number;
  heightCm?: number;
  scrMgDl?: number;
  serumCreatinineMgDl?: number;
  sbp?: number;
  dbp?: number;
};

interface CalcDef {
  id: string;
  label: string;
  group: string;
  render: (ctx?: CalcContext) => React.ReactNode;
}

const CALCS: CalcDef[] = [
  { id: "bmi",   label: "BMI / BSA",                group: "Anthropometric", render: c => <BmiBsa ctx={c} /> },
  { id: "egfr",  label: "eGFR (CKD-EPI 2021)",      group: "Renal",          render: c => <Egfr ctx={c} /> },
  { id: "crcl",  label: "CrCl (Cockcroft-Gault)",   group: "Renal",          render: c => <Crcl ctx={c} /> },
  { id: "dose",  label: "Drug dose (mg/kg, mg/m²)", group: "Dosing",         render: c => <DoseMgKg ctx={c} /> },
  { id: "drip",  label: "IV drip / infusion",       group: "Dosing",         render: c => <DripRate ctx={c} /> },
  { id: "map",   label: "MAP",                      group: "Hemodynamic",    render: c => <MapCalc ctx={c} /> },
  { id: "ag",    label: "Anion gap",                group: "Lytes",          render: () => <AnionGap /> },
  { id: "ca",    label: "Corrected calcium",        group: "Lytes",          render: () => <CorrectedCa /> },
  { id: "na",    label: "Corrected sodium",         group: "Lytes",          render: () => <CorrectedNa /> },
];

function normalize(ctx?: CalcContext): CalcContext | undefined {
  if (!ctx) return ctx;
  return {
    ...ctx,
    age: ctx.age ?? ctx.ageYears,
    scrMgDl: ctx.scrMgDl ?? ctx.serumCreatinineMgDl,
  };
}

export default function CalculatorPanel({ ctx, initial }: { ctx?: CalcContext; initial?: string }) {
  const [active, setActive] = useState(initial ?? CALCS[0].id);
  const def = CALCS.find(c => c.id === active) ?? CALCS[0];
  const groups = Array.from(new Set(CALCS.map(c => c.group)));
  const merged = normalize(ctx);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18 }}>
      <div className="side-tabs" style={{ position: "static" }}>
        {groups.map(g => (
          <div key={g}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: ".05em", padding: "10px 12px 4px" }}>{g}</div>
            {CALCS.filter(c => c.group === g).map(c => (
              <button key={c.id} className={active === c.id ? "active" : ""} onClick={() => setActive(c.id)}>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div>
        <h2 style={{ marginTop: 0 }}>{def.label}</h2>
        <div className="sub" style={{ marginBottom: 12 }}>Live calculation · values are not auto-saved to chart</div>
        {def.render(merged)}
      </div>
    </div>
  );
}
