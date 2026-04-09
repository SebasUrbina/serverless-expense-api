export const formatCompactValue = (value: number) => {
  if (value === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

import { format, parseISO, isValid } from 'date-fns';

export function formatDateAbbreviated(dateStr: string) {
  if (!dateStr) return 'Select date';
  const d = parseISO(dateStr);
  if (!isValid(d)) return 'Select date';
  
  return format(d, 'MMM d');
}

export const formatCurrency = (value: number) => 
  value.toLocaleString('es-CL');