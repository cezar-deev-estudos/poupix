'use client';

import React from 'react';

interface TransactionsOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  groupByCard: boolean;
  onToggleGroupByCard: () => void;
  alertPending: boolean;
  onToggleAlertPending: () => void;
  onOpenReceipts?: () => void;
}

export const TransactionsOptionsMenu: React.FC<TransactionsOptionsMenuProps> = ({
  isOpen,
  onClose,
  groupByCard,
  onToggleGroupByCard,
  alertPending,
  onToggleAlertPending,
  onOpenReceipts,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-40 p-3 animate-scaleUp text-xs text-slate-200 space-y-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenReceipts?.();
          }}
          className="w-full text-left py-1 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
        >
          Recibos
        </button>

        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pt-1 border-t border-slate-700/50">
          Opções de visualização
        </div>

        {/* Toggle: Agrupar por Cartão */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-300">Agrupar por Cartão</span>
          <button
            type="button"
            onClick={onToggleGroupByCard}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              groupByCard ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                groupByCard ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle: Alerta de transações pendentes */}
        <div className="flex items-center justify-between py-1 border-t border-slate-700/50 pt-2">
          <span className="text-xs text-slate-300">Alerta de transações pendentes</span>
          <button
            type="button"
            onClick={onToggleAlertPending}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              alertPending ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                alertPending ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </>
  );
};
