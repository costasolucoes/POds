import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import https from "https";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json()); // IMPORTANTE

// ---------- Utils ----------
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return s; }  // nunca explode
}

// ---------- Axios com Keep-Alive ----------
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 10_000,
  maxSockets: 100,
  maxFreeSockets: 10,
});
const api = axios.create({
  baseURL: process.env.PARADISE_API_BASE || 'https://api.paradisepagbr.com/api/public/v1',
  httpsAgent: keepAliveAgent,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  timeout: 12_000,
});

// ---------- Schemas ----------
const CartItem = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(), // centavos
  quantity: z.number().int().min(1),
  image: z.string().url().optional(),
});
const CreateCheckout = z.object({
  items: z.array(CartItem).default([]),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    document: z.string().optional(), // CPF/CNPJ
    phone: z.string().optional(),    // +55...
  }),
  // só usamos o address para preencher customer (antifraude)
  shipping: z.object({
    price: z.number().nonnegative().default(0),
    address: z.object({
      line1: z.string().default(""),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().default(""),
      state: z.string().default(""),
      postal_code: z.string().default(""),
      country: z.string().default("BR"),
    }).optional(),
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

// ---------- Offer cache (reusa por valor) ----------
const offerCache = new Map<number, { hash: string; expiresAt: number }>();
const OFFER_TTL_MS = 10 * 60 * 1000; // 10 min

async function createDynamicOffer(amountCents: number, title: string) {
  const token = process.env.PARADISE_API_TOKEN!;
  const product = process.env.PARADISE_ANCHOR_PRODUCT_HASH!;
  const url = `/products/${product}/offers?api_token=${encodeURIComponent(token)}`;
  const body = { title, price: amountCents, amount: amountCents, unit_price: amountCents };

  console.time("create_offer");
  console.log("[paradise] CRIAR OFERTA URL =", api.defaults.baseURL + url);
  console.log("[paradise] CRIAR OFERTA BODY =", JSON.stringify(body));

  const { data } = await api.post(url, body);
  console.timeEnd("create_offer");

  const offerHash = data?.hash ?? data?.offer_hash ?? data?.data?.hash;
  if (!offerHash) throw new Error("Não recebi offer_hash ao criar oferta dinâmica");
  return offerHash as string;
}
async function getOfferForAmount(amountCents: number, title: string) {
  const now = Date.now();
  const cached = offerCache.get(amountCents);
  if (cached && cached.expiresAt > now) return cached.hash;
  const hash = await createDynamicOffer(amountCents, title);
  offerCache.set(amountCents, { hash, expiresAt: now + OFFER_TTL_MS });
  return hash;
}

async function createPixTransaction(paradiseBody: any) {
  const token = process.env.PARADISE_API_TOKEN!;
  const url = `/transactions?api_token=${encodeURIComponent(token)}`;

  console.time("create_tx");
  console.log("[paradise] URL  =", api.defaults.baseURL + url);
  console.log("[paradise] BODY =", JSON.stringify(paradiseBody, null, 2));

  const { data } = await api.post(url, paradiseBody);

  console.timeEnd("create_tx");
  return data;
}

// ---------- Rotas básicas ----------
app.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));

