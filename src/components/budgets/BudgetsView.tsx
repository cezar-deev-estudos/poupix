'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FolderTree,
  PieChart,
  Tag,
  Check,
  X,
  Layers,
} from 'lucide-react';

const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

const AVAILABLE_ICONS = [
  'Tag', 'Utensils', 'Home', 'Car', 'Gamepad2', 'Heart',
  'GraduationCap', 'ShoppingBag', 'Tv', 'DollarSign', 'TrendingUp',
  'Briefcase', 'Coffee', 'Plane', 'Smartphone', 'Zap', 'Shield', 'Gift'
];

export const BudgetsView: React.FC = () => {
  const { categories, filteredTransactions, addCategory, updateCategory, deleteCategory } = useFinance();

  const [activeTab, setActiveTab] = useState<'budgets' | 'categories'>('budgets');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Estado para Modal de Criação / Edição de Categoria
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [parentId, setParentId] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#10B981');

  // Estado para Modal de Exclusão
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Categorias expandidas na visualização de orçamento
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Separação de Categorias Principais (Pais) e Subcategorias
  const parentCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentCatId: string) => categories.filter(c => c.parentId === parentCatId);

  // Categorias elegíveis para serem Pai no formulário
  const eligibleParentCategories = categories.filter(c => !c.parentId && c.type === type && (!editingCategory || c.id !== editingCategory.id));

  // Abrir modal de criação
  const handleOpenCreate = (suggestedParentId?: string, suggestedType?: 'expense' | 'income') => {
    setEditingCategory(null);
    setName('');
    setType(suggestedType || 'expense');
    setParentId(suggestedParentId || '');
    setBudgetLimit('');
    setIcon('Tag');
    setColor('#10B981');
    setIsFormModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setParentId(cat.parentId || '');
    setBudgetLimit(cat.budgetLimit ? String(cat.budgetLimit) : '');
    setIcon(cat.icon);
    setColor(cat.color);
    setIsFormModalOpen(true);
  };

  // Salvar formulário
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBudget = budgetLimit ? parseFloat(budgetLimit.replace(',', '.')) : undefined;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        budgetLimit: isNaN(Number(numBudget)) ? undefined : numBudget,
        icon,
        color,
      });
    } else {
      addCategory({
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        budgetLimit: isNaN(Number(numBudget)) ? undefined : numBudget,
        icon,
        color,
      });
    }

    setIsFormModalOpen(false);
  };

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  // Cálculo de gastos para uma categoria (incluindo a soma de suas subcategorias)
  const calculateCategorySpent = (cat: Category) => {
    const subs = getSubcategories(cat.id);
    const subIds = subs.map(s => s.id);
    const allIds = [cat.id, ...subIds];

    return filteredTransactions
      .filter(t => allIds.includes(t.categoryId) && t.type === cat.type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Categorias de despesa para o planejamento orçamentário
  const budgetExpenseCategories = parentCategories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header com Alternador de Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>Categorias & Planejamento Orçamentário</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie suas categorias, crie subcategorias e defina tetos de gastos mensais.
          </p>
        </div>

        {/* Abas no Topo */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'budgets'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Orçamentos do Mês</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Gerenciar Categorias</span>
          </button>
        </div>
      </div>

      {/* ABA 1: PLANEJAMENTO ORÇAMENTÁRIO */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Acompanhamento de consumo por categoria e subcategorias no período selecionado.
            </span>
            <button
              onClick={() => handleOpenCreate(undefined, 'expense')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Teto / Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetExpenseCategories.map(cat => {
              const subs = getSubcategories(cat.id);
              const totalSpent = calculateCategorySpent(cat);
              const budget = cat.budgetLimit || 0;
              const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
              const isOverBudget = budget > 0 && totalSpent > budget;
              const isExpanded = Boolean(expandedCats[cat.id]);

              return (
                <div
                  key={cat.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Linha Superior: Ícone, Nome, Teto e Ações */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                            {subs.length > 0 && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
                                {subs.length} sub
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Teto: <strong className="text-slate-200">{budget > 0 ? formatCurrency(budget) : 'Sem teto definido'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Editar Categoria"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          title="Excluir Categoria"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso Consolidada */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Gasto Total: <strong className="text-white">{formatCurrency(totalSpent)}</strong>
                        </span>
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
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subcategorias Aninhadas */}
                  {subs.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 cursor-pointer"
                      >
                        <span className="font-semibold flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          Ver Detalhamento por Subcategorias ({subs.length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isExpanded ? 'Ocultar' : 'Expandir'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 mt-2 pl-2 border-l-2 border-slate-800">
                          {subs.map(sub => {
                            const subSpent = filteredTransactions
                              .filter(t => t.categoryId === sub.id && t.type === 'expense')
                              .reduce((sum, t) => sum + t.amount, 0);

                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: sub.color }}
                                  />
                                  <span className="font-medium text-slate-300">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{formatCurrency(subSpent)}</span>
                                  <button
                                    onClick={() => handleOpenEdit(sub)}
                                    className="text-slate-500 hover:text-white p-1"
                                    title="Editar Subcategoria"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: GERENCIAMENTO DE CATEGORIAS & SUBCATEGORIAS */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            {/* Filtro por Tipo */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({categories.length})
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Despesas ({categories.filter(c => c.type === 'expense').length})
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Receitas ({categories.filter(c => c.type === 'income').length})
              </button>
            </div>

            {/* Botão de Adicionar Categoria */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenCreate()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Categoria</span>
              </button>
            </div>
          </div>

          {/* Lista de Categorias Pais e Subcategorias */}
          <div className="space-y-3">
            {parentCategories
              .filter(cat => filterType === 'all' || cat.type === filterType)
              .map(parentCat => {
                const subs = getSubcategories(parentCat.id);

                return (
                  <div
                    key={parentCat.id}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-lg"
                  >
                    {/* Linha da Categoria Pai */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
                          style={{ backgroundColor: parentCat.color }}
                        >
                          <CategoryIcon name={parentCat.icon} size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{parentCat.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                parentCat.type === 'expense'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {parentCat.type === 'expense' ? 'Despesa' : 'Receita'}
                            </span>
                          </div>
                          {parentCat.budgetLimit && parentCat.budgetLimit > 0 && (
                            <span className="text-[11px] text-slate-400 block">
                              Teto Mensal: {formatCurrency(parentCat.budgetLimit)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Botão para Adicionar Subcategoria Rápido */}
                        <button
                          onClick={() => handleOpenCreate(parentCat.id, parentCat.type)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Subcategoria</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(parentCat)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingCategory(parentCat)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de Subcategorias Aninhadas */}
                    {subs.length > 0 && (
                      <div className="pl-6 border-l-2 border-slate-800 space-y-1.5">
                        {subs.map(sub => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px]"
                                style={{ backgroundColor: sub.color }}
                              >
                                <CategoryIcon name={sub.icon} size={12} />
                              </div>
                              <span className="font-semibold text-slate-200 text-xs">{sub.name}</span>
                              <span className="text-[10px] text-slate-500">(Subcategoria)</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(sub)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Editar Subcategoria"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCategory(sub)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Subcategoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CATEGORIA E SUBCATEGORIA */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{editingCategory ? 'Editar Categoria' : parentId ? 'Nova Subcategoria' : 'Nova Categoria'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Categoria / Subcategoria</label>
                <input
                  type="text"
                  placeholder="Ex: Uber, Mercado, Farmácia..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tipo (Despesa / Receita) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                  <select
                    value={type}
                    disabled={Boolean(parentId)}
                    onChange={e => setType(e.target.value as 'expense' | 'income')}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria Pai (Opcional)</label>
                  <select
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {eligibleParentCategories.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teto Orçamentário (Apenas para Categoria Principal de Despesa) */}
              {type === 'expense' && !parentId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teto Orçamentário Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1500.00 (Opcional)"
                    value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Seletor de Ícone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ícone</label>
                <div className="grid grid-cols-6 gap-2 max-h-28 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {AVAILABLE_ICONS.map(ic => {
                    const isSelected = icon === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <CategoryIcon name={ic} size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Cores */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cor de Destaque</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"? ${
          deletingCategory && getSubcategories(deletingCategory.id).length > 0
            ? 'As subcategorias vinculadas também serão afetadas.'
            : ''
        }`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
};
