import axios from "axios";

const BASE = process.env.PARADISE_BASE_URL || "https://api.paradisepagbr.com/api/public/v1";
const API_TOKEN = process.env.PARADISE_API_TOKEN!;
const PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH!; // ex: w7jmhixqn2

if (!API_TOKEN || !PRODUCT_HASH) {
  console.error("Faltam envs PARADISE_API_TOKEN ou PARADISE_PRODUCT_HASH");
}

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

export async function createOffer(amountCents: number): Promise<ParadiseOffer> {
  const url = withToken(`/products/${PRODUCT_HASH}/offers`);
  const body = {
    title: `Pedido dinâmico — ${amountCents} cents`,
    price: amountCents,
    amount: amountCents,
    unit_price: amountCents,
  };

  console.log("[paradise] CRIAR OFERTA URL =", api.defaults.baseURL + url);
  console.log("[paradise] CRIAR OFERTA BODY =", body);

  try {
    const { data } = await api.post(url, body);
    const offerHash = data?.offer_hash || data?.hash || data?.offer?.hash;
    if (!offerHash) throw new Error("Sem offer_hash na resposta");
    return { hash: offerHash };
  } catch (err: any) {
    console.error("create_offer error:", err?.response?.status, err?.response?.data || err?.message);
    // Fallback: propagar erro para o caller decidir se ignora a oferta
    throw new Error(`create_offer: HTTP ${err?.response?.status || 500} - ${JSON.stringify(err?.response?.data || {})}`);
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
