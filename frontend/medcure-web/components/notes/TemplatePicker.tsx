"use client";
import type { NoteTemplate } from "@/lib/types";

interface Props {
  templates: NoteTemplate[];
  type?: string;
  value?: number | null;
  onSelect: (t: NoteTemplate) => void;
}

export default function TemplatePicker({ templates, type, value, onSelect }: Props) {
  const filtered = type ? templates.filter(t => t.type === type) : templates;
  return (
    <select
      className="template-picker"
      value={value ?? ""}
      onChange={e => {
        const id = Number(e.target.value);
        const t = templates.find(x => x.id === id);
        if (t) onSelect(t);
      }}
      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line, #ddd)" }}
    >
      <option value="">— Template —</option>
      {filtered.map(t => (
        <option key={t.id} value={t.id}>
          [{t.scope}] {t.title}
        </option>
      ))}
    </select>
  );
}
