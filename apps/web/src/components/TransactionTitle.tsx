import { CreditCard } from 'lucide-react';
import {
  getInstallmentDetails,
  type InstallmentTransaction,
} from '@/lib/installments';

type Props = { transaction: InstallmentTransaction };

export function TransactionTitle({ transaction }: Props) {
  const installment = getInstallmentDetails(transaction);
  return (
    <p
      className="text-primary truncate text-sm leading-tight font-medium"
      title={transaction.title}
    >
      {installment?.title ?? transaction.title}
    </p>
  );
}

export function InstallmentBadge({ transaction }: Props) {
  const installment = getInstallmentDetails(transaction);
  if (!installment) return null;
  return (
    <span
      aria-label={`Cuota ${installment.current} de ${installment.total}`}
      className="text-accent border-accent/25 bg-accent/10 inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
    >
      <CreditCard size={11} aria-hidden="true" />
      Cuota {installment.current}/{installment.total}
    </span>
  );
}
