'use client';

import React from 'react';
import { FileText, X } from 'lucide-react';
import { CreditCard } from '@/types/finance';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  card?: CreditCard | null;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  card,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#242428] border border-slate-700/80 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-200 text-left relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Botão Fechar no Topo Direito (Desktop) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ilustração / Ícone de Recibo de Fatura */}
        <div className="flex justify-center pt-2">
          <div className="w-24 h-28 bg-slate-100 rounded-xl shadow-lg border border-slate-300 flex flex-col items-center justify-center p-3 gap-2 relative">
            <div className="w-full h-1.5 bg-teal-500/80 rounded-full" />
            <div className="w-3/4 h-1 bg-slate-300 rounded-full" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-full" />
            <div className="w-1/2 h-1 bg-slate-300 rounded-full" />
            <div className="w-full border-t border-dashed border-slate-300 my-1" />
            <div className="w-3/5 h-1.5 bg-teal-600/70 rounded-full" />
          </div>
        </div>

        {/* Título e Texto Explicativo (Fiel à referência) */}
        <div className="space-y-3">
          <h3 className="font-bold text-white text-base sm:text-lg">
            Pagamento adiantado
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Pague o valor adiantado de uma fatura que ainda está aberta para que o valor da fatura esteja menor quando ela estiver fechada.
          </p>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Pagar um valor adiantado não faz sua fatura fechar, você ainda terá que pagar o que restou da fatura quando chegar o dia de pagamento.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl border border-slate-700 hover:bg-slate-800 text-teal-400 hover:text-teal-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer text-center"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
