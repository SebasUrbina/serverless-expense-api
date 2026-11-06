'use client';

import {
  equalPercentages,
  splitAmounts,
  type SplitPercentages,
} from '@/lib/splitPlan';
import { formatCurrency } from '@/lib/utils';

type Member = { user_id: string; nickname?: string };

const sliderStyle = (pct: number) => ({
  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
});

/** Percent of a shared expense each member covers. */
export function SplitEditor({
  members,
  amount,
  percentages,
  onChange,
}: {
  members: Member[];
  amount: number;
  percentages: SplitPercentages;
  onChange: (next: SplitPercentages) => void;
}) {
  const is2Members = members.length === 2;
  const firstPct = percentages[members[0]?.user_id ?? ''] || 0;
  const total = members.reduce((s, m) => s + (percentages[m.user_id] ?? 0), 0);
  const amounts = splitAmounts(percentages, members, amount);
  const presets = is2Members
    ? [
        [50, 50],
        [60, 40],
        [70, 30],
        [80, 20],
        [100, 0],
      ]
    : [];

  return (
    <div className="space-y-3">
      <p className="text-secondary text-sm font-semibold">División</p>
      {is2Members ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(([a, b]) => (
              <button
                key={a}
                type="button"
                aria-pressed={firstPct === a}
                onClick={() =>
                  onChange({
                    [members[0]!.user_id]: a!,
                    [members[1]!.user_id]: b!,
                  })
                }
                className={`focus-ring h-8 rounded-xl border px-3 text-xs font-bold tabular-nums transition-colors ${
                  firstPct === a
                    ? 'bg-accent-soft text-accent border-transparent'
                    : 'border-border text-secondary hover:text-primary'
                }`}
              >
                {a} / {b}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            aria-label={`Porcentaje de ${members[0]!.nickname ?? 'la primera persona'}`}
            value={firstPct}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onChange({
                [members[0]!.user_id]: value,
                [members[1]!.user_id]: 100 - value,
              });
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={sliderStyle(firstPct)}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => onChange(equalPercentages(members))}
          className="focus-ring border-border text-secondary hover:text-primary h-8 rounded-xl border px-3 text-xs font-bold"
        >
          Partes iguales
        </button>
      )}

      <ul className="space-y-1.5">
        {members.map((member) => {
          const pct = percentages[member.user_id] || 0;
          return (
            <li
              key={member.user_id}
              className="bg-inset flex items-center gap-3 rounded-xl px-3 py-2"
            >
              <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                {member.nickname}
              </span>
              {!is2Members && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label={`Porcentaje de ${member.nickname ?? 'integrante'}`}
                  value={pct}
                  onChange={(e) =>
                    onChange({
                      ...percentages,
                      [member.user_id]: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-full"
                  style={sliderStyle(pct)}
                />
              )}
              <span className="text-primary w-10 text-right text-sm font-bold tabular-nums">
                {pct}%
              </span>
              <span className="text-secondary w-20 text-right text-sm tabular-nums">
                ${formatCurrency(amounts[member.user_id] ?? 0)}
              </span>
            </li>
          );
        })}
      </ul>
      {total !== 100 && (
        <p className="text-expense text-xs">
          Debe sumar 100% (ahora suma {total}%).
        </p>
      )}
    </div>
  );
}
