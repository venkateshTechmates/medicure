"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface TPatient {
  id: number; n: string; mrn: string; age: number; bed: string; pic: string;
  state: "ok" | "warn" | "crit";
  hr: number; bp: string; spo2: number; rr: number; temp: number; dx: string;
  alarm?: string;
}

const DEFAULT_PATIENTS: TPatient[] = [
  { id: 1, n: "Albert Smith",     mrn: "4421-08", age: 9,  bed: "Peds-2 / 14",  pic: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 96,  bp: "112/72", spo2: 97, rr: 18, temp: 36.9, dx: "Asthma exac" },
  { id: 2, n: "Maria Hernandez",  mrn: "08461",   age: 64, bed: "ICU-2 / 04",   pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces", state: "crit", hr: 128, bp: "88/54",  spo2: 91, rr: 28, temp: 38.4, dx: "Sepsis · ARDS",     alarm: "V-tach 6 beats" },
  { id: 3, n: "Robert Kim",       mrn: "08305",   age: 71, bed: "ICU-2 / 07",   pic: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&h=120&fit=crop&crop=faces", state: "warn", hr: 62,  bp: "102/64", spo2: 93, rr: 20, temp: 36.2, dx: "Post-op CABG",      alarm: "Brady 58" },
  { id: 4, n: "James Liu",        mrn: "08410",   age: 67, bed: "CCU / 12",     pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces", state: "crit", hr: 142, bp: "160/98", spo2: 94, rr: 24, temp: 37.6, dx: "STEMI · post-PCI",  alarm: "A-fib RVR" },
  { id: 5, n: "Sarah Johnson",    mrn: "08440",   age: 29, bed: "StepD / 21",   pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 88,  bp: "120/78", spo2: 98, rr: 16, temp: 36.7, dx: "Post-appy" },
  { id: 6, n: "Daniel Owusu",     mrn: "08299",   age: 45, bed: "StepD / 22",   pic: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 76,  bp: "124/80", spo2: 97, rr: 14, temp: 36.8, dx: "Migraine obs" },
  { id: 7, n: "Adison Reyes",     mrn: "08423",   age: 6,  bed: "Peds-2 / 15",  pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces", state: "warn", hr: 138, bp: "94/60",  spo2: 95, rr: 30, temp: 38.9, dx: "RSV · bronchiolitis", alarm: "Tachy + fever" },
  { id: 8, n: "Priya Shah",       mrn: "08233",   age: 32, bed: "Maty / 03",    pic: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 84,  bp: "118/74", spo2: 98, rr: 16, temp: 36.8, dx: "Post-partum" },
  { id: 9, n: "Marcus Wei",       mrn: "08188",   age: 58, bed: "CCU / 13",     pic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces", state: "warn", hr: 58,  bp: "94/58",  spo2: 96, rr: 14, temp: 36.5, dx: "CHF exac",          alarm: "Brady" },
  { id: 10, n: "Emma Bauer",      mrn: "08561",   age: 43, bed: "ICU-1 / 02",   pic: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 82,  bp: "128/82", spo2: 97, rr: 16, temp: 37.0, dx: "Post-op vasc" },
  { id: 11, n: "Chen Wei",        mrn: "08501",   age: 51, bed: "StepD / 24",   pic: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 74,  bp: "122/76", spo2: 98, rr: 14, temp: 36.9, dx: "COPD obs" },
  { id: 12, n: "Layla Hassan",    mrn: "08612",   age: 39, bed: "StepD / 25",   pic: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=120&h=120&fit=crop&crop=faces", state: "ok",   hr: 90,  bp: "118/76", spo2: 96, rr: 18, temp: 37.1, dx: "PE · therapeutic" },
];

function ecgY(phase: number, hr: number, irreg: boolean): number {
  const period = Math.max(20, 60 - (hr - 60) * 0.4);
  const x = phase % period;
  let y = 30;
  if (x < 1) y = 30 + (Math.random() - 0.5) * 0.5;
  else if (x < 3) y = 30 - 3 * Math.sin((x - 1) * Math.PI / 2);
  else if (x < 5) y = 30;
  else if (x === 5) y = 32;
  else if (x === 6) y = 14;
  else if (x === 7) y = 38;
  else if (x === 8) y = 30;
  else if (x < 14) y = 30 - 5 * Math.sin((x - 8) * Math.PI / 6);
  else y = 30 + (Math.random() - 0.5) * 0.4;
  if (irreg && Math.random() < 0.04) y += (Math.random() - 0.5) * 16;
  return y;
}
function plethY(phase: number, hr: number): number {
  const period = Math.max(20, 60 - (hr - 60) * 0.4);
  const x = phase % period;
  const env = Math.exp(-Math.pow((x - period * 0.25) / (period * 0.18), 2));
  return 30 - env * 22;
}
function respY(phase: number, rr: number): number {
  return 30 - Math.sin(phase * (rr / 60) * 0.05) * 14;
}

function drawWave(ctx: CanvasRenderingContext2D, buf: number[], color: string) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,.04)"; ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.shadowColor = color; ctx.shadowBlur = 6;
  ctx.beginPath();
  for (let i = 0; i < buf.length; i++) {
    const x = (i / buf.length) * w;
    const y = (buf[i] / 60) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a0d12"; ctx.fillRect(w - 2, 0, 6, h);
  ctx.fillStyle = color;     ctx.fillRect(w - 3, 0, 1, h);
}

export default function TelemetryClient() {
  const [time, setTime] = useState("");
  const [active, setActive] = useState<TPatient | null>(null);
  const [unit, setUnit] = useState("All units");
  const [view, setView] = useState("All patients");
  const [patients, setPatients] = useState<TPatient[]>(DEFAULT_PATIENTS);
  const canvasRefs = useRef<Map<number, { ecg: HTMLCanvasElement; pleth: HTMLCanvasElement; resp: HTMLCanvasElement }>>(new Map());

  useEffect(() => {
    document.body.classList.add("telemetry-dark");
    return () => { document.body.classList.remove("telemetry-dark"); };
  }, []);

  useEffect(() => {
    interface Live { id: number; mrn: string; fullName: string; age: number; sex: string; status: string; bed: string; avatarUrl: string; attendingName: string; hr: number; sbp: number; dbp: number; spo2: number; rr: number; tempC: number; }
    api<Live[]>("/api/telemetry").then(rows => {
      if (!rows?.length) return;
      const mapped: TPatient[] = rows.map(r => ({
        id: r.id,
        n: r.fullName,
        mrn: r.mrn,
        age: r.age,
        bed: r.bed,
        pic: r.avatarUrl,
        state: r.status === "bad" ? "crit" : r.status === "warn" ? "warn" : "ok",
        hr: r.hr || 80,
        bp: `${r.sbp}/${r.dbp}`,
        spo2: r.spo2,
        rr: r.rr,
        temp: r.tempC,
        dx: r.attendingName,
        alarm: r.status === "bad" ? "Critical alert" : r.status === "warn" ? "Watcher" : undefined,
      }));
      setPatients(mapped);
    }).catch(() => { /* keep defaults */ });
  }, []);

  const PATIENTS = patients;

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const buffers = new Map<number, { ecg: number[]; pleth: number[]; resp: number[]; t: number }>();
    patients.forEach(p => buffers.set(p.id, {
      ecg: new Array(600).fill(30),
      pleth: new Array(600).fill(30),
      resp: new Array(600).fill(30),
      t: Math.random() * 100,
    }));

    let raf = 0;
    const step = () => {
      patients.forEach(p => {
        const b = buffers.get(p.id);
        const refs = canvasRefs.current.get(p.id);
        if (!b || !refs) return;
        b.t += 1;
        const irreg = p.state === "crit";
        b.ecg.shift();   b.ecg.push(ecgY(b.t, p.hr, irreg));
        b.pleth.shift(); b.pleth.push(plethY(b.t, p.hr));
        b.resp.shift();  b.resp.push(respY(b.t, p.rr));
        const ec = refs.ecg.getContext("2d"); if (ec) drawWave(ec, b.ecg, "#27c26b");
        const pc = refs.pleth.getContext("2d"); if (pc) drawWave(pc, b.pleth, "#3a86ff");
        const rc = refs.resp.getContext("2d"); if (rc) drawWave(rc, b.resp, "#ffb84d");
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [patients]);

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <>
      <div className="telem-head">
        <div>
          <span className="eyebrow">Cardiac monitoring · ICU + step-down</span>
          <h1>Telemetry</h1>
          <div className="sub">{PATIENTS.length} patients on continuous cardiac monitoring · {PATIENTS.filter(p => p.state === "crit").length} active critical alarms · last sync 2s ago</div>
        </div>
        <div className="clock"><span>{time}</span><span className="d">{dateLabel}</span></div>
      </div>

      <div className="telem-filters">
        <div className="telem-seg">
          {["All units", "ICU", "CCU", "Step-down"].map(o => (
            <button key={o} className={unit === o ? "active" : ""} onClick={() => setUnit(o)}>{o}</button>
          ))}
        </div>
        <div className="telem-seg">
          {["All patients", "Alarming", "My patients"].map(o => (
            <button key={o} className={view === o ? "active" : ""} onClick={() => setView(o)}>{o}</button>
          ))}
        </div>
        <div className="alert-stat">
          <span className="a crit"><i />{PATIENTS.filter(p => p.state === "crit").length} Critical</span>
          <span className="a warn"><i />{PATIENTS.filter(p => p.state === "warn").length} Warning</span>
          <span className="a ok"><i />{PATIENTS.filter(p => p.state === "ok").length} Stable</span>
        </div>
      </div>

      <div className="telem-grid">
        {PATIENTS.map(p => {
          const stateClass = p.state === "crit" ? "crit" : p.state === "warn" ? "warn" : "";
          const bpParts = p.bp.split("/").map(Number);
          const map = (bpParts[1] + (bpParts[0] - bpParts[1]) / 3).toFixed(0);
          return (
            <div key={p.id} className={`tile ${stateClass}`} onClick={() => setActive(p)}>
              <div className="head-row">
                <div className="who">
                  <div className="pic" style={{ backgroundImage: `url(${p.pic})` }} />
                  <div>
                    <div className="nm">{p.n}</div>
                    <div className="meta"><b>{p.bed}</b> · {p.age}y · {p.dx}</div>
                  </div>
                </div>
                {p.alarm
                  ? <span className={`alarm-pill ${p.state === "crit" ? "crit" : "warn"}`}>⚠ {p.alarm}</span>
                  : <span className="alarm-pill ok">● Stable</span>}
              </div>

              <div className="waves">
                <WaveRow lab="II"    sub="ECG"   patientId={p.id} kind="ecg"   color="ecg-color"   value={`${p.hr}`} unit="BPM" canvasRefs={canvasRefs} />
                <WaveRow lab="SpO₂"  sub="PLETH" patientId={p.id} kind="pleth" color="pleth-color" value={`${p.spo2}`} unit="%" canvasRefs={canvasRefs} />
                <WaveRow lab="imp"   sub="RESP"  patientId={p.id} kind="resp"  color="resp-color"  value={`${p.rr}`} unit="/min" canvasRefs={canvasRefs} />
              </div>

              <div className="stats-mini-row">
                <div className={`stat-mini ${stateClass}`}><div className="v">{p.bp}</div><div className="l">NIBP</div></div>
                <div className="stat-mini"><div className="v">{p.temp.toFixed(1)}°</div><div className="l">Temp</div></div>
                <div className="stat-mini"><div className="v">{Math.round(p.hr * 0.85)}</div><div className="l">PR</div></div>
                <div className="stat-mini"><div className="v">{map}</div><div className="l">MAP</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {active && (
        <div className="detail-bar open">
          <div className="pic" style={{ backgroundImage: `url(${active.pic})` }} />
          <div>
            <div className="nm">{active.n}</div>
            <div className="sub">MRN {active.mrn} · {active.bed} · {active.dx} · {active.alarm ?? "No active alarms"}</div>
          </div>
          <div className="actions">
            <button className="btn">Acknowledge</button>
            <button className="btn">Silence 60s</button>
            <button className="btn">View ECG strip</button>
            <Link href="/patients" className="btn primary">Open chart →</Link>
            <button className="close" onClick={() => setActive(null)}>×</button>
          </div>
        </div>
      )}
    </>
  );
}

function WaveRow({ lab, sub, patientId, kind, color, value, unit, canvasRefs }: {
  lab: string; sub: string; patientId: number; kind: "ecg" | "pleth" | "resp";
  color: string; value: string; unit: string;
  canvasRefs: React.MutableRefObject<Map<number, { ecg: HTMLCanvasElement; pleth: HTMLCanvasElement; resp: HTMLCanvasElement }>>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let entry = canvasRefs.current.get(patientId);
    if (!entry) {
      entry = { ecg: null!, pleth: null!, resp: null! } as { ecg: HTMLCanvasElement; pleth: HTMLCanvasElement; resp: HTMLCanvasElement };
      canvasRefs.current.set(patientId, entry);
    }
    entry[kind] = ref.current;
  }, [patientId, kind, canvasRefs]);

  return (
    <div className="wave-row">
      <div className="lab"><b className={color}>{sub}</b>{lab}</div>
      <div className="wave-canvas"><canvas ref={ref} width={600} height={60} /></div>
      <div className={`val ${color}`}>{value}<small>{unit}</small></div>
    </div>
  );
}