app.get('/cep/:zip', async (req, res) => {
  try {
    const zip = (req.params.zip || '').replace(/\D/g, '');
    if (!zip) return res.status(400).json({ error: 'zip inválido' });

    // use a API que você já usava (ViaCEP, BrasilAPI, etc.)
    const r = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    const data = await r.json();
    if ((data as any).erro) return res.status(404).json({ error: 'CEP não encontrado' });

    return res.json({
      zip: zip,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || 'SP',
    });
  } catch (err: any) {
    res.status(err?.status || 500).json({ error: 'server_error', detail: String(err?.message || err) });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    console.time("checkout_total");
    console.log('[checkout] BODY =', req.body); // ajuda nos logs do Render

    const payload = req.body;

    if (!payload?.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'items é obrigatório' });
    }

    // frete grátis por regra: +R$15 se <3 itens (como ACRÉSCIMO, não frete)
    const subtotal = payload.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const totalQty = payload.items.reduce((a, i) => a + i.quantity, 0);
    const surchargeCents = totalQty < 3 ? 1500 : 0;
    const totalCents = subtotal + surchargeCents;

    const orderId = `ord_${Date.now()}`;
    const postback_url = process.env.POSTBACK_URL || `http://localhost:${process.env.PORT || 3333}/webhooks/paradise`;
    const anchorProductHash = process.env.PARADISE_ANCHOR_PRODUCT_HASH!;
    const LEAN = process.env.PARADISE_LEAN_BODY === "1";

    // endereço "safe" — sempre válido, independente do que vier do front
    const a = payload.shipping?.address || {};
    function pickOr<T>(v: any, fallback: T): T {
      const s = String(v ?? "").trim();
      return (s.length ? (v as any) : fallback) as T;
    }
    const safeZip = onlyDigits(a.postal_code);
    const addr = {
      line1: pickOr(a.line1, "Av. Paulista"),
      number: String(pickOr((a as any).number, "1000")),
      complement: pickOr((a as any).complement, ""),
      neighborhood: pickOr((a as any).neighborhood, "Bela Vista"),
      city: pickOr(a.city, "São Paulo"),
      state: pickOr(a.state, "SP"),
      postal_code: safeZip && safeZip.length === 8 ? safeZip : "01311000",
      country: (a.country || "BR").toUpperCase(),
    };

    const customer = {
      name: pickOr(payload.customer.name, "Cliente Teste"),
      email: pickOr(payload.customer.email, "cliente@example.com"),
      document: onlyDigits(payload.customer.document) || "52998224725",
      phone_number: onlyDigits(payload.customer.phone) || "11999999999",
      phone_country_code: "55",
      zip_code: addr.postal_code,
      street_name: addr.line1,
      number: addr.number,
      complement: addr.complement,
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      country: (addr.country || "BR").toLowerCase(),
    };

    // oferta dinâmica (via cache)
    const title = `Pedido ${orderId} — ${totalQty} itens${surchargeCents ? " (+R$15)" : ""}`;
    const offer_hash = await getOfferForAmount(totalCents, title);

    // item "âncora" correspondente ao valor total
    const cartItem = {
      product_hash: anchorProductHash,
      offer_hash,
      offer: offer_hash,
      quantity: 1,
      price: totalCents,
      unit_price: totalCents,
      split: false,
      title: `Pedido ${orderId}`,
    };

    // corpo COMPLETO (LEAN=0) — reduz 422 por validação do gateway
    const paradiseBody = LEAN
      ? {
          payment_method: "pix",
          amount: totalCents,
          installments: 1,
          product_hash: anchorProductHash,
          offer_hash,
          offer: offer_hash,
          quantity: 1,
          customer,
          metadata: { orderId, surcharge_cents: String(surchargeCents), ...payload.metadata },
          postback_url,
        }
      : {
          payment_method: "pix",
          amount: totalCents,
          installments: 1,
          product_hash: anchorProductHash,
          offer_hash,
          offer: offer_hash,
          quantity: 1,
          offers: [{ offer_hash, offer: offer_hash, quantity: 1 }],
          cart: [cartItem],
          customer,
          metadata: { orderId, surcharge_cents: String(surchargeCents), ...payload.metadata },
          postback_url,
        };

    const data = await createPixTransaction(paradiseBody);

    console.timeEnd("checkout_total");
    // resposta compacta pro front
    return res.json({
      tx_id: data?.id || data?.tx || data?.tx_id,
      tx_hash: data?.hash || data?.tx_hash,
      checkout_url: data?.checkout_url ?? null,
      has_pix: !!data?.pix,
      pix: data?.pix || null,
      raw: data,
    });
  } catch (err: any) {
    console.timeEnd("checkout_total");
    const status = err?.response?.status;
    const detail = err?.response?.data ?? { message: err.message };
    console.error("Erro no checkout:", status, JSON.stringify(detail, null, 2));
    return res.status(status || 500).json({ error: "Paradise error", detail });
  }
});

// ---------- Status (normaliza PIX) ----------
app.get("/tx/:idOrHash", async (req, res) => {
  const idOrHash = req.params.idOrHash;
  const token = process.env.PARADISE_API_TOKEN!;
  const base = process.env.PARADISE_API_BASE || 'https://api.paradisepagbr.com/api/public/v1';
  const isNumeric = /^\d+$/.test(idOrHash);

  const urls: string[] = [
    `${base}/transactions/${encodeURIComponent(idOrHash)}?api_token=${encodeURIComponent(token)}`,
    `${base}/transactions/hash/${encodeURIComponent(idOrHash)}?api_token=${encodeURIComponent(token)}`,
  ];
  if (isNumeric) urls.unshift(`${base}/transactions/id/${encodeURIComponent(idOrHash)}?api_token=${encodeURIComponent(token)}`);
  urls.push(
    `${base}/transactions?api_token=${encodeURIComponent(token)}&transaction_hash=${encodeURIComponent(idOrHash)}`,
    `${base}/transactions?api_token=${encodeURIComponent(token)}&id=${encodeURIComponent(idOrHash)}`
  );

  for (const u of urls) {
    try {
      const { data } = await api.get(u.replace(base, ""));
      const tx = Array.isArray(data?.data) ? data.data[0] ?? data : data;

      const status = tx?.payment_status || tx?.status;
      const p = tx?.pix || {};
      const brcode = p.pix_qr_code || p.brcode || p.copia_e_cola || p.payload || null;
      const qr64 = p.qr_code_base64 || null;

      return res.json({ status, pix: brcode || qr64 ? { brcode, qr_code_base64: qr64 } : null, raw: tx });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      if (/not found|não encontrada|404|422/i.test(msg)) continue;
      if (e?.response?.status === 401) return res.status(401).json({ error: "Unauthenticated" });
      continue;
    }
  }
  return res.status(404).json({ error: "Transação não encontrada (tente com o tx_hash)" });
});

// ---------- Webhook ----------
app.post("/webhooks/paradise", async (req, res) => {
  try {
    const event = req.body;
    const txHash = event?.transaction_hash || event?.hash;
    const status = event?.payment_status || event?.status;
    console.log("[webhook] recebido:", { txHash, status });
    // TODO: atualizar pedido no banco
    return res.status(200).send("ok");
  } catch {
    return res.status(200).send("ok");
  }
});

// ---------- Alias para /api/* (compatibilidade) ----------
app.post("/api/checkout", (req, res) =>
  app._router.handle({ ...req, url: "/checkout", originalUrl: "/checkout" } as any, res, () => {})
);
app.get("/api/tx/:idOrHash", (req, res) =>
  app._router.handle({ ...req, url: `/tx/${req.params.idOrHash}`, originalUrl: `/tx/${req.params.idOrHash}` } as any, res, () => {})
);
app.post("/api/webhooks/paradise", (req, res) =>
  app._router.handle({ ...req, url: "/webhooks/paradise", originalUrl: "/webhooks/paradise" } as any, res, () => {})
);

// ---------- Start ----------
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));