'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAccounts } from '@/features/preferences/hooks/usePreferences';
import { useAuth } from '@/lib/AuthProvider';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { SettleConfirmModal } from './SettleConfirmModal';
import type {
  GroupBalance,
  SettlementPair,
  GroupBalancesResponse,
} from '@/types/api';
import { queryKeys } from '@/lib/query-keys';

function useGroupBalances(month: string) {
  return useQuery<GroupBalancesResponse>({
    queryKey: queryKeys.groupBalances.byMonth(month),
    queryFn: async () => {
      const res = await api.get(`/groups/balances?month=${month}`);
      return res.data;
    },
  });
}

export function SharedBalancesCard({ filterMonth }: { filterMonth: string }) {
  const currentMonth = filterMonth || format(new Date(), 'yyyy-MM');
  const { data, isLoading } = useGroupBalances(currentMonth);
  const { data: accountsData } = useAccounts();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const accounts = accountsData?.accounts || [];
  const balances = data?.balances || [];
  const userId = session?.user?.id;

  const [settleTarget, setSettleTarget] = useState<{
    group: GroupBalance;
    pairs: SettlementPair[];
  } | null>(null);

  const settleMutation = useMutation({
    mutationFn: async ({
      groupId,
      month,
      accountId,
      settlements,
    }: {
      groupId: number;
      month: string;
      accountId: number;
      settlements?: SettlementPair[];
    }) => {
      const res = await api.post(`/groups/${groupId}/settle`, {
        month,
        account_id: accountId,
        ...(settlements ? { settlements } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupBalances.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      setSettleTarget(null);
    },
  });

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
      <div className="bg-card border-border mt-4 rounded-3xl border p-5 sm:p-6 lg:col-span-3 xl:col-span-4">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Users className="text-violet-500" size={20} />
            </div>
            <div>
              <h3 className="text-primary text-sm font-bold">
                Gastos compartidos
              </h3>
              <p className="text-muted text-xs capitalize">{monthLabel}</p>
            </div>
          </div>
          <Link
            href={`/transactions?shared=1&month=${currentMonth}`}
            className="flex items-center gap-1 rounded-xl bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-400 transition-colors hover:text-violet-300"
          >
            <Receipt size={12} />
            <span className="hidden sm:inline">Ver movimientos</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner color="accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {balances.map((group) => {
              const members = group.members;
              if (members.length < 2) return null;

              const hasActivity = group.transaction_count > 0;

              // Compute settlement pairs using minimum cash flow
              const nets = members.map((m) => ({ ...m }));
              const settlementPairs: {
                debtor: string;
                creditor: string;
                amount: number;
              }[] = [];
              while (true) {
                let maxC = nets[0],
                  maxD = nets[0];
                for (const m of nets) {
                  if (m.net > maxC.net) maxC = m;
                  if (m.net < maxD.net) maxD = m;
                }
                if (Math.abs(maxD.net) < 1 && Math.abs(maxC.net) < 1) break;
                const amt = Math.min(Math.abs(maxD.net), maxC.net);
                if (amt < 1) break;
                settlementPairs.push({
                  debtor: maxD.nickname,
                  creditor: maxC.nickname,
                  amount: Math.round(amt),
                });
                maxD.net += amt;
                maxC.net -= amt;
              }
              const hasDebts = settlementPairs.length > 0;

              // Find current user's balance for hero display
              const myBalance = members.find((m) => m.user_id === userId);
              const myNet = myBalance?.net ?? 0;
              const otherMember = members.find((m) => m.user_id !== userId);

              return (
                <div
                  key={group.group_id}
                  className="bg-inset border-border-subtle flex flex-col rounded-2xl border p-4 transition-colors"
                >
                  {/* Group header */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-primary text-sm font-bold tracking-tight">
                      {group.group_name}
                    </span>
                    <Link
                      href={`/transactions?shared=1&group_id=${group.group_id}&month=${currentMonth}`}
                      className="text-muted bg-card border-border flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase transition-opacity hover:opacity-80"
                    >
                      {group.transaction_count} movs
                      <ExternalLink size={9} />
                    </Link>
                  </div>

                  {!hasActivity ? (
                    <div className="flex flex-1 items-center justify-center py-6">
                      <p className="text-muted text-center text-sm italic">
                        No hay gastos compartidos este mes
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col">
                      {/* Hero debt amount */}
                      <div className="bg-card border-border-subtle mb-4 rounded-xl border px-4 py-4 text-center">
                        {hasDebts ? (
                          <>
                            <p className="text-muted mb-1.5 text-[10px] font-bold tracking-wider uppercase">
                              {myNet > 0
                                ? 'Te deben'
                                : myNet < 0
                                  ? 'Debes'
                                  : 'Sin deudas'}
                            </p>
                            <p
                              className={`text-3xl font-extrabold tracking-tight ${myNet > 0 ? 'text-emerald-500' : myNet < 0 ? 'text-red-400' : 'text-primary'}`}
                            >
                              ${formatCurrency(Math.abs(myNet))}
                            </p>
                            {otherMember && myNet !== 0 && (
                              <p className="text-muted mt-1.5 text-[11px] font-medium">
                                {myNet > 0
                                  ? `${otherMember.nickname} te debe`
                                  : `Le debes a ${otherMember.nickname}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-sm font-semibold text-emerald-500">
                              Todo saldado — sin deudas
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Member breakdown */}
                      <div className="mb-4 space-y-2.5">
                        {members.map((member) => {
                          const isMe = member.user_id === userId;
                          return (
                            <div
                              key={member.user_id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold uppercase ${isMe ? 'bg-violet-500/15 text-violet-400' : 'bg-emerald-500/10 text-emerald-500'}`}
                                >
                                  {member.nickname.substring(0, 2)}
                                </div>
                                <span className="text-secondary text-xs font-medium">
                                  {member.nickname}
                                  {isMe ? ' (tú)' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted flex gap-1 text-[10px]">
                                  Pagó{' '}
                                  <span className="text-secondary font-semibold">
                                    ${formatCurrency(member.total_paid)}
                                  </span>
                                </span>
                                <span className="text-muted flex gap-1 text-[10px]">
                                  Cuota{' '}
                                  <span className="text-secondary font-semibold">
                                    ${formatCurrency(member.total_share)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Settlement section */}
                      <div className="mt-auto">
                        {hasDebts ? (
                          <div className="border-border-subtle space-y-2 border-t border-dashed pt-3">
                            {settlementPairs.map((pair, i) => (
                              <div
                                key={i}
                                className="bg-card border-border-subtle flex items-center gap-2 rounded-xl border px-3 py-2.5"
                              >
                                <span className="text-secondary text-xs font-semibold">
                                  {pair.debtor}
                                </span>
                                <ArrowRight
                                  size={12}
                                  className="mx-auto text-emerald-500"
                                />
                                <span className="text-secondary text-xs font-semibold">
                                  {pair.creditor}
                                </span>
                                <span className="ml-2 text-xs font-bold text-emerald-500">
                                  ${formatCurrency(pair.amount)}
                                </span>
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setSettleTarget({
                                  group,
                                  pairs: settlementPairs,
                                })
                              }
                              disabled={!accounts.length}
                              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-emerald-500/50"
                            >
                              <CheckCircle2 size={14} />
                              Saldar deudas ({settlementPairs.length})
                            </button>
                          </div>
                        ) : (
                          <div className="border-border-subtle bg-card mt-3 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5">
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                            <span className="text-xs font-semibold text-emerald-500">
                              Todo saldado — sin deudas
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Confirmation Modal */}
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
