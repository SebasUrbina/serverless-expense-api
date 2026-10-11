import type { Transaction } from '@/types/api';

export type InstallmentTransaction = Pick<
  Transaction,
  'title' | 'installment_number' | 'installment_total'
>;

export function getInstallmentDetails(transaction: InstallmentTransaction) {
  const {
    title,
    installment_number: current,
    installment_total: total,
  } = transaction;
  if (
    current == null ||
    total == null ||
    !Number.isSafeInteger(current) ||
    !Number.isSafeInteger(total) ||
    current < 1 ||
    total < 2 ||
    current > total
  )
    return null;

  // Hide the legacy suffix only when it agrees with the stored metadata.
  const suffix = ` (Cuota ${current}/${total})`;
  const name = title.endsWith(suffix)
    ? title.slice(0, -suffix.length).trim()
    : title;
  return { title: name || title, current, total };
}
