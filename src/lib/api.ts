// src/lib/api.ts
const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export async function post<T>(path: string, body: any): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

export async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

// Funções específicas para compatibilidade
export function createCheckout(body: any) {
  return post("/checkout", body);
}

export function getTx(idOrHash: string) {
  return get(`/tx/${encodeURIComponent(idOrHash)}`);
}

export function getCep(zip: string) {
  return get(`/cep/${zip}`);
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

// Compatibilidade com código existente
export const checkout = (payload: any) => postCheckout(payload);
export const api = { createCheckout, getTx };