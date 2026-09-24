'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { categories, filteredTransactions, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#EF4444');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const numBudget = parseFloat(budgetLimit.replace(',', '.'));

    addCategory({
      name,
      type,
      budgetLimit: isNaN(numBudget) ? undefined : numBudget,
      icon,
      color,
    });

    setName('');
    setBudgetLimit('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Planejamento Orçamentário</h2>
          <p className="text-xs text-slate-400">Defina limites de gastos por categoria para não estourar o orçamento do mês.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expenseCategories.map(cat => {
          // Total gasto nesta categoria no mês
          const spent = filteredTransactions
            .filter(t => t.categoryId === cat.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const budget = cat.budgetLimit || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isOverBudget = budget > 0 && spent > budget;

          return (
            <div
              key={cat.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <span className="text-[11px] text-slate-400">
                      Teto: <strong>{budget > 0 ? formatCurrency(budget) : 'Sem teto'}</strong>
                    </span>
                  </div>
                </div>

                {!cat.isDefault && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir categoria ${cat.name}?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barra de Progresso do Orçamento */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Gasto: <strong className="text-white">{formatCurrency(spent)}</strong></span>
                  <span className={`font-semibold ${isOverBudget ? 'text-rose-400 flex items-center gap-1' : 'text-slate-300'}`}>
                    {isOverBudget && <AlertTriangle className="w-3.5 h-3.5" />}
                    {budget > 0 ? `${percentage.toFixed(0)}%` : '-'}
                  </span>
                </div>

                {budget > 0 && (
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage > 100
                          ? 'bg-rose-500'
                          : percentage > 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Nova Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Nova Categoria</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Pets, Farmácia, Academia..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as 'expense' | 'income')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Orçamento Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 500.00"
                    value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
                <div className="flex gap-2">
                  {['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
