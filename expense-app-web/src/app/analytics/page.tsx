'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { MonthlySummary, CategorySummary } from '@/hooks/useDashboardData';

export default function AnalyticsPage() {
  const { data: response, isLoading: isLoadingSummary } = useQuery<{ summary: MonthlySummary[] }>({
    queryKey: ['transactions', 'analytics', 'monthly'],
    queryFn: async () => {
      const res = await api.get('/transactions/summary/monthly?months=12');
      return res.data;
    }
  });

  const { data: categoryResponse, isLoading: isLoadingCategory } = useQuery<{ summary: CategorySummary[] }>({
    queryKey: ['transactions', 'analytics', 'category'],
    queryFn: async () => {
      // For general analytics we want all time
      const res = await api.get('/transactions/summary/category?type=expense');
      return res.data;
    }
  });

  const isLoading = isLoadingSummary || isLoadingCategory;

  const monthlySummary = response?.summary || [];
  const categorySummary = categoryResponse?.summary || [];
  
  const chartData = monthlySummary
    .filter((item) => item.month)
    .map((item) => {
      const parsedDate = parseISO(`${item.month}-01`);
      return {
        name: isValid(parsedDate) ? format(parsedDate, 'MMM yy') : item.month,
        Income: item.total_income,
        Expense: item.total_expense,
        Balance: item.total_income - item.total_expense
      };
    });

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Analytics Deep Dive</h1>
        <p className="text-zinc-400">Comprehensive overview of your financial trajectory over the last 12 months.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
          </div>
        ) : chartData.length > 0 ? (
          <>
            <h3 className="text-white font-bold text-lg mb-6">Annual Cashflow Overlay</h3>
            <div className="flex-1 w-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#30D158" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#30D158" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF453A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF453A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`} />
                  
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString('es-CL')}`, undefined]}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  <Area type="monotone" dataKey="Income" stroke="#30D158" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#FF453A" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
           <div className="flex items-center justify-center flex-1 text-zinc-500">
             <p>Not enough history to generate deep analytics.</p>
           </div>
        )}
        </div>

        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <h3 className="text-white font-bold text-lg mb-6">Spending by Category (All Time)</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center flex-1 h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
              </div>
            ) : categorySummary.length > 0 ? (
              <div className="space-y-4">
                {categorySummary.map((cat, idx) => {
                  const totalExpense = categorySummary.reduce((acc, curr) => acc + curr.amount, 0);
                  const percentage = ((cat.amount / totalExpense) * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium text-sm">{cat.category}</span>
                          <span className="text-zinc-400 text-sm">
                            ${cat.amount.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 w-12 text-right">
                        <span className="text-xs font-bold text-emerald-500">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <p>No category data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
