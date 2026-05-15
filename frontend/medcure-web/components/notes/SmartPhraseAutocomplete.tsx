"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SmartPhrase } from "@/lib/types";

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  phrases: SmartPhrase[];
  value: string;
  onChange: (next: string) => void;
}

interface Trigger {
  startIdx: number;   // index of the leading '.'
  query: string;      // text after '.'
  caret: { top: number; left: number };
}

export default function SmartPhraseAutocomplete({ textareaRef, phrases, value, onChange }: Props) {
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [selIdx, setSelIdx] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    return phrases
      .filter(p => p.code.toLowerCase().slice(1).startsWith(q))
      .slice(0, 8);
  }, [trigger, phrases]);

  useEffect(() => { setSelIdx(0); }, [trigger?.query]);

  function detectTrigger() {
    const ta = textareaRef.current;
    if (!ta) { setTrigger(null); return; }
    const pos = ta.selectionStart ?? 0;
    const upto = value.slice(0, pos);
    // Why: find the last '.' that starts a token (preceded by start/whitespace/newline).
    const m = upto.match(/(^|[\s\n])(\.[A-Za-z0-9_\-]*)$/);
    if (!m || !m[2]) { setTrigger(null); return; }
    const word = m[2];
    const startIdx = pos - word.length;
    const rect = ta.getBoundingClientRect();
    setTrigger({
      startIdx,
      query: word.slice(1),
      caret: { top: rect.top + 28, left: rect.left + 12 },
    });
  }

  function insert(phrase: SmartPhrase) {
    const ta = textareaRef.current;
    if (!ta || !trigger) return;
    const pos = ta.selectionStart ?? 0;
    const before = value.slice(0, trigger.startIdx);
    const after = value.slice(pos);
    const next = before + phrase.body + after;
    onChange(next);
    setTrigger(null);
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = (before + phrase.body).length;
      ta.setSelectionRange(newPos, newPos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!trigger || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx(i => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(matches[selIdx]);
    } else if (e.key === "Escape") {
      setTrigger(null);
    }
  }

  // expose keydown handler via a portal: we attach listeners on the textarea via effect.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const onKey = (e: KeyboardEvent) => handleKeyDown(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
    const onInputOrSel = () => detectTrigger();
    ta.addEventListener("keydown", onKey);
    ta.addEventListener("input", onInputOrSel);
    ta.addEventListener("click", onInputOrSel);
    ta.addEventListener("keyup", onInputOrSel);
    return () => {
      ta.removeEventListener("keydown", onKey);
      ta.removeEventListener("input", onInputOrSel);
      ta.removeEventListener("click", onInputOrSel);
      ta.removeEventListener("keyup", onInputOrSel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaRef, value, phrases, matches, selIdx, trigger]);

  if (!trigger || matches.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: trigger.caret.top,
        left: trigger.caret.left,
        background: "var(--surface, #fff)",
        border: "1px solid var(--line, #ddd)",
        borderRadius: 6,
        boxShadow: "0 6px 18px rgba(0,0,0,.12)",
        zIndex: 1000,
        minWidth: 260,
      }}
    >
      {matches.map((p, i) => (
        <div
          key={p.id}
          onMouseDown={e => { e.preventDefault(); insert(p); }}
          style={{
            padding: "6px 10px",
            background: i === selIdx ? "var(--accent, #ffe26b)" : "transparent",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          <b>{p.code}</b>{p.title ? <span style={{ color: "var(--ink-mute, #666)" }}> — {p.title}</span> : null}
        </div>
      ))}
    </div>
  );
}
