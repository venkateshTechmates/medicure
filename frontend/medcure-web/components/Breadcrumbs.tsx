import Link from "next/link";

export default function Breadcrumbs({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  return (
    <div className="bc-bar">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        if (last || !c.href) return <span key={i} className="bc-cur">{c.label}</span>;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link className="bc-link" href={c.href}>{c.label}</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
          </span>
        );
      })}
    </div>
  );
}
