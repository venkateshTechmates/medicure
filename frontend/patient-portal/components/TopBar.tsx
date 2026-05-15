"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getUser } from "@/lib/api";
import { useEffect, useState } from "react";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/appointments", label: "Appointments" },
  { href: "/labs", label: "Labs" },
  { href: "/statements", label: "Bills" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const u = getUser<{ fullName?: string; email?: string }>();
    setName(u?.fullName || u?.email || "");
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  }

  function signOut() {
    clearSession();
    router.replace("/sign-in");
  }

  return (
    <nav className="nav" aria-label="Primary">
      <Link href="/" className="logo">
        <span className="logo-mark">M</span>
        <span>
          MedCure
          <div className="sub">Patient Portal</div>
        </span>
      </Link>

      <div className="tabs" role="tablist">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`tab${isActive(l.href) ? " active" : ""}`}
            role="tab"
            aria-selected={isActive(l.href)}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        {name ? <span className="muted" style={{ fontWeight: 700 }}>{name}</span> : null}
        <button className="btn ghost" onClick={signOut} aria-label="Sign out">
          Sign out
        </button>
      </div>
    </nav>
  );
}
