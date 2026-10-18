'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { X, Check, Bookmark, Trash2 } from 'lucide-react';
import { SavedTransactionFilter } from '@/types/finance';

export interface AdvancedFilterState {
  startDate: string;
  endDate: string;
  categoryId: string;
  subcategoryId?: string;
  accountId: string;
  tag: string;
  status: 'all' | 'paid' | 'pending';
  type: 'all' | 'expense' | 'income' | 'transfer';
  saveFilter: boolean;
  filterName?: string;
}

interface TransactionsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: AdvancedFilterState;
  onApplyFilter: (filter: AdvancedFilterState) => void;
  onResetFilter: () => void;
  savedFilters?: SavedTransactionFilter[];
  onApplySavedFilter?: (filter: SavedTransactionFilter) => void;
  onDeleteSavedFilter?: (id: string) => void;
}

export const TransactionsFilterModal: React.FC<TransactionsFilterModalProps> = ({
  isOpen,
  onClose,
  filter,
  onApplyFilter,
  onResetFilter,
  savedFilters = [],
  onApplySavedFilter,
  onDeleteSavedFilter,
}) => {
  const { categories, accounts, tags } = useFinance();
  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [currentFilter, setCurrentFilter] = useState<AdvancedFilterState>(filter);

  // Categorias Pai (sem parentId)
  const parentCategories = React.useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );

  // Subcategorias disponíveis para a Categoria Pai selecionada (ou todas caso nenhuma esteja selecionada)
  const availableSubcategories = React.useMemo(() => {
    if (currentFilter.categoryId) {
      return categories.filter((c) => c.parentId === currentFilter.categoryId);
    }
    return categories.filter((c) => Boolean(c.parentId));
  }, [categories, currentFilter.categoryId]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilter(currentFilter);
    onClose();
  };

  const handleReset = () => {
    onResetFilter();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#222530] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <h3 className="text-base font-bold text-white">Filtro de transações</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 pb-2.5 text-xs font-bold transition-all text-center cursor-pointer border-b-2 ${
              activeTab === 'new'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            NOVO FILTRO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex-1 pb-2.5 text-xs font-bold transition-all text-center cursor-pointer border-b-2 ${
              activeTab === 'saved'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            FILTROS SALVOS ({savedFilters.length})
          </button>
        </div>

        {activeTab === 'new' ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Datas De / Até */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">De</label>
                <input
                  type="date"
                  value={currentFilter.startDate}
                  onChange={(e) => setCurrentFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[#181b24] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Até</label>
                <input
                  type="date"
                  value={currentFilter.endDate}
                  onChange={(e) => setCurrentFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[#181b24] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Categorias (Somente Pais) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Categoria</label>
              <select
                value={currentFilter.categoryId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setCurrentFilter((prev) => {
                    const subBelongs = newCatId
                      ? categories.some((c) => c.id === prev.subcategoryId && c.parentId === newCatId)
                      : true;
                    return {
                      ...prev,
                      categoryId: newCatId,
                      subcategoryId: subBelongs ? prev.subcategoryId : '',
                    };
                  });
                }}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as categorias</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategorias (Pai / Subcategoria) */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Subcategoria</label>
              <select
                value={currentFilter.subcategoryId || ''}
                onChange={(e) => {
                  const selectedSubId = e.target.value;
                  setCurrentFilter((prev) => {
                    const sub = categories.find((c) => c.id === selectedSubId);
                    return {
                      ...prev,
                      subcategoryId: selectedSubId,
                      categoryId: sub?.parentId ? sub.parentId : prev.categoryId,
                    };
                  });
                }}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as subcategorias</option>
                {availableSubcategories.map((sub) => {
                  const parent = categories.find((c) => c.id === sub.parentId);
                  const label = parent ? `${parent.name} / ${sub.name}` : sub.name;
                  return (
                    <option key={sub.id} value={sub.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Contas */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Contas</label>
              <select
                value={currentFilter.accountId}
                onChange={(e) => setCurrentFilter((prev) => ({ ...prev, accountId: e.target.value }))}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as contas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Tags</label>
              <select
                value={currentFilter.tag}
                onChange={(e) => setCurrentFilter((prev) => ({ ...prev, tag: e.target.value }))}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.name}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Situações */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Situações</label>
              <select
                value={currentFilter.status}
                onChange={(e) => setCurrentFilter((prev) => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas as situações</option>
                <option value="paid">Efetivadas (Pagas)</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>

            {/* Tipos */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Tipos</label>
              <select
                value={currentFilter.type}
                onChange={(e) => setCurrentFilter((prev) => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="expense">Despesas</option>
                <option value="income">Receitas</option>
                <option value="transfer">Transferências</option>
              </select>
            </div>

            {/* Salvar filtro personalizado com Nome */}
            <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  Salvar este filtro com um nome
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentFilter((prev) => ({ ...prev, saveFilter: !prev.saveFilter }))}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    currentFilter.saveFilter ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      currentFilter.saveFilter ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {currentFilter.saveFilter && (
                <div className="space-y-1 animate-fadeIn pt-1">
                  <label className="text-[10px] text-slate-400">Nome do filtro</label>
                  <input
                    type="text"
                    placeholder="Ex: Minhas Despesas Fixas"
                    value={currentFilter.filterName || ''}
                    onChange={(e) => setCurrentFilter((prev) => ({ ...prev, filterName: e.target.value }))}
                    className="w-full bg-[#181b24] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {savedFilters.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs space-y-1">
                <Bookmark className="w-7 h-7 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-400">Nenhum filtro salvo no momento</p>
                <p className="text-[11px] text-slate-600">
                  Configure um filtro na aba "Novo Filtro" e marque a opção para salvar.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {savedFilters.map((sf) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer group"
                  >
                    <div
                      className="flex-1 min-w-0 mr-2"
                      onClick={() => {
                        onApplySavedFilter?.(sf);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100 truncate block">
                          {sf.name}
                        </span>
                        {sf.scope === 'year' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold shrink-0">
                            Ano Todo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 truncate">
                        {sf.searchQuery && <span>Busca: "{sf.searchQuery}"</span>}
                        {sf.type && sf.type !== 'all' && <span>• Tipo: {sf.type}</span>}
                        {sf.status && sf.status !== 'all' && <span>• Situação: {sf.status}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onApplySavedFilter?.(sf);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>

                      {onDeleteSavedFilter && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSavedFilter(sf.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                          title="Excluir filtro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            CANCELAR / LIMPAR
          </button>

          {activeTab === 'new' && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              APLICAR FILTROS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

