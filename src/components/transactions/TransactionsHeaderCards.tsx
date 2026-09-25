'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Landmark, ArrowUp, ArrowDown, Scale, ChevronRight } from 'lucide-react';

interface TransactionsHeaderCardsProps {
  activeTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
  onSelectTypeFilter: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
}

export const TransactionsHeaderCards: React.FC<TransactionsHeaderCardsProps> = ({
  activeTypeFilter,
  onSelectTypeFilter,
}) => {
  const { summary, isPrivacyMode } = useFinance();

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Saldo atual */}
      <button
        type="button"
        onClick={() => onSelectTypeFilter('all')}
        className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
          activeTypeFilter === 'all'
            ? 'bg-[#1e2330] border-cyan-500/60 shadow-lg shadow-cyan-500/10'
            : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#0284c7] flex items-center justify-center text-white shrink-0 shadow-md">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Saldo atual</span>
            <span className="text-base font-bold text-white tracking-tight block truncate">
              {displayVal(summary.totalBalance)}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
      </button>

      {/* 2. Receitas */}
      <button
        type="button"
        onClick={() => onSelectTypeFilter(activeTypeFilter === 'income' ? 'all' : 'income')}
        className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
          activeTypeFilter === 'income'
            ? 'bg-[#1e2330] border-emerald-500/60 shadow-lg shadow-emerald-500/10'
            : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Receitas</span>
            <span className="text-base font-bold text-white tracking-tight block truncate">
              {displayVal(summary.monthlyIncome)}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
      </button>

      {/* 3. Despesas */}
      <button
        type="button"
        onClick={() => onSelectTypeFilter(activeTypeFilter === 'expense' ? 'all' : 'expense')}
        className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
          activeTypeFilter === 'expense'
            ? 'bg-[#1e2330] border-rose-500/60 shadow-lg shadow-rose-500/10'
            : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#f43f5e] flex items-center justify-center text-white font-bold shrink-0 shadow-md">
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Despesas</span>
            <span className="text-base font-bold text-white tracking-tight block truncate">
              {displayVal(summary.monthlyExpense)}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
      </button>

      {/* 4. Balanço mensal */}
      <button
        type="button"
        onClick={() => onSelectTypeFilter('all')}
        className="flex items-center justify-between p-4 rounded-3xl border bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a] transition-all text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white shrink-0 shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block truncate">Balanço mensal</span>
            <span
              className={`text-base font-bold tracking-tight block truncate ${
                summary.monthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {displayVal(summary.monthlySavings)}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
      </button>
    </div>
  );
};
