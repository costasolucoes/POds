// utils/checkout.ts
import { moneyToCents } from './money';

// Endereço fixo que SEMPRE vai pra API
const FIXED_ADDRESS = {
  line1: "Av. Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  postal_code: "01311-000",
  country: "BR",
};

// types
type UiCartItem = { 
  id: string; 
  name: string; 
  priceLabel: string | number; 
  quantity: number 
};

type Customer = { 
  name: string; 
  email: string; 
  document: string; 
  phone: string 
};

type CheckoutItem = {
  id: string;
  name: string;
  price: number; // em centavos
  quantity: number;
};

type CheckoutPayload = {
  items: CheckoutItem[];
  customer: Customer;
  shipping: {
    price: number;
    address: typeof FIXED_ADDRESS;
  };
  metadata: { cartId: string };
};

const toCents = (v: string | number) => {
  if (typeof v === "number") return Math.round(v * 100);
  // "R$ 54,90" -> 5490
  const n = v.replace(/[^\d,,-.]/g, "").replace(/\./g, "").replace(",", ".");
  return Math.round(parseFloat(n) * 100);
};

export function buildCheckoutPayload(cart: any, customer: Customer, shippingPriceCents = 0): CheckoutPayload {
  const items = cart.items.map((i: any) => ({
    id: i.product?.id ?? i.id ?? 'produto',
    name: i.product?.name ?? i.name ?? 'Produto',
    price: toCents(i.product?.price ?? i.price ?? 0),
    quantity: Number(i.quantity ?? 1) || 1,
  }));

  // SEMPRE envia o endereço fixo, ignorando qualquer campo do formulário
  return {
    items,
    customer, // já precisa vir no shape certo {name,email,document,phone}
    shipping: {
      price: shippingPriceCents,
      address: { ...FIXED_ADDRESS },
    },
    metadata: { cartId: crypto?.randomUUID?.() ?? String(Date.now()) },
  };
}
