'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  CreditCard as CreditCardIcon,
  Wallet,
  PieChart,
  Bell,
  User,
  Crown,
} from 'lucide-react';
import { ActiveTab } from '../layout/Sidebar';
import { TransactionFlowType } from '../transactions/modal/TransactionModal';
import { MonthDropdownModal } from '../layout/MonthDropdownModal';
import { PendingAlertsCards } from './PendingAlertsCards';
import { useAuth } from '@/context/AuthContext';
import { isTransactionInInvoicePeriod } from '@/lib/invoiceHelpers';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MobillsMobileHomeProps {
  onNavigateTab: (
    tab: ActiveTab,
    filterType?: 'all' | 'income' | 'expense' | 'transfer',
    cardId?: string,
    statusFilter?: 'all' | 'pending' | 'paid'
  ) => void;
  onOpenNewTransaction: (flowType?: TransactionFlowType) => void;
  onOpenAlerts?: () => void;
}

export const MobillsMobileHome: React.FC<MobillsMobileHomeProps> = ({
  onNavigateTab,
  onOpenNewTransaction,
  onOpenAlerts,
}) => {
  const {
    summary,
    accounts,
    creditCards,
    categories,
    transactions,
    filteredTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    isPrivacyMode,
    togglePrivacyMode,
    unreadAlertsCount,
    currentUser,
  } = useFinance();
  const { user, isDemoMode } = useAuth();

  const [cardInvoiceTab, setCardInvoiceTab] = useState<'current_month' | 'next_month'>('current_month');
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Mês alvo para as faturas
  const targetCardMonth = useMemo(() => {
    if (cardInvoiceTab === 'next_month') {
      return (selectedMonth + 1) % 12;
    }
    return selectedMonth;
  }, [cardInvoiceTab, selectedMonth]);

  const targetCardYear = useMemo(() => {
    if (cardInvoiceTab === 'next_month' && selectedMonth === 11) {
      return selectedYear + 1;
    }
    return selectedYear;
  }, [cardInvoiceTab, selectedMonth, selectedYear]);

  // Cálculo das despesas de cada cartão no período selecionado (baseado no vencimento da fatura)
  const cardExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    creditCards.forEach(c => {
      const expenses = transactions
        .filter(t => isTransactionInInvoicePeriod(t, c, targetCardYear, targetCardMonth))
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
      map[c.id] = Math.max(0, expenses);
    });
    return map;
  }, [creditCards, transactions, targetCardMonth, targetCardYear]);

  // Total consolidado de faturas do período
  const totalCardInvoices = useMemo(() => {
    return Object.values(cardExpensesMap).reduce((sum, v) => sum + v, 0);
  }, [cardExpensesMap]);

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
      {/* 1. HERO CARD: TOPO MOBILLS + SALDO EM CONTAS */}
      <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Top Header do Card: Avatar Usuário | Mês Dropdown | Ícone Notificações / Alertas */}
        <div className="flex items-center justify-between gap-2">
          {/* Avatar Usuário com Badge VIP / Perfil */}
          <button
            type="button"
            onClick={() => onNavigateTab('users')}
            className="relative p-0.5 rounded-full hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            title="Meu Perfil"
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-600/80 bg-slate-800/90 flex items-center justify-center text-slate-300 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-[#1c202a] flex items-center justify-center text-slate-950 shadow-sm">
              <Crown className="w-2.5 h-2.5 fill-slate-950" />
            </div>
          </button>

          {/* Seletor Central de Mês (Setembro ∨) */}
          <button
            type="button"
            onClick={() => setIsMonthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition-all text-white font-bold text-base cursor-pointer"
          >
            <span>{MONTH_NAMES[selectedMonth]}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 stroke-[2.5]" />
          </button>

          {/* Botão de Alertas / Notificações (Sininho em Roxo) */}
          <button
            type="button"
            onClick={() => onOpenAlerts?.()}
            className="relative w-10 h-10 rounded-full bg-[#9333EA] hover:bg-[#A855F7] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            title="Notificações e Alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#1c202a] rounded-full" />
            )}
          </button>
        </div>

        {/* Saldo Central */}
        <div className="text-center space-y-1 pt-1">
          <span 
            onClick={() => onNavigateTab('accounts')}
            className="text-xs font-semibold text-slate-400 block cursor-pointer hover:text-slate-200 transition-colors"
          >
            Saldo em contas
          </span>
          <div 
            onClick={() => onNavigateTab('accounts')}
            className="text-2xl font-bold text-white tracking-tight cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
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
            onClick={() => onNavigateTab('transactions', 'income')}
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
            onClick={() => onNavigateTab('transactions', 'expense')}
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

      {/* Modal de Seleção de Mês */}
      <MonthDropdownModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
      />

      {/* 2. PENDÊNCIAS E ALERTAS (CARROSSEL DINÂMICO) */}
      <PendingAlertsCards onNavigateTab={onNavigateTab} />

      {/* 3. CARD: BALANÇO MENSAL */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-300 px-1">Balanço mensal</h4>
        <div
          onClick={() => onNavigateTab('monthly-balance')}
          className="bg-[#1c202a] hover:bg-[#222734] border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99] transition-all"
        >
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
              <span className="text-[11px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider">
                DETALHES
              </span>
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
          {/* Tabs Fatura Mês Atual / Fatura Próximo Mês */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCardInvoiceTab('current_month')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                cardInvoiceTab === 'current_month'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm shadow-teal-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Fatura Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setCardInvoiceTab('next_month')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                cardInvoiceTab === 'next_month'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm shadow-teal-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Fatura Próximo Mês
            </button>
          </div>

          {/* Lista de Cartões */}
          <div className="space-y-3">
            {creditCards.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum cartão cadastrado.</p>
            ) : (
              creditCards.map(card => {
                const cardTotal = cardExpensesMap[card.id] || 0;

                // Cálculo de Status do Cartão / Fatura
                const periodKey = `${targetCardYear}-${String(targetCardMonth + 1).padStart(2, '0')}`;
                const manualStatus = card.manualInvoiceStatus?.[periodKey];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(targetCardYear, targetCardMonth, card.dueDay);
                dueDate.setHours(0, 0, 0, 0);
                const closingDate = new Date(targetCardYear, targetCardMonth, card.closingDay);
                closingDate.setHours(0, 0, 0, 0);

                let invoiceStatus: 'open' | 'closed' | 'overdue' | 'paid' = 'open';
                if (manualStatus === 'paid') {
                  invoiceStatus = 'paid';
                } else if (manualStatus === 'open') {
                  invoiceStatus = 'open';
                } else if (today > dueDate) {
                  invoiceStatus = 'overdue';
                } else if (today > closingDate || manualStatus === 'closed') {
                  invoiceStatus = 'closed';
                }

                // Textos contextuais de Fechamento e Vencimento (sem a palavra "em" e formato DD/MM)
                const dueDayStr = String(card.dueDay).padStart(2, '0');
                const dueMonthStr = String(dueDate.getMonth() + 1).padStart(2, '0');
                const dueDateFormatted = `${dueDayStr}/${dueMonthStr}`;

                const closingDayStr = String(card.closingDay).padStart(2, '0');
                const closingMonthStr = String(closingDate.getMonth() + 1).padStart(2, '0');
                const closingDateFormatted = `${closingDayStr}/${closingMonthStr}`;

                const hasClosed = today > closingDate;
                const closingLabel = hasClosed ? `fechou ${closingDateFormatted}` : `fecha ${closingDateFormatted}`;

                const isOverdue = invoiceStatus === 'overdue';
                const dueLabel = isOverdue
                  ? `Venceu ${dueDateFormatted}`
                  : `Vence ${dueDateFormatted}`;

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedMonth(targetCardMonth);
                      setSelectedYear(targetCardYear);
                      onNavigateTab('cards', undefined, card.id);
                    }}
                    className="flex items-center justify-between gap-3 p-2.5 -mx-2 rounded-2xl hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderCardBrand(card.brand)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white block truncate group-hover:text-teal-300 transition-colors">
                            {card.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                              invoiceStatus === 'open'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : invoiceStatus === 'paid'
                                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                : invoiceStatus === 'overdue'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold'
                                : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                            }`}
                          >
                            {invoiceStatus === 'open'
                              ? 'Aberta'
                              : invoiceStatus === 'paid'
                              ? 'Paga'
                              : invoiceStatus === 'overdue'
                              ? 'Vencida'
                              : 'Fechada'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal whitespace-nowrap">
                            • {closingLabel}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-rose-400 block mt-0.5">
                          {displayVal(cardTotal)}
                        </span>
                        <span className={`text-[10px] block ${isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
                          • {dueLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenNewTransaction('creditCard');
                      }}
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
            <span className="text-white">{displayVal(totalCardInvoices)}</span>
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
        </div>
      </div>

      {/* 7. GERENCIAR TELA INICIAL */}
      <div className="pt-4 pb-6 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => onNavigateTab('settings')}
          className="flex flex-col items-center gap-2 group cursor-pointer text-slate-400 hover:text-white transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl border-2 border-slate-600 group-hover:border-purple-400 flex items-center justify-center transition-colors">
            {/* Ícone de gerenciar layout/cards */}
            <div className="w-6 h-6 border-2 border-current rounded-md relative flex items-center justify-center">
              <div className="w-1.5 h-3 bg-current rounded-sm absolute left-1" />
              <div className="w-1.5 h-1.5 bg-current rounded-sm absolute right-1 top-1" />
            </div>
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-purple-400 transition-colors">
            GERENCIAR TELA INICIAL
          </span>
        </button>
      </div>
    </div>
  );
};
