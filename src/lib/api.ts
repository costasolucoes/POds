// src/lib/api.ts
const API = import.meta.env.VITE_API_URL || 'https://pods-p3qt.onrender.com';

// Fetch robusto que lida com respostas não-JSON
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`HTTP ${res.status} ${new URL(url).pathname}: ${msg}`);
  }
  return data;
}

export function postJson(url: string, body: unknown) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Funções da API
export const getCep = (zip: string) => fetchJson(`${API}/cep/${zip}`);
export const checkout = (payload: any) => postJson(`${API}/checkout`, payload);
export const getTx = (idOrHash: string) => fetchJson(`${API}/tx/${encodeURIComponent(idOrHash)}`);

// Compatibilidade com código existente
export function createCheckout(body: any) {
  return checkout(body);
}

export const api = { createCheckout, getTx };