'use client';

import React from 'react';
import { TrendingDown, TrendingUp, CreditCard, ArrowLeftRight, X } from 'lucide-react';
import { TransactionFlowType } from '../transactions/modal/TransactionModal';

interface MobileSpeedDialProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlow: (flow: TransactionFlowType) => void;
}

export const MobileSpeedDial: React.FC<MobileSpeedDialProps> = ({
  isOpen,
  onClose,
  onSelectFlow,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="md:hidden fixed inset-0 z-50 flex flex-col justify-end items-center bg-black/60 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Container dos botões radiais posicionados ao redor do botão roxo */}
      <div 
        className="relative w-[340px] h-[260px] pb-6 flex items-center justify-center pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. Transferência (Lateral Esquerda, logo acima e à esquerda do botão central) */}
        <div className="absolute left-6 bottom-10 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('transfer');
              onClose();
            }}
            className="w-16 h-16 rounded-full bg-[#444854]/90 hover:bg-[#525766] text-[#b388ff] flex items-center justify-center shadow-xl border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
          </button>
          <span className="text-[11px] font-medium text-white/90 tracking-tight">Transferência</span>
        </div>

        {/* 2. Receita (Superior Esquerda) */}
        <div className="absolute left-[72px] top-6 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('income');
              onClose();
            }}
            className="w-16 h-16 rounded-full bg-[#444854]/90 hover:bg-[#525766] text-[#34d399] flex items-center justify-center shadow-xl border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </button>
          <span className="text-[11px] font-medium text-white/90 tracking-tight">Receita</span>
        </div>

        {/* 3. Despesa cartão (Superior Direita) */}
        <div className="absolute right-[72px] top-6 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('creditCard');
              onClose();
            }}
            className="w-16 h-16 rounded-full bg-[#444854]/90 hover:bg-[#525766] text-[#22d3ee] flex items-center justify-center shadow-xl border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-6 h-6 stroke-[2]" />
          </button>
          <span className="text-[11px] font-medium text-white/90 tracking-tight text-center leading-tight">
            Despesa<br />cartão
          </span>
        </div>

        {/* 4. Despesa (Lateral Direita, logo acima e à direita do botão central) */}
        <div className="absolute right-6 bottom-10 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('expense');
              onClose();
            }}
            className="w-16 h-16 rounded-full bg-[#444854]/90 hover:bg-[#525766] text-[#fb7185] flex items-center justify-center shadow-xl border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingDown className="w-6 h-6 stroke-[2.2]" />
          </button>
          <span className="text-[11px] font-medium text-white/90 tracking-tight">Despesa</span>
        </div>
      </div>

      {/* Botão Central Roxo com 'X' (alinhado perfeitamente na posição da barra inferior) */}
      <div 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white flex items-center justify-center shadow-2xl shadow-purple-600/60 border-4 border-[#161a23] active:scale-95 transition-all cursor-pointer"
          title="Fechar menu"
        >
          <X className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
