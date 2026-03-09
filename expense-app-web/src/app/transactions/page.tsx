'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction } from '@/hooks/useDashboardData';
import { format, parseISO, endOfMonth, isValid } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Receipt, Plus, Search } from 'lucide-react';
import { CreateTransactionModal } from '@/components/CreateTransactionModal';
import { MonthSelector } from '@/components/MonthSelector';
import { useTags } from '@/hooks/usePreferences';
import { useState, useEffect } from 'react';

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [filterMonth, setFilterMonth] = useState(''); // Format: YYYY-MM

  const { data: tagsData } = useTags();
  const tagsMap = new Map((tagsData?.tags || []).map(t => [t.id, t.name]));

  const { data: response, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['transactions', 'list', debouncedSearch, filterMonth],
    queryFn: async () => {
      let url = debouncedSearch 
        ? `/transactions?limit=50&search=${encodeURIComponent(debouncedSearch)}`
        : '/transactions?limit=50';
      
      if (filterMonth) {
        const start = `${filterMonth}-01`;
        const dateObj = parseISO(start);
        if (isValid(dateObj)) {
          const end = format(endOfMonth(dateObj), 'yyyy-MM-dd');
          url += `&startDate=${start}&endDate=${end}`;
        }
      }

      const res = await api.get(url);
      return res.data;
    }
  });

  const transactions = response?.transactions || [];

  return (
    <div className="px-8 py-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Transactions</h1>
          <p className="text-zinc-400 mt-1">View and manage all your recent financial activity.</p>
        </div>
        <div className="flex gap-4 items-center flex-col md:flex-row w-full md:w-auto mt-4 md:mt-0">
          <div className="flex gap-2 w-full md:w-auto flex-col md:flex-row items-stretch">
            <MonthSelector value={filterMonth} onChange={setFilterMonth} />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Search optionally..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 w-full sm:w-64 transition-all"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl h-[42px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap w-full md:w-auto"
          >
            <Plus size={18} /> <span className="md:inline">Add New</span>
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-emerald-500 border-r-emerald-500/30"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 shadow-sm shadow-black/20">
                <tr>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">Transaction</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">Category</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {transactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setEditingTx(tx);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-white font-medium">{tx.title}</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {tx.tag_ids?.map(tagId => (
                              <span key={tagId} className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-400 font-medium border border-zinc-700/50">
                                {tagsMap.get(tagId) || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-400 text-sm">
                      {format(parseISO(tx.date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-12 text-center">
            <Receipt className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">
              {debouncedSearch ? "No matches found" : "No statements found"}
            </h3>
            <p className="max-w-sm">
              {debouncedSearch 
                ? `We couldn't find any transaction matching "${debouncedSearch}".`
                : "We couldn't find any recent transactions. Once you start tracking, they'll show up here."}
            </p>
          </div>
        )}
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
