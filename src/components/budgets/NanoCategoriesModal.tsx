'use client';

import React, { useState } from 'react';
import { Category, NanoCategory } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, Plus, Edit2, Trash2, Check, AlertCircle, DollarSign } from 'lucide-react';

interface NanoCategoriesModalProps {
  isOpen: boolean;
  subcategory: Category | null;
  onClose: () => void;
  onUpdateSubcategory: (subcategoryId: string, nanoCategories: NanoCategory[]) => void;
}

export const NanoCategoriesModal: React.FC<NanoCategoriesModalProps> = ({
  isOpen,
  subcategory,
  onClose,
  onUpdateSubcategory,
}) => {
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !subcategory) return null;

  const currentNanos = subcategory.nanoCategories || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('Informe o nome da nano-categoria.');
      return;
    }

    if (currentNanos.some(n => n.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage('Já existe uma nano-categoria com este nome.');
      return;
    }

    const budgetVal = newBudget.trim() ? parseFloat(newBudget.replace(',', '.')) : undefined;

    const newNano: NanoCategory = {
      id: crypto.randomUUID(),
      name: trimmed,
      budgetLimit: budgetVal && !isNaN(budgetVal) && budgetVal > 0 ? budgetVal : undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [...currentNanos, newNano];
    onUpdateSubcategory(subcategory.id, updated);
    setNewName('');
    setNewBudget('');
    setErrorMessage('');
  };

  const handleStartEdit = (nano: NanoCategory) => {
    setEditingId(nano.id);
    setEditName(nano.name);
    setEditBudget(nano.budgetLimit ? nano.budgetLimit.toString() : '');
    setDeletingId(null);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    const budgetVal = editBudget.trim() ? parseFloat(editBudget.replace(',', '.')) : undefined;

    const updated = currentNanos.map(n => {
      if (n.id === id) {
        return {
          ...n,
          name: trimmed,
          budgetLimit: budgetVal && !isNaN(budgetVal) && budgetVal > 0 ? budgetVal : undefined,
        };
      }
      return n;
    });

    onUpdateSubcategory(subcategory.id, updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = currentNanos.filter(n => n.id !== id);
    onUpdateSubcategory(subcategory.id, updated);
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: subcategory.color }}
            >
              <CategoryIcon name={subcategory.icon} size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                Nano-Categorias
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {subcategory.name}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Despesas frequentes agrupadas no planejamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form para adicionar nova */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-950/20 border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7">
              <label className="block text-[11px] text-slate-400 mb-1">Nome da Despesa Frequente</label>
              <input
                type="text"
                placeholder="Ex: Pão, Gasolina, Lanche..."
                value={newName}
                onChange={e => {
                  setNewName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-[11px] text-slate-400 mb-1">Teto Mensal (R$) (Opcional)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Nano-Categoria</span>
            </button>
          </div>
        </form>

        {/* Lista de Nano-categorias */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentNanos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p>Nenhuma nano-categoria cadastrada para {subcategory.name}.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Adicione itens que você compra várias vezes no mês para agrupar automaticamente.
              </p>
            </div>
          ) : (
            currentNanos.map(nano => {
              const isEditing = editingId === nano.id;
              const isDeleting = deletingId === nano.id;

              if (isEditing) {
                return (
                  <div
                    key={nano.id}
                    className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                          placeholder="Nome"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={editBudget}
                          onChange={e => setEditBudget(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                          placeholder="Teto (R$)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(nano.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Salvar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={nano.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-slate-200">{nano.name}</span>
                    {nano.budgetLimit && nano.budgetLimit > 0 ? (
                      <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                        Teto: {formatCurrency(nano.budgetLimit)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Sem teto</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-950/30 border border-rose-800/50 rounded-lg p-1 animate-in fade-in duration-150">
                        <span className="text-[10px] text-rose-300 px-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(nano.id)}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(nano)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Editar Nano-Categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(nano.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Excluir Nano-Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

