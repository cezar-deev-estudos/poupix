'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { ActiveTab } from '@/components/layout/Sidebar';
import { Scale } from 'lucide-react';

interface MonthlyBalanceCardProps {
  onNavigateTab?: (tab: ActiveTab, filterType?: 'all' | 'income' | 'expense' | 'transfer') => void;
}

export const MonthlyBalanceCard: React.FC<MonthlyBalanceCardProps> = ({ onNavigateTab }) => {
  const { summary, isPrivacyMode } = useFinance();

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  // Cálculo das barras do Balanço Mensal
  const maxBarValue = Math.max(summary.monthlyIncome, summary.monthlyExpense, 1);
  const incomeHeightPct = Math.min(100, Math.max(15, (summary.monthlyIncome / maxBarValue) * 100));
  const expenseHeightPct = Math.min(100, Math.max(15, (summary.monthlyExpense / maxBarValue) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Scale className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-base">Balanço mensal</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">Mês Atual</span>
      </div>

      {/* Conteúdo Central */}
      <div className="bg-[#1c202a]/80 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-6">
        {/* Gráfico de Barras Verticais (Verde e Vermelho) */}
        <div className="flex items-end gap-2.5 h-32 w-20 px-3 pb-2 bg-slate-950/50 rounded-2xl border border-slate-800/60 shrink-0 justify-center">
          {/* Barra Receita */}
          <div
            className="w-4 bg-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/30"
            style={{ height: `${incomeHeightPct}%` }}
            title={`Receitas: ${displayVal(summary.monthlyIncome)}`}
          />
          {/* Barra Despesa */}
          <div
            className="w-4 bg-rose-500 rounded-full transition-all duration-500 shadow-sm shadow-rose-500/30"
            style={{ height: `${expenseHeightPct}%` }}
            title={`Despesas: ${displayVal(summary.monthlyExpense)}`}
          />
        </div>

        {/* Discriminação de Valores */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Receitas</span>
            <span className="text-emerald-400 font-bold tracking-tight">
              {displayVal(summary.monthlyIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Despesas</span>
            <span className="text-rose-400 font-bold tracking-tight">
              {displayVal(summary.monthlyExpense)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-800/90 flex items-center justify-between text-sm">
            <span className="text-slate-300 font-bold">Balanço</span>
            <span
              className={`font-bold tracking-tight ${
                summary.monthlySavings >= 0 ? 'text-slate-100' : 'text-rose-400'
              }`}
            >
              {displayVal(summary.monthlySavings)}
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé: Botão VER MAIS */}
      <div className="pt-4 mt-4 border-t border-slate-800/60 flex justify-center">
        <button
          type="button"
          onClick={() => onNavigateTab?.('projections')}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider cursor-pointer"
        >
          VER MAIS
        </button>
      </div>
    </div>
  );
};
