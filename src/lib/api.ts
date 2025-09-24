// src/lib/api.ts
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json() as Promise<T>;
}

export function createCheckout(body: any) {
  return http("/checkout", { method: "POST", body: JSON.stringify(body) });
}

export function getTx(idOrHash: string) {
  return http(`/tx/${encodeURIComponent(idOrHash)}`);
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
export const getCep = (zip: string) => http(`${API}/cep/${zip}`);
export const checkout = (payload: any) => postCheckout(payload);

// Compatibilidade com código existente
export const api = { createCheckout, getTx };