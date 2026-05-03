import type { ReactNode } from "react";
import type { StatusKind } from "@/lib/types";

export default function StatusPill({ kind = "info", children }: { kind?: StatusKind | string; children: ReactNode }) {
  const cls = ["good", "warn", "bad", "info"].includes(kind) ? kind : "info";
  return (
    <span className={`pill ${cls}`}>
      <span className="pdot" />
      {children}
    </span>
  );
}
