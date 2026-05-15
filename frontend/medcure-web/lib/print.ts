const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("medcure_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/// Opens a new window with the given HTML payload or a same-origin URL, then triggers print.
/// When given an API path, we fetch with auth, then write to the new window because the
/// JWT can't be attached to a plain `window.open(href)`.
export async function openPrintWindow(htmlOrUrl: string, title = "MedCure print") {
  let html = htmlOrUrl;
  if (htmlOrUrl.startsWith("/api/") || htmlOrUrl.startsWith("http")) {
    const url = htmlOrUrl.startsWith("http") ? htmlOrUrl : `${BASE}${htmlOrUrl}`;
    const res = await fetch(url, { headers: authHeader(), cache: "no-store" });
    if (!res.ok) throw new Error(`print fetch ${res.status}`);
    html = await res.text();
  }
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) throw new Error("Popup blocked — allow popups for printing");
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.document.title = title;
}

/// Downloads a ZPL text payload as a file. The user can then send it to a Zebra printer
/// via their OS print spooler or printer agent.
export async function downloadZpl(pathOrText: string, filename: string) {
  let text = pathOrText;
  if (pathOrText.startsWith("/api/") || pathOrText.startsWith("http")) {
    const url = pathOrText.startsWith("http") ? pathOrText : `${BASE}${pathOrText}`;
    const res = await fetch(url, { headers: authHeader(), cache: "no-store" });
    if (!res.ok) throw new Error(`zpl fetch ${res.status}`);
    text = await res.text();
  }
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
