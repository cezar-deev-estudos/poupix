'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CreditCard as CreditCardType } from '@/types/finance';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface CreditCardSelectorDropdownProps {
  creditCards: CreditCardType[];
  selectedCardId: string;
  onSelectCard: (id: string) => void;
}

export const CreditCardSelectorDropdown: React.FC<CreditCardSelectorDropdownProps> = ({
  creditCards,
  selectedCardId,
  onSelectCard,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardColor = selectedCard?.color || '#06B6D4';

  return (
    <div ref={containerRef} className="relative space-y-1">
      {/* Botão Gatilho */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
        <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between text-left cursor-pointer group min-w-0"
        >
          {/* Badge Pílula do Cartão Selecionado */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all truncate"
            style={{
              borderColor: `${cardColor}90`,
              backgroundColor: `${cardColor}15`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm text-[10px] font-bold"
              style={{ backgroundColor: cardColor }}
            >
              💳
            </div>

            <span className="text-xs font-semibold text-white truncate max-w-[240px]">
              {selectedCard?.name || 'Selecione um cartão'} ({selectedCard?.brand?.toUpperCase()})
            </span>
          </div>

          <div className="text-slate-400 group-hover:text-white p-1 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
      </div>

      {/* Menu Dropdown Suspenso de Cartões */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto animate-fadeIn space-y-1">
          {creditCards.map(card => {
            const isSelected = selectedCardId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  onSelectCard(card.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm text-[10px] font-bold"
                    style={{ backgroundColor: card.color }}
                  >
                    💳
                  </div>
                  <span className="truncate">{card.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {card.brand.toUpperCase()}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium ml-2 shrink-0">
                  Vence dia {card.dueDay}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
