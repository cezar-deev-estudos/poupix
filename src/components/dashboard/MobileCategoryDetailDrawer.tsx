'use client';

import React from 'react';
import { Transaction, Category } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getEffectiveTransactionDate, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Check, Edit3, CreditCard } from 'lucide-react';

interface MobileCategoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  transactions: Transaction[];
  onEditTransaction?: (tx: Transaction) => void;
}

export const MobileCategoryDetailDrawer: React.FC<MobileCategoryDetailDrawerProps> = ({
  isOpen,
  onClose,
  category,
  transactions,
  onEditTransaction,
}) => {
  const { updateTransaction, accounts, creditCards } = useFinance();

  if (!isOpen) return null;

  // Alterna status de pago/pendente
  const handleTogglePaid = (e: React.MouseEvent, tx: Transaction, currentEffectivelyPaid: boolean) => {
    e.stopPropagation();
    updateTransaction(tx.id, { paid: !currentEffectivelyPaid });
  };

  // Agrupa transações por data formatada
  const groupedTransactions = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const card = creditCards.find(c => c.id === tx.creditCardId);
    const dateKey = getEffectiveTransactionDate(tx, card);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const formatSectionHeader = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const compareD = new Date(year, month - 1, day);
      compareD.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - compareD.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';

      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      return `${weekday}., ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } catch {
      return formatDateBR(dateStr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#323642] text-white rounded-t-3xl shadow-2xl p-5 border-t border-slate-700/80 animate-slideUp space-y-4 max-h-[85vh] overflow-y-auto z-10"
      >
        {/* Handle de fechamento */}
        <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto cursor-pointer" onClick={onClose} />

        {/* Título da Categoria */}
        <div className="flex items-center gap-3 pt-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: category.color || '#3B82F6' }}
          >
            <CategoryIcon name={category.icon || 'Tag'} size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{category.name}</h3>
            <span className="text-xs text-slate-400">
              {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
          </div>
        </div>

        {/* Lista de Transações da Categoria */}
        <div className="space-y-4 pt-2">
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma transação nesta categoria neste mês.
            </div>
          ) : (
            sortedDates.map(dateKey => {
              const items = groupedTransactions[dateKey] || [];
              return (
                <div key={dateKey} className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 capitalize px-1">
                    {formatSectionHeader(dateKey)}
                  </div>

                  <div className="space-y-2">
                    {items.map(tx => {
                      const acc = accounts.find(a => a.id === tx.accountId);
                      const card = creditCards.find(c => c.id === tx.creditCardId);
                      const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
                      const isEffectivelyPaid =
                        tx.paid ||
                        (card && invoicePeriod
                          ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
                          : false);

                      const isIncome = tx.type === 'income';
                      const accountLabel = card ? card.name : (acc?.name || 'Conta');

                      return (
                        <div
                          key={tx.id}
                          onClick={() => onEditTransaction?.(tx)}
                          className="flex items-center justify-between p-3 bg-[#242732]/90 border border-slate-700/60 hover:border-slate-600 rounded-2xl transition-all cursor-pointer"
                        >
                          {/* Ícone e Informações */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md mt-0.5"
                              style={{ backgroundColor: category.color || (isIncome ? '#10b981' : '#f97316') }}
                            >
                              <CategoryIcon name={category.icon || 'Tag'} size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-slate-100 text-xs block truncate">
                                {tx.description}
                              </span>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                                <span>{formatDateBR(tx.date)}</span>
                                <span className="text-slate-600">|</span>
                                {card ? (
                                  <span className="inline-flex items-center gap-1 text-cyan-300 truncate">
                                    <CreditCard className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{accountLabel}</span>
                                  </span>
                                ) : (
                                  <span className="truncate">{accountLabel}</span>
                                )}
                              </div>

                              {/* Observação / Notas */}
                              {tx.notes && (
                                <p className="text-[10px] text-slate-400 italic truncate mt-0.5 flex items-center gap-1">
                                  <Edit3 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                  <span>{tx.notes}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Valor e Botão de Status Efetivado */}
                          <div className="flex items-center gap-2.5 shrink-0 ml-3">
                            <span
                              className={`text-xs font-bold ${
                                isIncome ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatCurrency(tx.amount)}
                            </span>

                            <button
                              type="button"
                              onClick={e => handleTogglePaid(e, tx, isEffectivelyPaid)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                                isEffectivelyPaid
                                  ? 'bg-[#22c55e] text-slate-950 shadow-sm'
                                  : 'bg-[#ef4444] text-white shadow-sm'
                              }`}
                              title={isEffectivelyPaid ? 'Efetivado / Pago' : 'Pendente de pagamento'}
                            >
                              {isEffectivelyPaid ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <span className="text-[10px] font-black leading-none">!</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
