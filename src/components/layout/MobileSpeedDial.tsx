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
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end items-center pb-24 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Botões Radiais / Speed Dial */}
      <div className="relative w-72 h-64 flex items-center justify-center">
        {/* 1. Transferência (Esquerda) */}
        <div className="absolute left-2 bottom-12 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('transfer');
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-[#3d3858] hover:bg-[#4d4670] text-purple-300 flex items-center justify-center shadow-xl border border-purple-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-medium text-white tracking-tight">Transferência</span>
        </div>

        {/* 2. Receita (Noroeste / Topo Esquerdo) */}
        <div className="absolute left-14 top-2 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('income');
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-[#384e46] hover:bg-[#435e54] text-emerald-400 flex items-center justify-center shadow-xl border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingUp className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-medium text-white tracking-tight">Receita</span>
        </div>

        {/* 3. Despesa cartão (Nordeste / Topo Direito) */}
        <div className="absolute right-14 top-2 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('creditCard');
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-[#354854] hover:bg-[#405969] text-cyan-300 flex items-center justify-center shadow-xl border border-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-medium text-white tracking-tight text-center leading-tight">
            Despesa<br />cartão
          </span>
        </div>

        {/* 4. Despesa (Direita) */}
        <div className="absolute right-2 bottom-12 flex flex-col items-center gap-1.5 animate-scaleUp">
          <button
            type="button"
            onClick={() => {
              onSelectFlow('expense');
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-[#4e383b] hover:bg-[#5f4448] text-rose-400 flex items-center justify-center shadow-xl border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingDown className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-medium text-white tracking-tight">Despesa</span>
        </div>
      </div>

      {/* Botão Central Roxo com 'X' para Fechar exatamente na posição do botão + central */}
      <div className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-50">
        <button
          type="button"
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center shadow-2xl shadow-purple-500/50 border-2 border-[#161a23] active:scale-95 transition-all cursor-pointer"
          title="Fechar menu"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
