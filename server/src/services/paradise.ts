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

type CreateOfferResponse = {
  success?: boolean;
  status?: number;
  data?: any;
  offer_hash?: string;        // alguns clusters retornam direto
  offer?: { hash?: string };  // outros retornam aninhado
  price?: number;
  amount?: number;
  message?: string;
};

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
}): Promise<string | null> {
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
    const offerHash =
      resp?.offer_hash ||
      resp?.offer?.hash ||
      resp?.data?.offer_hash ||
      resp?.data?.offer?.hash ||
      null;
    if (!offerHash) {
      console.warn("[paradise] WARN: createOffer sem hash retornado");
      return null;
    }
    return offerHash;
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
