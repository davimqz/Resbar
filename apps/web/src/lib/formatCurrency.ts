export default function formatCurrency(amount: number | string | null | undefined) {
  const value = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
