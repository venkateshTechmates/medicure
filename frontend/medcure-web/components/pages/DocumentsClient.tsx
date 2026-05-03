"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

type Kind = "pdf" | "img" | "dicom" | "signed";

interface DemoDoc { k: Kind; t: string; m: string; who: string; d: string; tag: string; }

const DEMO_DOCS: DemoDoc[] = [
  { k: "signed", t: "Discharge Summary",       m: "PDF · 4 pages",    who: "Albert Smith",     d: "2h ago",   tag: "Signed" },
  { k: "img",    t: "CT Chest w/ Contrast",    m: "DICOM · 142 frames", who: "Maria Hernandez", d: "5h ago",   tag: "Imaging" },
  { k: "pdf",    t: "Op Note — Appendectomy",  m: "PDF · 3 pages",    who: "Sarah Johnson",    d: "Today",    tag: "Surgery" },
  { k: "pdf",    t: "Lab Report — CMP, CBC",   m: "PDF · 2 pages",    who: "James Liu",        d: "Today",    tag: "Lab" },
  { k: "signed", t: "Consent — Anesthesia",    m: "PDF · 2 pages · Signed", who: "Sarah Johnson", d: "Yesterday", tag: "Consent" },
  { k: "pdf",    t: "Progress Note Day 3",     m: "PDF · 1 page",     who: "Robert Kim",       d: "Yesterday", tag: "Note" },
  { k: "img",    t: "XR Pelvis AP",            m: "DICOM · 1 image",  who: "Daniel Owusu",     d: "Jan 17",   tag: "Imaging" },
  { k: "dicom",  t: "MRI Brain T1/T2",         m: "DICOM · 320 frames", who: "James Liu",      d: "Jan 17",   tag: "Imaging" },
  { k: "pdf",    t: "Insurance Authorization", m: "PDF · 1 page",     who: "Priya Shah",       d: "Jan 16",   tag: "Insurance" },
];

const ICONS: Record<Kind, React.ReactNode> = {
  pdf:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></>,
  img:    <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  dicom:  <><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="9" /></>,
  signed: <><path d="M9 12l2 2 4-4" /><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.76 1.02 6.4 2.66" /></>,
};

const PILL_KIND: Record<Kind, string> = { signed: "good", img: "info", dicom: "info", pdf: "" };

