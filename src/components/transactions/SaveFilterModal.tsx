'use client';

import React, { useState } from 'react';
import { X, BookmarkPlus } from 'lucide-react';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, scope: 'month' | 'year') => void;
  currentSearchQuery: string;
  currentYear: number;
  currentScope: 'month' | 'year';
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSearchQuery,
  currentYear,
  currentScope,
}) => {
  const [filterName, setFilterName] = useState(
    currentSearchQuery.trim() ? `Busca: "${currentSearchQuery.trim()}"` : 'Meu Filtro'
  );
  const [scope, setScope] = useState<'month' | 'year'>(currentScope);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) return;
    onSave(filterName.trim(), scope);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#222530] border border-slate-700/80 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-scaleUp text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Salvar Filtro Atual</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Nome do Filtro</label>
            <input
              type="text"
              autoFocus
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Ex: Contas de Luz, Farmácia, etc."
              className="w-full bg-[#181b24] border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Escopo do Período */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Abrangência do Filtro</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('month')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                  scope === 'month'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                    : 'bg-[#181b24] border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Mês Selecionado
              </button>

              <button
                type="button"
                onClick={() => setScope('year')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                  scope === 'year'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                    : 'bg-[#181b24] border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Ano Inteiro ({currentYear})
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {scope === 'year'
                ? `Mostra todos os lançamentos desse item nos 12 meses de ${currentYear}.`
                : 'Filtra os lançamentos dentro de cada mês selecionado.'}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!filterName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Salvar Filtro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
