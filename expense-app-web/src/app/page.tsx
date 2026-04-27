"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { format, parseISO, isValid, subMonths } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
} from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { SharedBalancesCard } from "@/components/SharedBalancesCard";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { useTransactionModal } from "@/store/useTransactionModal";
import { useAuth } from "@/lib/AuthProvider";

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
              <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight text-primary drop-shadow-md">
                {firstName || "Mi resumen"}
              </h1>
            </div>
            <div className="hidden sm:block">
              <h1 className="truncate text-3xl leading-tight font-black tracking-tighter text-primary drop-shadow-md sm:text-4xl">
                <span>{firstName ? `Hola, ${firstName}` : "Mi resumen"}</span>
                <span className="ml-2 inline-block align-middle text-[0.85em]">
                  👋
                </span>
              </h1>
              <p className="text-sm mt-1 font-medium text-muted">
                Aquí puedes ver en que Seva tu dinero.
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
              className="sm:hidden w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-inset backdrop-blur-xl border border-border text-secondary hover:text-primary hover:bg-card-hover active:scale-95"
              aria-label="Ajustes"
            >
              <Settings size={18} className="text-emerald-400" />
            </Link>
            <button
              onClick={() => openModal()}
              className="hidden sm:flex bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-primary px-3.5 py-2.5 rounded-xl font-semibold transition-colors items-center gap-1.5 shadow-lg shadow-emerald-500/20 text-sm whitespace-nowrap"
            >
              <span className="text-base leading-none">+</span>
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30" />
            </div>
          ) : (
            <>
              {/* Massive Centered Expense Hero */}
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 mb-4 relative rounded-[2.5rem] bg-gradient-to-b from-emerald-500/5 to-transparent border border-border backdrop-blur-3xl shadow-card">
                {/* Link to Analytics */}
                <Link
                  href={`/analytics?month=${filterMonth}`}
                  className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-2xl transition-all hover:bg-emerald-500/20"
                >
                  <PieChartIcon size={14} />
                  Desglose detallado
                </Link>

                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2 text-muted">
                  {filterMonth ? "Este mes has gastado" : "Gasto Total"}
                </p>
                <div
                  className="flex items-baseline gap-1 leading-none mb-6 cursor-pointer hover:scale-[1.02] transition-transform duration-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  onClick={() => router.push(`/analytics?month=${filterMonth}`)}
                >
                  <span className="text-3xl sm:text-4xl font-semibold mb-1 text-secondary">
                    $
                  </span>
                  <h2 className="text-6xl sm:text-8xl font-black tracking-tighter text-primary">
                    {formatCurrency(expense)}
                  </h2>
                </div>

                {/* vs previous month indicator */}
                {filterMonth && prevExpense > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-inset border border-border backdrop-blur-md shadow-inner">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                      vs mes pasado
                    </span>
                    <span
                      className={`text-xs font-black flex items-center gap-1 ${isExpenseIncrease ? "text-red-500 dark:text-red-400 dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : isExpenseDecrease ? "text-emerald-500 dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-secondary"}`}
                    >
                      {isExpenseIncrease
                        ? `+${absExpenseDelta}%`
                        : isExpenseDecrease
                          ? `-${absExpenseDelta}%`
                          : `0%`}
                    </span>
                  </div>
                )}

                {/* Minimalist Flow & Meta Row */}
                <div className="w-full max-w-md mx-auto px-6 mt-8 sm:mt-12">
                  <div className="flex items-center justify-between p-4 rounded-3xl bg-card/80 border border-border backdrop-blur-xl">
                    <div className="flex flex-col items-center w-1/3">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                        <Wallet
                          size={12}
                          className="text-indigo-500 dark:text-indigo-400"
                        />{" "}
                        Balance
                      </p>
                      <p className={`font-extrabold text-sm sm:text-base ${totalBalance < 0 ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-300"}`}>
                        ${formatCurrency(totalBalance)}
                      </p>
                    </div>

                    <div className="w-px h-8 bg-border" />

                    <div className="flex flex-col items-center w-1/3">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                        <ArrowUpRight
                          size={12}
                          className="text-emerald-500 dark:text-emerald-400"
                        />{" "}
                        Ingresos
                      </p>
                      <p className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                        ${formatCurrency(income)}
                      </p>
                    </div>

                    <div className="w-px h-8 bg-border" />

                    <div className="flex flex-col items-center w-1/3">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5 text-muted">
                        <CreditCard
                          size={12}
                          className="text-blue-500 dark:text-blue-400"
                        />{" "}
                        <span className="hidden sm:inline">Movimientos</span>
                        <span className="sm:hidden">Movs.</span>
                      </p>
                      <p className="font-extrabold text-base sm:text-lg text-primary">
                        {kpiSummary?.transaction_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-[2rem] p-6 flex flex-col h-auto lg:h-[360px] bg-card border border-border shadow-card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="font-bold text-base text-primary">
                      Últimos movimientos
                    </p>
                    <p className="text-xs text-muted mt-0.5">Lo más reciente</p>
                  </div>
                  <Link
                    href="/transactions"
                    className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full"
                  >
                    Ver todo →
                  </Link>
                </div>
                <div className="flex-1 lg:overflow-y-auto space-y-1.5 -mx-2 px-2">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`flex justify-between items-center p-3 rounded-2xl transition-all duration-300 ${tx.is_owner !== false ? "cursor-pointer hover:bg-inset hover:scale-[1.01]" : "cursor-default"}`}
                        onClick={() => {
                          if (tx.is_owner === false) return;
                          openModal(tx);
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base shadow-inner ${tx.type === "income" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"}`}
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
                          className="shrink-0 font-bold text-sm ml-2"
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
                    <div
                      className="flex flex-col items-center justify-center h-full"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Receipt className="w-9 h-9 mb-3 opacity-20" />
                      <p className="text-sm">Aún no hay movimientos</p>
                      <p className="text-xs mt-1 opacity-60">
                        Empieza añadiendo uno ↑
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Categories + KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4">
                {/* Top Spending Categories */}
                <div
                  className="lg:col-span-2 rounded-3xl p-5 flex flex-col h-auto lg:min-h-[240px]"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PieChartIcon className="text-emerald-500" size={18} />
                    <p
                      className="font-bold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      En esto se va tu dinero
                    </p>
                  </div>
                  <p
                    className="text-xs mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Categorías con más gasto este mes
                  </p>
                  <div className="flex-1 lg:overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                      {categorySummary && categorySummary.length > 0 ? (
                        categorySummary.map((cat, idx) => {
                          const delta =
                            cat.previous_amount !== undefined
                              ? cat.amount - cat.previous_amount!
                              : 0;
                          const isIncrease = delta > 0;
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl p-3 flex justify-between items-center cursor-pointer transition-all"
                              style={{
                                background: "var(--bg-inset)",
                                border: "1px solid var(--border-subtle)",
                              }}
                              onClick={() => {
                                let url = `/transactions?category_id=${cat.category_id}`;
                                if (filterMonth) url += `&month=${filterMonth}`;
                                router.push(url);
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                                  style={{ background: "var(--bg-card)" }}
                                >
                                  {cat.category_icon ? (
                                    <span>{cat.category_icon}</span>
                                  ) : (
                                    <Target
                                      size={14}
                                      style={{ color: "var(--text-muted)" }}
                                    />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className="font-medium text-sm"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {cat.category}
                                  </p>
                                  {cat.previous_amount !== undefined &&
                                    delta !== 0 && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span
                                          className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isIncrease ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                                        >
                                          {isIncrease ? (
                                            <ArrowUpRight
                                              size={9}
                                              className="mr-0.5"
                                            />
                                          ) : (
                                            <ArrowDownRight
                                              size={9}
                                              className="mr-0.5"
                                            />
                                          )}
                                          ${formatCurrency(Math.abs(delta))}
                                        </span>
                                        <span
                                          className="text-[9px]"
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          vs mes anterior
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                              <p className="text-red-500 font-bold text-sm">
                                ${formatCurrency(cat.amount)}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="flex-1 flex items-center justify-center text-sm py-8 sm:col-span-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Sin datos de categorías aún.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div
                    className="rounded-3xl p-5 flex flex-col justify-between group transition-colors flex-1"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                        <TrendingDown size={20} />
                      </div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Tu gasto más grande
                      </p>
                      <p
                        className="font-medium text-sm mt-1 truncate"
                        style={{ color: "var(--text-primary)" }}
                        title={kpiSummary?.largest_expense_title || ""}
                      >
                        {kpiSummary?.largest_expense_title || "Sin datos"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-red-500 mt-3">
                      ${formatCurrency(kpiSummary?.largest_expense || 0)}
                    </p>
                  </div>

                  <div
                    className="rounded-3xl p-5 flex flex-col justify-between group transition-colors flex-1"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                        <TrendingUp size={20} />
                      </div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Tu mayor ingreso
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-500 mt-3">
                      ${formatCurrency(kpiSummary?.largest_income || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shared Balances */}
              <SharedBalancesCard filterMonth={filterMonth} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
