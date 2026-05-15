const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("medcure_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("medcure_token");
    if (!location.pathname.startsWith("/sign-in")) location.href = "/sign-in";
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function downloadFile(path: string, suggestedName: string) {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("medcure_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${BASE}${path}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
