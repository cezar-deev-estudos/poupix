'use client';

import React from 'react';
import { Transaction, Category } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getEffectiveTransactionDate, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Check, Edit3, CreditCard, X } from 'lucide-react';

interface DesktopCategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  transactions: Transaction[];
  onEditTransaction?: (tx: Transaction) => void;
}

export const DesktopCategoryDetailModal: React.FC<DesktopCategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  transactions,
  onEditTransaction,
}) => {
  const { updateTransaction, accounts, creditCards, categories } = useFinance();

  if (!isOpen) return null;

  const parentCat = category.parentId ? categories.find(c => c.id === category.parentId) : null;
  const fullTitle = parentCat ? `${parentCat.name} / ${category.name}` : category.name;
  const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const handleTogglePaid = (e: React.MouseEvent, tx: Transaction, currentEffectivelyPaid: boolean) => {
    e.stopPropagation();
    updateTransaction(tx.id, { paid: !currentEffectivelyPaid });
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#1e222d] text-white rounded-3xl shadow-2xl border border-slate-800 p-6 space-y-4 max-h-[85vh] flex flex-col z-10 animate-scaleUp"
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{ backgroundColor: category.color || '#3B82F6' }}
            >
              <CategoryIcon name={category.icon || 'Tag'} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white truncate" title={fullTitle}>
                {fullTitle}
              </h3>
              <span className="text-xs text-slate-400">
                {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Valor da Soma dos Itens no Canto Superior Direito */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Total</span>
              <span className="text-base font-bold text-rose-400 block">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {sortedDates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
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
                          className="flex items-center justify-between p-3.5 bg-[#252a36] border border-slate-800 hover:border-slate-700 rounded-2xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: category.color || (isIncome ? '#10b981' : '#f97316') }}
                            >
                              <CategoryIcon name={category.icon || 'Tag'} size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-100 text-sm block truncate group-hover:text-emerald-400 transition-colors">
                                {tx.description}
                              </span>
                              <div className="text-xs text-slate-400 flex items-center gap-2 truncate mt-0.5">
                                <span>{formatDateBR(tx.date)}</span>
                                <span className="text-slate-600">•</span>
                                {card ? (
                                  <span className="inline-flex items-center gap-1 text-cyan-300 truncate">
                                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{accountLabel}</span>
                                  </span>
                                ) : (
                                  <span className="truncate">{accountLabel}</span>
                                )}
                              </div>

                              {tx.notes && (
                                <p className="text-xs text-slate-400 italic truncate mt-1 flex items-center gap-1.5">
                                  <Edit3 className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{tx.notes}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 shrink-0 ml-4">
                            <span
                              className={`text-sm font-bold tracking-tight ${
                                isIncome ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatCurrency(tx.amount)}
                            </span>

                            <button
                              type="button"
                              onClick={e => handleTogglePaid(e, tx, isEffectivelyPaid)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                                isEffectivelyPaid
                                  ? 'bg-[#22c55e] text-slate-950 shadow-sm hover:bg-[#16a34a]'
                                  : 'bg-[#ef4444] text-white shadow-sm hover:bg-[#dc2626]'
                              }`}
                              title={isEffectivelyPaid ? 'Efetivado / Pago (Clique para desmarcar)' : 'Pendente (Clique para efetivar)'}
                            >
                              {isEffectivelyPaid ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <span className="text-xs font-black leading-none">!</span>
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
