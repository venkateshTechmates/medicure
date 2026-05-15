"use client";
import { useState } from "react";
import { openPrintWindow, downloadZpl } from "@/lib/print";

interface Props {
  label: string;
  htmlUrl: string;
  zplUrl?: string;
  zplFilename?: string;
  variant?: "primary" | "default";
  title?: string;
  disabled?: boolean;
}

export default function PrintButton({ label, htmlUrl, zplUrl, zplFilename, variant = "default", title, disabled }: Props) {
  const [busy, setBusy] = useState<"" | "html" | "zpl">("");
  const [err, setErr] = useState<string | null>(null);

  async function handlePrint() {
    setBusy("html"); setErr(null);
    try { await openPrintWindow(htmlUrl, label); }
    catch (e) { setErr(e instanceof Error ? e.message : "Print failed"); }
    finally { setBusy(""); }
  }
  async function handleZpl() {
    if (!zplUrl) return;
    setBusy("zpl"); setErr(null);
    try { await downloadZpl(zplUrl, zplFilename || "label.zpl"); }
    catch (e) { setErr(e instanceof Error ? e.message : "Download failed"); }
    finally { setBusy(""); }
  }

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <button className={`btn ${variant === "primary" ? "primary" : ""}`} onClick={handlePrint} disabled={disabled || busy !== ""} title={title}>
        {busy === "html" ? "Opening…" : label}
      </button>
      {zplUrl && (
        <button className="btn" onClick={handleZpl} disabled={disabled || busy !== ""} title="Download ZPL for label printer" style={{ fontSize: 11 }}>
          {busy === "zpl" ? "…" : "ZPL"}
        </button>
      )}
      {err && <span style={{ fontSize: 11, color: "var(--bad)" }}>{err}</span>}
    </span>
  );
}
