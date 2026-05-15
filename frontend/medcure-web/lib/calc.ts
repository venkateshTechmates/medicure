export type Sex = "M" | "F" | "male" | "female" | string;

const isFemale = (s: Sex) => /^f/i.test(String(s));

export function bmi(heightCm: number, weightKg: number): number {
  const hM = heightCm / 100;
  return weightKg / (hM * hM);
}

export function bsaDubois(heightCm: number, weightKg: number): number {
  return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
}

export function bmiCategory(b: number): { label: string; kind: "good" | "warn" | "bad" | "info" } {
  if (b < 18.5) return { label: "Underweight", kind: "warn" };
  if (b < 25)   return { label: "Normal",      kind: "good" };
  if (b < 30)   return { label: "Overweight",  kind: "warn" };
  if (b < 35)   return { label: "Obese I",     kind: "bad" };
  if (b < 40)   return { label: "Obese II",    kind: "bad" };
  return         { label: "Obese III",   kind: "bad" };
}

export function egfr2021(scrMgDl: number, ageYears: number, sex: Sex): number {
  const female = isFemale(sex);
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = scrMgDl / kappa;
  return 142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.200) *
    Math.pow(0.9938, ageYears) *
    (female ? 1.012 : 1);
}

export function ckdStage(egfr: number): { label: string; kind: "good" | "warn" | "bad" } {
  if (egfr >= 90) return { label: "G1 normal",        kind: "good" };
  if (egfr >= 60) return { label: "G2 mild",          kind: "good" };
  if (egfr >= 45) return { label: "G3a mild-mod",     kind: "warn" };
  if (egfr >= 30) return { label: "G3b mod-severe",   kind: "warn" };
  if (egfr >= 15) return { label: "G4 severe",        kind: "bad" };
  return            { label: "G5 kidney failure", kind: "bad" };
}

export function crcl(age: number, weightKg: number, scrMgDl: number, sex: Sex): number {
  const v = ((140 - age) * weightKg) / (72 * scrMgDl);
  return isFemale(sex) ? v * 0.85 : v;
}

export function doseMgKg(mgPerKg: number, weightKg: number, maxMg?: number): number {
  const total = mgPerKg * weightKg;
  return maxMg != null && total > maxMg ? maxMg : total;
}

export function doseMgM2(mgPerM2: number, bsa: number): number {
  return mgPerM2 * bsa;
}

export function dripMlPerHr(mcgPerKgPerMin: number, weightKg: number, concentrationMgPerMl: number): number {
  return (mcgPerKgPerMin * weightKg * 60) / (concentrationMgPerMl * 1000);
}

export function dripMcgPerKgPerMin(mlPerHr: number, weightKg: number, concentrationMgPerMl: number): number {
  return (mlPerHr * concentrationMgPerMl * 1000) / (weightKg * 60);
}

export function mgHrFromMlHr(mlPerHr: number, concentrationMgPerMl: number): number {
  return mlPerHr * concentrationMgPerMl;
}

export function mapPressure(sbp: number, dbp: number): number {
  return (sbp + 2 * dbp) / 3;
}

export function anionGap(na: number, cl: number, hco3: number, k?: number): number {
  return na - (cl + hco3) + (k ?? 0);
}

export function correctedCalcium(totalCaMgDl: number, albuminGdL: number): number {
  return totalCaMgDl + 0.8 * (4.0 - albuminGdL);
}

export function correctedSodium(measuredNa: number, glucoseMgDl: number): number {
  const factor = glucoseMgDl > 400 ? 0.024 : 0.016;
  return measuredNa + factor * (glucoseMgDl - 100);
}

export type WeightSource = "actual" | "ideal" | "adjusted";

export function ibwKg(heightCm: number, sex: Sex): number {
  const inchesOver5ft = Math.max(0, (heightCm - 152.4) / 2.54);
  const base = isFemale(sex) ? 45.5 : 50;
  return base + 2.3 * inchesOver5ft;
}

export function adjustedBwKg(actualKg: number, ibw: number): number {
  return ibw + 0.4 * (actualKg - ibw);
}

export function resolveWeight(src: WeightSource, actualKg: number, heightCm: number, sex: Sex): number {
  if (src === "actual") return actualKg;
  const ibw = ibwKg(heightCm, sex);
  if (src === "ideal") return ibw;
  return adjustedBwKg(actualKg, ibw);
}

export function round(n: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
