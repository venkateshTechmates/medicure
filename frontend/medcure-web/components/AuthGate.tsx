"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!getToken()) routerRef.current.replace("/sign-in");
    else setOk(true);
  }, []); // intentionally run once on mount
  if (!ok) return null;
  return <>{children}</>;
}
