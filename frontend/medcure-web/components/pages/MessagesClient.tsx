"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Message, MessageThread } from "@/lib/types";
import { fmtTime } from "@/lib/fmt";
import CallModal from "@/components/CallModal";

interface DemoConv { n: string; r: string; pv: string; t: string; un?: number; urgent?: boolean; online?: boolean; pic: string; }

const DEMO_CONVS: DemoConv[] = [
  { n: "Dr. Aanya Patel",    r: "Pediatrics · Attending",    pv: "Great — please make sure pharmacy…",       t: "10:33", online: true, pic: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces" },
  { n: "Sepsis Alert Bot",   r: "NEWS2 monitor",             pv: "⚠ Score 7 · Maria Hernandez",              t: "11:02", un: 1, urgent: true, pic: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=120&h=120&fit=crop" },
  { n: "ICU Charge Nurse",   r: "Team channel · 6 people",   pv: "Bed 2 turning over in 20 min",            t: "10:48", un: 3, pic: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop" },
  { n: "Pharmacy",           r: "Order verification",        pv: "Vancomycin trough recommended…",           t: "10:12", un: 1, pic: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=120&h=120&fit=crop" },
  { n: "Dr. Marcus Cheng",   r: "Cardiology · Consult",      pv: "Echo report attached",                     t: "9:41",  online: true, pic: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=120&h=120&fit=crop&crop=faces" },
  { n: "Lab — Hematology",   r: "Critical result",           pv: "WBC 18.4 · awaiting ack",                  t: "9:15",  un: 1, urgent: true, pic: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop" },
  { n: "Transport Dispatch", r: "Porter team",               pv: "Pickup ready — 4B → MRI",                  t: "8:58",  pic: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=120&h=120&fit=crop" },
  { n: "Dr. Sofia Mendez",   r: "Maternity · Attending",     pv: "Thanks for the handoff!",                  t: "Yest",  pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces" },
];

const FILTERS = ["All", "Unread", "Urgent", "Teams"];

export default function MessagesClient() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [active, setActive] = useState(0);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [serverMessages, setServerMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState("All");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ subject: "", participants: "", body: "", urgent: false });
  const [call, setCall] = useState<null | "audio" | "video">(null);
  const headerPeer = { name: "Dr. Aanya Patel", role: "Pediatrics · Attending", pic: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&h=240&fit=crop&crop=faces" };

  async function refresh() {
    const list = await api<MessageThread[]>("/api/messages/threads").catch(() => [] as MessageThread[]);
    setThreads(list);
  }
  useEffect(() => { refresh(); }, []);

  async function pickThread(idx: number) {
    setActive(idx);
    if (idx < threads.length) {
      const t = threads[idx];
      setActiveThread(t);
      try {
        const r = await api<{ thread: MessageThread; messages: Message[] }>(`/api/messages/threads/${t.id}`);
        setServerMessages(r.messages);
        await api(`/api/messages/threads/${t.id}/read`, { method: "POST" }).catch(() => {});
      } catch { /* keep demo */ }
    }
  }

  async function send() {
    if (!activeThread || !body.trim()) return;
    setSending(true);
    try {
      const msg = await api<Message>(`/api/messages/threads/${activeThread.id}/send`, { method: "POST", body: JSON.stringify({ body }) });
      setServerMessages(s => [...s, msg]);
      setBody("");
    } finally { setSending(false); }
  }

  async function submitCompose() {
    if (!compose.subject || !compose.body) return;
    setSending(true);
    try {
      const t = await api<MessageThread>("/api/messages/threads", { method: "POST", body: JSON.stringify(compose) });
      await refresh();
      setComposing(false);
      setCompose({ subject: "", participants: "", body: "", urgent: false });
      const r = await api<{ thread: MessageThread; messages: Message[] }>(`/api/messages/threads/${t.id}`);
      setActiveThread(t);
      setServerMessages(r.messages);
    } finally { setSending(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Secure clinical messaging</div>
          <h1 className="h1">Messages</h1>
          <div className="meta">12 unread · 3 high-severity · end-to-end encrypted</div>
        </div>
        <button className="btn primary" onClick={() => setComposing(true)}>New message <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>
      </div>

      {composing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.5)", zIndex: 999, display: "grid", placeItems: "center" }} onClick={() => setComposing(false)}>
          <div className="card panel" onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 22, width: 480, maxWidth: "90vw" }}>
            <h2 style={{ marginTop: 0 }}>New message</h2>
            <div className="cpoe-field"><label>Subject</label><input value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Re: Albert Smith — discharge planning" /></div>
            <div className="cpoe-field"><label>Participants</label><input value={compose.participants} onChange={e => setCompose(c => ({ ...c, participants: e.target.value }))} placeholder="Dr. Patel, RN Brooks" /></div>
            <div className="cpoe-field"><label>Body</label><textarea rows={4} value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} /></div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", fontSize: 13 }}>
              <input type="checkbox" checked={compose.urgent} onChange={e => setCompose(c => ({ ...c, urgent: e.target.checked }))} />
              Mark urgent · pages recipients immediately
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setComposing(false)}>Cancel</button>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={submitCompose} disabled={sending || !compose.subject || !compose.body}>
                {sending ? "Sending…" : "Send →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="msg-grid">
        {/* LIST */}
        <div className="msg-panel">
          <div className="list-head">
            <div className="searchbox" style={{ minWidth: 0, boxShadow: "none", background: "#f4f6f9" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input placeholder="Search conversations" />
            </div>
            <div className="filters">
              {FILTERS.map(f => (
                <button key={f} className={`f ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>

          <div className="convs">
            {DEMO_CONVS.map((c, i) => (
              <div key={i} className={`conv ${active === i ? "active" : ""}`} onClick={() => pickThread(i)}>
                {c.urgent && <div className="pri" />}
                <div className="av" style={{ backgroundImage: `url(${c.pic})` }}>
                  {c.online && <span className="pres" />}
                </div>
                <div className="meta">
                  <div className="role">{c.r}</div>
                  <div className="top-row">
                    <div className="nm">{c.n}</div>
                    <div className="tm">{c.t}</div>
                  </div>
                  <div className="pv">{c.pv}</div>
                </div>
                {c.un && <div className="badge">{c.un}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* THREAD */}
        <div className="msg-panel">
          <div className="thread-head">
            <div className="av" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces)" }} />
            <div>
              <div className="nm">Dr. Aanya Patel <span className="pill good" style={{ marginLeft: 6 }}><span className="pdot"/>online</span></div>
              <div className="sub">Pediatrics · Attending · re: Albert Smith (MRN-08421)</div>
            </div>
            <div className="actions">
              <button className="icon-btn" title="call" onClick={() => setCall("audio")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
              <button className="icon-btn" title="video" onClick={() => setCall("video")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg></button>
              <button className="icon-btn" title="more"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
            </div>
          </div>

          <div className="thread">
            {serverMessages.length === 0 ? (
              <>
                <div className="day-sep">Today · 10:24 AM</div>
                <div className="msg-row">
                  <div className="av-s" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces)" }} />
                  <div>
                    <div className="bub">Hi — checking in on Albert. Vitals from the last round look stable. Are we still planning discharge tomorrow morning?</div>
                    <div className="meta-tm">10:24 AM · Read</div>
                  </div>
                </div>
                <div className="msg-row me">
                  <div>
                    <div className="bub">Yes, planning AM discharge. CBC and BMP came back normal at 09:15. PT is comfortable, ambulating. Mom signed the discharge instructions.</div>
                    <div className="meta-tm">10:31 AM · Read by Dr. Patel</div>
                  </div>
                </div>
                <div className="msg-row">
                  <div className="av-s" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces)" }} />
                  <div>
                    <div className="bub">Great — please make sure pharmacy reconciliation is signed off and we have a follow-up scheduled in 7 days.</div>
                    <div className="meta-tm">10:33 AM</div>
                  </div>
                </div>
                <div className="day-sep">High Severity</div>
                <div className="msg-row alert">
                  <div className="av-s" style={{ background: "#ffe7eb", color: "#b3263d", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                  </div>
                  <div>
                    <div className="bub">
                      <b>Sepsis Alert · NEWS2 = 7</b><br/>
                      Maria Hernandez (MRN-08401) — score crossed threshold at 11:02 AM. Bundle initiation recommended within 1h.
                      <div className="attach">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                        Sepsis Bundle Order Set · v3.2
                      </div>
                    </div>
                    <div className="meta-tm">11:02 AM · auto-routed by Predictor V4.2</div>
                  </div>
                </div>
                <div className="msg-row me">
                  <div>
                    <div className="bub">Acknowledged. Initiating bundle. Lactate ordered, fluids running.</div>
                    <div className="meta-tm">11:04 AM · Delivered</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="day-sep">{activeThread?.subject ?? "Thread"}</div>
                {serverMessages.map(m => {
                  const me = m.senderName === "Albert Drobo";
                  return (
                    <div key={m.id} className={`msg-row ${me ? "me" : ""}`}>
                      {!me && <div className="av-s" style={{ backgroundImage: "url(https://i.pravatar.cc/80)" }} />}
                      <div>
                        <div className="bub">{m.body}</div>
                        <div className="meta-tm">{fmtTime(m.sentAt)}{m.read ? " · Read" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="composer">
            <button className="ico-btn" title="attach"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>
            <input className="ipt" placeholder={activeThread ? "Type a secure message…" : "Pick a thread to reply"} value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} disabled={!activeThread || sending} />
            <button className="ico-btn" title="emoji"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></button>
            <button className="send-btn" onClick={send} disabled={!activeThread || !body.trim() || sending} title="send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></button>
          </div>
        </div>

        {/* DETAILS */}
        <div className="msg-panel">
          <div className="info-panel">
            <div className="av-l" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&h=240&fit=crop&crop=faces)" }} />
            <div>
              <h3>Dr. Aanya Patel</h3>
              <div className="sub2">Pediatric Attending · Pediatrics 4B</div>
              <div className="quick">
                <button className="y" title="message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                <button title="call" onClick={() => setCall("audio")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                <button title="video" onClick={() => setCall("video")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg></button>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Details</div>
              <div className="info-row-d"><span>NPI</span><b>1457809321</b></div>
              <div className="info-row-d"><span>Pager</span><b>x4421</b></div>
              <div className="info-row-d"><span>Shift</span><b>07:00 – 19:00</b></div>
              <div className="info-row-d"><span>Coverage</span><b>Dr. Mendez</b></div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Shared Files</div>
              <div className="files">
                <div className="file-chip"><span className="fi"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></span>Discharge.pdf</div>
                <div className="file-chip"><span className="fi" style={{ background: "#e6efff", color: "#3a86ff" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><rect x="3" y="3" width="18" height="18" rx="2"/></svg></span>CXR.dcm</div>
                <div className="file-chip"><span className="fi"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></span>CBC.pdf</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CallModal open={!!call} mode={call ?? "audio"} peer={headerPeer} onClose={() => setCall(null)} />
    </>
  );
}
