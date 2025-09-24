const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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

export const api = {
  createCheckout(body: any) {
    return http("/checkout", { method: "POST", body: JSON.stringify(body) });
  },
  getTx(idOrHash: string) {
    return http(`/tx/${encodeURIComponent(idOrHash)}`);
  },
};