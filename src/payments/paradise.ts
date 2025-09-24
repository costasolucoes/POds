// payments/paradise.ts
export type CartItem = {
  id: string;
  name: string;
  price: number | string;  // pode vir "R$ 54,90" ou 54.9
  quantity: number | string;
};

export type Customer = {
  name: string;
  email: string;
  document: string;
  phone: string;
};

const API_BASE = "https://pods-p3qt.onrender.com";

// ENDEREÇO FIXO — sempre enviado pro backend
const FIXED_ADDRESS = {
  line1: "Av. Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  postal_code: "01311-000",
  country: "BR",
};

function toCents(v: number | string): number {
  if (typeof v === "number") return Math.round(v * 100);
  const clean = String(v).replace(/[^\d,,-.]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(clean);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function buildCheckoutPayload(input: {
  items: CartItem[];
  customer: Customer;
  // address pode ser passado mas SERÁ IGNORADO (vamos sempre usar FIXED_ADDRESS)
  address?: any;
  metadata?: Record<string, any>;
}) {
  const items = (input.items || []).map((i) => ({
    id: i.id,
    name: i.name,
    price: toCents(i.price),
    quantity: Number(i.quantity),
  }));

  return {
    items,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      document: input.customer.document,
      phone: input.customer.phone,
    },
    shipping: {
      price: 0,
      address: { ...FIXED_ADDRESS }, // <— fixo, sempre
    },
    metadata: { ...(input.metadata || {}) },
  };
}

export async function createCheckout(payload: any) {
  const r = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try { data = await r.json(); } catch {}

  if (!r.ok) {
    console.error("Checkout erro:", r.status, data);
    throw data || { error: "checkout_failed", status: r.status };
  }

  // Normaliza campos de resposta (checkout URL / PIX)
  const p = data || {};
  return {
    checkoutUrl: p.checkout_url || p.checkoutUrl || null,
    txId: p.tx_id || p.txId || p.id || null,
    pixCode: p.brcode || p.pix_qr_code || p.copia_e_cola || p.payload || null,
    qrBase64: p.qr_code_base64 || p.qrBase64 || null,
    raw: p,
  };
}

// Polling de transação (para o modal)
export async function getTx(txId: string) {
  const r = await fetch(`${API_BASE}/tx/${encodeURIComponent(txId)}`);
  if (!r.ok) throw new Error(`TX ${r.status}`);
  return r.json();
}

// Lookup de CEP — USO SOMENTE NA UI (não vai pro payload)
export async function fetchCep(cep: string) {
  const r = await fetch(`${API_BASE}/cep/${encodeURIComponent(cep)}`);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`HTTP ${r.status} /cep: ${JSON.stringify(err)}`);
  }
  return r.json();
}