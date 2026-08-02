"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { format, parseISO, isValid, subMonths } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MonthSelector } from "@/components/MonthSelector";
import { SharedBalancesCard } from "@/components/SharedBalancesCard";
import { MonthlyBudgetCard } from "@/components/MonthlyBudgetCard";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { useTransactionModal } from "@/store/useTransactionModal";
import { useAuth } from "@/lib/AuthProvider";

const DONUT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#f43f5e",
  "#84cc16",
  "#14b8a6",
  "#a855f7",
];

function EmptyDonut() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full border-8 border-dashed border-border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Target size={22} className="text-muted" />
        </div>
      </div>
      <p className="text-sm text-muted mt-4">
        Sin datos de categorías este mes.
      </p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  const {
    recentTransactions,
    monthlySummary,
    categorySummary,
    kpiSummary,
    selectedMonthSummary,
    totalBalance,
    isLoading,
  } = useDashboardData(filterMonth);
  const { openModal } = useTransactionModal();

  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.display_name;
  const firstName =
    typeof displayName === "string" ? displayName.split(" ")[0] : null;

  const expense = filterMonth
    ? (selectedMonthSummary?.total_expense ?? 0)
    : monthlySummary.reduce((acc, curr) => acc + curr.total_expense, 0);
  const income = filterMonth
    ? (selectedMonthSummary?.total_income ?? 0)
    : monthlySummary.reduce((acc, curr) => acc + curr.total_income, 0);
  const previousMonthDate = subMonths(parseISO(`${filterMonth}-01`), 1);
  const previousMonthStr = isValid(previousMonthDate)
    ? format(previousMonthDate, "yyyy-MM")
    : null;
  const previousMonthSummary = monthlySummary.find(
    (s) => s.month === previousMonthStr,
  );
  const prevExpense = previousMonthSummary?.total_expense ?? 0;

  let expenseDeltaRaw = 0;
  if (prevExpense > 0) {
    expenseDeltaRaw = ((expense - prevExpense) / prevExpense) * 100;
  } else if (expense > 0) {
    expenseDeltaRaw = 100;
  }
  const isExpenseIncrease = expenseDeltaRaw > 0;
  const isExpenseDecrease = expenseDeltaRaw < 0;
  const absExpenseDelta = Math.abs(expenseDeltaRaw).toFixed(0);

  const totalExpense = categorySummary.reduce((acc, curr) => acc + curr.amount, 0);

  const goToCategory = (categoryId: number) => {
    let url = `/transactions?category_id=${categoryId}`;
    if (filterMonth) url += `&month=${filterMonth}`;
    router.push(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1 pr-1">
            <div className="sm:hidden">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted mb-0.5">
                Bienvenido 👋
              </p>
              <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight text-primary">
                {firstName || "Mi resumen"}
              </h1>
            </div>
            <div className="hidden sm:block">
              <h1 className="truncate text-3xl leading-tight font-black tracking-tighter text-primary sm:text-4xl">
                <span>{firstName ? `Hola, ${firstName}` : "Mi resumen"}</span>
                <span className="ml-2 inline-block align-middle text-[0.85em]">
                  👋
                </span>
              </h1>
              <p className="text-sm mt-1 font-medium text-muted">
                Aquí puedes ver en qué se va tu dinero.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            <MonthSelector
              value={filterMonth}
              onChange={setFilterMonth}
              className="min-w-0"
            />
            <Link
              href="/settings"
              className="sm:hidden w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-inset border border-border text-secondary hover:text-primary hover:bg-card-hover active:scale-95"
              aria-label="Ajustes"
            >
              <Settings size={18} className="text-accent" />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-accent hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all items-center gap-1.5 shadow-sm text-sm whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-base leading-none">+</span>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-accent border-r-accent/30" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (spans 2) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Gasto Hero */}
                  <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 flex flex-col items-center text-center relative">
                    <Link
                      href={`/analytics?month=${filterMonth}`}
                      className="absolute top-5 right-5 hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-accent bg-accent-soft px-3 py-1.5 rounded-lg transition-colors hover:bg-accent/20"
                    >
                      Desglose detallado
                    </Link>

                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-2 text-muted">
                      {filterMonth ? "Este mes has gastado" : "Gasto Total"}
                    </p>
                    <div
                      className="flex items-baseline gap-1 leading-none mb-5 cursor-pointer hover:opacity-80 transition-opacity tabular-nums"
                      onClick={() => router.push(`/analytics?month=${filterMonth}`)}
                    >
                      <span className="text-3xl sm:text-4xl font-bold mb-1 text-secondary">
                        $
                      </span>
                      <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-primary tabular-nums">
                        {formatCurrency(expense)}
                      </h2>
                    </div>

                    {/* vs previous month */}
                    {filterMonth && prevExpense > 0 && (
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-inset border border-border">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                          vs mes pasado
                        </span>
                        <span
                          className={`text-xs font-bold flex items-center gap-1 tabular-nums ${
                            isExpenseIncrease
                              ? "text-red-500"
                              : isExpenseDecrease
                                ? "text-emerald-600"
                                : "text-secondary"
                          }`}
                        >
                          {isExpenseIncrease
                            ? `+${absExpenseDelta}%`
                            : isExpenseDecrease
                              ? `-${absExpenseDelta}%`
                              : `0%`}
                        </span>
                      </div>
                    )}

                    {/* Mini metrics */}
                    <div className="w-full max-w-md mx-auto mt-8 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-inset/60">
                      <div className="flex flex-col items-center py-4">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                          <Wallet size={12} className="text-violet-500" />{" "}
                          Balance
                        </p>
                        <p
                          className={`font-bold text-sm sm:text-base tabular-nums ${
                            totalBalance < 0
                              ? "text-red-600"
                              : "text-violet-600"
                          }`}
                        >
                          ${formatCurrency(totalBalance)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                          <ArrowUpRight size={12} className="text-emerald-500" />{" "}
                          Ingresos
                        </p>
                        <p className="font-bold text-sm sm:text-base text-emerald-600 tabular-nums">
                          ${formatCurrency(income)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                          <CreditCard size={12} className="text-blue-500" />{" "}
                          <span className="hidden sm:inline">Movimientos</span>
                          <span className="sm:hidden">Movs.</span>
                        </p>
                        <p className="font-bold text-base sm:text-lg text-primary tabular-nums">
                          {kpiSummary?.transaction_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ritmo del mes */}
                  {filterMonth && (
                    <MonthlyBudgetCard month={filterMonth} expense={expense} />
                  )}

                  {/* Categorías: donut + lista */}
                  <div className="rounded-3xl p-6 bg-card border border-border">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-base text-primary">
                          En esto se va tu dinero
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Categorías con más gasto este mes
                        </p>
                      </div>
                    </div>

                    {categorySummary.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* Donut */}
                        <div className="relative h-56 mx-auto w-full max-w-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categorySummary.map((cat, i) => ({
                                  ...cat,
                                  fill: DONUT_COLORS[i % DONUT_COLORS.length],
                                }))}
                                dataKey="amount"
                                nameKey="category"
                                innerRadius="68%"
                                outerRadius="100%"
                                paddingAngle={2}
                                strokeWidth={0}
                                onClick={(entry) => {
                                  const id = (
                                    entry as
                                      | { payload?: { category_id?: number } }
                                      | undefined
                                  )?.payload?.category_id;
                                  if (id) goToCategory(id);
                                }}
                                cursor="pointer"
                              >
                                {categorySummary.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                                    className="outline-none"
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => [
                                  `$${formatCurrency(
                                    Number(value ?? 0),
                                  )}`,
                                  String(name),
                                ]}
                                contentStyle={{
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 12,
                                  fontSize: 13,
                                  color: "var(--text-primary)",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                              Total
                            </span>
                            <span className="text-lg font-black text-primary tabular-nums">
                              ${formatCurrency(totalExpense)}
                            </span>
                          </div>
                        </div>

                        {/* Lista */}
                        <div className="space-y-2">
                          {categorySummary.map((cat, idx) => {
                            const percentage =
                              totalExpense > 0
                                ? ((cat.amount / totalExpense) * 100).toFixed(0)
                                : "0";
                            const delta =
                              cat.previous_amount !== undefined
                                ? cat.amount - cat.previous_amount!
                                : 0;
                            const isIncrease = delta > 0;
                            const color = DONUT_COLORS[idx % DONUT_COLORS.length];
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-inset transition-colors cursor-pointer"
                                onClick={() => goToCategory(cat.category_id)}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: color }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm text-primary truncate flex items-center gap-1.5">
                                      {cat.category_icon && (
                                        <span>{cat.category_icon}</span>
                                      )}
                                      {cat.category}
                                    </p>
                                    <p className="font-bold text-sm text-primary tabular-nums shrink-0 ml-2">
                                      ${formatCurrency(cat.amount)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 rounded-full bg-inset overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                          width: `${percentage}%`,
                                          background: color,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted tabular-nums w-8 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                  {delta !== 0 &&
                                    cat.previous_amount !== undefined && (
                                      <p className="text-[10px] text-muted mt-0.5">
                                        <span
                                          className={
                                            isIncrease
                                              ? "text-red-500"
                                              : "text-emerald-600"
                                          }
                                        >
                                          {isIncrease ? "▲" : "▼"} $
                                          {formatCurrency(Math.abs(delta))}
                                        </span>{" "}
                                        vs mes anterior
                                      </p>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <EmptyDonut />
                    )}
                  </div>
                </div>

                {/* Right Column (spans 1) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Recent Activity */}
                  <div className="rounded-3xl p-6 flex flex-col h-auto lg:h-[480px] bg-card border border-border">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="font-bold text-base text-primary">
                          Últimos movimientos
                        </p>
                        <p className="text-xs text-muted mt-0.5">Lo más reciente</p>
                      </div>
                      <Link
                        href="/transactions"
                        className="text-accent text-[11px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity bg-accent-soft px-3 py-1.5 rounded-full"
                      >
                        Ver todo →
                      </Link>
                    </div>
                    <div className="flex-1 lg:overflow-y-auto space-y-1.5 -mx-2 px-2">
                      {recentTransactions.length > 0 ? (
                        recentTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className={`flex justify-between items-center p-3 rounded-2xl transition-all duration-300 ${
                              tx.is_owner !== false
                                ? "cursor-pointer hover:bg-inset"
                                : "cursor-default"
                            }`}
                            onClick={() => {
                              if (tx.is_owner === false) return;
                              openModal(tx);
                            }}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base ${
                                  tx.type === "income"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-red-500/10 text-red-600"
                                }`}
                              >
                                {tx.category_icon ||
                                  (tx.type === "income" ? (
                                    <ArrowUpRight size={18} />
                                  ) : (
                                    <ArrowDownRight size={18} />
                                  ))}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate text-primary">
                                  {tx.title}
                                </p>
                                <p className="text-xs text-muted mt-0.5 font-medium">
                                  {tx.category} ·{" "}
                                  {format(parseISO(tx.date), "d MMM")}
                                </p>
                              </div>
                            </div>
                            <p
                              className="shrink-0 font-bold text-sm ml-2 tabular-nums"
                              style={{
                                color:
                                  tx.type === "income"
                                    ? "var(--color-income)"
                                    : "var(--color-expense)",
                              }}
                            >
                              {tx.type === "income" ? "+" : "−"}$
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted">
                          <Receipt className="w-9 h-9 mb-3 opacity-30" />
                          <p className="text-sm">Aún no hay movimientos</p>
                          <p className="text-xs mt-1 opacity-70">
                            Empieza añadiendo uno ↑
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="flex flex-col gap-4">
                    <div className="rounded-3xl p-5 flex items-center justify-between gap-3 bg-card border border-border">
                      <div className="min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                          <TrendingDown size={20} />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Gasto más grande
                        </p>
                        <p
                          className="font-bold text-sm mt-1 truncate text-primary"
                          title={kpiSummary?.largest_expense_title || ""}
                        >
                          {kpiSummary?.largest_expense_title || "Sin datos"}
                        </p>
                      </div>
                      <p className="text-2xl font-black text-red-500 tabular-nums shrink-0">
                        ${formatCurrency(kpiSummary?.largest_expense || 0)}
                      </p>
                    </div>

                    <div className="rounded-3xl p-5 flex items-center justify-between gap-3 bg-card border border-border">
                      <div className="min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                          <TrendingUp size={20} />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Mayor ingreso
                        </p>
                      </div>
                      <p className="text-2xl font-black text-emerald-500 tabular-nums shrink-0">
                        ${formatCurrency(kpiSummary?.largest_income || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shared Balances */}
              <SharedBalancesCard filterMonth={filterMonth} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
