import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import https from "https";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(cors({ origin: ['https://odoutorpds.shop', 'http://localhost:5173'] }));
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
  baseURL: process.env.PARADISE_API_BASE,
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
    console.log('[checkout] BODY =', req.body); // ajuda nos logs do Render

    const {
      items = [],                // [{ title, price, quantity }]
      customer = {},
      address = {},
      shipping_cents = 0,
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items é obrigatório' });
    }

    // soma em centavos com fallback pra unit_price/price
    const amount = items.reduce((acc: number, it: any) => {
      const q = Number(it.quantity ?? 1);
      const p = Number(it.unit_price ?? it.price ?? 0);
      return acc + q * p;
    }, 0);

    const totalQty = items.reduce((acc: number, it: any) => acc + Number(it.quantity ?? 1), 0);
    const orderId = `ord_${Date.now()}`;
    const title = `Pedido ${orderId} — ${totalQty} itens`;

    // 🔐 envs
    const API_TOKEN = process.env.PARADISE_API_TOKEN!;
    const PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH!;
    const POSTBACK_URL = process.env.POSTBACK_URL || `${process.env.PUBLIC_URL || ''}/webhooks/paradise`;

    const base = 'https://api.paradisepagbr.com/api/public/v1';

    // 1) cria oferta dinâmica
    const offerResp = await fetch(
      `${base}/products/${PRODUCT_HASH}/offers?api_token=${API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: amount,
          amount,
          unit_price: amount,
        }),
      }
    );
    const offerText = await offerResp.text();
    const offerJson = safeParse(offerText);
    if (!offerResp.ok) {
      console.error('[paradise] criar oferta FAIL', offerJson);
      return res.status(offerResp.status).json({ error: 'paradise_offer', detail: offerJson });
    }
    const offer_hash =
      offerJson?.hash || offerJson?.offer_hash || offerJson?.data?.hash || offerJson?.data?.offer_hash;

    // 2) monta o payload SEM depender do front te mandar `cart`
    const txPayload = {
      payment_method: 'pix',
      amount,
      installments: 1,
      product_hash: PRODUCT_HASH,
      offer_hash,
      quantity: 1,
      offers: [{ offer_hash, offer: offer_hash, quantity: 1 }],
      cart: [
        {
          product_hash: PRODUCT_HASH,
          offer_hash,
          offer: offer_hash,
          quantity: 1,
          price: amount,
          unit_price: amount,
          split: false,
          title,
        },
      ],
      customer: {
        name: customer?.name || 'Cliente',
        email: customer?.email || 'cliente@example.com',
        document: customer?.document || '',
      },
      shipping: {
        method: 'Normal',
        amount: Number(shipping_cents) || 0, // você disse frete grátis
        address: {
          line1: address?.street || '',
          city: address?.city || '',
          state: address?.state || 'SP',
          postal_code: address?.zip || '',
          country: 'BR',
        },
      },
      metadata: {
        orderId,
        shipping_cents: String(Number(shipping_cents) || 0),
      },
      postback_url: POSTBACK_URL,
    };

    console.log('[paradise] BODY =', JSON.stringify(txPayload, null, 2));

    // 3) cria transação
    const txResp = await fetch(`${base}/transactions?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txPayload),
    });

    const txText = await txResp.text();
    const txJson = safeParse(txText);
    if (!txResp.ok) {
      console.error('[paradise] TX FAIL', txJson);
      return res.status(txResp.status).json({ error: 'Paradise error', detail: txJson });
    }

    // resposta compacta pro front
    return res.json({
      tx_id: txJson?.id || txJson?.tx || txJson?.tx_id,
      tx_hash: txJson?.hash || txJson?.tx_hash,
      checkout_url: txJson?.checkout_url ?? null,
      has_pix: !!txJson?.pix,
      pix: txJson?.pix || null,
    });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err?.message || err;
    res.status(status).json({ error: 'server_error', detail: String(data) }); // **sempre JSON**
  }
});

// ---------- Status (normaliza PIX) ----------
app.get("/tx/:idOrHash", async (req, res) => {
  const idOrHash = req.params.idOrHash;
  const token = process.env.PARADISE_API_TOKEN!;
  const base = process.env.PARADISE_API_BASE!;
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
app.get("/api/tx/:idOrHash", (req, res) => app._router.handle({ ...req, url: `/tx/${req.params.idOrHash}`, originalUrl: `/tx/${req.params.idOrHash}` } as any, res, () => {}));
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/api/webhooks/paradise", (req, res) => app._router.handle({ ...req, url: "/webhooks/paradise", originalUrl: "/webhooks/paradise" } as any, res, () => {}));

// ---------- Start ----------
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));