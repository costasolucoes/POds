import { Request, Response } from "express";
import { sumCents, toInt } from "../utils/price";
import { createOffer, createTransaction } from "../services/paradise";

// Validação simples do corpo recebido do front
type CheckoutRequest = {
  offerHash?: string;         // Hash da oferta (obrigatório)
  items: Array<{ title: string; price: number; quantity?: number }>;
  shipping?: { price?: number };
  customer: {
    name: string;
    email: string;
    document: string;         // CPF
    phone: string;            // ex: "5511999999999"
    phone_country_code?: string; // opcional; se não vier, extraímos do phone
    zip_code?: string;
    street_name?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;         // "br"
  };
  metadata?: Record<string, any>;
  payment_method?: "pix" | "card";
};

function parsePhone(full: string) {
  // Se vier "5511999999999" extraímos "55" + restante
  const onlyDigits = (full || "").replace(/\D+/g, "");
  const defaultCountry = "55";
  if (onlyDigits.startsWith(defaultCountry)) {
    return { country: defaultCountry, number: onlyDigits };
  }
  // fallback: país padrão 55
  return { country: defaultCountry, number: `${defaultCountry}${onlyDigits}` };
}

export async function checkoutHandler(req: Request, res: Response) {
  try {
    // CORS duro também aqui (opcional — o global já cuida)
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Vary", "Origin");

    // Validação e fallback do offerHash
    const body = req.body || {};
    const offerHash = body.offerHash || process.env.PARADISE_ANCHOR_PRODUCT || process.env.PARADISE_PRODUCT_HASH; // fallback
    
    console.log("[DEBUG] body.offerHash:", body.offerHash);
    console.log("[DEBUG] PARADISE_ANCHOR_PRODUCT:", process.env.PARADISE_ANCHOR_PRODUCT);
    console.log("[DEBUG] offerHash final:", offerHash);
    
    if (!offerHash) {
      return res.status(422).json({
        success: false,
        message: "O hash da oferta é obrigatório"
      });
    }
    const cart = (body.items || []).map((i: any) => ({
      // aceita title ou name
      title: i.title || i.name || "Item",
      unit_price: toInt(i.price),
      quantity: i.quantity ?? 1,
    }));
    // soma total do carrinho em centavos
    const cartAmount = cart.reduce((sum: number, it: any) => sum + (it.unit_price * (it.quantity ?? 1)), 0);

    const shippingCents = toInt(body?.shipping?.price || 0);
    const subTotal = sumCents(body.items || []);
    const amount = subTotal + shippingCents;

    if (amount < 500) {
      // Paradise exige mínimo de R$5,00
      return res.status(400).json({
        ok: false,
        error: "min_amount",
        detail: { message: "O valor da compra precisa ser no mínimo R$ 5,00" },
      });
    }

    // Offer dinâmica — se falhar (500/{}), seguimos sem a oferta
    let dynamicOfferHash: string | undefined;
    try {
      const offer = await createOffer(amount);
      dynamicOfferHash = offer.hash;
    } catch (e) {
      console.warn("createOffer falhou, seguindo sem offer_hash.", String(e));
    }

    // Cliente
    const { country, number } = parsePhone(body.customer.phone);
    const customer = {
      name: body.customer.name,
      email: body.customer.email,
      document: body.customer.document,
      phone_number: number,          // Paradise espera "5511999..."
      phone_country_code: country,   // "55"
      zip_code: body.customer.zip_code || "01311000",
      street_name: body.customer.street_name || "Av. Paulista",
      number: body.customer.number || "1000",
      complement: body.customer.complement || "",
      neighborhood: body.customer.neighborhood || "Bela Vista",
      city: body.customer.city || "São Paulo",
      state: body.customer.state || "SP",
      country: (body.customer.country || "br").toLowerCase(),
    };

    // Se houver offer (dinâmica ou fixa), enviamos:
    // - amount (obrigatório pela Paradise)
    // - offer (hash da oferta criada)
    // - NÃO enviamos cart (para não conflitar com a oferta)
    const hasOffer = Boolean(dynamicOfferHash || offerHash);
    const payload = hasOffer
      ? {
          payment_method: body.payment_method || "pix",
          // Paradise aceita "offer" (recomendado). Mantemos também "offer_hash" por compat.
          offer: (dynamicOfferHash || offerHash)!,
          offer_hash: (dynamicOfferHash || offerHash)!,
          amount: amount ?? cartAmount, // manter o total em centavos (ex.: 4990)
          customer: {
            name: body.customer?.name,
            email: body.customer?.email,
            document: body.customer?.document,
            phone_number: customer.phone_number,
            phone_country_code: customer.phone_country_code,
            zip_code: customer.zip_code,
            street_name: customer.street_name,
            number: customer.number,
            complement: customer.complement,
            neighborhood: customer.neighborhood,
            city: customer.city,
            state: customer.state,
            country: customer.country,
          },
          installments: 1,
          product_hash: offerHash, // produto âncora
          quantity: 1,
          shipping: { price: shippingCents },
          postback_url: process.env.PARADISE_POSTBACK_URL || process.env.POSTBACK_URL,
          metadata: body.metadata || {},
          // sem cart quando há oferta
        }
      : {
          payment_method: body.payment_method || "pix",
          amount: amount ?? cartAmount,
          customer: {
            name: body.customer?.name,
            email: body.customer?.email,
            document: body.customer?.document,
            phone_number: customer.phone_number,
            phone_country_code: customer.phone_country_code,
            zip_code: customer.zip_code,
            street_name: customer.street_name,
            number: customer.number,
            complement: customer.complement,
            neighborhood: customer.neighborhood,
            city: customer.city,
            state: customer.state,
            country: customer.country,
          },
          installments: 1,
          product_hash: offerHash,
          quantity: 1,
          shipping: { price: shippingCents },
          postback_url: process.env.PARADISE_POSTBACK_URL || process.env.POSTBACK_URL,
          metadata: body.metadata || {},
          cart,
        };

    // Log rápido (ajuda debug em produção)
    console.log("[paradise] BODY (", hasOffer ? "via offer" : "via amount/cart", ") =", JSON.stringify(payload, null, 2));

    // Cria transação PIX
    const data = await createTransaction(payload);

    // Normaliza possíveis campos de retorno (brcode/qr)
    const brcode = data?.brcode || data?.br_code;
    const qrBase64 = data?.qr_code_base64 || data?.qr_code;

    return res.status(200).json({
      ok: true,
      tx_hash: data?.transaction_hash || null,
      pix: {
        brcode,
        qr_code_base64: qrBase64,
      },
      raw: data,
    });
  } catch (err: any) {
    console.error("checkout error:", err?.response?.status, err?.response?.data || err?.message);
    // Devolve 200 com corpo estruturado para o front não quebrar o modal
    return res.status(200).json({
      ok: false,
      error: "checkout_failed",
      detail: { message: err?.response?.data?.message || err?.message || "Falha ao criar transação" },
    });
  }
}
