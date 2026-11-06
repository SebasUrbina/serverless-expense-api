'use client';

import {
  equalPercentages,
  otherMember,
  splitAmounts,
  type SplitMode,
  type SplitState,
} from '@/lib/splitPlan';
import { formatCurrency } from '@/lib/utils';
import { formatAmountInput, parseAmountInput } from './TransactionFields';

type Member = { user_id: string; nickname?: string };

const chipClass = (active: boolean) =>
  `focus-ring h-8 rounded-xl border px-3 text-xs font-bold transition-colors ${
    active
      ? 'bg-accent-soft text-accent border-transparent'
      : 'border-border text-secondary hover:text-primary'
  }`;

const sliderStyle = (pct: number) => ({
  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
});

/** How a shared expense is divided among the group's members. */
export function SplitEditor({
  members,
  amount,
  userId,
  state,
  onChange,
}: {
  members: Member[];
  amount: number;
  userId?: string;
  state: SplitState;
  onChange: (next: SplitState) => void;
}) {
  const other = otherMember(members, userId);
  const shown = splitAmounts(state, members, amount, userId);
  const name = (m: Member) =>
    m.user_id === userId ? 'Tú' : (m.nickname ?? 'Integrante');

  const choose = (mode: SplitMode) => {
    if (mode === state.mode) return;
    onChange({
      mode,
      percentages:
        mode === 'percent' && Object.keys(state.percentages).length === 0
          ? equalPercentages(members)
          : state.percentages,
      // Start custom amounts from what the current split gives each member.
      amounts: mode === 'amount' ? shown : state.amounts,
    });
  };

  const options: { mode: SplitMode; label: string }[] = [
    { mode: 'equal', label: 'Partes iguales' },
    ...(other
      ? [{ mode: 'other' as const, label: `Todo para ${name(other)}` }]
      : []),
    { mode: 'amount', label: 'Montos' },
    { mode: 'percent', label: '%' },
  ];

  const percentSum = members.reduce(
    (s, m) => s + (state.percentages[m.user_id] ?? 0),
    0,
  );
  const amountLeft =
    Math.round(amount) -
    members.reduce((s, m) => s + (state.amounts[m.user_id] ?? 0), 0);
  const first = members[0];
  const firstPct = first ? (state.percentages[first.user_id] ?? 0) : 0;

  return (
    <div className="space-y-3">
      <p className="text-secondary text-sm font-semibold">¿Cómo se divide?</p>
      <div
        role="radiogroup"
        aria-label="Forma de dividir"
        className="flex flex-wrap gap-1.5"
      >
        {options.map((o) => (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={state.mode === o.mode}
            onClick={() => choose(o.mode)}
            className={chipClass(state.mode === o.mode)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {state.mode === 'other' && other && (
        <p className="text-secondary text-[13px]">
          Pagaste por {name(other)}: queda debiéndote todo el monto.
        </p>
      )}

      {state.mode === 'percent' && members.length === 2 && first && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {[50, 60, 70, 80].map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={firstPct === a}
                onClick={() =>
                  onChange({
                    ...state,
                    percentages: {
                      [first.user_id]: a,
                      [members[1]!.user_id]: 100 - a,
                    },
                  })
                }
                className={`${chipClass(firstPct === a)} tabular-nums`}
              >
                {a} / {100 - a}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            aria-label={`Porcentaje de ${name(first)}`}
            value={firstPct}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onChange({
                ...state,
                percentages: {
                  [first.user_id]: value,
                  [members[1]!.user_id]: 100 - value,
                },
              });
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={sliderStyle(firstPct)}
          />
        </div>
      )}

      <ul className="space-y-1.5">
        {members.map((member) => {
          const pct = state.percentages[member.user_id] ?? 0;
          return (
            <li
              key={member.user_id}
              className="bg-inset flex min-h-11 items-center gap-3 rounded-xl px-3 py-2"
            >
              <span className="text-primary min-w-0 flex-1 truncate text-sm font-medium">
                {name(member)}
              </span>
              {state.mode === 'percent' && members.length > 2 && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label={`Porcentaje de ${name(member)}`}
                  value={pct}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      percentages: {
                        ...state.percentages,
                        [member.user_id]: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-full"
                  style={sliderStyle(pct)}
                />
              )}
              {state.mode === 'percent' && (
                <span className="text-primary w-10 text-right text-sm font-bold tabular-nums">
                  {pct}%
                </span>
              )}
              {state.mode === 'amount' ? (
                <span className="bg-card border-border flex h-9 w-28 items-center gap-1 rounded-lg border px-2">
                  <span className="text-muted text-sm">$</span>
                  <input
                    inputMode="numeric"
                    aria-label={`Parte de ${name(member)}`}
                    value={formatAmountInput(
                      String(state.amounts[member.user_id] ?? 0),
                    )}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        amounts: {
                          ...state.amounts,
                          [member.user_id]: parseAmountInput(
                            formatAmountInput(e.target.value),
                          ),
                        },
                      })
                    }
                    className="text-primary min-w-0 flex-1 bg-transparent text-right text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </span>
              ) : (
                <span className="text-secondary w-24 text-right text-sm tabular-nums">
                  ${formatCurrency(shown[member.user_id] ?? 0)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {state.mode === 'percent' && percentSum !== 100 && (
        <p className="text-expense text-xs">
          Debe sumar 100% (ahora suma {percentSum}%).
        </p>
      )}
      {state.mode === 'amount' && (
        <p
          className={`text-xs tabular-nums ${amountLeft === 0 ? 'text-muted' : 'text-expense'}`}
        >
          {amountLeft === 0
            ? 'Las partes cuadran con el monto.'
            : amountLeft > 0
              ? `Faltan $${formatCurrency(amountLeft)} por asignar.`
              : `Sobran $${formatCurrency(-amountLeft)}.`}
        </p>
      )}
    </div>
  );
}
