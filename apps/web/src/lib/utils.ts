export const formatCompactValue = (value: number) => {
  if (value === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Math.round(value).toLocaleString('es-CL');
};

/** `$1.234`, or `−$1.234` for negative values. */
export const formatMoney = (value: number | null | undefined): string =>
  `${(value ?? 0) < 0 ? '−' : ''}$${formatCurrency(Math.abs(value ?? 0))}`;
