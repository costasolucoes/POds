// utils/checkout.ts
import { moneyToCents } from './money';

// types
type CheckoutItem = {
  title: string;
  unit_price_cents: number;
  quantity: number;
};

type CheckoutPayload = {
  items: CheckoutItem[];
  utm?: Partial<{
    source: string; medium: string; campaign: string; content: string; term: string;
  }>;
};

export function buildCheckoutPayload(cart: any, utm: any): CheckoutPayload {
  // ❗️ NÃO usar FormData do formulário de endereço aqui.
  return {
    items: cart.items.map((i: any) => ({
      title: i.product?.name ?? i.name ?? 'Produto',
      unit_price_cents: moneyToCents(i.product?.price ?? i.price ?? 0),
      quantity: Number(i.quantity ?? 1) || 1,
    })),
    utm: utm ? {
      source: utm.utm_source,
      medium: utm.utm_medium,
      campaign: utm.utm_campaign,
      content: utm.utm_content,
      term: utm.utm_term,
    } : undefined,
  };
}
