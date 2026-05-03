import Dna from "./Dna";

export default function HeartGauge({ bpm = 80 }: { bpm?: number }) {
  const cx = 120, cy = 120, r = 92, count = 44;
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const ang = Math.PI - t * Math.PI;
    const X1 = cx + Math.cos(ang) * r;
    const Y1 = cy - Math.sin(ang) * r;
    const X2 = cx + Math.cos(ang) * (r - 18);
    const Y2 = cy - Math.sin(ang) * (r - 18);
    let color: string;
    if (t < 0.45) color = `hsl(${350 + t * 15} 90% ${55 + t * 15}%)`;
    else if (t < 0.55) color = "#0e1116";
    else color = `hsl(${20 - t * 5} 70% ${78 - t * 8}%)`;
    const w = Math.abs(t - 0.5) < 0.04 ? 3.2 : 2.2;
    ticks.push(<line key={i} x1={X1} y1={Y1} x2={X2} y2={Y2} stroke={color} strokeWidth={w} strokeLinecap="round" />);
  }

  return (
    <div className="heart-card">
      <div className="head">
        <div className="heart-title">
          <span className="ti">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
          Heart Rate
        </div>
        <span style={{ color: "var(--ink-mute)", cursor: "pointer" }}>⋯</span>
      </div>

      <div className="gauge-wrap">
        <svg className="gauge" viewBox="0 0 240 140">
          <g>{ticks}</g>
        </svg>
        <div className="gauge-center">
          <div className="gauge-num">{bpm}<small>BPM</small></div>
          <div className="gauge-sub">Normal Heart Rate</div>
        </div>
      </div>

      <div className="legend">
        <span className="lg h"><span className="d" />High</span>
        <span className="lg m"><span className="d" />Medium</span>
        <span className="lg n"><span className="d" />Normal</span>
        <span className="lg l"><span className="d" />Low</span>
      </div>

      <Dna />
    </div>
  );
}
