import type { GroupBalanceMember, SettlementPair } from '@/types/api';

/** Minimum cash-flow transfers that bring every member's net balance to zero. */
export function computeSettlements(
  members: Pick<GroupBalanceMember, 'nickname' | 'net'>[],
): SettlementPair[] {
  const nets = members.map((m) => ({ nickname: m.nickname, net: m.net }));
  const pairs: SettlementPair[] = [];
  if (nets.length < 2) return pairs;

  while (true) {
    let creditor = nets[0]!;
    let debtor = nets[0]!;
    for (const m of nets) {
      if (m.net > creditor.net) creditor = m;
      if (m.net < debtor.net) debtor = m;
    }
    const amount = Math.min(-debtor.net, creditor.net);
    if (amount < 1) break;
    pairs.push({
      debtor: debtor.nickname,
      creditor: creditor.nickname,
      amount: Math.round(amount),
    });
    debtor.net += amount;
    creditor.net -= amount;
  }
  return pairs;
}
