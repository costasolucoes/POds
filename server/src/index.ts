import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import https from "https";
import { z } from "zod";

dotenv.config();

const app = express();
const allow = [
  "https://odoutorpds.shop",
  "https://www.odoutorpds.shop",
];

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allow.includes(origin)),
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false,
}));

// garante preflight
app.options("*", cors());
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

// ====== ENV OBRIGATÓRIAS ======
const PARADISE_API_TOKEN = process.env.PARADISE_API_TOKEN!; // ex: "P7S..."
const PARADISE_PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH!; // ex: "w7jmhixqn2"
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://pods-p3qt.onrender.com";
// ==================================

const PARADISE_BASE = "https://api.paradisepagbr.com/api/public/v1";

const toNumber = (v: any) =>
  (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;
const toCents = (v: any) => {
  const n = toNumber(v);
  // se v já vier inteiro alto (ex.: 4990), mantenha
  if (typeof v === "number" && Number.isInteger(v) && v > 1000) return v;
  const c = Math.round(n * 100);
  return isNaN(c) ? 0 : c;
};

type Item = { id: string; name: string; price: number | string; quantity: number | string };

function calcTotalCents(items: Item[]): number {
  if (!Array.isArray(items) || !items.length) return 0;
  return items.reduce((acc, it) => {
    const price = toCents((it as any).price);
    const qty = parseInt(String((it as any).quantity || 1), 10) || 1;
    return acc + price * Math.max(1, qty);
  }, 0);
}

function mapCustomer(body: any) {
  const c = body?.customer || {};
  const addr = body?.shipping?.address || {};
  const phoneDigits = onlyDigits(c.phone);
  const docDigits = onlyDigits(c.document);
  const zipDigits = onlyDigits(addr.postal_code);

  // DDD/País (simples e robusto)
  const phone_country_code = phoneDigits.startsWith("55") ? "55" : "55";
  const phone_number =
    phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits || "11999999999"}`;

  return {
    name: c.name || "Cliente",
    email: c.email || "cliente@example.com",
    document: docDigits || "52998224725",
    phone_number,
    phone_country_code,
    zip_code: zipDigits || "01311000",
    street_name: addr.line1 || "Av. Paulista",
    number: String(addr.number || "1000"),
    complement: String(addr.complement || ""),
    neighborhood: addr.neighborhood || "Centro",
    city: addr.city || "São Paulo",
    state: addr.state || "SP",
    country: "br",
  };
}

function buildOfferTitle(orderId: string, itemsCount: number, surchargeCents: number) {
  const plus = surchargeCents > 0 ? ` (+R$${(surchargeCents / 100).toFixed(0)})` : "";
  return `Pedido ${orderId} — ${itemsCount} itens${plus}`;
}

async function paradiseCreateOffer({
  productHash,
  priceCents,
  title,
}: {
  productHash: string;
  priceCents: number;
  title: string;
}): Promise<string> {
  const url = `${PARADISE_BASE}/products/${productHash}/offers?api_token=${encodeURIComponent(
    PARADISE_API_TOKEN
  )}`;

  const body = {
    title,
    price: priceCents,
    amount: priceCents,
    unit_price: priceCents,
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`create_offer: HTTP ${r.status} - ${JSON.stringify(d)}`);
  }

  // Tenta várias chaves comuns para o hash da oferta
  const offerHash =
    d?.data?.hash || d?.data?.offer_hash || d?.offer_hash || d?.hash || d?.data?.code;
  if (!offerHash) {
    throw new Error(`create_offer: resposta sem offer_hash: ${JSON.stringify(d)}`);
  }
  return String(offerHash);
}

async function paradiseCreateTransaction({
  productHash,
  offerHash,
  customer,
  metadata,
  postbackUrl,
}: {
  productHash: string;
  offerHash: string;
  customer: any;
  metadata: Record<string, any>;
  postbackUrl: string;
}) {
  const url = `${PARADISE_BASE}/transactions?api_token=${encodeURIComponent(
    PARADISE_API_TOKEN
  )}`;

  // *** IMPORTANTE ***
  // Sem `amount` e sem `cart` aqui. A Paradise usará o preço da OFERTA.
  const body = {
    payment_method: "pix",
    installments: 1,
    product_hash: productHash,
    offer_hash: offerHash,
    quantity: 1,
    customer,
    metadata,
    postback_url: postbackUrl,
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`create_tx: HTTP ${r.status} - ${JSON.stringify(d)}`);
  }
  return d;
}

// ============ HANDLER =============
app.post('/checkout', async (req, res) => {
  try {
    // CORS básico (caso seu middleware global não trate)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();

    const { items = [], shipping = {}, metadata = {} } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items é obrigatório" });
    }

    // 1) Soma carrinho
    const itemsTotal = calcTotalCents(items);

    // 2) Frete (ex.: R$15 quando aplicável). Se seu critério for diferente, ajuste aqui.
    const surchargeCents = shipping?.price ? toCents(shipping.price) : 1500; // <= troque conforme sua regra
    const totalCents = itemsTotal + (surchargeCents || 0);

    if (totalCents < 500) {
      // A Paradise exige mínimo R$5
      return res.status(400).json({
        error: "valor_mínimo",
        message: "O valor da compra precisa ser no mínimo R$5,00",
      });
    }

    const orderId = `ord_${Date.now()}`;
    const title = buildOfferTitle(orderId, items.length, surchargeCents || 0);

    const customer = mapCustomer(req.body);
    const postbackUrl = `${PUBLIC_BASE_URL}/webhooks/paradise`;

    // 3) CRIA OFERTA COM O VALOR FINAL
    const offerHash = await paradiseCreateOffer({
      productHash: PARADISE_PRODUCT_HASH,
      priceCents: totalCents,
      title,
    });

    // 4) CRIA TRANSAÇÃO PIX usando APENAS product_hash + offer_hash
    const txResp = await paradiseCreateTransaction({
      productHash: PARADISE_PRODUCT_HASH,
      offerHash,
      customer,
      metadata: {
        ...metadata,
        orderId,
        surcharge_cents: String(surchargeCents || 0),
        origem: metadata?.origem || "hostinger",
      },
      postbackUrl,
    });

    // 5) NORMALIZA RESPOSTA PRO FRONT
    const tx_hash =
      txResp?.tx_hash ||
      txResp?.data?.tx_hash ||
      txResp?.data?.transaction?.hash ||
      txResp?.data?.hash ||
      txResp?.id ||
      null;

    const pix =
      txResp?.pix ||
      txResp?.data?.pix ||
      txResp?.transaction?.pix ||
      {
        // tenta campos comuns
        brcode:
          txResp?.pix_qr_code ||
          txResp?.data?.pix_qr_code ||
          txResp?.brcode ||
          txResp?.data?.brcode ||
          null,
        qr_code_base64:
          txResp?.qr_code_base64 ||
          txResp?.data?.qr_code_base64 ||
          null,
      };

    return res.json({
      ok: true,
      tx_hash,
      pix,
      raw: txResp,
    });
  } catch (err: any) {
    console.error("checkout error:", err?.message || err);
    // Tenta extrair mensagem da Paradise
    const msg =
      err?.message?.includes("HTTP")
        ? err.message
        : (err?.message || "Erro inesperado");
    return res.status(400).json({ error: "Paradise error", detail: { message: msg } });
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