'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeftRight, ArrowRight, Check, Copy, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { transactionListOptions } from '@/lib/transactionList';
import { isSettlement, ledgerEffect } from '@/lib/groupLedger';
import { computeSettlements } from '@/lib/settlements';
import { formatCurrency } from '@/lib/utils';
import { usePendingDeleteIds } from '@/store/usePendingDeletes';
import { useTransactionModal } from '@/store/useTransactionModal';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { CardNotice } from '@/components/ui/Card';
import { MemberAvatar } from './MemberAvatar';
import type { GroupBalance, SharedGroup, Transaction } from '@/types/api';

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

/** The group's shared movements for the month, with what each one means for you. */
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
  } = useInfiniteQuery(
    transactionListOptions(
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
  );

  const hiddenIds = usePendingDeleteIds();
  const days = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of data?.pages.flatMap((p) => p.transactions) ?? []) {
      if (hiddenIds.has(tx.id)) continue;
      const key = tx.date.slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), tx]);
    }
    return [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [data?.pages, hiddenIds]);

  const memberById = new Map(group.members.map((m) => [m.user_id, m]));

  if (isLoading) return <LoadingState minHeight="h-40" />;
  if (isError && days.length === 0)
    return (
      <CardNotice
        title="No pudimos cargar los movimientos del grupo"
        description="Revisa tu conexión e intenta nuevamente."
        action={{ label: 'Reintentar', onClick: () => void refetch() }}
      />
    );
  if (days.length === 0)
    return (
      <CardNotice
        title="Sin gastos compartidos este mes"
        description="Cuando alguien del grupo registre un gasto, aparecerá aquí con lo que te toca."
      />
    );

  return (
    <div>
      {days.map(([date, items]) => (
        <section key={date} aria-label={dayLabel(date)}>
          <h3 className="text-muted pt-4 pb-1 text-xs font-semibold capitalize first:pt-0">
            {dayLabel(date)}
          </h3>
          <ul className="divide-border divide-y">
            {items.map((tx) => {
              const effect = ledgerEffect(tx, userId);
              const settlement = isSettlement(tx);
              const payer = tx.user_id ? memberById.get(tx.user_id) : undefined;
              const paidByMe = !!userId && tx.user_id === userId;
              const detail = settlement
                ? 'Pago entre miembros'
                : paidByMe
                  ? `Pagaste ${money(tx.amount)}`
                  : `Pagó ${payer?.nickname ?? 'otro miembro'} · ${money(tx.amount)}`;
              const editable = tx.is_owner !== false && !settlement;

              const content = (
                <>
                  {settlement ? (
                    <span
                      aria-hidden="true"
                      className="bg-inset text-secondary flex h-8 w-8 items-center justify-center rounded-full"
                    >
                      <ArrowLeftRight size={15} />
                    </span>
                  ) : (
                    <MemberAvatar
                      userId={tx.user_id ?? ''}
                      nickname={payer?.nickname ?? '?'}
                    />
                  )}
                  <span className="min-w-0">
                    <span className="text-primary block truncate text-sm font-semibold">
                      {settlement ? 'Pago de deuda' : tx.title}
                    </span>
                    <span className="text-muted mt-0.5 block truncate text-xs tabular-nums">
                      {detail}
                    </span>
                  </span>
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
                </>
              );
              const rowClass =
                '-mx-2 grid min-h-14 w-[calc(100%+1rem)] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2.5 text-left';

              return (
                <li key={tx.id}>
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => openModal(tx)}
                      className={`${rowClass} hover:bg-inset focus-ring transition-colors`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={rowClass}>{content}</div>
                  )}
                </li>
              );
            })}
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

/** Each member's net for the month and the transfers that even it out. */
export function GroupBalancesPanel({
  balance,
  userId,
}: {
  balance?: GroupBalance;
  userId?: string;
}) {
  if (!balance || balance.transaction_count === 0)
    return (
      <p className="text-secondary text-sm">
        No hay gastos compartidos este mes.
      </p>
    );

  const max = Math.max(...balance.members.map((m) => Math.abs(m.net)), 1);
  const pairs = computeSettlements(balance.members);

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
                Pagó {money(m.total_paid)} · Le toca {money(m.total_share)}
              </p>
            </li>
          );
        })}
      </ul>

      {pairs.length > 0 && (
        <div className="border-border mt-4 border-t pt-3">
          <p className="text-secondary mb-1.5 text-xs font-semibold">
            Para quedar a mano
          </p>
          <ul className="space-y-1 text-[13px]">
            {pairs.map((pair) => (
              <li
                key={`${pair.debtor}-${pair.creditor}`}
                className="text-secondary flex items-center gap-1.5"
              >
                <span className="truncate">{pair.debtor}</span>
                <ArrowRight size={12} className="text-muted shrink-0" />
                <span className="truncate">{pair.creditor}</span>
                <span className="text-primary ml-auto font-semibold tabular-nums">
                  {money(pair.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Who is in the group and how to invite someone else. */
export function GroupMembersPanel({
  group,
  userId,
}: {
  group: SharedGroup;
  userId?: string;
}) {
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

      <Link
        href="/settings?section=grupos"
        className="text-secondary hover:text-primary focus-ring mt-3 inline-flex min-h-10 items-center rounded-lg text-[13px] font-medium transition-colors"
      >
        Renombrar o eliminar en Ajustes →
      </Link>
    </div>
  );
}
