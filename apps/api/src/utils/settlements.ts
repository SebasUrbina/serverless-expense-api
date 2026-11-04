export type MemberNet = { user_id: string; nickname: string; net: number };

export type SettlementPair = {
  from_user_id: string;
  from_nickname: string;
  to_user_id: string;
  to_nickname: string;
  amount: number;
};

/** Fewest transfers that bring every member's net balance to zero. */
export function computeSettlementPairs(members: MemberNet[]): SettlementPair[] {
  const nets = members.map((m) => ({ ...m }));
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
      from_user_id: debtor.user_id,
      from_nickname: debtor.nickname,
      to_user_id: creditor.user_id,
      to_nickname: creditor.nickname,
      amount: Math.round(amount),
    });
    debtor.net += amount;
    creditor.net -= amount;
  }
  return pairs;
}
