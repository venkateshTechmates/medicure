export default function Ruler({ label = "3.8 nm" }: { label?: string }) {
  const W = 520;
  const count = 70;
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = 10 + (W - 20) * t;
    const y = (1 - t) * (1 - t) * 36 + 2 * (1 - t) * t * (-18) + t * t * 36;
    const major = i % 5 === 0;
    const len = major ? 9 : 5;
    ticks.push(<line key={i} x1={x} y1={y} x2={x} y2={y + len} strokeWidth={major ? 1.2 : 0.7} />);
  }
  return (
    <div className="ruler">
      <svg className="ruler-arc" viewBox="0 0 520 46" preserveAspectRatio="none">
        <path d="M10 36 Q 260 -18 510 36" fill="none" stroke="currentColor" strokeWidth="1" />
        <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">{ticks}</g>
      </svg>
      <div className="ruler-pin" />
      <div className="ruler-label">{label}</div>
    </div>
  );
}
