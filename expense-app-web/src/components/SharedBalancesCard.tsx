'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, ArrowRight, Loader2, CheckCircle2, ExternalLink, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAccounts } from '@/hooks/usePreferences';
import { useAuth } from '@/lib/AuthProvider';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { SettleConfirmModal } from './SettleConfirmModal';
import type { GroupBalance, SettlementPair, GroupBalancesResponse } from '@/types/api';

function useGroupBalances(month: string) {
  return useQuery<GroupBalancesResponse>({
    queryKey: ['group-balances', month],
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
    mutationFn: async ({ groupId, month, accountId, settlements }: {
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
      queryClient.invalidateQueries({ queryKey: ['group-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSettleTarget(null);
    },
  });

  if (!isLoading && balances.length === 0) return null;

  const handleConfirmSettle = (accountId: number, selectedPairs: SettlementPair[]) => {
    if (!settleTarget || settleMutation.isPending) return;
    settleMutation.mutate({
      groupId: settleTarget.group.group_id,
      month: currentMonth,
      accountId,
      settlements: selectedPairs,
    });
  };

  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy', { locale: es });

  return (
    <>
      <div className="rounded-3xl p-5 sm:p-6 mt-4 lg:col-span-3 xl:col-span-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10">
              <Users className="text-violet-500" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gastos compartidos</h3>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{monthLabel}</p>
            </div>
          </div>
          <Link
            href={`/transactions?shared=1&month=${currentMonth}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Receipt size={12} />
            <span className="hidden sm:inline">Ver movimientos</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-emerald-500 opacity-50" size={20} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {balances.map(group => {
              const members = group.members;
              if (members.length < 2) return null;

              const hasActivity = group.transaction_count > 0;

              // Compute settlement pairs using minimum cash flow
              const nets = members.map(m => ({ ...m }));
              const settlementPairs: { debtor: string; creditor: string; amount: number }[] = [];
              while (true) {
                let maxC = nets[0], maxD = nets[0];
                for (const m of nets) {
                  if (m.net > maxC.net) maxC = m;
                  if (m.net < maxD.net) maxD = m;
                }
                if (Math.abs(maxD.net) < 1 && Math.abs(maxC.net) < 1) break;
                const amt = Math.min(Math.abs(maxD.net), maxC.net);
                if (amt < 1) break;
                settlementPairs.push({ debtor: maxD.nickname, creditor: maxC.nickname, amount: Math.round(amt) });
                maxD.net += amt;
                maxC.net -= amt;
              }
              const hasDebts = settlementPairs.length > 0;

              // Find current user's balance for hero display
              const myBalance = members.find(m => m.user_id === userId);
              const myNet = myBalance?.net ?? 0;
              const otherMember = members.find(m => m.user_id !== userId);

              return (
                <div key={group.group_id} className="rounded-2xl p-4 transition-colors flex flex-col" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: 'var(--text-primary)' }} className="font-bold text-sm tracking-tight">{group.group_name}</span>
                    <Link
                      href={`/transactions?shared=1&group_id=${group.group_id}&month=${currentMonth}`}
                      className="text-[10px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      {group.transaction_count} movs
                      <ExternalLink size={9} />
                    </Link>
                  </div>

                  {!hasActivity ? (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-sm italic text-center" style={{ color: 'var(--text-muted)' }}>No hay gastos compartidos este mes</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      {/* Hero debt amount */}
                      <div className="rounded-xl px-4 py-4 mb-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        {hasDebts ? (
                          <>
                            <p className="text-[10px] uppercase font-bold tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                              {myNet > 0 ? 'Te deben' : myNet < 0 ? 'Debes' : 'Sin deudas'}
                            </p>
                            <p className={`text-3xl font-extrabold tracking-tight ${myNet > 0 ? 'text-emerald-500' : myNet < 0 ? 'text-red-400' : ''}`}
                              style={myNet === 0 ? { color: 'var(--text-primary)' } : {}}>
                              ${formatCurrency(Math.abs(myNet))}
                            </p>
                            {otherMember && myNet !== 0 && (
                              <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                                {myNet > 0
                                  ? `${otherMember.nickname} te debe`
                                  : `Le debes a ${otherMember.nickname}`
                                }
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-emerald-500 text-sm font-semibold">Todo saldado — sin deudas</span>
                          </div>
                        )}
                      </div>

                      {/* Member breakdown */}
                      <div className="space-y-2.5 mb-4">
                        {members.map(member => {
                          const isMe = member.user_id === userId;
                          return (
                            <div key={member.user_id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${isMe ? 'bg-violet-500/15 text-violet-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  {member.nickname.substring(0, 2)}
                                </div>
                                <span style={{ color: 'var(--text-secondary)' }} className="font-medium text-xs">
                                  {member.nickname}{isMe ? ' (tú)' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span style={{ color: 'var(--text-muted)' }} className="text-[10px] flex gap-1">
                                  Pagó <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>${formatCurrency(member.total_paid)}</span>
                                </span>
                                <span style={{ color: 'var(--text-muted)' }} className="text-[10px] flex gap-1">
                                  Cuota <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>${formatCurrency(member.total_share)}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Settlement section */}
                      <div className="mt-auto">
                        {hasDebts ? (
                          <div className="space-y-2 pt-3" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
                            {settlementPairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{pair.debtor}</span>
                                <ArrowRight size={12} className="text-emerald-500 mx-auto" />
                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{pair.creditor}</span>
                                <span className="text-emerald-500 text-xs font-bold ml-2">${formatCurrency(pair.amount)}</span>
                              </div>
                            ))}
                            <button
                              onClick={() => setSettleTarget({ group, pairs: settlementPairs })}
                              disabled={!accounts.length}
                              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 shadow-sm shadow-emerald-500/20"
                            >
                              <CheckCircle2 size={14} />
                              Saldar deudas ({settlementPairs.length})
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border mt-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-emerald-500 text-xs font-semibold">Todo saldado — sin deudas</span>
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
