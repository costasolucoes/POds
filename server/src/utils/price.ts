export const toInt = (n: unknown) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x);
};

export const sumCents = (items: Array<{ price: number; quantity?: number }>) =>
  items.reduce((acc, it) => acc + toInt(it.price) * (it.quantity ?? 1), 0);
