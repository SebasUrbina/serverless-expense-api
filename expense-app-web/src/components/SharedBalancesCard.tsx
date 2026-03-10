'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAccounts } from '@/hooks/usePreferences';

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

  const formatCurrency = (val: number) => `$${Math.abs(val).toLocaleString('es-CL')}`;

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Users className="text-violet-400" size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Shared Balances</h3>
          <p className="text-zinc-500 text-xs">{format(new Date(currentMonth + '-01'), 'MMMM yyyy')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-zinc-500" size={20} />
        </div>
      ) : (
        <div className="space-y-4">
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
              <div key={group.group_id} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{group.group_name}</span>
                    <span className="text-zinc-600 text-xs">{group.transaction_count} expenses</span>
                  </div>
                </div>

                {!hasActivity ? (
                  <p className="text-zinc-600 text-sm italic">No shared expenses this month</p>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      {members.map(member => (
                        <div key={member.user_id} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">{member.nickname}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-zinc-500 text-xs">Paid {formatCurrency(member.total_paid)}</span>
                            <span className="text-zinc-500 text-xs">Share {formatCurrency(member.total_share)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasDebts && (
                      <div className="space-y-2">
                        {settlementPairs.map((pair, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10">
                            <span className="text-sm font-medium text-zinc-300">{pair.debtor}</span>
                            <ArrowRight size={14} className="text-zinc-600" />
                            <span className="text-sm font-medium text-zinc-300">{pair.creditor}</span>
                            <span className="text-red-400 text-sm font-bold ml-auto">{formatCurrency(pair.amount)}</span>
                          </div>
                        ))}
                        <button
                          onClick={() => handleSettle(group)}
                          disabled={settleMutation.isPending || !accounts.length}
                          className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white text-sm font-bold px-3 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                        >
                          {settleMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Settle All ({settlementPairs.length} {settlementPairs.length === 1 ? 'transfer' : 'transfers'})
                        </button>
                      </div>
                    )}

                    {!hasDebts && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-emerald-400 text-sm font-medium">✓ All settled — no debts</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
