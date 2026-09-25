'use client';

import React from 'react';
import { TrendingDown, TrendingUp, CreditCard, ArrowRightLeft } from 'lucide-react';
import { TransactionFlowType } from '../transactions/modal/TransactionModal';

interface NewTransactionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlow: (flow: TransactionFlowType) => void;
}

export const NewTransactionPopover: React.FC<NewTransactionPopoverProps> = ({
  isOpen,
  onClose,
  onSelectFlow,
}) => {
  if (!isOpen) return null;

  const items: {
    id: TransactionFlowType;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    hoverClass: string;
  }[] = [
    {
      id: 'expense',
      label: 'Despesa',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
      colorClass: 'text-slate-200',
      hoverClass: 'hover:bg-rose-500/10 hover:text-rose-300',
    },
    {
      id: 'income',
      label: 'Receita',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      colorClass: 'text-slate-200',
      hoverClass: 'hover:bg-emerald-500/10 hover:text-emerald-300',
    },
    {
      id: 'creditCard',
      label: 'Despesa cartão',
      icon: <CreditCard className="w-4 h-4 text-cyan-400" />,
      colorClass: 'text-slate-200',
      hoverClass: 'hover:bg-cyan-500/10 hover:text-cyan-300',
    },
    {
      id: 'transfer',
      label: 'Transferência',
      icon: <ArrowRightLeft className="w-4 h-4 text-blue-400" />,
      colorClass: 'text-slate-200',
      hoverClass: 'hover:bg-blue-500/10 hover:text-blue-300',
    },
  ];

  return (
    <>
      {/* Backdrop invisível para fechar ao clicar fora */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu Popover Flutuante */}
      <div className="absolute left-4 top-24 z-50 w-56 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 animate-fadeIn space-y-0.5">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectFlow(item.id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${item.colorClass} ${item.hoverClass}`}
          >
            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 shrink-0">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
