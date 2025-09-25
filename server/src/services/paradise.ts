import axios from "axios";

// Suporta nomes novos e antigos de env para evitar quebra em produção
const BASE =
  process.env.PARADISE_BASE_URL ||
  process.env.PARADISE_API_BASE || // legacy
  "https://api.paradisepagbr.com/api/public/v1";
const API_TOKEN = process.env.PARADISE_API_TOKEN!;
const PRODUCT_HASH =
  process.env.PARADISE_PRODUCT_HASH ||
  process.env.PARADISE_ANCHOR_PRODUCT || // legacy
  process.env.PARADISE_ANCHOR_PRODUCT_HASH || // legacy doc
  "";

if (!API_TOKEN || !PRODUCT_HASH) {
  console.error("Faltam envs PARADISE_API_TOKEN ou PARADISE_PRODUCT_HASH/ANCHOR_PRODUCT(_HASH)");
}

type CreateOfferResponse = any; // formatos variam entre clusters

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

function withToken(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}api_token=${encodeURIComponent(API_TOKEN)}`;
}

export type ParadiseOffer = {
  hash: string; // offer_hash retornado
};

export async function createOffer(params: {
  productHash: string;
  amount: number; // em centavos
  title?: string;
}): Promise<{ hash: string; price?: number } | null> {
  const { productHash, amount, title } = params;
  const url = `${BASE}/products/${productHash}/offers?api_token=${API_TOKEN}`;
  const body = {
    title: title || `Pedido dinâmico — ${amount} cents`,
    price: amount,
    amount: amount,
    unit_price: amount,
  };
  console.log("[paradise] CRIAR OFERTA URL =", url);
  console.log("[paradise] CRIAR OFERTA BODY =", body);
  try {
    const { data } = await axios.post(url, body, { timeout: 15000 });
    const resp = data as CreateOfferResponse;
    console.log("[paradise] CRIAR OFERTA RESP =", JSON.stringify(resp, null, 2));
    // Captura hash em todos os formatos conhecidos
    const offerHash =
      resp?.hash ||
      resp?.offer_hash ||
      resp?.data?.hash ||
      resp?.data?.offer_hash ||
      resp?.offer?.hash ||
      resp?.data?.offer?.hash ||
      null;
    const price =
      resp?.price ??
      resp?.amount ??
      resp?.data?.price ??
      resp?.data?.amount ??
      undefined;
    if (!offerHash) {
      console.warn("[paradise] WARN: createOffer sem hash retornado (formatos testados: hash, offer_hash, data.hash, data.offer_hash, offer.hash, data.offer.hash)");
      return null;
    }
    return { hash: offerHash, price };
  } catch (err: any) {
    console.error("create_offer error:", err?.response?.status, err?.response?.data || err?.message);
    return null;
  }
}

export type ParadiseTxResponse = {
  transaction_hash?: string;
  br_code?: string;
  brcode?: string;
  qr_code?: string;
  qr_code_base64?: string;
};

export async function createTransaction(payload: any): Promise<ParadiseTxResponse> {
  const url = withToken(`/transactions`);

  console.log("[paradise] URL  =", api.defaults.baseURL + url);
  console.log("[paradise] BODY =", payload);

  const { data } = await api.post(url, payload);
  return data;
}
