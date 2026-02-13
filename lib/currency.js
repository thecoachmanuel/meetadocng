export function formatNaira(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
