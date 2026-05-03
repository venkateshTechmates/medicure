"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth, getUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function signOut() {
    clearAuth();
    router.push("/sign-in");
  }

  if (!user) return null;
  const handle = user.title ? `${user.title} · ${user.specialty}` : user.specialty;

  return (
    <div ref={ref} className="profile" onClick={() => setOpen(o => !o)}>
      <div className="avatar" style={{ backgroundImage: `url(${user.avatarUrl})` }} />
      <div className="who">
        <div className="name">{user.fullName}</div>
        <div className="handle">{handle}</div>
      </div>
      <span className="chev">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </span>
      {open && (
        <div className="dropdown" style={{ minWidth: 240 }}>
          <div style={{ padding: "10px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 12.5 }}>{user.fullName}</div>
            <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>{user.email}</div>
          </div>
          <Link className="tm-row" href="/settings" onClick={() => setOpen(false)}>
            <span className="tm-pic" style={{ background: "#f4f6f9", color: "var(--ink)" }}>⚙</span>
            <span><b>Settings &amp; preferences</b></span><span />
          </Link>
          <Link className="tm-row" href="/signout" onClick={() => setOpen(false)}>
            <span className="tm-pic" style={{ background: "#f4f6f9", color: "var(--ink)" }}>↪</span>
            <span><b>Hand-off / sign-out (clinical)</b></span><span />
          </Link>
          <div className="tm-sep" />
          <Link className="tm-row" href="/tenant-selector" onClick={() => setOpen(false)}>
            <span className="tm-pic" style={{ background: "#f4f6f9", color: "var(--ink)" }}>⇆</span>
            <span><b>Switch organization</b></span><span />
          </Link>
          <div className="tm-row" onClick={signOut}>
            <span className="tm-pic" style={{ background: "#ffe7eb", color: "#b3263d" }}>⤴</span>
            <span><b style={{ color: "#b3263d" }}>Sign out of Medcure</b></span><span />
          </div>
        </div>
      )}
    </div>
  );
}
