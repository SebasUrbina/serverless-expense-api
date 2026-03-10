export const formatCompactValue = (value: number) => {
  if (value === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};
