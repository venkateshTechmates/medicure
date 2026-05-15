"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShortcutHelp from "./ShortcutHelp";

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

export default function GlobalShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let pending: string | null = null;       // first key of a chord
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearChord() {
      pending = null;
      if (timer) { clearTimeout(timer); timer = null; }
    }

    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // ? — show help overlay
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // n — new note
      if (e.key === "n" && !pending) {
        e.preventDefault();
        router.push("/note-composer");
        return;
      }

      // / handled by UniversalSearch focus

      // g chord
      if (pending === "g") {
        e.preventDefault();
        if (e.key === "p") router.push("/patients");
        else if (e.key === "i") router.push("/inbasket");
        else if (e.key === "o") router.push("/");
        else if (e.key === "l") router.push("/labs");
        else if (e.key === "m") router.push("/messages");
        else if (e.key === "a") router.push("/appointments");
        else if (e.key === "h") router.push("/pharmacy");
        else if (e.key === "s") router.push("/settings");
        else if (e.key === "e") router.push("/ed");
        clearChord();
        return;
      }
      if (e.key === "g") {
        pending = "g";
        timer = setTimeout(clearChord, 900);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
