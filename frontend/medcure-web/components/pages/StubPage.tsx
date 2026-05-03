import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";

export default function StubPage({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} sub={sub} />
      <div className="card">
        {children ?? (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>
            This module follows the same layout system as the rest of the app.<br />
            Connect it to a backend module to populate live data.
          </div>
        )}
      </div>
    </>
  );
}
