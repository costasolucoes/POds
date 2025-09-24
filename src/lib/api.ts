// src/lib/api.ts
const envBase = (import.meta as any)?.env?.VITE_API_URL || "";
const API_BASE =
  String(envBase).trim() ||
  (typeof window !== "undefined"
    ? (window as any).API_BASE || "" // opcional, se você setar em window
    : "") ||
  "http://localhost:3333"; // fallback dev

const BASE = API_BASE.replace(/\/$/, "");

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} on ${url}: ${txt}`);
  }
  return (await r.json()) as T;
}

export const api = {
  postCheckout: (body: any) =>
    http<{
      tx_hash?: string;
      session?: { id?: string };
      pix?: any;
      raw?: any;
      checkout_url?: string;
    }>("/checkout", { method: "POST", body: JSON.stringify(body) }),

  getTx: (idOrHash: string) =>
    http<{ status: string; pix?: { brcode?: string; qr_code_base64?: string }; raw: any }>(
      `/tx/${encodeURIComponent(idOrHash)}`
    ),

  BASE,
};