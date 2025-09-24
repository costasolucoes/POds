// payments/paradise.ts
export type CartItem = { id: string; name: string; price: number | string; quantity: number | string; };
export type Customer = { name: string; email: string; document: string; phone: string; };

const API_BASE = "https://pods-p3qt.onrender.com";

// OPCIONAL: se quiser forçar um ID/nome de produto base específico:
const BASE_ITEM_ID = "base-offer";
const BASE_ITEM_NAME = "Pedido Loja (PIX)";

// ENDEREÇO FIXO — SEMPRE enviado
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
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function sumCartInCents(items: CartItem[]): number {
  return (items || []).reduce((acc, it) => acc + toCents(it.price) * Number(it.quantity || 1), 0);
}

export function buildCheckoutPayload(input: {
  items: CartItem[];
  customer: Customer;
  address?: any; // ignorado
  metadata?: Record<string, any>;
}) {
  if (!input.items || input.items.length === 0) throw new Error("empty_cart");

  const totalInCents = sumCartInCents(input.items);
  if (totalInCents <= 0) throw new Error("invalid_total");

  // >>>>> AQUI: 1 item base, qty=1, price = TOTAL DO CARRINHO
  const baseItem = {
    id: BASE_ITEM_ID || input.items[0].id,
    name: BASE_ITEM_NAME || input.items[0].name,
    price: totalInCents,
    quantity: 1,
  };

  return {
    items: [baseItem],
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      document: input.customer.document,
      phone: input.customer.phone,
    },
    shipping: { price: 0, address: { ...FIXED_ADDRESS } },
    metadata: { ...(input.metadata || {}), cartRaw: input.items.map(i => ({ id: i.id, q: i.quantity })) },
  };
}

export async function createCheckout(payload: any) {
  // Importa a função createCheckout do api.ts
  const { createCheckout: apiCreateCheckout } = await import('@/lib/api');
  
  try {
    const data = await apiCreateCheckout(payload);
    
    const p = data || {};
    return {
      checkoutUrl: p.checkout_url || p.checkoutUrl || null,
      txId: p.tx_id || p.txId || p.id || null,
      pixCode: p.brcode || p.pix_qr_code || p.copia_e_cola || p.payload || null,
      qrBase64: p.qr_code_base64 || p.qrBase64 || null,
      raw: p,
    };
  } catch (error: any) {
    console.error("Checkout erro:", error);
    // ajuda debugar no browser
    console.debug("[checkout payload enviado]", payload);
    throw error;
  }
}

// Polling de transação (para o modal)
export async function getTx(txId: string) {
  const { getTx: apiGetTx } = await import('@/lib/api');
  return apiGetTx(txId);
}

// Lookup de CEP — USO SOMENTE NA UI (não vai pro payload)
export async function fetchCep(cep: string) {
  const { getCep } = await import('@/lib/api');
  return getCep(cep);
}