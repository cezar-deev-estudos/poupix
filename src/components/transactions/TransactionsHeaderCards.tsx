'use client';

import React, { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Landmark, ArrowUp, ArrowDown, Scale, ChevronRight } from 'lucide-react';

interface TransactionsHeaderCardsProps {
  activeTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
  onSelectTypeFilter: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  activeStatusFilter?: 'all' | 'paid' | 'pending';
  onSelectStatusFilter?: (status: 'all' | 'paid' | 'pending') => void;
}

export const TransactionsHeaderCards: React.FC<TransactionsHeaderCardsProps> = ({
  activeTypeFilter,
  onSelectTypeFilter,
  activeStatusFilter = 'all',
  onSelectStatusFilter,
}) => {
  const { summary, filteredTransactions, isPrivacyMode } = useFinance();

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  // Cálculos de Despesas (pendentes, pagas e total)
  const pendingExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' && !t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const paidExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' && t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = pendingExpense + paidExpense;

  // Cálculos de Receitas (pendentes, recebidas e total)
  const pendingIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income' && !t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const paidIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income' && t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalIncome = pendingIncome + paidIncome;

  const handleStatusClick = (status: 'all' | 'paid' | 'pending') => {
    if (!onSelectStatusFilter) return;
    if (activeStatusFilter === status) {
      onSelectStatusFilter('all');
    } else {
      onSelectStatusFilter(status);
    }
  };

  // 1. Visualização Específica para DESPESAS
  if (activeTypeFilter === 'expense') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
        {/* Despesas pendentes */}
        <button
          type="button"
          onClick={() => handleStatusClick('pending')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'pending'
              ? 'bg-[#221c24] border-rose-500/70 shadow-lg shadow-rose-500/10'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-md">
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Despesas pendentes</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(pendingExpense)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>

        {/* Despesas pagas */}
        <button
          type="button"
          onClick={() => handleStatusClick('paid')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'paid'
              ? 'bg-[#221c24] border-rose-500/70 shadow-lg shadow-rose-500/10'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-md">
              <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Despesas pagas</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(paidExpense)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>

        {/* Total Despesas */}
        <button
          type="button"
          onClick={() => handleStatusClick('all')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'all'
              ? 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Total</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(totalExpense)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>
      </div>
    );
  }

  // 2. Visualização Específica para RECEITAS
  if (activeTypeFilter === 'income') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
        {/* Receitas pendentes */}
        <button
          type="button"
          onClick={() => handleStatusClick('pending')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'pending'
              ? 'bg-[#192420] border-emerald-500/70 shadow-lg shadow-emerald-500/10'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Receitas pendentes</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(pendingIncome)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>

        {/* Receitas recebidas */}
        <button
          type="button"
          onClick={() => handleStatusClick('paid')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'paid'
              ? 'bg-[#192420] border-emerald-500/70 shadow-lg shadow-emerald-500/10'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
              <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Receitas recebidas</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(paidIncome)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>

        {/* Total Receitas */}
        <button
          type="button"
          onClick={() => handleStatusClick('all')}
          className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left cursor-pointer group ${
            activeStatusFilter === 'all'
              ? 'bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a]'
              : 'bg-[#181c24] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block truncate">Total</span>
              <span className="text-base font-bold text-white tracking-tight block truncate">
                {displayVal(totalIncome)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
        </button>
      </div>
    );
  }

  // 3. Visualização Padrão para TODAS ou TRANSFERÊNCIAS (4 Cards)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-fadeIn">
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
        onClick={() => onSelectTypeFilter('income')}
        className="flex items-center justify-between p-4 rounded-3xl border bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a] transition-all text-left cursor-pointer group"
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
        onClick={() => onSelectTypeFilter('expense')}
        className="flex items-center justify-between p-4 rounded-3xl border bg-[#181c24] border-slate-800/80 hover:border-slate-700 hover:bg-[#1c202a] transition-all text-left cursor-pointer group"
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
