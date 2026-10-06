'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category, Transaction, getCategoryBudgetForPeriod } from '@/types/finance';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { MobileCategoryDetailDrawer } from '../dashboard/MobileCategoryDetailDrawer';
import { DesktopCategoryDetailModal } from '../dashboard/DesktopCategoryDetailModal';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import { ArchivedCategoriesModal } from './ArchivedCategoriesModal';
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
  ListFilter,
  Archive,
  MoreVertical,
  GripVertical,
  LayoutGrid,
  StretchHorizontal,
  Copy,
  CalendarSync,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const COLOR_PALETTE = [
  '#EF4444', '#F43F5E', '#EC4899', '#D946EF', '#A855F7', '#8B5CF6',
  '#6366F1', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6', '#10B981',
  '#22C55E', '#84CC16', '#EAB308', '#F59E0B', '#F97316', '#EA580C',
  '#78716C', '#64748B'
];

const AVAILABLE_ICONS = [
  'Tag', 'Utensils', 'Pizza', 'Coffee', 'Beer', 'Apple',
  'Home', 'Zap', 'Flame', 'Droplets', 'Wifi', 'Key',
  'Car', 'Fuel', 'Bus', 'Bike', 'Train', 'Plane',
  'Gamepad2', 'Tv', 'Music', 'Film', 'Camera', 'Ticket',
  'ShoppingBag', 'ShoppingCart', 'Shirt', 'Gift', 'Package', 'Scissors',
  'HeartPulse', 'Heart', 'Dumbbell', 'Pill', 'Stethoscope', 'Smile',
  'GraduationCap', 'BookOpen', 'Briefcase', 'Laptop', 'Building', 'Award',
  'DollarSign', 'CreditCard', 'Wallet', 'Banknote', 'Landmark', 'TrendingUp',
  'PiggyBank', 'Coins', 'Receipt', 'Smartphone', 'Shield', 'Wrench',
  'Sparkles', 'Baby', 'Dog', 'Cat', 'Flower2', 'MoreHorizontal'
];

