"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";

export default function WorkflowPage({ eyebrow, title, sub, steps, finishHref = "/", finishLabel = "Finish" }: {
  eyebrow: string; title: string; sub?: string;
  steps: { label: string; render: () => ReactNode }[];
  finishHref?: string; finishLabel?: string;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} sub={sub} />
      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {steps.map((s, idx) => (
            <div key={s.label} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: idx <= i ? "var(--ink)" : "var(--line)", marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: idx === i ? "var(--ink)" : "var(--ink-mute)", fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ minHeight: 220 }}>{steps[i].render()}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
          <div style={{ flex: 1 }} />
          {!last
            ? <button className="btn primary" onClick={() => setI(i + 1)}>Continue →</button>
            : <button className="btn primary" onClick={() => router.push(finishHref)}>{finishLabel} →</button>}
        </div>
      </div>
    </>
  );
}
