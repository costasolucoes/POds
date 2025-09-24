import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import https from "https";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---------- Utils ----------
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

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

// ---------- API de CEP ----------
app.get("/api/cep/:cep", async (req, res) => {
  const cep = req.params.cep.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    return res.status(400).json({ error: "CEP deve ter 8 dígitos" });
  }

  try {
    // Usar a API ViaCEP
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (response.data.erro) {
      return res.status(404).json({ error: "CEP não encontrado" });
    }

    const { logradouro, bairro, localidade, uf } = response.data;
    
    res.json({
      cep: cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
      logradouro,
      bairro,
      localidade,
      uf
    });
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ---------- Checkout ----------
app.post("/checkout", async (req, res) => {
  console.time("checkout_total");
  const parsed = CreateCheckout.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payload = parsed.data;

  const orderId = `ord_${Date.now()}`;

  // frete grátis => total = itens
  const totalCents = payload.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalQty = payload.items.reduce((a, i) => a + i.quantity, 0);
  const postback_url = process.env.POSTBACK_URL || `http://localhost:${process.env.PORT || 3333}/webhooks/paradise`;
  const anchorProductHash = process.env.PARADISE_ANCHOR_PRODUCT_HASH!;
  const LEAN = process.env.PARADISE_LEAN_BODY === "1";

  try {
    // oferta dinâmica (via cache)
    const title = `Pedido ${orderId} — ${totalQty} itens`;
    const offer_hash = await getOfferForAmount(totalCents, title);

    // customer completo (endereço vai aqui p/ antifraude)
    const addr = payload.shipping?.address || {
      line1: "Av. Paulista",
      number: "1000",
      complement: "",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      postal_code: "01311000",
      country: "BR",
    };
    const customer = {
      name: payload.customer.name,
      email: payload.customer.email,
      document: onlyDigits(payload.customer.document),
      phone_number: onlyDigits(payload.customer.phone),
      phone_country_code: "55",
      zip_code: onlyDigits(addr.postal_code),
      street_name: addr.line1,
      number: String((addr as any).number ?? "1000"),
      complement: (addr as any).complement ?? "",
      neighborhood: (addr as any).neighborhood ?? "Bela Vista",
      city: addr.city,
      state: addr.state,
      country: (addr.country || "BR").toLowerCase(),
    };

    // corpo mínimo (rápido) ou completo (compat)
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
          metadata: { orderId, ...payload.metadata },
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
          metadata: { orderId, ...payload.metadata },
          postback_url,
        };

    const data = await createPixTransaction(paradiseBody);

    const tx_id = data.id ?? data.transaction?.id ?? null;
    const tx_hash = data.transaction_hash ?? data.hash ?? data.transaction?.hash ?? null;

    console.log(
      "[paradise] RESP =",
      JSON.stringify(
        {
          tx_id,
          tx_hash,
          status: data.status || data.payment_status,
          checkout_url: data.checkout_url || data.payment_url || null,
          has_pix: !!(data.pix && (data.pix.pix_qr_code || data.pix.qr_code_base64 || data.pix.brcode)),
        },
        null,
        2
      )
    );
    console.timeEnd("checkout_total");

    // Log detalhado dos dados PIX
    console.log("[paradise] PIX data:", JSON.stringify(data.pix, null, 2));
    
    return res.json({
      order_id: orderId,
      offer_hash,
      tx_id,
      tx_hash,
      session: { id: tx_hash ?? tx_id, status: data.status || data.payment_status || "pending" },
      checkout_url: data.checkout_url || data.payment_url || null,
      pix: data.pix || null,
      raw: data,
    });
  } catch (err: any) {
    console.timeEnd("checkout_total");
    const detail = err?.response?.data ?? { message: err.message };
    console.error("Erro no checkout:", detail);
    return res.status(err?.response?.status || 500).json({ error: "Paradise error", detail });
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
app.post("/api/checkout", (req, res) => app._router.handle({ ...req, url: "/checkout", originalUrl: "/checkout" } as any, res, () => {}));
app.get("/api/tx/:idOrHash", (req, res) => app._router.handle({ ...req, url: `/tx/${req.params.idOrHash}`, originalUrl: `/tx/${req.params.idOrHash}` } as any, res, () => {}));
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/api/webhooks/paradise", (req, res) => app._router.handle({ ...req, url: "/webhooks/paradise", originalUrl: "/webhooks/paradise" } as any, res, () => {}));

// ---------- Start ----------
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));