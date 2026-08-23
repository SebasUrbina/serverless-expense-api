import { format, parseISO, isValid } from 'date-fns';

const integerFormatter = new Intl.NumberFormat('es-CL');

export const formatCompactValue = (value: number) => {
  if (value === 0) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export function formatDateAbbreviated(dateStr: string) {
  if (!dateStr) return 'Select date';
  const d = parseISO(dateStr);
  if (!isValid(d)) return 'Select date';

  return format(d, 'MMM d');
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return integerFormatter.format(Math.round(value));
};

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

export function formatCurrencyInput(value: string | number): string {
  const amount =
    typeof value === 'number' ? value : parseCurrencyInput(value);
  return amount > 0 ? integerFormatter.format(amount) : '';
}
