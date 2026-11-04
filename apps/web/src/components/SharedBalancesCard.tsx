'use client';
import { ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardLink } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAccounts } from '@/hooks/usePreferences';
import { useGroupBalances, useSettleGroup } from '@/hooks/useGroupBalances';
import { useAuth } from '@/lib/AuthProvider';
import { formatCurrency } from '@/lib/utils';
import { computeSettlements } from '@/lib/settlements';
import { useState } from 'react';
import { SettleConfirmModal } from './SettleConfirmModal';
import type { GroupBalance, SettlementPair } from '@/types/api';

export function SharedBalancesCard({ filterMonth }: { filterMonth: string }) {
  const currentMonth = filterMonth || format(new Date(), 'yyyy-MM');
  const { data, isLoading } = useGroupBalances(currentMonth);
  const { data: accountsData } = useAccounts();
  const { session } = useAuth();

  const accounts = accountsData?.accounts || [];
  const balances = data?.balances || [];
  const userId = session?.user?.id;

  const [settleTarget, setSettleTarget] = useState<{
    group: GroupBalance;
    pairs: SettlementPair[];
  } | null>(null);

  const settleMutation = useSettleGroup(() => setSettleTarget(null));

  if (!isLoading && balances.length === 0) return null;

  const handleConfirmSettle = (
    accountId: number,
    selectedPairs: SettlementPair[],
  ) => {
    if (!settleTarget || settleMutation.isPending) return;
    settleMutation.mutate({
      groupId: settleTarget.group.group_id,
      month: currentMonth,
      accountId,
      settlements: selectedPairs,
    });
  };

  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy', {
    locale: es,
  });

  return (
    <>
      <Card label="Gastos compartidos">
        <CardHeader
          title="Gastos compartidos"
          description={<span className="capitalize">{monthLabel}</span>}
          link={{
            href: '/groups',
            label: 'Ver grupos',
          }}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner color="muted" />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {balances.map((group) => (
              <GroupBalanceBlock
                key={group.group_id}
                group={group}
                month={currentMonth}
                userId={userId}
                canSettle={accounts.length > 0}
                onSettle={(pairs) => setSettleTarget({ group, pairs })}
              />
            ))}
          </div>
        )}
      </Card>

      {settleTarget && (
        <SettleConfirmModal
          isOpen={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          onConfirm={handleConfirmSettle}
          groupName={settleTarget.group.group_name}
          month={monthLabel}
          pairs={settleTarget.pairs}
          accounts={accounts}
          isPending={settleMutation.isPending}
        />
      )}
    </>
  );
}

function GroupBalanceBlock({
  group,
  month,
  userId,
  canSettle,
  onSettle,
}: {
  group: GroupBalance;
  month: string;
  userId?: string;
  canSettle: boolean;
  onSettle: (pairs: SettlementPair[]) => void;
}) {
  const { members } = group;
  if (members.length < 2) return null;

  const pairs = computeSettlements(members);
  const myNet = members.find((m) => m.user_id === userId)?.net ?? 0;
  const other = members.find((m) => m.user_id !== userId);
  const owed = Math.round(myNet) !== 0 && pairs.length > 0;

  return (
    <div className="bg-inset flex flex-col rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-primary truncate text-sm font-semibold">
          {group.group_name}
        </p>
        <CardLink href={`/groups?id=${group.group_id}&month=${month}`}>
          {group.transaction_count}{' '}
          {group.transaction_count === 1 ? 'movimiento' : 'movimientos'}
        </CardLink>
      </div>

      {group.transaction_count === 0 ? (
        <p className="text-secondary mt-3 text-sm">
          No hay gastos compartidos este mes.
        </p>
      ) : (
        <>
          <div className="mt-3">
            {owed ? (
              <>
                <p className="text-secondary text-[13px]">
                  {myNet > 0 ? 'Te deben' : 'Debes'}
                </p>
                <p
                  className={`mt-0.5 text-2xl font-bold tracking-tight tabular-nums ${myNet > 0 ? 'text-income' : 'text-expense'}`}
                >
                  ${formatCurrency(Math.abs(myNet))}
                </p>
              </>
            ) : (
              <p className="text-primary text-lg font-semibold">
                {pairs.length === 0 ? 'Todo saldado' : 'No tienes deudas'}
              </p>
            )}
            {owed && other && members.length === 2 && (
              <p className="text-muted mt-0.5 text-xs">
                {myNet > 0
                  ? `${other.nickname} te debe`
                  : `Le debes a ${other.nickname}`}
              </p>
            )}
          </div>

          <ul className="divide-border mt-3 divide-y text-sm">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-primary min-w-0 truncate font-medium">
                  {member.nickname}
                  {member.user_id === userId && (
                    <span className="text-muted font-normal"> (tú)</span>
                  )}
                </span>
                <span className="text-muted shrink-0 text-xs tabular-nums">
                  Pagó{' '}
                  <b className="text-secondary font-semibold">
                    ${formatCurrency(member.total_paid)}
                  </b>{' '}
                  · Le toca{' '}
                  <b className="text-secondary font-semibold">
                    ${formatCurrency(member.total_share)}
                  </b>
                </span>
              </li>
            ))}
          </ul>

          {pairs.length > 0 && (
            <div className="border-border mt-auto border-t pt-3">
              <ul className="space-y-1 text-xs">
                {pairs.map((pair, i) => (
                  <li
                    key={i}
                    className="text-secondary flex items-center gap-1.5"
                  >
                    <span className="truncate">{pair.debtor}</span>
                    <ArrowRight size={12} className="text-muted shrink-0" />
                    <span className="truncate">{pair.creditor}</span>
                    <span className="text-primary ml-auto font-semibold tabular-nums">
                      ${formatCurrency(pair.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onSettle(pairs)}
                disabled={!canSettle}
                className="bg-primary text-card focus-ring mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pairs.length === 1
                  ? 'Saldar deuda'
                  : `Saldar ${pairs.length} deudas`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
