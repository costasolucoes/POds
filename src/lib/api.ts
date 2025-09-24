// src/lib/api.ts
const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
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

export function createCheckout(body: any) {
  return http<{ tx_hash?: string; session?: { id?: string }; pix?: any; raw?: any; checkout_url?: string }>(
    "/checkout",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function getTx(idOrHash: string) {
  return http<{ status: string; pix?: { brcode?: string; qr_code_base64?: string }; raw: any }>(
    `/tx/${encodeURIComponent(idOrHash)}`
  );
}

export const api = { createCheckout, getTx };
