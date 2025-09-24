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

// Função específica para checkout com parsing robusto
export async function postCheckout(payload: any) {
  console.debug("POST /checkout body", payload);
  
  const r = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Sempre tenta ler JSON; se vier HTML do upstream, devolve como texto
  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { error: 'invalid_upstream', detail: text }; }

  if (!r.ok) {
    // Aqui a API já deve enviar {error, detail, upstreamStatus}
    const err = typeof data === 'object' ? data : { error: 'http_error', detail: text };
    alert(`Erro ao finalizar: ${err.error || r.status}\n${JSON.stringify(err.detail || err, null, 2)}`);
    throw err;
  }
  return data;
}

// Funções da API
export const getCep = (zip: string) => fetchJson(`${API}/cep/${zip}`);
export const checkout = (payload: any) => postCheckout(payload);
export const getTx = (idOrHash: string) => fetchJson(`${API}/tx/${encodeURIComponent(idOrHash)}`);

// Compatibilidade com código existente
export function createCheckout(body: any) {
  return checkout(body);
}

export const api = { createCheckout, getTx };