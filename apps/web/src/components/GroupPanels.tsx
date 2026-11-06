'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeftRight, ArrowRight, Check, Copy, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { transactionListOptions } from '@/lib/transactionList';
import {
  isSettlement,
  leaveGroupError,
  ledgerEffect,
  type LedgerEffect,
} from '@/lib/groupLedger';
import { formatCurrency } from '@/lib/utils';
import {
  GROUP_STALE_TIME,
  useDeleteSettlement,
  useGroupSettlements,
} from '@/hooks/useGroupBalances';
import { usePendingDeleteIds } from '@/store/usePendingDeletes';
import { useTransactionModal } from '@/store/useTransactionModal';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { CardNotice } from '@/components/ui/Card';
import { MemberAvatar } from './MemberAvatar';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useDeleteGroup, useLeaveGroup } from '@/hooks/usePreferences';
import type {
  GroupBalance,
  GroupSettlement,
  SharedGroup,
  Transaction,
} from '@/types/api';

const money = (n: number) => `$${formatCurrency(Math.round(Math.abs(n)))}`;

function dayLabel(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

const EFFECT_LABEL = {
  lent: 'Prestaste',
  owe: 'Te toca',
  paid: 'Pagaste',
  received: 'Recibiste',
  none: 'No te afecta',
} as const;

const EFFECT_CLASS = {
  lent: 'text-income',
  owe: 'text-expense',
  paid: 'text-secondary',
  received: 'text-secondary',
  none: 'text-muted',
} as const;

const rowClass =
  '-mx-2 grid min-h-14 w-[calc(100%+1rem)] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 text-left';

type LedgerItem =
  | { kind: 'tx'; date: string; tx: Transaction }
  | { kind: 'payment'; date: string; payment: GroupSettlement };

function Effect({ effect }: { effect: LedgerEffect }) {
  return (
    <span className="text-right tabular-nums">
      <span className="text-muted block text-[11px]">
        {EFFECT_LABEL[effect.kind]}
      </span>
      {effect.kind !== 'none' && (
        <span
          className={`block text-sm font-bold ${EFFECT_CLASS[effect.kind]}`}
        >
          {money(effect.amount)}
        </span>
      )}
    </span>
  );
}

function PaymentIcon() {
  return (
    <span
      aria-hidden="true"
      className="bg-inset text-secondary flex h-8 w-8 items-center justify-center rounded-full"
    >
      <ArrowLeftRight size={15} />
    </span>
  );
}

/** The group's shared movements and payments for the month, with what each one means for you. */
export function GroupLedger({
  group,
  month,
  userId,
}: {
  group: SharedGroup;
  month: string;
  userId?: string;
}) {
  const { openModal } = useTransactionModal();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    ...transactionListOptions(
      {
        search: '',
        month,
        type: '',
        category: '',
        tag: '',
        shared: true,
        group: group.id,
      },
      async (url, signal) => (await api.get(url, { signal })).data,
    ),
    // Other members add and edit these movements; the list is one month.
    staleTime: GROUP_STALE_TIME,
    refetchOnWindowFocus: true,
  });
  const settlementsQuery = useGroupSettlements(group.id, month);
  const deleteSettlement = useDeleteSettlement();
  const [show, setShow] = useState<'all' | 'expenses' | 'payments'>('all');

  const hiddenIds = usePendingDeleteIds();
  const days = useMemo(() => {
    const txs = (data?.pages.flatMap((p) => p.transactions) ?? []).filter(
      (tx) => !hiddenIds.has(tx.id),
    );
    // While older movements are still unloaded, hold back older payments too,
    // so they don't show up out of place at the end of the list.
    const oldestLoaded = hasNextPage
      ? txs.at(-1)?.date.slice(0, 10)
      : undefined;
    const payments = (settlementsQuery.data?.settlements ?? []).filter(
      (p) => !oldestLoaded || p.date >= oldestLoaded,
    );
    const items: LedgerItem[] = [
      ...txs.map((tx) => ({
        kind: 'tx' as const,
        date: tx.date.slice(0, 10),
        tx,
      })),
      ...payments.map((payment) => ({
        kind: 'payment' as const,
        date: payment.date,
        payment,
      })),
    ].filter((item) => {
      if (show === 'all') return true;
      const isPayment = item.kind === 'payment' || isSettlement(item.tx);
      return show === 'payments' ? isPayment : !isPayment;
    });
    const byDay = new Map<string, LedgerItem[]>();
    for (const item of items) {
      byDay.set(item.date, [...(byDay.get(item.date) ?? []), item]);
    }
    return [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [data?.pages, hiddenIds, hasNextPage, settlementsQuery.data, show]);

  const memberById = new Map(group.members.map((m) => [m.user_id, m]));
  const nameOf = (id: string) => memberById.get(id)?.nickname ?? 'Otro miembro';

  if (isLoading || settlementsQuery.isLoading)
    return <LoadingState minHeight="h-40" />;
  if ((isError || settlementsQuery.isError) && days.length === 0)
    return (
      <CardNotice
        title="No pudimos cargar los movimientos del grupo"
        description="Revisa tu conexión e intenta nuevamente."
        action={{
          label: 'Reintentar',
          onClick: () => {
            void refetch();
            void settlementsQuery.refetch();
          },
        }}
      />
    );
  const filters = (
    <div
      role="radiogroup"
      aria-label="Mostrar"
      className="mb-1 flex flex-wrap gap-1.5"
    >
      {(
        [
          ['all', 'Todo'],
          ['expenses', 'Gastos'],
          ['payments', 'Pagos'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={show === value}
          onClick={() => setShow(value)}
          className={`focus-ring h-8 rounded-xl border px-3 text-xs font-bold transition-colors ${
            show === value
              ? 'bg-accent-soft text-accent border-transparent'
              : 'border-border text-secondary hover:text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (days.length === 0)
    return show === 'all' ? (
      <CardNotice
        title="Sin movimientos este mes"
        description="Cuando alguien del grupo registre un gasto o un pago, aparecerá aquí con lo que significa para ti."
      />
    ) : (
      <div>
        {filters}
        <p className="text-secondary py-6 text-center text-sm">
          {show === 'payments'
            ? 'No hubo pagos entre ustedes este mes.'
            : 'No hubo gastos compartidos este mes.'}
        </p>
      </div>
    );

  const paymentRow = (payment: GroupSettlement) => {
    const title =
      payment.from_user_id === userId
        ? `Le pagaste a ${nameOf(payment.to_user_id)}`
        : payment.to_user_id === userId
          ? `${nameOf(payment.from_user_id)} te pagó`
          : `${nameOf(payment.from_user_id)} le pagó a ${nameOf(payment.to_user_id)}`;
    const effect: LedgerEffect =
      payment.from_user_id === userId
        ? { kind: 'paid', amount: payment.amount }
        : payment.to_user_id === userId
          ? { kind: 'received', amount: payment.amount }
          : { kind: 'none' };
    const canUndo =
      !!userId &&
      [payment.created_by, payment.from_user_id, payment.to_user_id].includes(
        userId,
      );
    const isThis = deleteSettlement.variables?.id === payment.id;
    return (
      <div className={rowClass}>
        <PaymentIcon />
        <span className="min-w-0">
          <span className="text-primary block truncate text-sm font-semibold">
            {title}
          </span>
          <span className="text-muted mt-0.5 flex min-w-0 items-center gap-1.5 text-xs">
            <span className="truncate">Pago entre miembros</span>
            {canUndo && (
              <button
                type="button"
                onClick={() =>
                  deleteSettlement.mutate({ groupId: group.id, id: payment.id })
                }
                disabled={deleteSettlement.isPending && isThis}
                className="text-secondary hover:text-primary focus-ring shrink-0 rounded font-semibold underline-offset-2 hover:underline disabled:opacity-50"
              >
                · Deshacer
              </button>
            )}
          </span>
          {deleteSettlement.isError && isThis && (
            <span role="alert" className="text-expense mt-0.5 block text-xs">
              No pudimos deshacer el pago. Intenta nuevamente.
            </span>
          )}
        </span>
        <Effect effect={effect} />
      </div>
    );
  };

  const txRow = (tx: Transaction) => {
    const legacyPayment = isSettlement(tx);
    const payer = tx.user_id ? memberById.get(tx.user_id) : undefined;
    const paidByMe = !!userId && tx.user_id === userId;
    const detail = legacyPayment
      ? 'Pago entre miembros'
      : paidByMe
        ? `Pagaste ${money(tx.amount)}`
        : `Pagó ${payer?.nickname ?? 'otro miembro'} · ${money(tx.amount)}`;
    const content = (
      <>
        {legacyPayment ? (
          <PaymentIcon />
        ) : (
          <MemberAvatar
            userId={tx.user_id ?? ''}
            nickname={payer?.nickname ?? '?'}
          />
        )}
        <span className="min-w-0">
          <span className="text-primary block truncate text-sm font-semibold">
            {legacyPayment ? 'Pago de deuda' : tx.title}
          </span>
          <span className="text-muted mt-0.5 block truncate text-xs tabular-nums">
            {detail}
          </span>
        </span>
        <Effect effect={ledgerEffect(tx, userId)} />
      </>
    );
    if (tx.is_owner === false || legacyPayment)
      return <div className={rowClass}>{content}</div>;
    return (
      <button
        type="button"
        onClick={() => openModal(tx)}
        className={`${rowClass} hover:bg-inset focus-ring transition-colors`}
      >
        {content}
      </button>
    );
  };

  return (
    <div>
      {filters}
      {days.map(([date, items]) => (
        <section key={date} aria-label={dayLabel(date)}>
          <h3 className="text-muted pt-4 pb-1 text-xs font-semibold capitalize first:pt-0">
            {dayLabel(date)}
          </h3>
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <li
                key={
                  item.kind === 'tx'
                    ? `tx-${item.tx.id}`
                    : `pay-${item.payment.id}`
                }
              >
                {item.kind === 'tx' ? txRow(item.tx) : paymentRow(item.payment)}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage({ cancelRefetch: false })}
          disabled={isFetchingNextPage}
          className="text-accent focus-ring mt-2 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Cargando…' : 'Cargar más movimientos'}
        </button>
      )}
    </div>
  );
}

/** Shares a reminder of a debt, or copies it where sharing isn't available. */
function RemindButton({ nickname, text }: { nickname: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const remind = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // Closing the share sheet rejects; nothing to report.
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={remind}
      aria-label={`Recordarle a ${nickname}`}
      className="text-accent hover:bg-accent-soft focus-ring -my-1 shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition-colors"
    >
      {copied ? 'Copiado' : 'Recordar'}
    </button>
  );
}

/** Each member's accumulated balance and the transfers that even it out. */
export function GroupBalancesPanel({
  balance,
  userId,
  monthName,
}: {
  balance?: GroupBalance;
  userId?: string;
  monthName: string;
}) {
  if (!balance) return null;

  const max = Math.max(...balance.members.map((m) => Math.abs(m.net)), 1);

  return (
    <div>
      <ul className="space-y-3">
        {balance.members.map((m) => {
          const net = Math.round(m.net);
          const width = (Math.abs(m.net) / max) * 50;
          return (
            <li key={m.user_id}>
              <div className="flex items-center gap-2">
                <MemberAvatar
                  userId={m.user_id}
                  nickname={m.nickname}
                  size="sm"
                />
                <span className="text-primary min-w-0 flex-1 truncate text-sm font-semibold">
                  {m.nickname}
                  {m.user_id === userId && (
                    <span className="text-muted font-normal"> (tú)</span>
                  )}
                </span>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    net === 0
                      ? 'text-muted'
                      : net > 0
                        ? 'text-income'
                        : 'text-expense'
                  }`}
                >
                  {net === 0 ? 'al día' : `${net > 0 ? '+' : '−'}${money(net)}`}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="bg-inset relative mt-1.5 h-1.5 rounded-full"
              >
                <span className="bg-border absolute inset-y-[-2px] left-1/2 w-px" />
                {net !== 0 && (
                  <span
                    className={`absolute inset-y-0 rounded-full ${net > 0 ? 'bg-income' : 'bg-expense'}`}
                    style={{
                      left: net > 0 ? '50%' : `${50 - width}%`,
                      width: `${width}%`,
                    }}
                  />
                )}
              </div>
              <p className="text-muted mt-1 text-[11px] tabular-nums">
                En {monthName}: pagó {money(m.month_paid)} · le toca{' '}
                {money(m.month_share)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="border-border mt-4 border-t pt-3">
        {balance.pairs.length > 0 ? (
          <>
            <p className="text-secondary mb-1.5 text-xs font-semibold">
              Para quedar a mano
            </p>
            <ul className="space-y-1 text-[13px]">
              {balance.pairs.map((pair) => (
                <li
                  key={`${pair.from_user_id}-${pair.to_user_id}`}
                  className="text-secondary flex items-center gap-1.5"
                >
                  <span className="truncate">{pair.from_nickname}</span>
                  <ArrowRight size={12} className="text-muted shrink-0" />
                  <span className="truncate">{pair.to_nickname}</span>
                  <span className="text-primary ml-auto font-semibold tabular-nums">
                    {money(pair.amount)}
                  </span>
                  {pair.to_user_id === userId && (
                    <RemindButton
                      nickname={pair.from_nickname}
                      text={`Hola ${pair.from_nickname}, según Seva me debes ${money(pair.amount)} de "${balance.group_name}". ¿Me lo transfieres cuando puedas?`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-secondary text-[13px]">Todos están al día.</p>
        )}
      </div>
    </div>
  );
}

/** Who is in the group and how to invite someone else. */
export function GroupMembersPanel({
  group,
  userId,
  balance,
}: {
  group: SharedGroup;
  userId?: string;
  balance?: GroupBalance;
}) {
  const router = useRouter();
  const leaveMutation = useLeaveGroup();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const deleteMutation = useDeleteGroup();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isCreator = group.created_by === userId;
  const myNet = Math.round(
    balance?.members.find((m) => m.user_id === userId)?.net ?? 0,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (text: string) => {
    setNotice(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 2000);
  };

  const code = group.invite_code;
  const inviteUrl = code
    ? `${typeof window === 'undefined' ? '' : window.location.origin}/groups?join=${code}`
    : '';

  const share = async () => {
    if (!code) return;
    const text = `Únete a "${group.name}" en Seva para dividir gastos. Código: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text, url: inviteUrl });
      } catch {
        // Closing the share sheet rejects; nothing to report.
      }
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${inviteUrl}`);
    flash('Enlace copiado');
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    flash('Código copiado');
  };

  return (
    <div>
      <ul className="space-y-1">
        {group.members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 py-1.5">
            <MemberAvatar userId={m.user_id} nickname={m.nickname} />
            <span className="text-primary min-w-0 truncate text-sm font-semibold">
              {m.nickname}
              {m.user_id === userId && (
                <span className="text-muted font-normal"> (tú)</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {code && (
        <div className="bg-inset mt-4 rounded-2xl p-4">
          <p className="text-secondary text-xs">Código de invitación</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-primary font-mono text-xl font-bold tracking-[0.18em]">
              {code}
            </p>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copiar código de invitación"
              className="text-secondary hover:text-primary hover:bg-card focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            >
              <Copy size={15} />
            </button>
          </div>
          <button
            type="button"
            onClick={share}
            className="bg-card border-border text-primary hover:bg-card-hover focus-ring mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
          >
            {notice ? (
              <>
                <Check size={15} className="text-accent" /> {notice}
              </>
            ) : (
              <>
                <Share2 size={15} /> Invitar con un enlace
              </>
            )}
          </button>
        </div>
      )}

      <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        {isCreator ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteMutation.isPending}
            className="text-expense focus-ring min-h-10 rounded-lg px-2 text-[13px] font-semibold disabled:opacity-50"
          >
            Eliminar grupo
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          disabled={!balance || myNet !== 0 || leaveMutation.isPending}
          className="text-expense focus-ring min-h-10 rounded-lg px-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salir del grupo
        </button>
      </div>
      {myNet !== 0 && (
        <p className="text-muted text-xs">
          Para salir, primero tienes que quedar al día:{' '}
          {myNet > 0 ? `te deben ${money(myNet)}` : `debes ${money(myNet)}`}.
        </p>
      )}
      {deleteMutation.isError && (
        <p role="alert" className="text-expense mt-1 text-xs">
          {isAxiosError(deleteMutation.error) &&
          deleteMutation.error.response?.status === 409
            ? 'No se puede eliminar todavía: alguien del grupo tiene deudas pendientes. Registren los pagos y vuelve a intentarlo.'
            : 'No pudimos eliminar el grupo. Intenta nuevamente.'}
        </p>
      )}
      {leaveMutation.isError && (
        <p role="alert" className="text-expense mt-1 text-xs">
          {isAxiosError(leaveMutation.error)
            ? leaveGroupError(
                leaveMutation.error.response?.status,
                leaveMutation.error.response?.data,
              )
            : leaveGroupError()}
        </p>
      )}

      <ConfirmDeleteModal
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() =>
          leaveMutation.mutate(group.id, {
            onSuccess: () => router.replace('/groups'),
          })
        }
        title={`Salir de ${group.name}`}
        message={
          group.members.length === 1
            ? 'Eres el único miembro: el grupo se elimina y sus gastos quedan como tuyos.'
            : 'Dejarás de ver sus gastos y saldos. Tus gastos anteriores siguen en el grupo para los demás.'
        }
        confirmLabel="Salir"
      />
      <ConfirmDeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(group.id, {
            onSuccess: () => router.replace('/groups'),
          })
        }
        title={`Eliminar ${group.name}`}
        message="Solo se puede con todos al día. Todos los miembros salen del grupo y sus gastos quedan como gastos personales de quien los pagó."
      />
    </div>
  );
}
