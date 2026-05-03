import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, sub, actions }: { eyebrow?: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="h1">{title}</h1>
        {sub && <div className="meta">{sub}</div>}
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </div>
  );
}
