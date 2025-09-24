const toNumber = (v: any) =>
  (typeof v === "number" ? v :
    parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;

const toCents = (v: any) => {
  if (Number.isInteger(v) && v > 1000) return Number(v); // já veio em centavos
  const cents = Math.round(toNumber(v) * 100);
  return isNaN(cents) ? 0 : cents;
};

export function normalizeCart(items: any[]) {
  return items.map((it) => ({
    id: String(it.id),
    name: String(it.name),
    price: toCents(it.price),
    quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
  }));
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
