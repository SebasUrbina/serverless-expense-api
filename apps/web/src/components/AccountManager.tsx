'use client';

import { useId, useState } from 'react';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '@/hooks/usePreferences';
import {
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  PiggyBank,
  Wallet,
  Pencil,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { Account } from '@/types/api';
import { formatMoney } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  FieldLabel,
  PrimaryButton,
  SettingsList,
  SettingsListEmpty,
  fieldClass,
  secondaryButtonClass,
} from './settings/ui';

const accountTypes: Record<
  Account['type'],
  { label: string; icon: React.ElementType }
> = {
  checking: { label: 'Cuenta corriente', icon: Banknote },
  savings: { label: 'Ahorros', icon: PiggyBank },
  credit: { label: 'Tarjeta de crédito', icon: CreditCard },
  cash: { label: 'Efectivo', icon: Wallet },
};

type Draft = { name: string; type: Account['type']; balance: string };

function AccountFields({
  draft,
  onChange,
  balanceLabel,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  balanceLabel: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_150px]">
      <div>
        <FieldLabel htmlFor={`${id}-name`}>Nombre</FieldLabel>
        <input
          id={`${id}-name`}
          required
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Ej. Banco Estado"
          className={fieldClass}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${id}-type`}>Tipo</FieldLabel>
        <select
          id={`${id}-type`}
          value={draft.type}
          onChange={(e) =>
            onChange({ ...draft, type: e.target.value as Account['type'] })
          }
          className={fieldClass}
        >
          {Object.entries(accountTypes).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel htmlFor={`${id}-balance`}>{balanceLabel}</FieldLabel>
        <input
          id={`${id}-balance`}
          inputMode="numeric"
          value={draft.balance}
          onChange={(e) =>
            onChange({
              ...draft,
              balance: e.target.value.replace(/[^0-9-]/g, ''),
            })
          }
          placeholder="0"
          className={`${fieldClass} tabular-nums`}
        />
      </div>
    </div>
  );
}

const emptyDraft: Draft = { name: '', type: 'checking', balance: '' };

export function AccountManager() {
  const { data, isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const deleteMutation = useDeleteAccount();
  const updateMutation = useUpdateAccount();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  const accounts = data?.accounts || [];
  const busy = updateMutation.isPending || deleteMutation.isPending;

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    createMutation.mutate(
      {
        name: draft.name.trim(),
        type: draft.type,
        balance: Number(draft.balance) || 0,
      },
      { onSuccess: () => setDraft(emptyDraft) },
    );
  };

  const save = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editDraft.name.trim()) return;
    updateMutation.mutate(
      {
        id,
        name: editDraft.name.trim(),
        type: editDraft.type,
        balance: Number(editDraft.balance) || 0,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner color="muted" />
        </div>
      ) : accounts.length > 0 ? (
        <SettingsList label="Tus cuentas">
          {accounts.map((acc) => {
            const config = accountTypes[acc.type] || accountTypes.checking;
            const Icon = config.icon;
            if (editingId === acc.id) {
              return (
                <li key={acc.id} className="bg-inset p-4">
                  <form onSubmit={(e) => save(e, acc.id)}>
                    <AccountFields
                      draft={editDraft}
                      onChange={setEditDraft}
                      balanceLabel="Saldo"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountToDelete(acc.id)}
                        aria-label={`Eliminar ${acc.name}`}
                        className="text-expense focus-ring mr-auto inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={secondaryButtonClass}
                      >
                        Cancelar
                      </button>
                      <PrimaryButton
                        type="submit"
                        loading={updateMutation.isPending}
                        disabled={!editDraft.name.trim()}
                      >
                        Guardar
                      </PrimaryButton>
                    </div>
                  </form>
                </li>
              );
            }
            return (
              <li key={acc.id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Editar ${acc.name}`}
                  onClick={() => {
                    setEditingId(acc.id);
                    setEditDraft({
                      name: acc.name,
                      type: acc.type,
                      balance: String(acc.balance ?? 0),
                    });
                  }}
                  className="hover:bg-inset focus-ring flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="bg-inset text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-primary block truncate text-sm font-semibold">
                      {acc.name}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      {config.label}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${acc.balance < 0 ? 'text-expense' : 'text-primary'}`}
                  >
                    {formatMoney(acc.balance)}
                  </span>
                  <Pencil
                    size={14}
                    aria-hidden="true"
                    className="text-muted shrink-0"
                  />
                </button>
              </li>
            );
          })}
        </SettingsList>
      ) : (
        <SettingsListEmpty>
          Aún no tienes cuentas. Agrega una para empezar a registrar tus
          movimientos.
        </SettingsListEmpty>
      )}

      <form onSubmit={create} aria-label="Nueva cuenta">
        <h3 className="text-primary mb-3 text-sm font-semibold">
          Nueva cuenta
        </h3>
        <AccountFields
          draft={draft}
          onChange={setDraft}
          balanceLabel="Saldo inicial"
        />
        <PrimaryButton
          type="submit"
          loading={createMutation.isPending}
          disabled={!draft.name.trim()}
          className="mt-3 w-full sm:w-auto"
        >
          <Plus size={16} aria-hidden="true" />
          Agregar cuenta
        </PrimaryButton>
      </form>

      <ConfirmDeleteModal
        isOpen={accountToDelete !== null}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete === null) return;
          deleteMutation.mutate(accountToDelete);
          setEditingId(null);
        }}
        title="Eliminar cuenta"
        message="Se eliminarán permanentemente todos los movimientos y reglas recurrentes de esta cuenta. Esta acción no se puede deshacer."
      />
    </div>
  );
}
