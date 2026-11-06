'use client';
import { ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardLink } from '@/components/ui/Card';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGroupBalances } from '@/hooks/useGroupBalances';
import { useAuth } from '@/lib/AuthProvider';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { SettlementModal } from './SettlementModal';
import type { GroupBalance, SettlementPair } from '@/types/api';

export function SharedBalancesCard({ filterMonth }: { filterMonth: string }) {
  const currentMonth = filterMonth || format(new Date(), 'yyyy-MM');
  const { data, isLoading } = useGroupBalances(currentMonth);
  const { session } = useAuth();

  const balances = (data?.balances ?? []).filter((g) => g.members.length >= 2);
  const userId = session?.user?.id;

  const [settleTarget, setSettleTarget] = useState<{
    group: GroupBalance;
    pairs: SettlementPair[];
  } | null>(null);

  if (!isLoading && balances.length === 0) return null;

  const monthName = format(parseISO(`${currentMonth}-01`), 'MMMM', {
    locale: es,
  });

  return (
    <>
      <Card label="Gastos compartidos">
        <CardHeader
          title="Gastos compartidos"
          description="Saldo acumulado de tus grupos"
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
                monthName={monthName}
                userId={userId}
                onSettle={(pairs) => setSettleTarget({ group, pairs })}
              />
            ))}
          </div>
        )}
      </Card>

      {settleTarget && (
        <SettlementModal
          isOpen={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          groupId={settleTarget.group.group_id}
          groupName={settleTarget.group.group_name}
          pairs={settleTarget.pairs}
          userId={userId}
        />
      )}
    </>
  );
}

function GroupBalanceBlock({
  group,
  month,
  monthName,
  userId,
  onSettle,
}: {
  group: GroupBalance;
  month: string;
  monthName: string;
  userId?: string;
  onSettle: (pairs: SettlementPair[]) => void;
}) {
  const { members, pairs } = group;
  const myNet = Math.round(members.find((m) => m.user_id === userId)?.net ?? 0);
  const myPairs = pairs.filter(
    (p) => p.from_user_id === userId || p.to_user_id === userId,
  );

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

      <div className="mt-3">
        {myNet !== 0 ? (
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
      </div>

      {group.transaction_count > 0 && (
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
                <span className="capitalize">{monthName}</span>: pagó{' '}
                <b className="text-secondary font-semibold">
                  ${formatCurrency(member.month_paid)}
                </b>{' '}
                · le toca{' '}
                <b className="text-secondary font-semibold">
                  ${formatCurrency(member.month_share)}
                </b>
              </span>
            </li>
          ))}
        </ul>
      )}

      {pairs.length > 0 && (
        <div className="border-border mt-auto border-t pt-3">
          <ul className="space-y-1 text-xs">
            {pairs.map((pair) => (
              <li
                key={`${pair.from_user_id}-${pair.to_user_id}`}
                className="text-secondary flex items-center gap-1.5"
              >
                <span className="truncate">{pair.from_nickname}</span>
                <ArrowRight size={12} className="text-muted shrink-0" />
                <span className="truncate">{pair.to_nickname}</span>
                <span className="text-primary ml-auto font-semibold tabular-nums">
                  ${formatCurrency(pair.amount)}
                </span>
              </li>
            ))}
          </ul>
          {myPairs.length > 0 && (
            <button
              type="button"
              onClick={() => onSettle(myPairs)}
              className="bg-primary text-card focus-ring mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              Registrar pago
            </button>
          )}
        </div>
      )}
    </div>
  );
}
