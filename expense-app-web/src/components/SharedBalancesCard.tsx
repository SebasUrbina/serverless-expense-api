'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAccounts } from '@/hooks/usePreferences';
import { formatCurrency } from '@/lib/utils';

type MemberBalance = {
  user_id: string;
  nickname: string;
  total_paid: number;
  total_share: number;
  net: number;
};

type GroupBalance = {
  group_id: number;
  group_name: string;
  month: string;
  transaction_count: number;
  members: MemberBalance[];
};

function useGroupBalances(month: string) {
  return useQuery<{ balances: GroupBalance[] }>({
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
  const queryClient = useQueryClient();

  const accounts = accountsData?.accounts || [];
  const balances = data?.balances || [];

  const settleMutation = useMutation({
    mutationFn: async ({ groupId, month, accountId }: { groupId: number; month: string; accountId: number }) => {
      const res = await api.post(`/groups/${groupId}/settle`, { month, account_id: accountId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (!isLoading && balances.length === 0) return null;

  const handleSettle = (group: GroupBalance) => {
    if (settleMutation.isPending) return;
    const defaultAccount = accounts[0];
    if (!defaultAccount) return;

    settleMutation.mutate({
      groupId: group.group_id,
      month: currentMonth,
      accountId: defaultAccount.id,
    });
  };

  return (
    <div className="rounded-3xl p-5 sm:p-6 mt-4 lg:col-span-3 xl:col-span-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Users className="text-emerald-500" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gastos compartidos</h3>
            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
              {format(new Date(currentMonth + '-01'), 'MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
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

            return (
              <div key={group.group_id} className="rounded-2xl p-4 transition-colors flex flex-col" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ color: 'var(--text-primary)' }} className="font-bold text-sm tracking-tight">{group.group_name}</span>
                  <span style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }} className="text-[10px] uppercase font-bold px-2 py-1 rounded-lg">
                    {group.transaction_count} movs
                  </span>
                </div>

                {!hasActivity ? (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <p className="text-sm italic text-center" style={{ color: 'var(--text-muted)' }}>No hay gastos compartidos este mes</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-3 mb-4">
                      {members.map(member => (
                        <div key={member.user_id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold uppercase">
                              {member.nickname.substring(0, 2)}
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }} className="font-medium text-xs">{member.nickname}</span>
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
                      ))}
                    </div>

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
                            onClick={() => handleSettle(group)}
                            disabled={settleMutation.isPending || !accounts.length}
                            className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 shadow-sm shadow-emerald-500/20"
                          >
                            {settleMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
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
  );
}
