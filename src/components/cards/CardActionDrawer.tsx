'use client';

import React from 'react';
import { CreditCard } from '@/types/finance';
import {
  X,
  CreditCard as CardIcon,
  Download,
  ListFilter,
  Layers,
  BarChart3,
  History,
  Edit2,
  Lock,
  Unlock,
  Archive,
} from 'lucide-react';

interface CardActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  invoiceStatus: 'open' | 'closed' | 'overdue' | 'paid';
  onToggleInvoiceStatus: (card: CreditCard) => void;
  onEdit: (card: CreditCard) => void;
  onViewInvoiceDetails: (card: CreditCard) => void;
  onArchive: (card: CreditCard) => void;
  onAdvancePayment?: (card: CreditCard) => void;
}

export const CardActionDrawer: React.FC<CardActionDrawerProps> = ({
  isOpen,
  onClose,
  card,
  invoiceStatus,
  onToggleInvoiceStatus,
  onEdit,
  onViewInvoiceDetails,
  onArchive,
  onAdvancePayment,
}) => {
  if (!isOpen || !card) return null;

  const isClosedOrPaid = invoiceStatus === 'closed' || invoiceStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#242428] rounded-t-3xl border-t border-slate-700/80 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Mais opções</h3>
            <p className="text-xs text-slate-400">{card.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Opções Conforme o Print */}
        <div className="p-2 overflow-y-auto divide-y divide-slate-700/40 text-sm">
          {/* Opção Reabrir / Fechar */}
          <button
            onClick={() => {
              onToggleInvoiceStatus(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-teal-300 font-semibold hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            {isClosedOrPaid ? <Unlock className="w-4 h-4 text-teal-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
            <span>{isClosedOrPaid ? 'Reabrir fatura' : 'Fechar fatura'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onAdvancePayment) {
                onAdvancePayment(card);
              } else {
                onViewInvoiceDetails(card);
              }
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <CardIcon className="w-4 h-4 text-slate-400" />
            <span>Pagar adiantado</span>
          </button>

          <button
            onClick={() => {
              onViewInvoiceDetails(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Lançar estorno</span>
          </button>

          <button
            onClick={() => {
              onViewInvoiceDetails(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span>Listar despesas</span>
          </button>

          <button
            onClick={() => {
              onViewInvoiceDetails(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Despesas fixas</span>
          </button>

          <button
            onClick={() => {
              onViewInvoiceDetails(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Gráfico Despesas</span>
          </button>

          <button
            onClick={() => {
              onViewInvoiceDetails(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Histórico de faturas</span>
          </button>

          <button
            onClick={() => {
              onEdit(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4 text-slate-400" />
            <span>Editar</span>
          </button>

          <button
            onClick={() => {
              onArchive(card);
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 text-left text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 text-rose-400" />
            <span>Arquivar cartão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
