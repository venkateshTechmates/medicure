"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!getToken()) router.replace("/sign-in");
    else setOk(true);
  }, [router]);
  if (!ok) return <div style={{ padding: 60, textAlign: "center", color: "var(--ink-mute)" }}>Loading…</div>;
  return <>{children}</>;
}
