'use client';

import { useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  onlineManager,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CREATE_TRANSACTION_KEY,
  UPDATE_TRANSACTION_KEY,
  patchCachedTransaction,
  type CreateTransactionVariables,
  type UpdateTransactionVariables,
} from '@/lib/offlineMutations';
import { format } from 'date-fns';
import { ChevronDown, Repeat2 } from 'lucide-react';
import { useTransactionModal } from '@/store/useTransactionModal';
import { usePendingDeletes } from '@/store/usePendingDeletes';
import {
  useCategories,
  useAccounts,
  useTags,
  useGroups,
} from '@/hooks/usePreferences';
import {
  AccountPicker,
  AmountInput,
  CategoryPicker,
  FormModalHeader,
  Switch,
  TagPicker,
  TypeToggle,
  focusField,
  formatAmountInput,
  parseAmountInput,
  readLastAccount,
  rememberAccount,
  resolveAccount,
} from './TransactionFields';
import { TitleField } from './TitleField';
import type { TitleSuggestion } from '@/hooks/useTitleSuggestions';
import { TransactionSuccessOverlay } from './TransactionSuccessOverlay';
import { CustomSelect } from './CustomSelect';
import { DateField } from './DateField';
import { BaseModal } from './ui/BaseModal';
import { SubmitButton } from './ui/SubmitButton';
import { DeleteButton } from './ui/DeleteButton';
import type { Transaction } from '@/types/api';
import { getInstallmentDetails } from '@/lib/installments';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
  /** Prefills a new movement from an earlier one; the date is today. */
  template?: Transaction | null;
  /** Starts a new movement shared with this group, split equally. */
  presetGroupId?: number | null;
};

type TransactionPayload = {
  title: string;
  amount: number;
  category_id?: number;
  type: 'expense' | 'income';
  account_id?: number;
  tag_ids: number[];
  date: string;
  is_shared: 0 | 1;
  group_id?: number;
  installments?: number;
  splits?: Array<{
    user_id: string;
    percentage: number;
  }>;
};

function getInitialSplitPercentages(
  transaction?: Transaction | null,
): Record<string, number> {
  if (!transaction?.splits?.length) {
    return {};
  }

  return transaction.splits.reduce<Record<string, number>>(
    (accumulator, split) => {
      accumulator[split.user_id] = split.percentage;
      return accumulator;
    },
    {},
  );
}

function getEqualSplitPercentages(
  members: Array<{ user_id: string }>,
): Record<string, number> {
  if (members.length === 0) {
    return {};
  }

  const equalPct = Math.floor(100 / members.length);
  return members.reduce<Record<string, number>>(
    (accumulator, member, index) => {
      accumulator[member.user_id] =
        index === 0 ? 100 - equalPct * (members.length - 1) : equalPct;
      return accumulator;
    },
    {},
  );
}

