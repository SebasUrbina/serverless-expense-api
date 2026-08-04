"use client";

import { useState } from "react";
import { Gauge, Pencil, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBudget } from "@/hooks/useBudget";
import { parseISO, isValid, format } from "date-fns";

type Props = {
  month: string;
  expense: number;
};

export function MonthlyBudgetCard({ month, expense }: Props) {
  const { general, isLoading, saveBudget } = useBudget(month);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  const budgetAmount = general?.amount ?? 0;
  const formatter = new Intl.NumberFormat("es-CL");

  const daysInMonth = month
    ? new Date(
        Number(month.split("-")[0]),
        Number(month.split("-")[1]),
        0,
      ).getDate()
    : 30;

  const monthDate = parseISO(`${month}-01`);
  const isCurrentMonth =
    isValid(monthDate) && format(new Date(), "yyyy-MM") === month;
  const today = new Date();
  const daysElapsed = isCurrentMonth
    ? today.getDate()
    : daysInMonth;

  const percent = budgetAmount > 0 ? (expense / budgetAmount) * 100 : 0;
  const dailyAvg = daysElapsed > 0 ? expense / daysElapsed : 0;
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);
  const projected = expense + dailyAvg * remainingDays;
  const projectedPercent = budgetAmount > 0 ? (projected / budgetAmount) * 100 : 0;

  const percentColor =
    percent < 70
      ? "bg-emerald-500"
      : percent < 90
        ? "bg-amber-500"
        : "bg-red-500";
  const textColor =
    percent < 70
      ? "text-emerald-600 dark:text-emerald-400"
      : percent < 90
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const startEdit = () => {
    setDraft(budgetAmount > 0 ? formatter.format(budgetAmount) : "");
    setEditing(true);
  };
  const commit = () => {
    const value = Number(draft.replace(/[^0-9]/g, ""));
    if (!isNaN(value) && value >= 0) saveBudget.mutate(value);
    setEditing(false);
  };

  return (
    <div className="rounded-3xl p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Gauge size={20} />
          </div>
          <div>
            <p className="font-bold text-base text-primary">Ritmo del mes</p>
            <p className="text-xs text-muted mt-0.5">
              Presupuesto vs. lo que llevas gastado
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-inset rounded-lg w-1/3" />
          <div className="h-2.5 bg-inset rounded-full w-full" />
          <div className="h-3 bg-inset rounded-lg w-2/3" />
        </div>
      ) : budgetAmount === 0 && !editing ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-muted">
            Aún no tienes un presupuesto para este mes.
          </p>
          <button
            onClick={startEdit}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent-soft px-4 py-2 rounded-xl hover:bg-accent/20 transition-colors"
          >
            <Pencil size={14} /> Establecer presupuesto
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-sm text-muted">
                Gastado{" "}
                <span className="font-bold text-primary tabular-nums">
                  ${formatCurrency(expense)}
                </span>
              </p>
            </div>
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    if (!rawValue) {
                      setDraft("");
                      return;
                    }
                    setDraft(formatter.format(parseInt(rawValue, 10)));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  inputMode="numeric"
                  className="w-32 px-2.5 py-1.5 rounded-lg text-base font-bold text-primary bg-inset border border-border text-right tabular-nums outline-none focus:border-accent"
                  placeholder="Monto"
                />
                <button
                  onClick={commit}
                  className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center"
                  aria-label="Guardar"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 rounded-lg bg-inset text-secondary flex items-center justify-center"
                  aria-label="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
              >
                <Pencil size={13} />
                <span className="tabular-nums">${formatCurrency(budgetAmount)}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2.5 rounded-full bg-inset overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${percentColor}`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            <span
              className={`text-sm font-black tabular-nums ${textColor}`}
            >
              {percent.toFixed(0)}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-inset/60 border border-border-subtle px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted">
                Proyección fin de mes
              </p>
              <p
                className={`text-sm font-black tabular-nums mt-0.5 ${
                  projectedPercent > 100
                    ? "text-red-600 dark:text-red-400"
                    : projectedPercent > 90
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ${formatCurrency(projected)}
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                {projectedPercent.toFixed(0)}% del presupuesto
              </p>
            </div>
            <div className="rounded-xl bg-inset/60 border border-border-subtle px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted">
                Presupuesto diario
              </p>
              <p className="text-sm font-black text-primary tabular-nums mt-0.5">
                ${formatCurrency(dailyAvg)}
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                {remainingDays} días restantes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
