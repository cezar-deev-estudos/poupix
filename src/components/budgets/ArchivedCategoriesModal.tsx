'use client';

import React from 'react';
import { Category } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, ArchiveRestore, Trash2 } from 'lucide-react';

interface ArchivedCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedCategories: Category[];
  allCategories: Category[];
  onUnarchive: (catId: string) => void;
  onDelete: (cat: Category) => void;
}

export const ArchivedCategoriesModal: React.FC<ArchivedCategoriesModalProps> = ({
  isOpen,
  onClose,
  archivedCategories,
  allCategories,
  onUnarchive,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Categorias Arquivadas</h3>
            <p className="text-xs text-slate-400">Itens inativos ou ocultados do planejamento orçamentário</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {archivedCategories.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">Nenhuma categoria ou subcategoria arquivada.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {archivedCategories.map(cat => {
              const parentCat = cat.parentId ? allCategories.find(c => c.id === cat.parentId) : null;
              const displayName = parentCat ? `${parentCat.name} / ${cat.name}` : cat.name;

              return (
                <div
                  key={cat.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">{displayName}</h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            cat.type === 'expense'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {cat.type === 'expense' ? 'Despesa' : 'Receita'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cat.budgetLimit && cat.budgetLimit > 0 ? (
                          <span className="text-xs text-slate-400">
                            Teto: {formatCurrency(cat.budgetLimit)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Sem teto</span>
                        )}
                        {parentCat && (
                          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded">
                            Subcategoria
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUnarchive(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                      title="Desarquivar categoria"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Restaurar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
