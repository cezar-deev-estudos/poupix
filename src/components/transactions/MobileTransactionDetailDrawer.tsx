'use client';

import React from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  Check,
  Clock,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Paperclip,
  Heart,
  FileText,
  Calendar,
  Tag as TagIcon,
  Bell,
  Edit3,
  HelpCircle,
  X,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { CategoryIcon } from '../ui/CategoryIcon';

interface MobileTransactionDetailDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export const MobileTransactionDetailDrawer: React.FC<MobileTransactionDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { categories, accounts, creditCards, updateTransaction } = useFinance();

  if (!isOpen || !transaction) return null;

  const cat = categories.find((c) => c.id === transaction.categoryId);
  const acc = accounts.find((a) => a.id === transaction.accountId);
  const card = creditCards.find((c) => c.id === transaction.creditCardId);
  const destAcc = accounts.find((a) => a.id === transaction.destinationAccountId);

  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const togglePaid = () => {
    updateTransaction(transaction.id, { paid: !transaction.paid });
  };

  const toggleFavorite = () => {
    updateTransaction(transaction.id, { isFavorite: !transaction.isFavorite });
  };

  const toggleIgnore = () => {
    updateTransaction(transaction.id, { ignoreInTotals: !transaction.ignoreInTotals });
  };

  const getTypeLabel = () => {
    if (isIncome) return 'Receita';
    if (isExpense) return 'Despesa';
    return 'Transferência';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#333742] text-white rounded-t-3xl shadow-2xl p-5 border-t border-slate-700/80 animate-slideUp space-y-5 max-h-[90vh] overflow-y-auto z-10"
      >
        {/* Handle de fechamento */}
        <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto" />

        {/* 1. Quick Actions Top Circles (Pago, Despesa/Receita, Anexo, Favorita) */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          {/* Botão Pago/Pendente */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={togglePaid}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer ${
                transaction.paid
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-slate-700 text-slate-400 border border-slate-600'
              }`}
            >
              {transaction.paid ? <Check className="w-6 h-6 stroke-[3]" /> : <Clock className="w-5 h-5" />}
            </button>
            <span className="text-[11px] text-slate-300 font-medium">
              {transaction.paid ? 'Pago' : 'Pendente'}
            </span>
          </div>

          {/* Tipo de Transação */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                isIncome ? 'bg-[#22c55e]' : isExpense ? 'bg-[#ef4444]' : 'bg-[#3b82f6]'
              }`}
            >
              {isIncome ? (
                <TrendingUp className="w-6 h-6" />
              ) : isExpense ? (
                <TrendingDown className="w-6 h-6" />
              ) : (
                <ArrowRightLeft className="w-6 h-6" />
              )}
            </div>
            <span className="text-[11px] text-slate-300 font-medium">{getTypeLabel()}</span>
          </div>

          {/* Anexo */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <span className="text-[11px] text-slate-300 font-medium">Anexo</span>
          </div>

          {/* Favorita */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                transaction.isFavorite
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-slate-700/80 border-slate-600 text-slate-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${transaction.isFavorite ? 'fill-rose-400' : ''}`} />
            </button>
            <span className="text-[11px] text-slate-300 font-medium">Favorita</span>
          </div>
        </div>

        <div className="border-t border-slate-600/50 pt-3 space-y-3.5 text-xs">
          {/* Grid de 2 colunas com Detalhes */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Descrição */}
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Descrição</span>
                <span className="text-xs font-semibold text-white truncate block">{transaction.description}</span>
              </div>
            </div>

            {/* Valor */}
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                $
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Valor</span>
                <span
                  className={`text-xs font-bold block truncate ${
                    isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-blue-400'
                  }`}
                >
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            {/* Data */}
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Data</span>
                <span className="text-xs font-semibold text-white block truncate">{formatDateBR(transaction.date)}</span>
              </div>
            </div>

            {/* Conta */}
            <div className="flex items-start gap-2.5">
              {card ? (
                <CreditCard className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              ) : (
                <Wallet className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Conta / Cartão</span>
                <span className="text-xs font-semibold text-white truncate block">
                  {isTransfer ? `${acc?.name} ➔ ${destAcc?.name}` : card?.name || acc?.name || 'Conta'}
                </span>
              </div>
            </div>

            {/* Categoria */}
            <div className="flex items-start gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                style={{ backgroundColor: cat?.color || '#6B7280' }}
              >
                <CategoryIcon name={cat?.icon || 'Tag'} size={10} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Categoria</span>
                <span className="text-xs font-semibold text-white truncate block">{cat?.name || 'Geral'}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-2.5">
              <TagIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Tags</span>
                <span className="text-xs font-semibold text-white truncate block">
                  {transaction.tags && transaction.tags.length > 0
                    ? transaction.tags.map((t) => `#${t}`).join(', ')
                    : 'Nenhuma tag'}
                </span>
              </div>
            </div>
          </div>

          {/* Lembrete */}
          <div className="flex items-start gap-2.5 pt-1">
            <Bell className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">Lembrete</span>
              <span className="text-xs font-semibold text-white block">Nenhum</span>
            </div>
          </div>

          {/* Observação */}
          <div className="flex items-start gap-2.5">
            <Edit3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">Observação</span>
              <span className="text-xs font-semibold text-white block truncate">
                {transaction.notes || 'Nenhuma'}
              </span>
            </div>
          </div>

          {/* Toggle: Ignorar despesa/receita */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-600/50">
            <div className="flex items-center gap-2 text-slate-300">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs">Ignorar {isIncome ? 'receita' : 'despesa'}</span>
            </div>
            <button
              type="button"
              onClick={toggleIgnore}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                transaction.ignoreInTotals ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  transaction.ignoreInTotals ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Botão Inferior Grande de Edição */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-xl transition-all active:scale-[0.98] cursor-pointer ${
              isIncome
                ? 'bg-[#22c55e] hover:bg-emerald-600 shadow-emerald-500/20'
                : isTransfer
                ? 'bg-[#3b82f6] hover:bg-blue-600 shadow-blue-500/20'
                : 'bg-[#ef4444] hover:bg-rose-600 shadow-rose-500/20'
            }`}
          >
            EDITAR {getTypeLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};
