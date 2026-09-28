'use client';

import React from 'react';
import { CreditCard } from '@/types/finance';
import { CardBrandLogo } from './CardBrandLogo';
import { X, Check } from 'lucide-react';

interface DefaultCardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  selectedCardId?: string;
  onSelectDefaultCard: (cardId: string) => void;
}

export const DefaultCardDrawer: React.FC<DefaultCardDrawerProps> = ({
  isOpen,
  onClose,
  cards,
  selectedCardId,
  onSelectDefaultCard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#242428] rounded-t-3xl border-t border-slate-700/80 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        {/* Header */}
        <div className="p-4 pb-2 border-b border-slate-700/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Cartão manual padrão</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem Explicativa Roxa */}
        <div className="p-4">
          <div className="p-4 rounded-2xl bg-[#372b4c]/80 border border-violet-500/30 flex items-start gap-3">
            <span className="text-violet-300 text-lg">💡</span>
            <p className="text-xs text-violet-200 leading-relaxed">
              Selecione o cartão que você usa mais. Ele será sugerido sempre que você cadastrar uma nova despesa.
            </p>
          </div>
        </div>

        {/* Lista de Cartões para Seleção */}
        <div className="px-4 pb-6 overflow-y-auto space-y-2.5 flex-1">
          {cards.map(card => {
            const isSelected = selectedCardId === card.id;

            return (
              <button
                key={card.id}
                onClick={() => {
                  onSelectDefaultCard(card.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#1c1c20] border-teal-500/60 shadow-md shadow-teal-500/10'
                    : 'bg-[#1c1c20]/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CardBrandLogo brand={card.brand} name={card.name} size="sm" />
                  <span className="font-semibold text-white text-sm truncate">{card.name}</span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-500 text-slate-950'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
