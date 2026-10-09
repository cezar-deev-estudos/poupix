'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { isTransactionInInvoicePeriod, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { CardBrandLogo } from '@/components/cards/CardBrandLogo';
import { ConfirmPaymentModal } from '@/components/transactions/ConfirmPaymentModal';
import { ArrowLeft, Bell, DollarSign, Check } from 'lucide-react';
import { ActiveTab } from '@/components/layout/Sidebar';

export type AlertTabFilter = 'reminders' | 'closed_invoices' | 'overdue_invoices';

interface PendingAlertsViewProps {
  initialFilter?: AlertTabFilter;
  onBack: () => void;
  onNavigateTab: (tab: ActiveTab, filterType?: any, cardId?: string) => void;
  onOpenAlertsDrawer?: () => void;
}

export const PendingAlertsView: React.FC<PendingAlertsViewProps> = ({
  initialFilter = 'closed_invoices',
  onBack,
  onNavigateTab,
  onOpenAlertsDrawer,
}) => {
  const {
    creditCards,
    transactions,
    filteredTransactions,
    selectedMonth,
    selectedYear,
    unreadAlertsCount,
    updateCreditCard,
    updateTransaction,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<AlertTabFilter>(initialFilter);
  const [confirmingPayment, setConfirmingPayment] = useState<{
    type: 'invoice' | 'transaction';
    cardId?: string;
    periodKey?: string;
    invoiceAmount?: number;
    invoiceDueDate?: string;
    cardName?: string;
    txId?: string;
    description?: string;
    amount?: number;
  } | null>(null);

  const targetPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Formatar data abreviada (ex: "10 out.", "11 out.")
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    return `${day} ${months[monthIdx] || ''}`;
  };

  // Cálculo das Faturas (Fechadas e Vencidas)
  const invoiceData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCards = creditCards.filter(c => !c.isArchived);

    const closedList: Array<{
      cardId: string;
      cardName: string;
      brand: any;
      dueDateStr: string;
      amount: number;
      isOverdue: boolean;
    }> = [];

    const overdueList: Array<{
      cardId: string;
      cardName: string;
      brand: any;
      dueDateStr: string;
      amount: number;
    }> = [];

    activeCards.forEach(card => {
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

      const dueDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;

      // Se passou da data de vencimento e não foi paga -> Vencida
      if (today > dueDate) {
        overdueList.push({
          cardId: card.id,
          cardName: card.name,
          brand: card.brand,
          dueDateStr,
          amount: invoiceAmount,
        });
      }
      // Se passou do fechamento (ou fechamento manual) mas ainda não venceu -> Fechada
      else if (today > closingDate || manualStatus === 'closed') {
        closedList.push({
          cardId: card.id,
          cardName: card.name,
          brand: card.brand,
          dueDateStr,
          amount: invoiceAmount,
          isOverdue: false,
        });
      }
    });

    return { closedList, overdueList };
  }, [creditCards, transactions, selectedYear, selectedMonth, targetPeriodKey]);

  // Lembretes de Receitas e Despesas Fixas / Recorrentes
  const remindersList = useMemo(() => {
    return filteredTransactions
      .filter(t => !t.paid && (t.type === 'income' || t.isRecurring || t.recurringGroupId))
      .map(t => ({
        id: t.id,
        description: t.description,
        date: t.date,
        amount: t.amount,
        type: t.type,
      }));
  }, [filteredTransactions]);

  // Handler de Confirmação de Pagamento de Fatura ou Lançamento
  const handleExecutePayment = (paymentDate?: string) => {
    if (!confirmingPayment) return;

    if (confirmingPayment.type === 'invoice' && confirmingPayment.cardId && confirmingPayment.periodKey) {
      const card = creditCards.find(c => c.id === confirmingPayment.cardId);
      if (card) {
        const updatedManual = {
          ...(card.manualInvoiceStatus || {}),
          [confirmingPayment.periodKey]: 'paid' as const,
        };
        updateCreditCard(card.id, {
          manualInvoiceStatus: updatedManual,
        });

        // Atualizar transações vinculadas
        transactions.forEach(t => {
          if (t.creditCardId === card.id) {
            const { periodKey: txPeriodKey } = getTransactionInvoicePeriod(t, card);
            if (txPeriodKey === confirmingPayment.periodKey && !t.paid) {
              updateTransaction(t.id, {
                paid: true,
                ...(paymentDate ? { paymentDate } : {}),
              });
            }
          }
        });
      }
    } else if (confirmingPayment.type === 'transaction' && confirmingPayment.txId) {
      updateTransaction(confirmingPayment.txId, {
        paid: true,
        ...(paymentDate ? { paymentDate } : {}),
      });
    }

    setConfirmingPayment(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 animate-fadeIn text-slate-100">
      {/* 1. Header: Voltar | Pendências e alertas | Sininho de Notificações */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 active:scale-95 transition-all cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-tight">Pendências e alertas</h2>
        </div>

        <button
          type="button"
          onClick={onOpenAlertsDrawer}
          className="relative w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
          title="Central de notificações"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
          )}
        </button>
      </div>

      {/* 2. Pílulas Superiores de Navegação / Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
            activeTab === 'reminders'
              ? 'bg-[#14b8a6] text-slate-950 shadow-md font-bold'
              : 'bg-[#2a2f3d] text-slate-300 hover:bg-[#343a4a] hover:text-white'
          }`}
        >
          Lembretes de receitas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closed_invoices')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
            activeTab === 'closed_invoices'
              ? 'bg-[#14b8a6] text-slate-950 shadow-md font-bold'
              : 'bg-[#2a2f3d] text-slate-300 hover:bg-[#343a4a] hover:text-white'
          }`}
        >
          Faturas fechadas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overdue_invoices')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
            activeTab === 'overdue_invoices'
              ? 'bg-[#14b8a6] text-slate-950 shadow-md font-bold'
              : 'bg-[#2a2f3d] text-slate-300 hover:bg-[#343a4a] hover:text-white'
          }`}
        >
          Faturas vencidas
        </button>
      </div>

      {/* 3. Card Container Escuro com Lista de Itens */}
      <div className="bg-[#242732] border border-slate-800/90 rounded-3xl p-5 shadow-2xl min-h-[380px]">
        {/* Aba: Faturas Fechadas */}
        {activeTab === 'closed_invoices' && (
          <div className="space-y-4">
            {invoiceData.closedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Nenhuma fatura fechada pendente</p>
                <p className="text-xs text-slate-500">Todas as faturas fechadas deste período já foram pagas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 space-y-3">
                {invoiceData.closedList.map(item => (
                  <div
                    key={item.cardId}
                    onClick={() => onNavigateTab('cards', undefined, item.cardId)}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {/* Logo da Marca / Cartão + Informações */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <CardBrandLogo brand={item.brand} name={item.cardName} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-teal-300 transition-colors">
                          {item.cardName}
                        </h4>
                        <span className="text-xs text-slate-400 block">
                          {formatShortDate(item.dueDateStr)}
                        </span>
                      </div>
                    </div>

                    {/* Valor e Botão Circular de Check para Quitar */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-rose-400">
                        {formatCurrency(item.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmingPayment({
                            type: 'invoice',
                            cardId: item.cardId,
                            cardName: item.cardName,
                            periodKey: targetPeriodKey,
                            invoiceAmount: item.amount,
                            invoiceDueDate: item.dueDateStr,
                          });
                        }}
                        className="w-6 h-6 rounded-lg border-2 border-slate-500/80 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-emerald-400 transition-all cursor-pointer"
                        title="Marcar como paga / Efetivar"
                      >
                        {/* Caixa de seleção vazia estilo modelo */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba: Faturas Vencidas */}
        {activeTab === 'overdue_invoices' && (
          <div className="space-y-4">
            {invoiceData.overdueList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Nenhuma fatura vencida!</p>
                <p className="text-xs text-slate-500">Parabéns, você não possui faturas em atraso.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 space-y-3">
                {invoiceData.overdueList.map(item => (
                  <div
                    key={item.cardId}
                    onClick={() => onNavigateTab('cards', undefined, item.cardId)}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {/* Logo da Marca / Cartão + Informações */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <CardBrandLogo brand={item.brand} name={item.cardName} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-rose-300 transition-colors">
                          {item.cardName}
                        </h4>
                        <span className="text-xs text-slate-400 block">
                          {formatShortDate(item.dueDateStr)}
                        </span>
                      </div>
                    </div>

                    {/* Valor e Botão de Check */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-rose-400">
                        {formatCurrency(item.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmingPayment({
                            type: 'invoice',
                            cardId: item.cardId,
                            cardName: item.cardName,
                            periodKey: targetPeriodKey,
                            invoiceAmount: item.amount,
                            invoiceDueDate: item.dueDateStr,
                          });
                        }}
                        className="w-6 h-6 rounded-lg border-2 border-slate-500/80 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-emerald-400 transition-all cursor-pointer"
                        title="Marcar como paga / Efetivar"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba: Lembretes de Receitas / Outros lançamentos */}
        {activeTab === 'reminders' && (
          <div className="space-y-4">
            {remindersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Nenhum lembrete pendente</p>
                <p className="text-xs text-slate-500">Todas as receitas e contas programadas já foram recebidas ou quitadas.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 space-y-3">
                {remindersList.map(item => (
                  <div
                    key={item.id}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3 group hover:opacity-90 transition-opacity"
                  >
                    {/* Ícone com Cifrão ($) estilo Previdência VGBL */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        <DollarSign className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                          {item.description}
                        </h4>
                        <span className="text-xs text-slate-400 block">
                          {formatShortDate(item.date)}
                        </span>
                      </div>
                    </div>

                    {/* Valor e Botão de Check */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setConfirmingPayment({
                            type: 'transaction',
                            txId: item.id,
                            description: item.description,
                            amount: item.amount,
                          });
                        }}
                        className="w-6 h-6 rounded-lg border-2 border-slate-500/80 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center text-emerald-400 transition-all cursor-pointer"
                        title="Efetivar recebimento / pagamento"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modal de Confirmação com Seletor de Data de Efetivação */}
      {confirmingPayment && (
        <ConfirmPaymentModal
          isOpen={Boolean(confirmingPayment)}
          onClose={() => setConfirmingPayment(null)}
          onConfirm={handleExecutePayment}
          currentPaid={false}
          transaction={
            confirmingPayment.type === 'transaction'
              ? (filteredTransactions.find(t => t.id === confirmingPayment.txId) || null)
              : null
          }
          isGroupedCard={confirmingPayment.type === 'invoice'}
          invoiceInfo={
            confirmingPayment.type === 'invoice'
              ? {
                  cardName: `Fatura ${confirmingPayment.cardName || 'Cartão'}`,
                  amount: confirmingPayment.invoiceAmount || 0,
                  dueDate: confirmingPayment.invoiceDueDate || '',
                }
              : null
          }
        />
      )}
    </div>
  );
};
