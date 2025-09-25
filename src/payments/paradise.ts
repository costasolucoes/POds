// src/payments/paradise.ts
const API_BASE = "https://pods-p3qt.onrender.com"; // <- RENDER (prod)

export type CartItem = { id: string; name: string; price: number | string; quantity: number | string; };
export type Customer = { name: string; email: string; document?: string; phone?: string; };
export type Address = { line1: string; number?: string; complement?: string; neighborhood?: string; city: string; state: string; postal_code: string; country?: string; };

const toNumber = (v: any) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");
const toCents = (v: any) => { const num = toNumber(v); if (Number.isInteger(v) && v > 1000) return Number(v); const cents = Math.round(num * 100); return isNaN(cents) ? 0 : cents; };

export function normalizeCart(items: CartItem[]) {
  return items.map((it) => ({
    id: String(it.id),
    name: String(it.name),
    price: toCents(it.price),
    quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
  }));
}

// <<< ACEITA offerHash do produto ÂNCORA >>>
export function buildCheckoutPayload(params: {
  offerHash: string;            // w7jmhixqn2 (obrigatório no front)
  items: CartItem[];
  customer: Customer;
  address: Address;
  metadata?: Record<string, any>;
}) {
  const items = normalizeCart(params.items);
  return {
    offerHash: params.offerHash,    // <- vai junto!
    items,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document: onlyDigits(params.customer.document),
      phone: params.customer.phone,
    },
    shipping: {
      price: 0,
      address: {
        line1: params.address.line1,
        number: params.address.number || "1000",
        complement: params.address.complement || "",
        neighborhood: params.address.neighborhood || "Centro",
        city: params.address.city,
        state: params.address.state,
        postal_code: params.address.postal_code,
        country: params.address.country || "BR",
      },
    },
    metadata: params.metadata || {},
  };
}

export async function createCheckout(payload: ReturnType<typeof buildCheckoutPayload>) {
  // LOG pra você ver no console o que vai pro back
  console.log("[checkout payload]", payload);

  const r = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors",
  });

  const text = await r.text(); // evita quebrar se vier HTML
  if (!r.ok) throw new Error(`HTTP ${r.status} /checkout -> ${text.slice(0, 300)}`);

  let d: any;
  try { d = JSON.parse(text); } 
  catch { throw new Error(`Resposta não-JSON do back: ${text.slice(0, 300)}`); }

  const txId = d.txId || d.tx_hash || d.session?.id || null;
  const p = d.pix || d.raw?.pix || d || {};
  const pixCode = p.pix_qr_code || p.brcode || p.copia_e_cola || p.payload || null;
  const qrBase64 = p.qr_code_base64 || null;

  return { raw: d, txId, checkoutUrl: d.checkout_url || d.payment_url || null, pixCode, qrBase64 };
}

// Para o modal/polling
export async function getTxStatus(txId: string) {
  const r = await fetch(`${API_BASE}/tx/${encodeURIComponent(txId)}`, { headers: { Accept: "application/json" } });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} /tx/:id -> ${t.slice(0, 300)}`);
  return JSON.parse(t);
}