'use client';

import React from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import {
  Check,
  Clock,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Image as ImageIcon,
  Heart,
  FileText,
  Calendar,
  Tag as TagIcon,
  Bell,
  Edit3,
  HelpCircle,
  CreditCard,
  Wallet,
  Trash2,
  Receipt,
} from 'lucide-react';
import { CategoryIcon } from '../ui/CategoryIcon';

interface MobileTransactionDetailDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

const MONTH_NAMES_SHORT = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
];

/**
 * Formata data no padrão "21 set. 2026"
 */
function formatDetailDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  const monthName = MONTH_NAMES_SHORT[monthIdx] || '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Formata data de fatura no padrão curto "22 set."
 */
function formatInvoiceDateShort(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_SHORT[monthIdx] || '';
  return `${day} ${monthName}`;
}

export const MobileTransactionDetailDrawer: React.FC<MobileTransactionDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { categories, accounts, creditCards, updateTransaction } = useFinance();

  if (!isOpen || !transaction) return null;

  const cat = categories.find((c) => c.id === transaction.categoryId);
  const acc = accounts.find((a) => a.id === transaction.accountId);
  const card = creditCards.find((c) => c.id === transaction.creditCardId);
  const destAcc = accounts.find((a) => a.id === transaction.destinationAccountId);

  const isCreditCard = Boolean(transaction.creditCardId || card);
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  // Obter data da fatura para cartão de crédito
  const invoiceDateStr = isCreditCard
    ? transaction.invoiceDate || (card ? getTransactionInvoicePeriod(transaction, card).invoiceDueDateStr : '')
    : '';

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
    if (isCreditCard) return 'Despesa cartão';
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

        {/* 1. Quick Actions Top Circles */}
        {isCreditCard ? (
          /* Cartão de Crédito: 3 botões redondos centralizados (Pago, Despesa Cartão [Turquesa], Anexo) */
          <div className="grid grid-cols-3 gap-2 pt-1 text-center max-w-[280px] mx-auto">
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

            {/* Despesa Cartão (Turquesa / Teal) */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#0d9488] text-white shadow-md">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-slate-300 font-medium leading-tight">
                Despesa<br />cartão
              </span>
            </div>

            {/* Anexo */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                className="w-12 h-12 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-300 transition-all active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <span className="text-[11px] text-slate-300 font-medium">Anexo</span>
            </div>
          </div>
        ) : (
          /* Transação de Conta Padrão: 4 botões redondos (Pago, Despesa/Receita/Transf, Anexo, Favorita) */
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
                <ImageIcon className="w-5 h-5" />
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
        )}

        {/* 2. Grid de Detalhes em 2 colunas */}
        <div className="border-t border-slate-600/50 pt-3 space-y-3.5 text-xs">
          {isCreditCard ? (
            /* Layout Detalhes Cartão de Crédito */
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
                  <span className="text-xs font-bold text-rose-400 block truncate">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Data</span>
                  <span className="text-xs font-semibold text-white block truncate">
                    {formatDetailDate(transaction.date)}
                  </span>
                </div>
              </div>

              {/* Fatura */}
              <div className="flex items-start gap-2.5">
                <Receipt className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Fatura</span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {invoiceDateStr ? formatInvoiceDateShort(invoiceDateStr) : 'Fatura atual'}
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

              {/* Cartão de Crédito */}
              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Cartão de crédito</span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {card?.name || 'Cartão de crédito'}
                  </span>
                </div>
              </div>

              {/* Lembrete */}
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Lembrete</span>
                  <span className="text-xs font-semibold text-white block">Nenhum</span>
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

              {/* Observação */}
              <div className="flex items-start gap-2.5 col-span-2">
                <Edit3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Observação</span>
                  <span className="text-xs font-semibold text-white block truncate">
                    {transaction.notes || 'Nenhuma'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Layout Detalhes Conta Padrão */
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
                  <span className="text-xs font-semibold text-white block truncate">
                    {formatDetailDate(transaction.date)}
                  </span>
                </div>
              </div>

              {/* Conta */}
              <div className="flex items-start gap-2.5">
                <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Conta</span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {isTransfer ? `${acc?.name} ➔ ${destAcc?.name}` : acc?.name || 'Conta'}
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

              {/* Lembrete */}
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Lembrete</span>
                  <span className="text-xs font-semibold text-white block">Nenhum</span>
                </div>
              </div>

              {/* Espaço vazio para manter alinhamento com a coluna de tags */}
              <div />

              {/* Observação */}
              <div className="flex items-start gap-2.5 col-span-2">
                <Edit3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Observação</span>
                  <span className="text-xs font-semibold text-white block truncate">
                    {transaction.notes || 'Nenhuma'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Toggle: Ignorar despesa/cartão/receita */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-600/50">
            <div className="flex items-center gap-2 text-slate-300">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs">
                {isCreditCard
                  ? 'Ignorar despesa cartão'
                  : `Ignorar ${isIncome ? 'receita' : isTransfer ? 'transferência' : 'despesa'}`}
              </span>
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

          {/* Botão de Excluir Lançamento */}
          {onDelete && (
            <div className="pt-2 border-t border-slate-600/50">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(transaction);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 border border-rose-500/30 rounded-2xl transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir {getTypeLabel().toLowerCase()}</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão Inferior Grande de Edição */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white shadow-xl transition-all active:scale-[0.98] cursor-pointer ${
              isCreditCard
                ? 'bg-[#14b8a6] hover:bg-[#0d9488] shadow-teal-500/20'
                : isIncome
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
