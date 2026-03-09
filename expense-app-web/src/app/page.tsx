'use client';

import { useDashboardData, Transaction } from '@/hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, CreditCard, PieChart as PieChartIcon, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { CreateTransactionModal } from '@/components/CreateTransactionModal';
import { MonthSelector } from '@/components/MonthSelector';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [filterMonth, setFilterMonth] = useState(''); // Empty string means current latest month
  const { recentTransactions, monthlySummary, categorySummary, kpiSummary, selectedMonthSummary, totalBalance, isLoading } = useDashboardData(filterMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  if (isLoading) {
    return (
      <div className="px-8 py-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
      </div>
    );
  }

  // Format the chart data so Recharts can consume it nicely
  const chartData = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate) ? format(parsedDate, 'MMM yy') : item.month,
        Income: item.total_income,
        Expense: item.total_expense,
      };
    });

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back. Here is your financial overview.</p>
        </div>
        <div className="flex gap-4 items-center flex-col sm:flex-row w-full sm:w-auto mt-4 sm:mt-0">
          <MonthSelector value={filterMonth} onChange={setFilterMonth} />
          <button 
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 h-[42px] whitespace-nowrap"
          >
            <span className="text-xl leading-none -mt-0.5">+</span> <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Balance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-40 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} />
          </div>
          <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Balance</p>
          <p className="text-white text-4xl font-bold">${totalBalance.toLocaleString('es-CL')}</p>
        </div>
        
        {/* Monthly Expenses */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-40 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
            <ArrowDownRight size={80} />
          </div>
          <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Monthly Expenses</p>
          <p className="text-white text-4xl font-bold">${selectedMonthSummary?.total_expense.toLocaleString('es-CL') || '0'}</p>
        </div>

        {/* Monthly Income */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-40 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <ArrowUpRight size={80} />
          </div>
          <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Monthly Income</p>
          <p className="text-emerald-400 text-4xl font-bold">${selectedMonthSummary?.total_income.toLocaleString('es-CL') || '0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[400px] flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6">Cashflow Trend</h3>
          <div className="flex-1 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`}
                  />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-CL')}`, undefined]}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Income" fill="#30D158" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#FF453A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-500">No data available to display chart.</p>
                </div>
            )}
          </div>
        </div>
        
        <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg">Recent Activity</h3>
            <Link href="/transactions" className="text-emerald-500 text-sm font-semibold hover:text-emerald-400">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex justify-between items-center border-b border-zinc-800/50 pb-4 last:border-0 cursor-pointer hover:bg-zinc-800/20 p-2 rounded-xl transition-colors -mx-2"
                  onClick={() => {
                    setEditingTx(tx);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{tx.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{tx.category} • {format(parseISO(tx.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Receipt className="w-12 h-12 mb-3 opacity-20" />
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon className="text-emerald-500" size={24} />
            <h3 className="text-white font-bold text-lg">Top Spending Categories</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {categorySummary && categorySummary.length > 0 ? (
              categorySummary.map((cat, idx) => (
                <div key={idx} className="bg-zinc-800/30 rounded-2xl p-4 flex justify-between items-center border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Target size={18} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{cat.category}</p>
                      <p className="text-zinc-500 text-xs">Total spent on this category</p>
                    </div>
                  </div>
                  <p className="text-red-400 font-bold">${cat.amount.toLocaleString('es-CL')}</p>
                </div>
              ))
            ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-500">No category data available.</p>
                </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-[400px]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group hover:bg-zinc-800/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <TrendingDown size={24} />
              </div>
              <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-1">Largest Expense</p>
              <p className="text-white font-medium mt-1 truncate max-w-full" title={kpiSummary?.largest_expense_title || ''}>
                {kpiSummary?.largest_expense_title || 'N/A'}
              </p>
            </div>
            <p className="text-4xl font-bold text-red-500 mt-4">${kpiSummary?.largest_expense?.toLocaleString('es-CL') || '0'}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group hover:bg-zinc-800/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-1">Largest Income</p>
            </div>
            <p className="text-4xl font-bold text-emerald-400 mt-4">${kpiSummary?.largest_income?.toLocaleString('es-CL') || '0'}</p>
          </div>
          
          <div className="col-span-1 sm:col-span-2 bg-linear-to-br from-emerald-500/20 to-zinc-900 border border-zinc-800/80 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center backdrop-blur-md">
                <CreditCard size={28} />
              </div>
              <div>
                <p className="text-white font-bold text-xl">{kpiSummary?.transaction_count || 0}</p>
                <p className="text-zinc-400 text-sm">Total Transactions Processed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateTransactionModal 
        isOpen={isModalOpen} 
        initialData={editingTx}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }} 
      />
    </div>
  );
}
