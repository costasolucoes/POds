// src/payments/paradise.ts
export type CartItem = {
  id: string;
  name: string;
  price: number | string;   // aceita 39.99, "39,99", "R$ 39,99", 3999...
  quantity: number | string;
};

export type Customer = {
  name: string;
  email: string;
  document?: string; // CPF
  phone?: string;    // +55 (11) 99999-9999
};

export type Address = {
  line1: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code: string; // pode vir com traço
  country?: string;    // BR
};

// -------- utils --------
const toNumber = (v: any) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");
const toCents = (v: any) => {
  // se veio 3999 (centavos), mantenha; se veio 39.99/"39,99", converte
  const num = toNumber(v);
  if (Number.isInteger(v) && v > 1000) return Number(v);
  const cents = Math.round(num * 100);
  return isNaN(cents) ? 0 : cents;
};

// Garante que cada item tenha {id,name,price(cents),quantity(int)}
export function normalizeCart(items: CartItem[]) {
  return items.map((it) => ({
    id: String(it.id),
    name: String(it.name),
    price: toCents(it.price),
    quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
  }));
}

// Monta o payload exatamente como o backend quer
export function buildCheckoutPayload(params: {
  items: CartItem[];
  customer: Customer;
  address: Address;
  metadata?: Record<string, string>;
}) {
  const items = normalizeCart(params.items);
  return {
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
        country: (params.address.country || "BR"),
      },
    },
    metadata: params.metadata || {},
  };
}

// Chama a API do seu backend (sem /api)
export async function createCheckout(payload: ReturnType<typeof buildCheckoutPayload>) {
  const r = await fetch("http://localhost:3333/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`HTTP ${r.status} /checkout: ${txt}`);
  }
  const d = await r.json();
  const txId = d.tx_hash || d.session?.id;
  const pixObj = d.pix || d.raw?.pix || {};
  const pixCode = pixObj.pix_qr_code || pixObj.brcode || pixObj.copia_e_cola || pixObj.payload || null;
  const qrBase64 = pixObj.qr_code_base64 || null;

  return {
    raw: d,
    txId,
    checkoutUrl: d.checkout_url || d.payment_url || null,
    pixCode,
    qrBase64,
  };
}
