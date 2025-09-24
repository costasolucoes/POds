import { BACKEND_URL, ANCHOR_PRODUCT } from "@/config/checkout";

const num = (v:any) =>
  (typeof v === "number" ? v :
   parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;

const toCents = (v:any) =>
  (Number.isInteger(v) && v > 999) ? Number(v) : Math.round(num(v) * 100);

export function buildCheckoutPayload({
  items, customer, address, metadata
}: {
  items: Array<{ id:string; name:string; price:number|string; quantity:number|string }>;
  customer: { name:string; email:string; document?:string; phone?:string };
  address: {
    line1:string; number?:string; complement?:string; neighborhood?:string;
    city:string; state:string; postal_code:string; country?:string;
  };
  metadata?: Record<string, any>;
}) {
  return {
    // <<< produto base fixo (OBRIGATÓRIO)
    offerHash: ANCHOR_PRODUCT,

    items: items.map(i => ({
      id: String(i.id),
      name: String(i.name),
      price: toCents(i.price),
      quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1),
    })),
    customer,
    shipping: {
      price: 0,
      address: {
        line1: address.line1,
        number: address.number || "S/N",
        complement: address.complement || "",
        neighborhood: address.neighborhood || "Centro",
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country || "BR",
      },
    },
    metadata: { origem: "hostinger", ...(metadata || {}) },
  };
}

export async function createCheckout(payload: ReturnType<typeof buildCheckoutPayload>) {
  const r = await fetch(`${BACKEND_URL}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const txt = await r.text().catch(()=> "");
    throw new Error(`HTTP ${r.status} /checkout: ${txt}`);
  }
  const d = await r.json();
  return {
    txId: d.txId || d.tx_hash || d.session?.id || "",
    pixCode:
      d.brcode || d.pix?.brcode || d.pix?.payload || d.pix?.copia_e_cola || d.pix_qr_code || null,
    qrBase64: d.qrBase64 || d.pix?.qr_code_base64 || null,
  };
}