export default function DocumentsClient() {
  const [serverDocs, setServerDocs] = useState<DocumentItem[]>([]);
  const [active, setActive] = useState("All Documents");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Note", fileType: "pdf", patientId: 0, pages: 1 });

  async function refresh() {
    const list = await api<DocumentItem[]>("/api/documents?take=50").catch(() => [] as DocumentItem[]);
    setServerDocs(list);
  }
  useEffect(() => { refresh(); }, []);

  async function submitUpload() {
    if (!form.title) return;
    setBusy(true);
    try {
      await api("/api/documents", { method: "POST", body: JSON.stringify({
        title: form.title,
        category: form.category,
        fileType: form.fileType,
        pages: form.pages,
        sizeBytes: form.pages * 100_000,
        patientId: form.patientId || null,
      }) });
      await refresh();
      setUploading(false);
      setForm({ title: "", category: "Note", fileType: "pdf", patientId: 0, pages: 1 });
    } finally { setBusy(false); }
  }

  const docs = DEMO_DOCS;

  return (
    <>
      {uploading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.5)", zIndex: 999, display: "grid", placeItems: "center" }} onClick={() => setUploading(false)}>
          <div className="card panel" onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 22, width: 460, maxWidth: "90vw" }}>
            <h2 style={{ marginTop: 0 }}>Upload document</h2>
            <div className="cpoe-field"><label>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Discharge Summary" /></div>
            <div className="grid-2">
              <div className="cpoe-field"><label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option>Note</option><option>Consent</option><option>Imaging</option><option>Lab</option><option>Discharge</option><option>Insurance</option>
                </select>
              </div>
              <div className="cpoe-field"><label>File type</label>
                <select value={form.fileType} onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}>
                  <option>pdf</option><option>img</option><option>dicom</option>
                </select>
              </div>
              <div className="cpoe-field"><label>Pages</label><input type="number" value={form.pages} onChange={e => setForm(f => ({ ...f, pages: Number(e.target.value) || 1 }))} min={1} max={500} /></div>
              <div className="cpoe-field"><label>Patient ID (optional)</label><input type="number" value={form.patientId || ""} onChange={e => setForm(f => ({ ...f, patientId: Number(e.target.value) || 0 }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setUploading(false)}>Cancel</button>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={submitUpload} disabled={busy || !form.title}>{busy ? "Uploading…" : "Upload →"}</button>
            </div>
          </div>
        </div>
      )}
      <div className="head">
        <div>
          <div className="eyebrow">Records · Patient files</div>
          <h1 className="h1">Documents</h1>
          <div className="meta">{Math.max(2418, serverDocs.length)} documents · 84 awaiting signature · synced via DocumentReference R4</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search documents…" />
          </div>
          <button className="btn primary" onClick={() => setUploading(true)}>Upload <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span></button>
        </div>
      </div>

      <div className="docs-grid">
        {/* SIDEBAR */}
        <div className="docs-side">
          <h4>Library</h4>
          <SideLink label="All Documents"     count="2,418" active={active} onClick={setActive} />
          <SideLink label="Recent"            count="42"    active={active} onClick={setActive} />
          <SideLink label="Shared with me"    count="18"    active={active} onClick={setActive} />
          <SideLink label="Awaiting signature" count="84"   active={active} onClick={setActive} />
          <h4>Categories</h4>
          <SideLink label="Clinical Notes"     count="912"   active={active} onClick={setActive} />
          <SideLink label="Imaging Studies"    count="386"   active={active} onClick={setActive} />
          <SideLink label="Lab Reports"        count="624"   active={active} onClick={setActive} />
          <SideLink label="Consents"           count="218"   active={active} onClick={setActive} />
          <SideLink label="Insurance"          count="142"   active={active} onClick={setActive} />
          <SideLink label="Discharge Summary"  count="86"    active={active} onClick={setActive} />
          <h4>Tags</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 4px" }}>
            <span className="pill">cardio</span>
            <span className="pill">post-op</span>
            <span className="pill">peds</span>
            <span className="pill">lab</span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="docs-main">
          <div className="docs-toolbar">
            <div className="subnav">
              <button className="active">All</button><button>PDF</button><button>Imaging</button><button>Signed</button><button>Drafts</button>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn">Sort: Recent <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m6 9 6 6 6-6"/></svg></button>
            </div>
          </div>

          <div className="doc-grid">
            {docs.map((d, i) => (
              <div className={`doc ${d.k}`} key={i}>
                <div className="badges">
                  <span className={`pill ${PILL_KIND[d.k]}`}>{d.tag}</span>
                </div>
                <div className="more">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                </div>
                <div className="thumb">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">{ICONS[d.k]}</svg>
                </div>
                <div className="nm">{d.t}</div>
                <div className="mt"><span>{d.who}</span> · <span>{d.m}</span> · <span>{d.d}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* PREVIEW + ACTIVITY */}
        <div className="docs-side-r">
          <div className="preview-card">
            <div className="ph">
              <div className="pg">
                <div className="ln l" /><div className="ln m" /><div className="ln s" />
                <div style={{ height: 14 }} />
                <div className="ln l" /><div className="ln l" /><div className="ln m" /><div className="ln l" /><div className="ln s" />
                <div style={{ height: 10 }} />
                <div className="ln l" /><div className="ln m" />
              </div>
            </div>
            <div className="pb">
              <h3>Discharge Summary</h3>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 14 }}>Albert Smith · MRN-08421</div>
              <div className="row-d"><span>Author</span><b>Dr. Aanya Patel</b></div>
              <div className="row-d"><span>Created</span><b>Jan 18, 2025</b></div>
              <div className="row-d"><span>Status</span><b style={{ color: "var(--good)" }}>● Signed</b></div>
              <div className="row-d"><span>Pages</span><b>4</b></div>
              <div className="row-d"><span>Size</span><b>284 KB</b></div>
              <div className="actions">
                <button className="btn dark" style={{ flex: 1, justifyContent: "center" }}>Open</button>
                <button className="btn" title="Download"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg></button>
              </div>
            </div>
          </div>

          <div className="card tight">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Activity</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.7 }}>
              <div><b>Dr. Patel</b> signed Discharge Summary · 2h ago</div>
              <div><b>R. Mendez</b> uploaded Insurance Card · 3h ago</div>
              <div><b>Lab</b> released ORU R01 results · 5h ago</div>
              <div><b>You</b> opened Imaging Study #2841 · yesterday</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SideLink({ label, count, active, onClick }: { label: string; count: string; active: string; onClick: (l: string) => void }) {
  return (
    <button className={`lk ${active === label ? "active" : ""}`} onClick={() => onClick(label)}>
      <span>{label}</span>
      <span className="ct">{count}</span>
    </button>
  );
}
