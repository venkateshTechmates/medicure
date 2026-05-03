import Link from "next/link";

export default function Logo() {
  return (
    <Link className="logo" href="/">
      <span className="logo-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7" />
          <path d="M20 12c0 4-3 7-7 7" />
        </svg>
      </span>
      <span>Medcure</span>
    </Link>
  );
}
