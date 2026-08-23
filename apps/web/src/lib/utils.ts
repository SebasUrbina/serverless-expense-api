import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const integerFormatter = new Intl.NumberFormat('es-CL');
const compactCurrencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactValue = (value: number) => {
  if (value === 0) return '';
  return compactCurrencyFormatter.format(value);
};

export function formatDateAbbreviated(dateStr: string) {
  if (!dateStr) return 'Selecciona una fecha';
  const d = parseISO(dateStr);
  if (!isValid(d)) return 'Selecciona una fecha';

  return format(d, 'd MMM', { locale: es });
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
