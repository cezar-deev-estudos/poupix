'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { ActiveTab } from '@/components/layout/Sidebar';
import { Wallet, TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

interface SummaryCardsProps {
  onNavigateTab?: (tab: ActiveTab, filterType?: 'all' | 'income' | 'expense' | 'transfer') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ onNavigateTab }) => {
  const { summary, isPrivacyMode } = useFinance();

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Total Consolidado -> Abre Contas */}
      <div 
        onClick={() => onNavigateTab?.('accounts')}
        className={`relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl backdrop-blur-md group hover:border-emerald-500/50 transition-all ${onNavigateTab ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Geral das Contas</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          {displayVal(summary.totalBalance)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Contas ativas e sincronizadas</span>
        </div>
      </div>

      {/* Receitas do Mês -> Abre Extrato de Transações Filtrado por Receita */}
      <div 
        onClick={() => onNavigateTab?.('transactions', 'income')}
        className={`relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl backdrop-blur-md group hover:border-teal-500/50 transition-all ${onNavigateTab ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/15 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas do Mês</span>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-all">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-teal-400 tracking-tight">
          {displayVal(summary.monthlyIncome)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
          <span>Previsto: {displayVal(summary.expectedMonthlyIncome)}</span>
        </div>
      </div>

      {/* Despesas do Mês -> Abre Extrato de Transações Filtrado por Despesa */}
      <div 
        onClick={() => onNavigateTab?.('transactions', 'expense')}
        className={`relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl backdrop-blur-md group hover:border-rose-500/50 transition-all ${onNavigateTab ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Despesas do Mês</span>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-all">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight">
          {displayVal(summary.monthlyExpense)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          <span>Balanço: <strong className={summary.monthlySavings >= 0 ? "text-emerald-400" : "text-rose-400"}>{displayVal(summary.monthlySavings)}</strong></span>
        </div>
      </div>

      {/* Faturas de Cartão -> Abre Cartões de Crédito */}
      <div 
        onClick={() => onNavigateTab?.('cards')}
        className={`relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 rounded-3xl shadow-xl backdrop-blur-md group hover:border-violet-500/50 transition-all ${onNavigateTab ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/15 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturas de Cartão</span>
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition-all">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-extrabold text-violet-400 tracking-tight">
          {displayVal(summary.creditCardTotalInvoice)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <span>Gastos em cartões no mês</span>
        </div>
      </div>
    </div>
  );
};

