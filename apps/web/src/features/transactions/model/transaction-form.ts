import type { SharedGroup, Transaction } from '@/types/api';

export type TransactionPayload = {
  title: string;
  amount: number;
  category_id: number;
  type: 'expense' | 'income';
  account_id: number;
  tag_ids: number[];
  date: string;
  is_shared: 0 | 1;
  group_id?: number;
  installments?: number;
  splits?: Array<{ user_id: string; percentage: number }>;
};

export type TransactionFormValues = {
  title: string;
  amount: number;
  categoryId: number | '';
  type: TransactionPayload['type'];
  accountId: number | '';
  tagIds: number[];
  date: string;
  isShared: boolean;
  selectedGroup?: SharedGroup;
  splitPercentages: Record<string, number>;
  isInstallments: boolean;
  installments: number;
};

export type TransactionFormResult =
  | { ok: true; payload: TransactionPayload }
  | { ok: false; error: string };

export function getInitialSplitPercentages(
  transaction?: Transaction | null,
): Record<string, number> {
  return Object.fromEntries(
    transaction?.splits?.map((split) => [split.user_id, split.percentage]) ?? [],
  );
}

export function getEqualSplitPercentages(
  members: Array<{ user_id: string }>,
): Record<string, number> {
  if (members.length === 0) return {};

  const equalPercentage = Math.floor(100 / members.length);
  return Object.fromEntries(
    members.map((member, index) => [
      member.user_id,
      index === 0
        ? 100 - equalPercentage * (members.length - 1)
        : equalPercentage,
    ]),
  );
}

export function buildTransactionPayload(
  values: TransactionFormValues,
): TransactionFormResult {
  const title = values.title.trim();
  if (!title) return { ok: false, error: 'Ingresa un detalle.' };
  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    return { ok: false, error: 'Ingresa un monto válido mayor que cero.' };
  }
  if (values.categoryId === '') {
    return { ok: false, error: 'Selecciona una categoría.' };
  }
  if (values.accountId === '') {
    return { ok: false, error: 'Selecciona una cuenta.' };
  }
  if (!values.date) return { ok: false, error: 'Selecciona una fecha.' };

  if (values.isShared && !values.selectedGroup) {
    return { ok: false, error: 'Selecciona un grupo para compartir el gasto.' };
  }

  const splitTotal = Object.values(values.splitPercentages).reduce(
    (total, percentage) => total + percentage,
    0,
  );
  if (values.isShared && splitTotal !== 100) {
    return { ok: false, error: 'Los porcentajes compartidos deben sumar 100%.' };
  }

  const payload: TransactionPayload = {
    title,
    amount: values.amount,
    category_id: values.categoryId,
    type: values.type,
    account_id: values.accountId,
    tag_ids: values.tagIds,
    date: values.date,
    is_shared: values.isShared ? 1 : 0,
  };

  if (
    values.type === 'expense' &&
    values.isInstallments &&
    values.installments > 1
  ) {
    payload.installments = values.installments;
  }

  if (values.isShared && values.selectedGroup) {
    payload.group_id = values.selectedGroup.id;
    payload.splits = values.selectedGroup.members.map((member) => ({
      user_id: member.user_id,
      percentage: values.splitPercentages[member.user_id] ?? 0,
    }));
  }

  return { ok: true, payload };
}
