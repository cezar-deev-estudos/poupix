'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronRight,
  FileText,
  CreditCard as CreditCardIcon,
  Wallet,
  PieChart,
} from 'lucide-react';
import { ActiveTab } from '../layout/Sidebar';
import { TransactionFlowType } from '../transactions/modal/TransactionModal';

interface MobillsMobileHomeProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: (flowType?: TransactionFlowType) => void;
}

export const MobillsMobileHome: React.FC<MobillsMobileHomeProps> = ({
  onNavigateTab,
  onOpenNewTransaction,
}) => {
  const {
    summary,
    accounts,
    creditCards,
    categories,
    filteredTransactions,
    isPrivacyMode,
    togglePrivacyMode,
  } = useFinance();

  const [cardInvoiceTab, setCardInvoiceTab] = useState<'open' | 'closed'>('open');

  const displayVal = (val: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(val);
  };

  // Cálculos de Categorias para o Donut Chart
  const categoryExpenses = categories
    .filter(c => c.type === 'expense' && !c.parentId)
    .map(cat => {
      const subIds = categories.filter(c => c.parentId === cat.id).map(c => c.id);
      const allIds = [cat.id, ...subIds];
      const total = filteredTransactions
        .filter(t => t.type === 'expense' && allIds.includes(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, total };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalExpenseCategorySum = categoryExpenses.reduce((sum, c) => sum + c.total, 0) || 1;

  // Cálculo das barras do Balanço Mensal
  const maxBarValue = Math.max(summary.monthlyIncome, summary.monthlyExpense, 1);
  const incomeHeightPct = Math.min(100, Math.max(15, (summary.monthlyIncome / maxBarValue) * 100));
  const expenseHeightPct = Math.min(100, Math.max(15, (summary.monthlyExpense / maxBarValue) * 100));

  // Helper para renderizar logo de banco
  const renderBankBadge = (accName: string, accColor?: string) => {
    const name = accName.toLowerCase();
    if (name.includes('itau') || name.includes('itaú')) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#EC7000] flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-[8px] font-black text-[#003399] tracking-tighter">Itaú</span>
        </div>
      );
    }
    if (name.includes('nubank') || name.includes('nu ')) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#820AD1] flex items-center justify-center text-white font-black shrink-0 shadow-sm">
          <span className="text-[9px] font-bold">Nu</span>
        </div>
      );
    }
    if (name.includes('inter')) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#FF7A00] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
          <span className="text-[8px]">Int</span>
        </div>
      );
    }
    if (name.includes('bradesco')) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#CC092F] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
          <span className="text-[8px]">Bra</span>
        </div>
      );
    }
    if (name.includes('santander')) {
      return (
        <div className="w-7 h-7 rounded-full bg-[#EA1D25] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
          <span className="text-[8px]">San</span>
        </div>
      );
    }
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
        style={{ backgroundColor: accColor || '#3B82F6' }}
      >
        {accName.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  // Helper para bandeira de cartão
  const renderCardBrand = (brand?: string) => {
    switch (brand) {
      case 'mastercard':
        return (
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <div className="flex -space-x-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-80" />
            </div>
          </div>
        );
      case 'visa':
        return (
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-black text-[#1A1F71] italic tracking-tight bg-white px-1 py-0.5 rounded">
              VISA
            </span>
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <CreditCardIcon className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* 1. HERO CARD: SALDO EM CONTAS */}
      <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="text-center space-y-1">
          <span 
            onClick={() => onNavigateTab('accounts')}
            className="text-xs font-semibold text-slate-400 block cursor-pointer hover:text-slate-200 transition-colors"
          >
            Saldo em contas
          </span>
          <div 
            onClick={() => onNavigateTab('accounts')}
            className="text-3xl font-black text-white tracking-tight cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform"
          >
            {displayVal(summary.totalBalance)}
          </div>
          <button
            type="button"
            onClick={togglePrivacyMode}
            className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Alternar privacidade"
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Pílulas de Receitas e Despesas -> Abre Extrato de Transações */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Receitas */}
          <button
            type="button"
            onClick={() => onNavigateTab('transactions')}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#242937] border border-slate-700/50 text-left hover:border-emerald-500/50 hover:bg-[#282e3e] active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <ArrowUp className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block">Receitas</span>
              <span className="text-xs font-bold text-emerald-400 truncate block">
                {displayVal(summary.monthlyIncome)}
              </span>
            </div>
          </button>

          {/* Despesas */}
          <button
            type="button"
            onClick={() => onNavigateTab('transactions')}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#242937] border border-slate-700/50 text-left hover:border-rose-500/50 hover:bg-[#282e3e] active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-black shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <ArrowDown className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 block">Despesas</span>
              <span className="text-xs font-bold text-rose-400 truncate block">
                {displayVal(summary.monthlyExpense)}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. CARD: BALANÇO MENSAL */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-300 px-1">Balanço mensal</h4>
        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4">
          {/* Gráfico de Barras Verticais (Verde e Vermelho) */}
          <div className="flex items-end gap-2 h-24 w-16 px-2 pb-1 bg-slate-950/40 rounded-2xl border border-slate-800/50 shrink-0 justify-center">
            {/* Barra Receita */}
            <div className="w-3.5 bg-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/30"
              style={{ height: `${incomeHeightPct}%` }}
              title="Receitas"
            />
            {/* Barra Despesa */}
            <div className="w-3.5 bg-rose-500 rounded-full transition-all duration-500 shadow-sm shadow-rose-500/30"
              style={{ height: `${expenseHeightPct}%` }}
              title="Despesas"
            />
          </div>

          {/* Discriminação de Valores */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Receitas</span>
              <span className="text-emerald-400 font-bold">{displayVal(summary.monthlyIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Despesas</span>
              <span className="text-rose-400 font-bold">{displayVal(summary.monthlyExpense)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">Balanço</span>
              <span className={`font-bold ${summary.monthlySavings >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                {displayVal(summary.monthlySavings)}
              </span>
            </div>

            <div className="pt-1 text-right">
              <button
                type="button"
                onClick={() => onNavigateTab('projections')}
                className="text-[11px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider cursor-pointer"
              >
                DETALHES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARD: DESPESAS POR CATEGORIA */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-300 px-1">Despesas por categoria</h4>
        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          {/* Donut Chart SVG */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
              {categoryExpenses.length === 0 ? (
                <circle cx="18" cy="18" r="14" fill="none" stroke="#334155" strokeWidth="4" />
              ) : (
                (() => {
                  let accumulatedPercent = 0;
                  return categoryExpenses.slice(0, 5).map((cat) => {
                    const percent = (cat.total / totalExpenseCategorySum) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    return (
                      <circle
                        key={cat.id}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={cat.color || '#F59E0B'}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#1c202a]" />
            </div>
          </div>

          {/* Lista das Principais Categorias */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {categoryExpenses.length === 0 ? (
              <span className="text-xs text-slate-500">Nenhum gasto registrado neste mês.</span>
            ) : (
              categoryExpenses.slice(0, 4).map(cat => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#F59E0B' }}
                    />
                    <span className="text-slate-300 truncate max-w-[100px]">{cat.name}</span>
                  </div>
                  <span className="text-slate-200 font-semibold shrink-0">
                    {displayVal(cat.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. CARD: CARTÕES DE CRÉDITO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-slate-300">Cartões de crédito</h4>
          <button
            type="button"
            onClick={() => onNavigateTab('cards')}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Ver todos
          </button>
        </div>

        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          {/* Tabs Faturas Abertas / Fechadas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCardInvoiceTab('open')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                cardInvoiceTab === 'open'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Faturas abertas
            </button>
            <button
              type="button"
              onClick={() => setCardInvoiceTab('closed')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                cardInvoiceTab === 'closed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Faturas fechadas
            </button>
          </div>

          {/* Lista de Cartões */}
          <div className="space-y-3">
            {creditCards.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum cartão cadastrado.</p>
            ) : (
              creditCards.map(card => {
                const cardTotal = filteredTransactions
                  .filter(t => t.creditCardId === card.id)
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div key={card.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderCardBrand(card.brand)}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          {card.name}
                        </span>
                        <span className="text-xs font-bold text-rose-400 block">
                          {displayVal(cardTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          • fecha em dia {card.closingDay}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenNewTransaction('creditCard')}
                      className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer shrink-0"
                      title="Nova despesa no cartão"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé Total de Faturas */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Total</span>
            <span className="text-white">{displayVal(summary.creditCardTotalInvoice)}</span>
          </div>
        </div>
      </div>

      {/* 5. CARD: CONTAS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-slate-300">Contas</h4>
          <button
            type="button"
            onClick={() => onNavigateTab('accounts')}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Ver todas
          </button>
        </div>

        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {renderBankBadge(acc.name, acc.color)}
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">
                    {acc.name}
                  </span>
                  <span
                    className={`text-xs font-bold block ${
                      acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {displayVal(acc.balance)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenNewTransaction('expense')}
                className="w-7 h-7 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/30 transition-colors cursor-pointer shrink-0"
                title="Novo lançamento nesta conta"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Rodapé Total de Contas */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Total</span>
            <span className="text-white">{displayVal(summary.totalBalance)}</span>
          </div>
        </div>
      </div>

      {/* 6. CARD: PLANEJAMENTO MENSAL */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-300 px-1">Planejamento mensal</h4>
        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-6 shadow-xl text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
            <FileText className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-slate-200 leading-relaxed">
            Ops! Você ainda não tem um planejamento definido para esse mês.
          </p>
          <p className="text-[11px] text-slate-500">
            Melhore seu controle financeiro agora definindo metas de gastos por categoria!
          </p>

          <button
            type="button"
            onClick={() => onNavigateTab('budgets')}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            DEFINIR MEU PLANEJAMENTO
          </button>
        </div>
      </div>
    </div>
  );
};
