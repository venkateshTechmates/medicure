type Tone = "good" | "warn" | "bad" | "info" | "neutral";

function toneFor(status?: string): Tone {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (["good", "ok", "completed", "complete", "resulted", "paid", "active", "confirmed", "final"].includes(s)) return "good";
  if (["warn", "warning", "pending", "scheduled", "draft", "submitted", "in progress", "in-progress", "open"].includes(s)) return "warn";
  if (["bad", "critical", "cancelled", "canceled", "denied", "failed", "abnormal", "high", "low"].includes(s)) return "bad";
  if (["info", "new", "unread"].includes(s)) return "info";
  return "neutral";
}

export default function StatusPill({ status, tone }: { status?: string; tone?: Tone }) {
  const t = tone ?? toneFor(status);
  const cls = t === "neutral" ? "pill" : `pill ${t}`;
  return (
    <span className={cls}>
      <span className="pdot" />
      {status ?? "—"}
    </span>
  );
}
