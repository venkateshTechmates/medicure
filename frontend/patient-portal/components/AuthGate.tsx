"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/sign-in");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
