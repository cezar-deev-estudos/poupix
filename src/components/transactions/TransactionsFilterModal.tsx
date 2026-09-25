'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { X, Check } from 'lucide-react';

export interface AdvancedFilterState {
  startDate: string;
  endDate: string;
  categoryId: string;
  accountId: string;
  tag: string;
  status: 'all' | 'paid' | 'pending';
  type: 'all' | 'expense' | 'income' | 'transfer';
  saveFilter: boolean;
}

interface TransactionsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: AdvancedFilterState;
  onApplyFilter: (filter: AdvancedFilterState) => void;
  onResetFilter: () => void;
}

export const TransactionsFilterModal: React.FC<TransactionsFilterModalProps> = ({
  isOpen,
  onClose,
  filter,
  onApplyFilter,
  onResetFilter,
}) => {
  const { categories, accounts, tags } = useFinance();
  const [activeTab, setActiveTab] = useState<'new' | 'saved'>('new');
  const [currentFilter, setCurrentFilter] = useState<AdvancedFilterState>(filter);

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
            FILTROS SALVOS
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

            {/* Categorias */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Categorias</label>
              <select
                value={currentFilter.categoryId}
                onChange={(e) => setCurrentFilter((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full bg-[#181b24] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
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

            {/* Salvar filtro personalizado */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-300">Salvar filtro personalizado</span>
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
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            <p>Nenhum filtro salvo no momento.</p>
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

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            APLICAR FILTROS
          </button>
        </div>
      </div>
    </div>
  );
};
