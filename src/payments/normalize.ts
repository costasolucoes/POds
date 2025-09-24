// src/payments/normalize.ts
export type CartItemIn = {
  id: string;
  name: string;
  price: number | string; // "R$ 49,90" | "49,90" | 49.9 | 4990
  quantity: number | string;
};

export type CartItemCents = {
  id: string;
  name: string;
  price: number;   // sempre em CENTAVOS
  quantity: number;
};

const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

function toCents(v: any): number {
  if (v == null) return 0;

  // números já em JS
  if (typeof v === "number") {
    // se for inteiro grande (tipo 4990), consideramos centavos
    if (Number.isInteger(v) && Math.abs(v) >= 1000) return v;
    return Math.round(v * 100);
  }

  // strings: remove moeda/espaços; troca vírgula por ponto; remove separador de milhar
  const raw = String(v).trim();
  const cleaned = raw
    .replace(/[^\d.,-]/g, "") // fica só dígitos e , .
    .replace(/\.(?=\d{3}(?:\D|$))/g, "") // remove pontos de milhar (ex.: 1.234,56 -> 1234,56)
    .replace(",", "."); // vírgula decimal -> ponto

  const num = Number(cleaned);
  if (!isFinite(num)) return 0;

  // se era algo como "4990" e não tinha decimal, isso é 4.990,00? ou 49,90?
  // Heurística: se NÃO tinha vírgula/ponto no raw e tiver >= 1000, tratamos como centavos
  const hadDecimal = /[.,]/.test(raw);
  if (!hadDecimal && Number.isInteger(num) && Math.abs(num) >= 1000) {
    return num;
  }

  return Math.round(num * 100);
}

export function normalizeCart(items: CartItemIn[]): CartItemCents[] {
  return items.map((it) => ({
    id: String(it.id),
    name: String(it.name),
    price: toCents(it.price),
    quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
  }));
}

export function formatBRLFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
