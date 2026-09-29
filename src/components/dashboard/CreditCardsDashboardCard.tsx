'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { CreditCard } from '@/types/finance';
import { CardBrandLogo } from '@/components/cards/CardBrandLogo';
import { isTransactionInInvoicePeriod } from '@/lib/invoiceHelpers';
import { Plus, CreditCard as CreditCardIcon, ArrowRight } from 'lucide-react';
import { ActiveTab } from '@/components/layout/Sidebar';
import { TransactionFlowType } from '@/components/transactions/modal/TransactionModal';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface CreditCardsDashboardCardProps {
  onNavigateTab: (tab: ActiveTab, filterType?: 'all' | 'income' | 'expense' | 'transfer', cardId?: string) => void;
  onOpenNewTransaction: (flowType?: TransactionFlowType, defaultCreditCardId?: string) => void;
}

export const CreditCardsDashboardCard: React.FC<CreditCardsDashboardCardProps> = ({
  onNavigateTab,
  onOpenNewTransaction,
}) => {
  const {
    creditCards,
    transactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    isPrivacyMode,
  } = useFinance();
  const [invoiceTab, setInvoiceTab] = useState<'current_month' | 'next_month'>('current_month');

  const activeCards = useMemo(() => {
    return creditCards.filter(c => !c.isArchived);
  }, [creditCards]);

  // Determinar o mês/ano alvo para os cálculos baseado na aba ativa
  const targetMonth = useMemo(() => {
    if (invoiceTab === 'next_month') {
      return (selectedMonth + 1) % 12;
    }
    return selectedMonth;
  }, [invoiceTab, selectedMonth]);

  const targetYear = useMemo(() => {
    if (invoiceTab === 'next_month' && selectedMonth === 11) {
      return selectedYear + 1;
    }
    return selectedYear;
  }, [invoiceTab, selectedMonth, selectedYear]);

  // Cálculo de valor da fatura de cada cartão no período selecionado
  const cardExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeCards.forEach(c => {
      const expenses = transactions
        .filter(t => isTransactionInInvoicePeriod(t, c, targetYear, targetMonth))
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
      map[c.id] = Math.max(0, expenses);
    });
    return map;
  }, [activeCards, transactions, targetMonth, targetYear]);

  // Soma total das faturas
  const totalAmount = useMemo(() => {
    return activeCards.reduce((sum, card) => {
      return sum + (cardExpensesMap[card.id] || 0);
    }, 0);
  }, [activeCards, cardExpensesMap]);

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  return (
    <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
      {/* Header do Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base tracking-tight">Cartões de crédito</h3>
          <button
            onClick={() => onNavigateTab('cards')}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Ver todos os cartões"
          >
            <CreditCardIcon className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Alternador de Abas: Fatura Mês Atual | Fatura Próximo Mês */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInvoiceTab('current_month')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              invoiceTab === 'current_month'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            Fatura Mês Atual
          </button>
          <button
            type="button"
            onClick={() => setInvoiceTab('next_month')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              invoiceTab === 'next_month'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            Fatura Próximo Mês
          </button>
        </div>

        {/* Lista de Cartões */}
        <div className="space-y-5 pt-1">
          {activeCards.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhum cartão cadastrado.
            </div>
          ) : (
            activeCards.map(card => {
              const invoiceAmount = cardExpensesMap[card.id] || 0;
              const availableLimit = Math.max(0, card.limit - invoiceAmount);
              const limitUsedPercent = Math.min(100, (invoiceAmount / (card.limit || 1)) * 100);

              // Cálculo de Status do Cartão / Fatura
              const periodKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
              const manualStatus = card.manualInvoiceStatus?.[periodKey];
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dueDate = new Date(targetYear, targetMonth, card.dueDay);
              dueDate.setHours(0, 0, 0, 0);
              const closingDate = new Date(targetYear, targetMonth, card.closingDay);
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

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedMonth(targetMonth);
                    setSelectedYear(targetYear);
                    onNavigateTab('cards', undefined, card.id);
                  }}
                  className="space-y-2 p-3 -mx-3 rounded-2xl hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  {/* Linha 1: Bandeira + Nome do Cartão + Badge de Status + Botão (+) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CardBrandLogo brand={card.brand} name={card.name} size="sm" />
                      <span className="font-bold text-white text-sm truncate group-hover:text-teal-300 transition-colors">
                        {card.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
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
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenNewTransaction('creditCard', card.id);
                      }}
                      className="w-7 h-7 rounded-full border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/30 text-teal-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title={`Nova despesa no cartão ${card.name}`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Linha 2: Fecha em [data] e Valor */}
                  <div className="text-xs space-y-0.5">
                    <div className="text-slate-400">
                      Fecha em {card.closingDay} de {MONTH_NAMES[targetMonth]} de {targetYear}
                    </div>
                    <div className="font-bold text-rose-500 text-sm tracking-tight">
                      {displayVal(invoiceAmount)}
                    </div>
                  </div>

                  {/* Linha 3: Barra de Limite */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center relative">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${limitUsedPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-end text-[11px] text-slate-400">
                      <span>{limitUsedPercent.toFixed(limitUsedPercent % 1 === 0 ? 0 : 2)}%</span>
                    </div>
                  </div>

                  {/* Linha 4: Limite Disponível */}
                  <div className="text-right text-[11px] text-slate-400 font-medium">
                    Limite Disponível {displayVal(availableLimit)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rodapé: TOTAL e Link VER MAIS */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-sm font-black text-white">
          <span className="text-slate-400 text-xs font-bold tracking-wider">TOTAL</span>
          <span className="text-base font-bold text-white tracking-tight">{displayVal(totalAmount)}</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('cards')}
          className="w-full py-2.5 text-center text-xs font-bold text-teal-400 hover:text-teal-300 uppercase tracking-wider transition-colors cursor-pointer border-t border-slate-800/60 pt-3"
        >
          VER MAIS
        </button>
      </div>
    </div>
  );
};
