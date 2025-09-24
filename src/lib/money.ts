export const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");
export const toNumber = (v: any) =>
  (typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."))) || 0;

export function toCents(v: any) {
  // aceita 49.9, "49,90", "R$ 49,90", 4990
  const n = toNumber(v);
  if (Number.isInteger(v) && Number(v) > 1000) return Number(v);
  const cents = Math.round(n * 100);
  return isNaN(cents) ? 0 : cents;
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
