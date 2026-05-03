export default function CardioBars() {
  const N = 56;
  const peaks = [12, 28, 44];
  let seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  const bars = [];
  for (let i = 0; i < N; i++) {
    const base = 30 + rnd() * 45;
    const h = base + (i % 3 === 0 ? 8 : 0);
    const isPeak = peaks.includes(i) || peaks.map(p => p + 1).includes(i);
    bars.push(<div key={i} className={`bar${isPeak ? " hi" : ""}`} style={{ height: `${Math.min(95, h)}%` }} />);
  }
  return (
    <div className="cardio">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="ttl">Cardiovascular System</div>
          <div className="sub-text">Total average heart bpm</div>
        </div>
        <div className="seg">
          <div className="s active">Heart Rate</div>
        </div>
      </div>
      <div className="cardio-num">
        <div className="big">78</div>
        <div className="delta-c">2% <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg></div>
        <div className="lab">Average BPM</div>
      </div>
      <div className="bars">{bars}</div>
      <div className="x-axis">
        <span>89%</span><span>89%</span><span>78%</span>
      </div>
    </div>
  );
}
