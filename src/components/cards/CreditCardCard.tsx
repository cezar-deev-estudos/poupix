'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CreditCard } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { CardBrandLogo } from './CardBrandLogo';
import {
  MoreVertical,
  Edit2,
  Archive,
  BarChart3,
  History,
  Layers,
  Lock,
  Unlock,
  CheckCircle2,
  Check,
  CreditCard as CardIcon,
} from 'lucide-react';

interface CreditCardCardProps {
  card: CreditCard;
  invoiceAmount: number;
  invoiceStatus: 'open' | 'closed' | 'overdue' | 'paid';
  closingOrDueDateFormatted: string; // Ex: "10 de setembro de 2026"
  isOverdue: boolean;
  isClosed: boolean;
  onSelectCard: (card: CreditCard) => void;
  onEdit: (card: CreditCard) => void;
  onArchive: (card: CreditCard) => void;
  onAddExpense: (card: CreditCard) => void;
  onPayInvoice: (card: CreditCard) => void;
  onViewHistory: (card: CreditCard) => void;
  onViewFixedExpenses: (card: CreditCard) => void;
  onViewExpenseChart: (card: CreditCard) => void;
  onToggleInvoiceStatus: (card: CreditCard) => void;
  onAdvancePayment?: (card: CreditCard) => void;
}

export const CreditCardCard: React.FC<CreditCardCardProps> = ({
  card,
  invoiceAmount,
  invoiceStatus,
  closingOrDueDateFormatted,
  isOverdue,
  isClosed,
  onSelectCard,
  onEdit,
  onArchive,
  onAddExpense,
  onPayInvoice,
  onViewHistory,
  onViewFixedExpenses,
  onViewExpenseChart,
  onToggleInvoiceStatus,
  onAdvancePayment,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const availableLimit = Math.max(0, card.limit - invoiceAmount);
  const limitUsedPercent = Math.min(100, (invoiceAmount / (card.limit || 1)) * 100);

  const isClosedOrOverdue = invoiceStatus === 'closed' || invoiceStatus === 'overdue' || invoiceStatus === 'paid';

  return (
    <div
      onClick={() => onSelectCard(card)}
      className="bg-[#18181b]/90 border border-slate-800/90 hover:border-teal-500/40 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all cursor-pointer group relative select-none"
    >
      {/* Header do Card: Bandeira + Nome + Menu ⋮ */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <CardBrandLogo brand={card.brand} name={card.name} size="md" />
          <h3 className="font-bold text-white text-sm truncate tracking-tight" title={card.name}>
            {card.name}
          </h3>
        </div>

        {/* Menu Dropdown ⋮ */}
        <div
          className="relative shrink-0"
          ref={menuRef}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* Opção Reabrir / Fechar Fatura */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleInvoiceStatus(card);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2 font-semibold text-left transition-colors cursor-pointer ${
                  isClosedOrOverdue
                    ? 'text-teal-300 hover:bg-teal-500/20'
                    : 'text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                {isClosedOrOverdue ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Reabrir fatura</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fechar fatura</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onAdvancePayment?.(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5"
              >
                <CardIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Pagar adiantado</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Editar cartão</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewFixedExpenses(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Despesas fixas</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewExpenseChart(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Gráfico despesas</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewHistory(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Histórico de faturas</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onArchive(card);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>Arquivar cartão de crédito</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seção Central: Status da Fatura + Valor Total / Parcial + Data de Fechamento / Vencimento */}
      <div className="space-y-2 py-1">
        {/* Status da Fatura (Fatura vencida / Fatura fechada / Fatura aberta / Fatura paga) */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 font-bold text-xs ${
                invoiceStatus === 'open'
                  ? 'text-amber-400'
                  : invoiceStatus === 'paid'
                  ? 'text-teal-300'
                  : invoiceStatus === 'overdue'
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-300'
              }`}
            >
              {invoiceStatus === 'open' ? (
                'Fatura aberta'
              ) : invoiceStatus === 'paid' ? (
                'Fatura paga'
              ) : invoiceStatus === 'overdue' ? (
                'Fatura vencida'
              ) : (
                'Fatura fechada'
              )}
            </span>
          </div>
        </div>

        {/* Linha de Valor Total / Valor Parcial */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {isClosedOrOverdue ? 'Valor total' : 'Valor parcial'}
          </span>
          <span className="font-bold text-rose-500 text-sm tracking-tight">
            {formatCurrency(invoiceAmount)}
          </span>
        </div>

        {/* Linha de Venceu em / Vence em / Fecha em */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {isOverdue ? 'Venceu em' : isClosed ? 'Vence em' : 'Fecha em'}
          </span>
          <span className="text-slate-200 font-medium">{closingOrDueDateFormatted}</span>
        </div>

        {/* Barra de Progresso de Limite */}
        <div className="pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>
              {formatCurrency(invoiceAmount)} de {formatCurrency(card.limit)}
            </span>
          </div>

          <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center relative">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${limitUsedPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Limite Disponível {formatCurrency(availableLimit)}</span>
            <span className="font-semibold text-slate-300">
              {limitUsedPercent.toFixed(limitUsedPercent % 1 === 0 ? 0 : 2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Botão Inferior de Ação: PAGAR FATURA (se fechada/vencida) ou ADICIONAR DESPESA (se aberta) */}
      <div
        className="mt-4 pt-3 border-t border-slate-800/70 flex justify-end"
        onClick={e => e.stopPropagation()}
      >
        {invoiceStatus === 'paid' ? (
          <div className="flex items-center gap-1.5 text-xs text-teal-300 font-bold py-1">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>FATURA PAGA</span>
          </div>
        ) : isClosedOrOverdue ? (
          <button
            onClick={() => onPayInvoice(card)}
            className="text-xs font-bold text-white hover:text-slate-200 transition-colors uppercase tracking-wider py-1 cursor-pointer flex items-center gap-1.5"
          >
            PAGAR FATURA
          </button>
        ) : (
          <button
            onClick={() => onAddExpense(card)}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-wider py-1 cursor-pointer flex items-center gap-1"
          >
            ADICIONAR DESPESA
          </button>
        )}
      </div>
    </div>
  );
};
