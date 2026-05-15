"use client";

export type CalcContext = {
  patientId?: number;
  age?: number;
  ageYears?: number;
  sex?: "M" | "F";
  weightKg?: number;
  heightCm?: number;
  scrMgDl?: number;
  serumCreatinineMgDl?: number;
  sbp?: number;
  dbp?: number;
};

export default function CalculatorPanel({ children }: { children?: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