export const BudgetsView: React.FC = () => {
  const {
    categories,
    filteredTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    setCategoryMonthlyBudget,
    applyDefaultBudgetsToMonth,
    replicateBudgetsToYear,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'budgets' | 'categories'>('budgets');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Modo de visualização de colunas no Desktop (1 coluna ou 2 colunas)
  const [layoutColumns, setLayoutColumns] = useState<'1col' | '2col'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobills_budgets_layout_columns');
      if (saved === '1col' || saved === '2col') return saved;
    }
    return '2col';
  });

  const toggleLayoutColumns = (mode: '1col' | '2col') => {
    setLayoutColumns(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_budgets_layout_columns', mode);
    }
  };

  // Estados de Drag & Drop para Categorias Principais (Pais) e Subcategorias (Filhas)
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const [dragOverParentId, setDragOverParentId] = useState<string | null>(null);

  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);

  // Reordenação de categorias pai
  const handleDropParentCategory = (targetParentId: string) => {
    if (!draggedParentId || draggedParentId === targetParentId) {
      setDraggedParentId(null);
      setDragOverParentId(null);
      return;
    }

    const currentParents = parentCategories.filter(c => c.type === 'expense');
    const sourceIdx = currentParents.findIndex(c => c.id === draggedParentId);
    const targetIdx = currentParents.findIndex(c => c.id === targetParentId);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggedParentId(null);
      setDragOverParentId(null);
      return;
    }

    // Criar nova ordem dos pais
    const newParents = [...currentParents];
    const [moved] = newParents.splice(sourceIdx, 1);
    newParents.splice(targetIdx, 0, moved);

    // Reconstruir o array completo de categorias mantendo as subcategorias logo após cada pai
    const reorderedList: Category[] = [];
    const usedIds = new Set<string>();

    newParents.forEach(p => {
      reorderedList.push(p);
      usedIds.add(p.id);
      const subs = categories.filter(c => c.parentId === p.id);
      subs.forEach(s => {
        reorderedList.push(s);
        usedIds.add(s.id);
      });
    });

    // Inclui categorias restantes (receitas, arquivadas ou órfãs)
    categories.forEach(c => {
      if (!usedIds.has(c.id)) {
        reorderedList.push(c);
      }
    });

    reorderCategories(reorderedList);
    setDraggedParentId(null);
    setDragOverParentId(null);
  };

  // Reordenação de subcategorias
  const handleDropSubCategory = (parentCatId: string, targetSubId: string) => {
    if (!draggedSubId || draggedSubId === targetSubId) {
      setDraggedSubId(null);
      setDragOverSubId(null);
      return;
    }

    const currentSubs = categories.filter(c => c.parentId === parentCatId);
    const sourceIdx = currentSubs.findIndex(s => s.id === draggedSubId);
    const targetIdx = currentSubs.findIndex(s => s.id === targetSubId);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggedSubId(null);
      setDragOverSubId(null);
      return;
    }

    const newSubs = [...currentSubs];
    const [moved] = newSubs.splice(sourceIdx, 1);
    newSubs.splice(targetIdx, 0, moved);

    // Reconstruir a lista geral preservando a nova ordem interna das subcategorias
    const reorderedList: Category[] = [];
    const newSubIds = new Set(newSubs.map(s => s.id));

    categories.forEach(c => {
      if (c.id === parentCatId) {
        reorderedList.push(c);
        newSubs.forEach(s => reorderedList.push(s));
      } else if (!newSubIds.has(c.id)) {
        reorderedList.push(c);
      }
    });

    reorderCategories(reorderedList);
    setDraggedSubId(null);
    setDragOverSubId(null);
  };

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

  // Estado para Modal de Categorias Arquivadas
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  // Estado para Visualização Detalhada dos Itens/Transações da Subcategoria (Mobile e Desktop)
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<Category | null>(null);

  // Estado para Edição da Transação a partir do modal/drawer de detalhe
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Estado para Edição Rápida de Orçamento do Mês Atual
  const [editingMonthlyBudgetCat, setEditingMonthlyBudgetCat] = useState<Category | null>(null);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');

  // Modais de Confirmação para Ações em Lote de Orçamentos
  const [isApplyDefaultsConfirmOpen, setIsApplyDefaultsConfirmOpen] = useState(false);
  const [isReplicateYearConfirmOpen, setIsReplicateYearConfirmOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Categorias expandidas na visualização de orçamento
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Separação de Categorias Ativas e Arquivadas
  const activeCategories = categories.filter(c => !c.isArchived);
  const archivedCategories = categories.filter(c => !!c.isArchived);

  // Separação de Categorias Principais (Pais) e Subcategorias ATIVAS
  const parentCategories = activeCategories.filter(c => !c.parentId);
  const getSubcategories = (parentCatId: string) => activeCategories.filter(c => c.parentId === parentCatId);

  // Categorias elegíveis para serem Pai no formulário
  const eligibleParentCategories = activeCategories.filter(c => !c.parentId && c.type === type && (!editingCategory || c.id !== editingCategory.id));

  // Handlers para Arquivar / Desarquivar
  const handleArchiveCategory = (cat: Category) => {
    // Se for categoria pai, arquiva ela e suas subcategorias
    updateCategory(cat.id, { isArchived: true });
    if (!cat.parentId) {
      const subs = categories.filter(c => c.parentId === cat.id);
      subs.forEach(s => updateCategory(s.id, { isArchived: true }));
    }
    if (selectedCategoryForDetails?.id === cat.id) {
      setSelectedCategoryForDetails(null);
    }
  };

  const handleUnarchiveCategory = (catId: string) => {
    const target = categories.find(c => c.id === catId);
    if (!target) return;
    updateCategory(catId, { isArchived: false });
    // Se for subcategoria, certifica-se de desarquivar também a pai se estiver arquivada
    if (target.parentId) {
      updateCategory(target.parentId, { isArchived: false });
    }
  };

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

  // Cálculo de teto efetivo da categoria pai no período selecionado (se as subcategorias tiverem tetos preenchidos, soma-os; senão usa o teto da pai)
  const getEffectiveCategoryBudget = (cat: Category) => {
    const subs = getSubcategories(cat.id);
    let subsSum = 0;
    let anySubHasCustom = false;
    let anySubHasBudget = false;

    subs.forEach(s => {
      const budgetInfo = getCategoryBudgetForPeriod(s, selectedYear, selectedMonth);
      if (budgetInfo.amount > 0) {
        subsSum += budgetInfo.amount;
        anySubHasBudget = true;
      }
      if (budgetInfo.isCustomMonth) {
        anySubHasCustom = true;
      }
    });

    if (anySubHasBudget && subsSum > 0) {
      return {
        amount: subsSum,
        isCustomMonth: anySubHasCustom,
        isSummedFromSubs: true,
      };
    }

    const parentBudget = getCategoryBudgetForPeriod(cat, selectedYear, selectedMonth);
    return {
      amount: parentBudget.amount,
      isCustomMonth: parentBudget.isCustomMonth,
      isSummedFromSubs: false,
    };
  };

  // Abrir modal de edição rápida de teto do mês
  const handleOpenMonthlyBudgetEdit = (cat: Category) => {
    setEditingMonthlyBudgetCat(cat);
    const budgetInfo = getCategoryBudgetForPeriod(cat, selectedYear, selectedMonth);
    setMonthlyBudgetInput(budgetInfo.amount > 0 ? String(budgetInfo.amount) : '');
  };

  // Salvar teto específico deste mês para a categoria
  const handleSaveMonthlyBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonthlyBudgetCat) return;

    const parsed = monthlyBudgetInput ? parseFloat(monthlyBudgetInput.replace(',', '.')) : 0;
    const finalAmount = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setCategoryMonthlyBudget(editingMonthlyBudgetCat.id, selectedYear, selectedMonth, finalAmount);
    setEditingMonthlyBudgetCat(null);
    showToast(`Orçamento de "${editingMonthlyBudgetCat.name}" atualizado para ${getMonthName(selectedMonth)}/${selectedYear}!`);
  };

  // Restaurar para teto padrão nesta categoria neste mês
  const handleResetToDefaultBudget = () => {
    if (!editingMonthlyBudgetCat) return;
    setCategoryMonthlyBudget(editingMonthlyBudgetCat.id, selectedYear, selectedMonth, 0);
    setEditingMonthlyBudgetCat(null);
    showToast(`Teto de "${editingMonthlyBudgetCat.name}" voltou ao valor padrão das configurações.`);
  };

  // Ação em Lote: Aplicar tetos padrão a este mês
  const handleConfirmApplyDefaults = () => {
    applyDefaultBudgetsToMonth(selectedYear, selectedMonth);
    setIsApplyDefaultsConfirmOpen(false);
    showToast(`Tetos padrão preenchidos com sucesso para ${getMonthName(selectedMonth)}/${selectedYear}!`);
  };

  // Ação em Lote: Replicar orçamentos deste mês para todos os meses do ano selecionado
  const handleConfirmReplicateYear = () => {
    replicateBudgetsToYear(selectedYear, selectedMonth, selectedYear);
    setIsReplicateYearConfirmOpen(false);
    showToast(`Orçamentos de ${getMonthName(selectedMonth)} replicados para todos os meses de ${selectedYear}!`);
  };

  // Categorias de despesa para o planejamento orçamentário
  const budgetExpenseCategories = parentCategories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header com Alternador de Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {activeTab === 'budgets' ? (
              <>
                <PieChart className="w-5 h-5 text-emerald-400" />
                <span>Orçamentos</span>
              </>
            ) : (
              <>
                <FolderTree className="w-5 h-5 text-emerald-400" />
                <span>Categorias</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            {activeTab === 'budgets'
              ? 'Defina e acompanhe tetos de gastos mensais por categoria.'
              : 'Gerencie categorias, subcategorias, ícones e cores do sistema.'}
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  Período: <strong className="text-emerald-400">{getMonthName(selectedMonth)} de {selectedYear}</strong>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                  {budgetExpenseCategories.length} categorias de despesa
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Você pode definir orçamentos específicos para cada mês ou reutilizar os tetos padrão cadastrados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botão Copiar Tetos Padrão */}
              <button
                type="button"
                onClick={() => setIsApplyDefaultsConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                title={`Preenche todos os orçamentos de ${getMonthName(selectedMonth)}/${selectedYear} com os valores padrão cadastrados nas Categorias`}
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preencher Tetos Padrão</span>
              </button>

              {/* Botão Replicar para o Ano Todo */}
              <button
                type="button"
                onClick={() => setIsReplicateYearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 rounded-xl text-xs font-semibold border border-purple-500/40 transition-all cursor-pointer shadow-sm"
                title={`Copia os orçamentos definidos em ${getMonthName(selectedMonth)} para todos os 12 meses de ${selectedYear}`}
              >
                <CalendarSync className="w-3.5 h-3.5 text-purple-400" />
                <span>Replicar para Ano {selectedYear}</span>
              </button>

              {/* Alternador de Layout de Colunas (Apenas Desktop) */}
              <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => toggleLayoutColumns('1col')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    layoutColumns === '1col'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Exibir 1 card por linha (1 coluna inteira)"
                >
                  <StretchHorizontal className="w-4 h-4" />
                  <span className="text-[11px]">1 Coluna</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayoutColumns('2col')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    layoutColumns === '2col'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Exibir em 2 colunas lado a lado"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-[11px]">2 Colunas</span>
                </button>
              </div>

              {archivedCategories.length > 0 && (
                <button
                  onClick={() => setIsArchivedModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
                  title="Ver categorias e subcategorias arquivadas"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Arquivadas ({archivedCategories.length})</span>
                </button>
              )}

              <button
                onClick={() => handleOpenCreate(undefined, 'expense')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Categoria</span>
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${layoutColumns === '1col' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {budgetExpenseCategories.map(cat => {
              const subs = getSubcategories(cat.id);
              const totalSpent = calculateCategorySpent(cat);
              const budgetInfo = getEffectiveCategoryBudget(cat);
              const budget = budgetInfo.amount;
              const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
              const isOverBudget = budget > 0 && totalSpent > budget;
              const isExpanded = Boolean(expandedCats[cat.id]);
              const subsWithBudget = subs.filter(s => {
                const sBudget = getCategoryBudgetForPeriod(s, selectedYear, selectedMonth);
                return sBudget.amount > 0;
              });
              const isSummedFromSubs = budgetInfo.isSummedFromSubs;
              const isDragging = draggedParentId === cat.id;
              const isOver = dragOverParentId === cat.id;

              return (
                <div
                  key={cat.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedParentId && draggedParentId !== cat.id) {
                      setDragOverParentId(cat.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverParentId === cat.id) setDragOverParentId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropParentCategory(cat.id);
                  }}
                  className={`bg-slate-900/60 border p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-all ${
                    isOver
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01]'
                      : isDragging
                      ? 'border-dashed border-slate-600 opacity-40'
                      : 'border-slate-800 hover:border-slate-700/80'
                  }`}
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
                            {budgetInfo.isCustomMonth ? (
                              <span
                                className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1"
                                title="Este valor foi definido especificamente para este mês"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                Mês {getMonthName(selectedMonth).slice(0, 3)}
                              </span>
                            ) : budget > 0 ? (
                              <span
                                className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-medium"
                                title="Usando valor padrão recorrente da categoria"
                              >
                                Teto padrão
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span>Teto:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenMonthlyBudgetEdit(cat)}
                              className="font-bold text-slate-200 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
                              title="Clique para ajustar o teto deste mês"
                            >
                              {budget > 0 ? formatCurrency(budget) : 'Sem teto definido (clique p/ definir)'}
                            </button>
                            {isSummedFromSubs && (
                              <span className="text-[9px] text-emerald-400/90 font-medium ml-0.5">
                                (soma subs)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Botão de Edição Rápida do Teto Mensal */}
                        <button
                          type="button"
                          onClick={() => handleOpenMonthlyBudgetEdit(cat)}
                          title="Alterar teto para este mês"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Alça de Arrastar Categoria Pai */}
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedParentId(cat.id);
                          }}
                          onDragEnd={() => {
                            setDraggedParentId(null);
                            setDragOverParentId(null);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
                          title="Arrastar para reordenar categoria"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Opções da Categoria"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
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
                              percentage > 150
                                ? 'bg-rose-500'
                                : percentage > 100
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
                            const subBudgetInfo = getCategoryBudgetForPeriod(sub, selectedYear, selectedMonth);
                            const subBudget = subBudgetInfo.amount;
                            const subPercent = subBudget > 0 ? (subSpent / subBudget) * 100 : 0;
                            const isSubOver = subBudget > 0 && subSpent > subBudget;
                            const isSubDragging = draggedSubId === sub.id;
                            const isSubOverDrag = dragOverSubId === sub.id;

                            return (
                              <div
                                key={sub.id}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (draggedSubId && draggedSubId !== sub.id) {
                                    setDragOverSubId(sub.id);
                                  }
                                }}
                                onDragLeave={() => {
                                  if (dragOverSubId === sub.id) setDragOverSubId(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDropSubCategory(cat.id, sub.id);
                                }}
                                onClick={() => setSelectedCategoryForDetails(sub)}
                                className={`p-2.5 bg-slate-950/60 hover:bg-slate-900/90 border rounded-xl text-xs space-y-1.5 transition-all cursor-pointer group select-none ${
                                  isSubOverDrag
                                    ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-slate-900'
                                    : isSubDragging
                                    ? 'border-dashed border-slate-600 opacity-40'
                                    : 'border-slate-800/40 hover:border-slate-700/70'
                                }`}
                                title="Clique para ver os lançamentos desta subcategoria"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {/* Alça de Arrastar Subcategoria */}
                                    <div
                                      draggable
                                      onClick={(e) => e.stopPropagation()}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        setDraggedSubId(sub.id);
                                      }}
                                      onDragEnd={() => {
                                        setDraggedSubId(null);
                                        setDragOverSubId(null);
                                      }}
                                      className="p-1 -ml-1 text-slate-600 hover:text-slate-300 rounded cursor-grab active:cursor-grabbing transition-colors"
                                      title="Arrastar para reordenar subcategoria"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    <div
                                      className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                                      style={{ backgroundColor: sub.color }}
                                    />
                                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                                      {sub.name}
                                    </span>
                                    {subBudget > 0 ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenMonthlyBudgetEdit(sub);
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-emerald-400 font-normal shrink-0 transition-colors"
                                        title="Clique para alterar o teto da subcategoria deste mês"
                                      >
                                        ({formatCurrency(subBudget)})
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenMonthlyBudgetEdit(sub);
                                        }}
                                        className="text-[10px] text-slate-600 hover:text-emerald-400 font-normal shrink-0 transition-colors"
                                        title="Definir teto para esta subcategoria neste mês"
                                      >
                                        + teto
                                      </button>
                                    )}
                                    {subBudgetInfo.isCustomMonth && (
                                      <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded font-medium">
                                        mês
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`font-semibold ${isSubOver ? 'text-rose-400' : 'text-white'}`}>
                                      {formatCurrency(subSpent)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenMonthlyBudgetEdit(sub);
                                      }}
                                      className="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="Ajustar teto deste mês"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(sub);
                                      }}
                                      className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="Opções da Subcategoria"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {subBudget > 0 && (
                                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden p-0.2 border border-slate-800">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        subPercent > 150
                                          ? 'bg-rose-500'
                                          : subPercent > 100
                                          ? 'bg-amber-400'
                                          : 'bg-emerald-400'
                                      }`}
                                      style={{ width: `${Math.min(100, subPercent)}%` }}
                                    />
                                  </div>
                                )}
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
            <div className="flex items-center gap-2">
              {archivedCategories.length > 0 && (
                <button
                  onClick={() => setIsArchivedModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
                  title="Ver categorias arquivadas"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Arquivadas ({archivedCategories.length})</span>
                </button>
              )}
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
                          title="Opções da Categoria"
                        >
                          <MoreVertical className="w-4 h-4" />
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
                              {sub.budgetLimit && sub.budgetLimit > 0 && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  • Teto: {formatCurrency(sub.budgetLimit)}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleOpenEdit(sub)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Opções da Subcategoria"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
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
              <div className="flex items-center gap-1">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      handleArchiveCategory(editingCategory);
                      setIsFormModalOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title={editingCategory.isArchived ? 'Desarquivar Categoria' : 'Arquivar Categoria'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                    <option value="">Nenhuma</option>
                    {eligibleParentCategories.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teto Orçamentário (Para Categoria Principal ou Subcategoria de Despesa) */}
              {type === 'expense' && (
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
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
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
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingCategory;
                      setIsFormModalOpen(false);
                      setDeletingCategory(toDelete);
                    }}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
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

      {/* DETALHAMENTO DE ITENS DA SUBCATEGORIA (MOBILE DRAWER) */}
      {selectedCategoryForDetails && (
        <div className="block sm:hidden">
          <MobileCategoryDetailDrawer
            isOpen={Boolean(selectedCategoryForDetails)}
            onClose={() => setSelectedCategoryForDetails(null)}
            category={selectedCategoryForDetails}
            transactions={filteredTransactions.filter(
              t => t.categoryId === selectedCategoryForDetails.id && t.type === 'expense'
            )}
            onEditTransaction={setEditingTransaction}
          />
        </div>
      )}

      {/* DETALHAMENTO DE ITENS DA SUBCATEGORIA (DESKTOP MODAL) */}
      {selectedCategoryForDetails && (
        <div className="hidden sm:block">
          <DesktopCategoryDetailModal
            isOpen={Boolean(selectedCategoryForDetails)}
            onClose={() => setSelectedCategoryForDetails(null)}
            category={selectedCategoryForDetails}
            transactions={filteredTransactions.filter(
              t => t.categoryId === selectedCategoryForDetails.id && t.type === 'expense'
            )}
            onEditTransaction={setEditingTransaction}
          />
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE TRANSAÇÃO */}
      {editingTransaction && (
        <NewTransactionModal
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}

      {/* MODAL DE CATEGORIAS ARQUIVADAS */}
      <ArchivedCategoriesModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        archivedCategories={archivedCategories}
        allCategories={categories}
        onUnarchive={handleUnarchiveCategory}
        onDelete={(cat) => setDeletingCategory(cat)}
      />

      {/* MODAL DE EDIÇÃO DE TETO ESPECÍFICO DO MÊS */}
      {editingMonthlyBudgetCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs shadow-md"
                  style={{ backgroundColor: editingMonthlyBudgetCat.color }}
                >
                  <CategoryIcon name={editingMonthlyBudgetCat.icon} size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    Teto para {getMonthName(selectedMonth)}/{selectedYear}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {editingMonthlyBudgetCat.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMonthlyBudgetCat(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor do Teto para este mês (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  placeholder="Ex: 1200.00"
                  value={monthlyBudgetInput}
                  onChange={e => setMonthlyBudgetInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Teto padrão cadastrado na categoria: <strong className="text-slate-300">{editingMonthlyBudgetCat.budgetLimit ? formatCurrency(editingMonthlyBudgetCat.budgetLimit) : 'Não definido'}</strong>
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Teto deste Mês</span>
                </button>

                {editingMonthlyBudgetCat.monthlyBudgets?.[`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`] !== undefined && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultBudget}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-[11px] transition-colors cursor-pointer"
                  >
                    Restaurar para Teto Padrão
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO: APLICAR TETOS PADRÃO NESTE MÊS */}
      <ConfirmModal
        isOpen={isApplyDefaultsConfirmOpen}
        title={`Preencher Tetos Padrão em ${getMonthName(selectedMonth)}/${selectedYear}?`}
        message="Esta ação irá preencher o orçamento de todas as categorias de despesa deste mês utilizando o teto padrão cadastrado em cada uma delas na aba Gerenciar Categorias."
        variant="warning"
        confirmLabel="Sim, Preencher Tetos"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmApplyDefaults}
        onCancel={() => setIsApplyDefaultsConfirmOpen(false)}
      />

      {/* CONFIRMAÇÃO: REPLICAR ORÇAMENTOS PARA O ANO INTEIRO */}
      <ConfirmModal
        isOpen={isReplicateYearConfirmOpen}
        title={`Replicar Orçamentos para Todo o Ano de ${selectedYear}?`}
        message={`Esta ação irá copiar os tetos de gastos atualmente definidos em ${getMonthName(selectedMonth)}/${selectedYear} para TODOS os 12 meses do ano de ${selectedYear}. Deseja continuar?`}
        variant="primary"
        confirmLabel="Sim, Replicar para o Ano"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmReplicateYear}
        onCancel={() => setIsReplicateYearConfirmOpen(false)}
      />

      {/* FEEDBACK TOAST */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-slate-200">{feedbackToast}</span>
        </div>
      )}
    </div>
  );
};
