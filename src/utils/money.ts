// utils/money.ts
export function moneyToCents(input: string | number): number {
  const s = String(input).replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  if (Number.isNaN(n)) throw new Error('Preço inválido');
  return Math.round(n * 100);
}
