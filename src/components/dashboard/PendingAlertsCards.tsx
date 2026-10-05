'use client';

import React, { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { isTransactionInInvoicePeriod } from '@/lib/invoiceHelpers';
import { ArrowDown, ArrowUp, FileText } from 'lucide-react';
import { ActiveTab } from '../layout/Sidebar';

interface PendingAlertsCardsProps {
  onNavigateTab: (
    tab: ActiveTab,
    filterType?: 'all' | 'income' | 'expense' | 'transfer',
    cardId?: string,
    statusFilter?: 'all' | 'pending' | 'paid'
  ) => void;
}

export const PendingAlertsCards: React.FC<PendingAlertsCardsProps> = ({ onNavigateTab }) => {
  const {
    filteredTransactions,
    transactions,
    creditCards,
    selectedMonth,
    selectedYear,
    isPrivacyMode,
  } = useFinance();

  const displayVal = (val: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(val);
  };

  // 1. Despesas Pendentes no mês selecionado
  const pendingExpensesData = useMemo(() => {
    const list = filteredTransactions.filter(t => t.type === 'expense' && !t.paid);
    const total = list.reduce((sum, t) => sum + t.amount, 0);
    return { count: list.length, total };
  }, [filteredTransactions]);

  // 2. Receitas Pendentes no mês selecionado
  const pendingIncomesData = useMemo(() => {
    const list = filteredTransactions.filter(t => t.type === 'income' && !t.paid);
    const total = list.reduce((sum, t) => sum + t.amount, 0);
    return { count: list.length, total };
  }, [filteredTransactions]);

  // Período da fatura atual
  const targetPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // 3 e 4. Faturas Vencidas e Faturas Fechadas
  const invoiceAlertsData = useMemo(() => {
    let overdueCount = 0;
    let overdueTotal = 0;
    let closedCount = 0;
    let closedTotal = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCards = creditCards.filter(c => !c.isArchived);

    activeCards.forEach(card => {
      // Valor da fatura no mês selecionado
      const cardExpenses = transactions
        .filter(t => isTransactionInInvoicePeriod(t, card, selectedYear, selectedMonth))
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

      const invoiceAmount = Math.max(0, cardExpenses);
      if (invoiceAmount <= 0) return;

      const manualStatus = card.manualInvoiceStatus?.[targetPeriodKey];
      if (manualStatus === 'paid') return; // Se já está paga, não alerta

      const dueDate = new Date(selectedYear, selectedMonth, card.dueDay);
      dueDate.setHours(0, 0, 0, 0);

      const closingDate = new Date(selectedYear, selectedMonth, card.closingDay);
      closingDate.setHours(0, 0, 0, 0);

      // Se passou da data de vencimento e não foi paga -> Vencida
      if (today > dueDate) {
        overdueCount += 1;
        overdueTotal += invoiceAmount;
      }
      // Se passou do fechamento (ou fechamento manual) mas ainda não venceu -> Fechada
      else if (today > closingDate || manualStatus === 'closed') {
        closedCount += 1;
        closedTotal += invoiceAmount;
      }
    });

    return {
      overdue: { count: overdueCount, total: overdueTotal },
      closed: { count: closedCount, total: closedTotal },
    };
  }, [creditCards, transactions, selectedYear, selectedMonth, targetPeriodKey]);

  // Lista dos cards que possuem valores pendentes (> 0)
  const items = useMemo(() => {
    const list = [];

    if (pendingExpensesData.count > 0 && pendingExpensesData.total > 0) {
      list.push({
        id: 'pending-expenses',
        title: 'Despesas pendentes',
        count: pendingExpensesData.count,
        amount: pendingExpensesData.total,
        amountColor: 'text-rose-400',
        badgeBg: 'bg-rose-500',
        icon: <ArrowDown className="w-4 h-4 stroke-[2.5]" />,
        onClick: () => onNavigateTab('transactions', 'expense', undefined, 'pending'),
      });
    }

    if (pendingIncomesData.count > 0 && pendingIncomesData.total > 0) {
      list.push({
        id: 'pending-incomes',
        title: 'Receitas pendentes',
        count: pendingIncomesData.count,
        amount: pendingIncomesData.total,
        amountColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500',
        icon: <ArrowUp className="w-4 h-4 stroke-[2.5]" />,
        onClick: () => onNavigateTab('transactions', 'income', undefined, 'pending'),
      });
    }

    if (invoiceAlertsData.overdue.count > 0 && invoiceAlertsData.overdue.total > 0) {
      list.push({
        id: 'overdue-invoices',
        title: 'Faturas vencidas',
        count: invoiceAlertsData.overdue.count,
        amount: invoiceAlertsData.overdue.total,
        amountColor: 'text-rose-400',
        badgeBg: 'bg-rose-500',
        icon: <FileText className="w-4 h-4 stroke-[2]" />,
        onClick: () => onNavigateTab('cards'),
      });
    }

    if (invoiceAlertsData.closed.count > 0 && invoiceAlertsData.closed.total > 0) {
      list.push({
        id: 'closed-invoices',
        title: 'Faturas fechadas',
        count: invoiceAlertsData.closed.count,
        amount: invoiceAlertsData.closed.total,
        amountColor: 'text-teal-400',
        badgeBg: 'bg-teal-500',
        icon: <FileText className="w-4 h-4 stroke-[2]" />,
        onClick: () => onNavigateTab('cards'),
      });
    }

    return list;
  }, [pendingExpensesData, pendingIncomesData, invoiceAlertsData, onNavigateTab]);

  // Se não houver itens pendentes, o bloco fica totalmente oculto
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 animate-fadeIn">
      <h4 className="text-sm font-bold text-slate-300 px-1">Pendências e alertas</h4>

      {/* Carrossel Horizontal com rolagem suave */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
        {items.map(item => (
          <div
            key={item.id}
            onClick={item.onClick}
            className="min-w-[150px] max-w-[170px] sm:min-w-[170px] sm:max-w-[190px] flex-shrink-0 bg-[#242732] hover:bg-[#2c303e] active:scale-[0.98] border border-slate-700/60 rounded-3xl p-3.5 shadow-md flex flex-col justify-between transition-all cursor-pointer group"
          >
            {/* Topo do card: Ícone à esquerda e Contador Badge à direita */}
            <div className="flex items-center justify-between">
              <div className="text-slate-400 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <span
                className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${item.badgeBg} shadow-sm`}
              >
                +{item.count}
              </span>
            </div>

            {/* Conteúdo inferior: Nome e Valor */}
            <div className="mt-4 space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {item.title}
              </span>
              <span className={`text-xs sm:text-sm font-bold block truncate ${item.amountColor}`}>
                {displayVal(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
