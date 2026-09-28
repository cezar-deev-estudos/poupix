'use client';

import React from 'react';
import { CreditCard } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { X, ArchiveRestore, Trash2, CreditCard as CardIcon } from 'lucide-react';

interface ArchivedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedCards: CreditCard[];
  onUnarchive: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}

export const ArchivedCardsModal: React.FC<ArchivedCardsModalProps> = ({
  isOpen,
  onClose,
  archivedCards,
  onUnarchive,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Cartões Arquivados</h3>
            <p className="text-xs text-slate-400">Cartões inativos ou arquivados da visão principal</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {archivedCards.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">Nenhum cartão arquivado no momento.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {archivedCards.map(card => (
              <div
                key={card.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold"
                    style={{ backgroundColor: card.color }}
                  >
                    <CardIcon className="w-5 h-5 opacity-90" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{card.name}</h4>
                    <span className="text-xs text-slate-400">Limite: {formatCurrency(card.limit)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUnarchive(card.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title="Desarquivar Cartão"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Desarquivar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir permanentemente o cartão "${card.name}"?`)) {
                        onDelete(card.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