/** A collapsible row for optional settings, showing their current state. */
function OptionRow({
  label,
  status,
  defaultOpen = false,
  children,
}: {
  label: string;
  status: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [initiallyOpen] = useState(defaultOpen);
  return (
    <details
      open={initiallyOpen}
      className="group/option border-border border-b"
    >
      <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg py-3 [&::-webkit-details-marker]:hidden">
        <span className="text-primary flex-1 text-sm font-semibold">
          {label}
        </span>
        <span className="text-secondary max-w-[50%] truncate text-sm">
          {status}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-muted shrink-0 transition-transform group-open/option:rotate-180"
        />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

export function CreateTransactionModal({
  isOpen,
  onClose,
  initialData,
  template,
  presetGroupId,
}: Props) {
  const source = initialData ?? template ?? null;
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const categories = categoriesData?.categories || [];

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts();
  const accounts = accountsData?.accounts || [];

  const { data: tagsData } = useTags();
  const tags = tagsData?.tags || [];

  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const sharedRef = useRef<HTMLDivElement>(null);

  // Form State
  const [type, setType] = useState<'expense' | 'income'>(
    source?.type ?? 'expense',
  );
  const [title, setTitle] = useState(source?.title ?? '');
  const [amount, setAmount] = useState(
    source ? new Intl.NumberFormat('es-CL').format(source.amount) : '',
  );
  const [categoryId, setCategoryId] = useState<number | ''>(
    source?.category_id || '',
  );
  // '' means "not chosen in this form": new movements fall back to the last account used.
  const [accountId, setAccountId] = useState<number | ''>(
    source?.account_id || '',
  );
  const [lastAccountId, setLastAccountId] = useState(readLastAccount);
  const [tagIds, setTagIds] = useState<number[]>(source?.tag_ids || []);
  const [date, setDate] = useState(
    // API dates are calendar dates (YYYY-MM-DD), not UTC timestamps.
    initialData?.date ?? format(new Date(), 'yyyy-MM-dd'),
  );
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSnapshot, setSuccessSnapshot] = useState<{
    amount: string;
    type: 'expense' | 'income';
  } | null>(null);

  // Shared expense state
  const presetGroup = source
    ? undefined
    : groups.find((g) => g.id === presetGroupId);
  const [isShared, setIsShared] = useState(
    Boolean(source?.is_shared) || !!presetGroup,
  );
  const [groupId, setGroupId] = useState<number | ''>(
    source?.group_id || presetGroup?.id || '',
  );
  const [splitPercentages, setSplitPercentages] = useState<
    Record<string, number>
  >(() =>
    presetGroup
      ? getEqualSplitPercentages(presetGroup.members)
      : getInitialSplitPercentages(source),
  );

  // Installment (Cuotas) State
  const [isInstallments, setIsInstallments] = useState(false);
  const [installments, setInstallments] = useState(1);

  const selectedGroup = groups.find((g) => g.id === groupId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const effectiveAccountId = resolveAccount(
    accountId,
    accounts,
    lastAccountId,
    !initialData,
  );
  const parsedAmount = parseAmountInput(amount);
  const splitTotal = Object.values(splitPercentages).reduce((a, b) => a + b, 0);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setType('expense');
    setCategoryId('');
    setAccountId('');
    setTagIds([]);
    setIsShared(false);
    setGroupId('');
    setSplitPercentages({});
    setIsInstallments(false);
    setInstallments(1);
    setError(null);
  };

  // Their functions come from the defaults registered in Providers (work offline).
  const createMutation = useMutation<
    unknown,
    Error,
    CreateTransactionVariables
  >({ mutationKey: CREATE_TRANSACTION_KEY });
  const updateMutation = useMutation<
    unknown,
    Error,
    UpdateTransactionVariables
  >({ mutationKey: UPDATE_TRANSACTION_KEY });

  const rememberPayloadAccount = (payload: TransactionPayload) => {
    if (!payload.account_id) return;
    setLastAccountId(payload.account_id);
    rememberAccount(payload.account_id);
  };

  const callbacks = {
    onSuccess: () => {
      setSuccessSnapshot({ amount, type });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessSnapshot(null);
        resetAndClose();
      }, 1500);
    },
    onError: () => {
      setError(
        'No pudimos guardar el movimiento. Revisa tu conexión e intenta nuevamente.',
      );
    },
    onSettled: () => setLoading(false),
  };

  const scheduleDelete = usePendingDeletes((s) => s.add);
  const openRepeat = useTransactionModal((s) => s.openRepeat);

  const handleDelete = () => {
    if (!initialData?.id) return;
    scheduleDelete({
      id: initialData.id,
      title: initialData.title,
      amount: initialData.amount,
      type: initialData.type,
      date: initialData.date,
      category_id: initialData.category_id ?? null,
    });
    resetAndClose();
  };

  const changeType = (next: 'expense' | 'income') => {
    setType(next);
    if (selectedCategory && selectedCategory.type !== next) setCategoryId('');
    if (next === 'income') {
      setIsInstallments(false);
      setInstallments(1);
    }
  };

  const applySuggestion = (suggestion: TitleSuggestion) => {
    setTitle(suggestion.title);
    const category = categories.find((c) => c.id === suggestion.category_id);
    if (category?.type === type) setCategoryId(category.id);
    if (accounts.some((a) => a.id === suggestion.account_id)) {
      setAccountId(suggestion.account_id!);
    }
    if (!parsedAmount) setAmount(formatAmountInput(String(suggestion.amount)));
    setError(null);
  };

  const fail = (message: string, target: RefObject<HTMLElement | null>) => {
    setError(message);
    focusField(target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!parsedAmount) return fail('Ingresa un monto.', amountRef);
    if (!selectedCategory || selectedCategory.type !== type)
      return fail('Elige una categoría.', categoryRef);
    if (effectiveAccountId === '') return fail('Elige una cuenta.', accountRef);
    if (isShared && !selectedGroup)
      return fail('Elige el grupo del gasto compartido.', sharedRef);
    if (isShared && splitTotal !== 100)
      return fail(
        `La división debe sumar 100% (ahora suma ${splitTotal}%).`,
        sharedRef,
      );

    const payload: TransactionPayload = {
      title: title.trim() || selectedCategory.name,
      amount: parsedAmount,
      category_id: selectedCategory.id,
      type,
      account_id: effectiveAccountId,
      tag_ids: tagIds,
      date,
      is_shared: 0,
    };

    if (type === 'expense' && isInstallments && installments > 1) {
      payload.installments = installments;
    }

    if (isShared && selectedGroup) {
      payload.is_shared = 1;
      payload.group_id = selectedGroup.id;
      payload.splits = selectedGroup.members.map((m) => ({
        user_id: m.user_id,
        percentage: splitPercentages[m.user_id] || 0,
      }));
    }

    // Offline, mutations pause until the connection returns and the sync
    // banner lists them; the dialog closes right away.
    const online = onlineManager.isOnline();
    rememberPayloadAccount(payload);

    if (initialData) {
      patchCachedTransaction(queryClient, initialData.id, {
        ...payload,
        category: selectedCategory.name,
        category_icon: selectedCategory.icon,
      });
      const variables = { id: initialData.id, payload };
      if (!online) {
        updateMutation.mutate(variables);
        resetAndClose();
        return;
      }
      setLoading(true);
      updateMutation.mutate(variables, callbacks);
      return;
    }

    const variables = { ...payload, client_id: crypto.randomUUID() };
    if (!online) {
      createMutation.mutate(variables);
      resetAndClose();
      return;
    }
    setLoading(true);
    createMutation.mutate(variables, callbacks);
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess && successSnapshot) {
    return (
      <TransactionSuccessOverlay
        amount={successSnapshot.amount}
        type={successSnapshot.type}
      />
    );
  }

  const heading = initialData
    ? 'Editar movimiento'
    : type === 'expense'
      ? 'Agregar gasto'
      : 'Agregar ingreso';
  const installmentsAvailable = type === 'expense' && !initialData;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetAndClose}
      label={heading}
      draggable
      lockScroll
    >
      <FormModalHeader
        title={initialData ? 'Editar' : heading}
        formId="transaction-form"
        saving={loading}
        onClose={resetAndClose}
      />

      <form
        id="transaction-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 px-6 pb-6"
      >
        <TypeToggle value={type} onChange={changeType} />

        <div className="flex flex-col items-center gap-4">
          <AmountInput
            inputRef={amountRef}
            type={type}
            autoFocus={!initialData}
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setError(null);
            }}
          />
          <DateField value={date} onChange={setDate} />
        </div>

        <div>
          <TitleField
            id="transaction-title"
            label={
              <>
                Detalle{' '}
                <span className="text-muted font-normal">· opcional</span>
              </>
            }
            type={type}
            value={title}
            onChange={setTitle}
            onPick={applySuggestion}
            placeholder={
              selectedCategory?.name ?? '¿En qué fue? Ej.: Uber, supermercado'
            }
            hint={
              !title.trim() &&
              selectedCategory && (
                <p className="text-muted mt-1.5 px-1 text-xs">
                  Si lo dejas vacío, se guarda como “{selectedCategory.name}”.
                </p>
              )
            }
          />
          {initialData && getInstallmentDetails(initialData) && (
            <p className="text-accent mt-2 px-1 text-xs font-medium">
              Cuota {initialData.installment_number}/
              {initialData.installment_total}
              {' · '}Editas solo este movimiento.
            </p>
          )}
        </div>

        <CategoryPicker
          containerRef={categoryRef}
          categories={categories.filter((cat) => cat.type === type)}
          loading={isLoadingCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setError(null);
          }}
        />

        <AccountPicker
          containerRef={accountRef}
          accounts={accounts}
          loading={isLoadingAccounts}
          value={effectiveAccountId}
          onChange={(id) => {
            setAccountId(id);
            setError(null);
          }}
        />

        <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />

        {installmentsAvailable && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-secondary text-sm font-semibold">
                Pagar en cuotas
              </span>
              <Switch
                label="Pagar en cuotas"
                checked={isInstallments}
                onChange={(on) => {
                  setIsInstallments(on);
                  setInstallments(on ? 3 : 1);
                }}
              />
            </div>
            {isInstallments && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={36}
                    aria-label="Cantidad de cuotas"
                    value={installments}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setInstallments(
                        isNaN(val) ? 2 : Math.max(2, Math.min(36, val)),
                      );
                    }}
                    className="bg-inset text-primary focus:ring-border w-16 rounded-xl px-3 py-2 text-center text-sm font-bold focus:ring-1 focus:outline-none"
                  />
                  {[3, 6, 12, 18, 24].map((num) => (
                    <button
                      key={num}
                      type="button"
                      aria-pressed={installments === num}
                      onClick={() => setInstallments(num)}
                      className={`focus-ring h-9 min-w-10 rounded-xl border px-3 text-xs font-bold transition-colors ${
                        installments === num
                          ? 'bg-accent-soft text-accent border-transparent'
                          : 'border-border text-secondary hover:text-primary'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {parsedAmount > 0 &&
                  installments >= 2 &&
                  (() => {
                    const baseAmt = Math.floor(parsedAmount / installments);
                    const firstAmt =
                      baseAmt + (parsedAmount - baseAmt * installments);
                    return (
                      <p className="text-secondary text-xs">
                        Se crearán {installments} movimientos mensuales:{' '}
                        <b className="text-primary font-semibold">
                          ${firstAmt.toLocaleString('es-CL')}
                        </b>{' '}
                        la primera cuota y{' '}
                        <b className="text-primary font-semibold">
                          ${baseAmt.toLocaleString('es-CL')}
                        </b>{' '}
                        las siguientes.
                      </p>
                    );
                  })()}
              </>
            )}
          </div>
        )}

        {groups.length > 0 && (
          <div className="border-border border-t">
            <OptionRow
              label="Gasto compartido"
              status={
                isShared ? (selectedGroup?.name ?? 'Elige un grupo') : 'No'
              }
              defaultOpen={isShared}
            >
              <div ref={sharedRef} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-secondary text-sm">
                    Dividir con un grupo
                  </span>
                  <Switch
                    label="Gasto compartido"
                    checked={isShared}
                    onChange={setIsShared}
                  />
                </div>
                {isShared && (
                  <>
                    <CustomSelect
                      value={groupId}
                      onChange={(val) => {
                        const nextGroupId =
                          typeof val === 'number' ? val : Number(val);
                        const nextGroup = groups.find(
                          (group) => group.id === nextGroupId,
                        );
                        setGroupId(nextGroupId);
                        setSplitPercentages(
                          nextGroup
                            ? getEqualSplitPercentages(nextGroup.members)
                            : {},
                        );
                        setError(null);
                      }}
                      placeholder="Elegir grupo"
                      options={groups.map((g) => ({
                        value: g.id,
                        label: `👥 ${g.name}`,
                      }))}
                    />
                    {selectedGroup && (
                      <SplitEditor
                        members={selectedGroup.members}
                        amount={parsedAmount}
                        percentages={splitPercentages}
                        total={splitTotal}
                        onChange={setSplitPercentages}
                      />
                    )}
                  </>
                )}
              </div>
            </OptionRow>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="text-expense rounded-xl bg-[var(--red-soft)] px-4 py-3 text-sm font-medium"
          >
            {error}
          </p>
        )}

        <SubmitButton
          loading={loading}
          text={
            initialData
              ? 'Guardar cambios'
              : `Agregar ${type === 'expense' ? 'gasto' : 'ingreso'}`
          }
        />

        {initialData && (
          <button
            type="button"
            onClick={() => openRepeat(initialData)}
            disabled={loading}
            className="bg-inset text-primary hover:bg-border focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Repeat2 size={16} aria-hidden="true" />
            Repetir hoy
          </button>
        )}

        {initialData && (
          <DeleteButton
            onClick={handleDelete}
            disabled={loading}
            text="Borrar movimiento"
          />
        )}
      </form>
    </BaseModal>
  );
}

function SplitEditor({
  members,
  amount,
  percentages,
  total,
  onChange,
}: {
  members: Array<{ user_id: string; nickname?: string }>;
  amount: number;
  percentages: Record<string, number>;
  total: number;
  onChange: (next: Record<string, number>) => void;
}) {
  const is2Members = members.length === 2;
  const firstPct = percentages[members[0]?.user_id ?? ''] || 0;
  const presets = is2Members
    ? [
        [50, 50],
        [60, 40],
        [70, 30],
        [80, 20],
        [100, 0],
      ]
    : [];

  return (
    <div className="space-y-3">
      <p className="text-secondary text-sm font-semibold">División</p>
      {is2Members ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(([a, b]) => (
              <button
                key={a}
                type="button"
                aria-pressed={firstPct === a}
                onClick={() =>
                  onChange({
                    [members[0]!.user_id]: a!,
                    [members[1]!.user_id]: b!,
                  })
                }
                className={`focus-ring h-8 rounded-xl border px-3 text-xs font-bold tabular-nums transition-colors ${
                  firstPct === a
                    ? 'bg-accent-soft text-accent border-transparent'
                    : 'border-border text-secondary hover:text-primary'
                }`}
              >
                {a} / {b}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            aria-label={`Porcentaje de ${members[0]!.nickname ?? 'la primera persona'}`}
            value={firstPct}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onChange({
                [members[0]!.user_id]: value,
                [members[1]!.user_id]: 100 - value,
              });
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${firstPct}%, var(--border) ${firstPct}%, var(--border) 100%)`,
            }}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => onChange(getEqualSplitPercentages(members))}
          className="focus-ring border-border text-secondary hover:text-primary h-8 rounded-xl border px-3 text-xs font-bold"
        >
          Partes iguales
        </button>
      )}

      <ul className="space-y-1.5">
        {members.map((member) => {
          const pct = percentages[member.user_id] || 0;
          return (
            <li
              key={member.user_id}
              className="bg-inset flex items-center gap-3 rounded-xl px-3 py-2"
            >
              <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                {member.nickname}
              </span>
              {!is2Members && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label={`Porcentaje de ${member.nickname ?? 'integrante'}`}
                  value={pct}
                  onChange={(e) =>
                    onChange({
                      ...percentages,
                      [member.user_id]: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-full"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
                  }}
                />
              )}
              <span className="text-primary w-10 text-right text-sm font-bold tabular-nums">
                {pct}%
              </span>
              <span className="text-secondary w-20 text-right text-sm tabular-nums">
                ${Math.round((amount * pct) / 100).toLocaleString('es-CL')}
              </span>
            </li>
          );
        })}
      </ul>
      {total !== 100 && (
        <p className="text-expense text-xs">
          Debe sumar 100% (ahora suma {total}%).
        </p>
      )}
    </div>
  );
}
