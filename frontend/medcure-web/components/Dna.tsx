export default function Dna() {
  return (
    <svg className="dna" viewBox="0 0 60 200" fill="none" stroke="#cfd4de" strokeWidth={1.4}>
      <path d="M10 0 C 50 50, 10 100, 50 150" />
      <path d="M50 0 C 10 50, 50 100, 10 150" />
      <g stroke="#dfe3eb">
        <line x1="14" y1="20" x2="46" y2="20" />
        <line x1="20" y1="40" x2="40" y2="40" />
        <line x1="20" y1="60" x2="40" y2="60" />
        <line x1="14" y1="80" x2="46" y2="80" />
        <line x1="20" y1="100" x2="40" y2="100" />
        <line x1="14" y1="120" x2="46" y2="120" />
        <line x1="20" y1="140" x2="40" y2="140" />
      </g>
    </svg>
  );
}
