'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category, Transaction, getCategoryBudgetForPeriod } from '@/types/finance';
import { formatCurrency, getMonthName, formatDateBR } from '@/lib/utils';
import { getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { MobileCategoryDetailDrawer } from '../dashboard/MobileCategoryDetailDrawer';
import { DesktopCategoryDetailModal } from '../dashboard/DesktopCategoryDetailModal';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import { ArchivedCategoriesModal } from './ArchivedCategoriesModal';
import { MonthSelector } from '../layout/MonthSelector';
import {
  Plus,
  Edit2,
  Edit3,
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
  Sparkles,
  CheckCircle2,
  CreditCard,
  ArrowUp,
  ArrowDown,
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
    updateTransaction,
    accounts,
    creditCards,
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

  // Mover categoria pai (cima / baixo) no mobile
  const handleMoveParentCategory = (catId: string, direction: 'up' | 'down') => {
    const currentParents = parentCategories.filter(c => c.type === 'expense');
    const idx = currentParents.findIndex(c => c.id === catId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentParents.length) return;

    const newParents = [...currentParents];
    const [moved] = newParents.splice(idx, 1);
    newParents.splice(targetIdx, 0, moved);

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

    categories.forEach(c => {
      if (!usedIds.has(c.id)) {
        reorderedList.push(c);
      }
    });

    reorderCategories(reorderedList);
  };

  // Mover subcategoria (cima / baixo) no mobile
  const handleMoveSubCategory = (parentCatId: string, subId: string, direction: 'up' | 'down') => {
    const currentSubs = categories.filter(c => c.parentId === parentCatId);
    const idx = currentSubs.findIndex(s => s.id === subId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentSubs.length) return;

    const newSubs = [...currentSubs];
    const [moved] = newSubs.splice(idx, 1);
    newSubs.splice(targetIdx, 0, moved);

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
  };

  // Estado para exibir controles de seta sob demanda no mobile (ao apertar e segurar)
  const [activeMoveControlsId, setActiveMoveControlsId] = useState<string | null>(null);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (id: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveMoveControlsId(prev => (prev === id ? null : id));
    }, 400);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Touch Drag & Drop para Mobile
  const touchParentTargetRef = React.useRef<string | null>(null);
  const touchSubTargetRef = React.useRef<{ parentId: string; subId: string } | null>(null);

  const handleTouchStartParent = (catId: string) => {
    startLongPress(catId);
    setDraggedParentId(catId);
    touchParentTargetRef.current = null;
  };

  const handleTouchMoveParent = (e: React.TouchEvent) => {
    cancelLongPress();
    if (!draggedParentId) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const parentCard = element?.closest('[data-parent-card-id]');
    if (parentCard) {
      const targetId = parentCard.getAttribute('data-parent-card-id');
      if (targetId && targetId !== draggedParentId) {
        setDragOverParentId(targetId);
        touchParentTargetRef.current = targetId;
        return;
      }
    }
    setDragOverParentId(null);
    touchParentTargetRef.current = null;
  };

  const handleTouchEndParent = () => {
    cancelLongPress();
    if (draggedParentId && touchParentTargetRef.current) {
      handleDropParentCategory(touchParentTargetRef.current);
    }
    setDraggedParentId(null);
    setDragOverParentId(null);
    touchParentTargetRef.current = null;
  };

  const handleTouchStartSub = (subId: string) => {
    startLongPress(subId);
    setDraggedSubId(subId);
    touchSubTargetRef.current = null;
  };

  const handleTouchMoveSub = (parentId: string, e: React.TouchEvent) => {
    cancelLongPress();
    if (!draggedSubId) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const subCard = element?.closest('[data-sub-card-id]');
    if (subCard) {
      const targetSubId = subCard.getAttribute('data-sub-card-id');
      const targetParentId = subCard.getAttribute('data-sub-parent-id');
      if (targetSubId && targetParentId === parentId && targetSubId !== draggedSubId) {
        setDragOverSubId(targetSubId);
        touchSubTargetRef.current = { parentId, subId: targetSubId };
        return;
      }
    }
    setDragOverSubId(null);
    touchSubTargetRef.current = null;
  };

  const handleTouchEndSub = () => {
    cancelLongPress();
    if (draggedSubId && touchSubTargetRef.current) {
      handleDropSubCategory(touchSubTargetRef.current.parentId, touchSubTargetRef.current.subId);
    }
    setDraggedSubId(null);
    setDragOverSubId(null);
    touchSubTargetRef.current = null;
  };

  // Estado para Modal de Criação / Edição de Categoria
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [parentId, setParentId] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetMode, setBudgetMode] = useState<'default' | 'month'>('default');
  const [monthBudgetLimit, setMonthBudgetLimit] = useState('');
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

  // Estado de feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Categorias e Subcategorias expandidas na visualização de orçamento
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleExpandSub = (subId: string) => {
    setExpandedSubs(prev => ({ ...prev, [subId]: !prev[subId] }));
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
    setMonthBudgetLimit('');
    setBudgetMode('default');
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

    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const customForMonth = cat.monthlyBudgets && typeof cat.monthlyBudgets[monthKey] === 'number';
    if (customForMonth) {
      setBudgetMode('month');
      setMonthBudgetLimit(String(cat.monthlyBudgets![monthKey]));
    } else {
      setBudgetMode('default');
      setMonthBudgetLimit('');
    }

    setIcon(cat.icon);
    setColor(cat.color);
    setIsFormModalOpen(true);
  };

  // Salvar formulário
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numDefaultBudget = budgetLimit ? parseFloat(budgetLimit.replace(',', '.')) : undefined;
    const cleanDefaultBudget = isNaN(Number(numDefaultBudget)) ? undefined : numDefaultBudget;

    const numMonthBudget = monthBudgetLimit ? parseFloat(monthBudgetLimit.replace(',', '.')) : undefined;
    const cleanMonthBudget = isNaN(Number(numMonthBudget)) ? undefined : numMonthBudget;

    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    if (editingCategory) {
      const updatedMonthlyBudgets = { ...(editingCategory.monthlyBudgets || {}) };
      if (budgetMode === 'month') {
        if (cleanMonthBudget !== undefined && cleanMonthBudget > 0) {
          updatedMonthlyBudgets[monthKey] = cleanMonthBudget;
        } else {
          delete updatedMonthlyBudgets[monthKey];
        }
      } else {
        // Se voltou para o teto padrão, remove a personalização deste mês
        delete updatedMonthlyBudgets[monthKey];
      }

      updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        budgetLimit: cleanDefaultBudget,
        monthlyBudgets: updatedMonthlyBudgets,
        icon,
        color,
      });
    } else {
      const initialMonthlyBudgets: Record<string, number> = {};
      if (budgetMode === 'month' && cleanMonthBudget !== undefined && cleanMonthBudget > 0) {
        initialMonthlyBudgets[monthKey] = cleanMonthBudget;
      }

      addCategory({
        name: name.trim(),
        type,
        parentId: parentId || undefined,
        budgetLimit: cleanDefaultBudget,
        monthlyBudgets: Object.keys(initialMonthlyBudgets).length > 0 ? initialMonthlyBudgets : undefined,
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
          {/* Barra de Controles: Seletor de Mês e Ações de Orçamento */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
            {/* Espaçador esquerdo invisível no mobile para manter o seletor perfeitamente centralizado */}
            <div className="w-8 shrink-0 sm:hidden" aria-hidden="true" />

            {/* Seletor de Mês / Ano (centralizado no mobile, alinhado à esquerda no desktop) */}
            <div className="flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2">
              <MonthSelector compact={true} />
              <span className="text-[11px] text-slate-400 hidden lg:inline">
                ({budgetExpenseCategories.length} categorias)
              </span>
            </div>

            {/* Ações de Orçamento e Layout */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                  <StretchHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[10px]">1 Col</span>
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
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[10px]">2 Col</span>
                </button>
              </div>

              {archivedCategories.length > 0 && (
                <button
                  onClick={() => setIsArchivedModalOpen(true)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold border border-slate-700/60 transition-all cursor-pointer"
                  title="Ver categorias e subcategorias arquivadas"
                >
                  <Archive className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Arquivadas</span>
                  <span>({archivedCategories.length})</span>
                </button>
              )}

              {/* Botão Nova Categoria: Apenas '+' circular/arredondado no mobile, '+ Nova' no desktop */}
              <button
                onClick={() => handleOpenCreate(undefined, 'expense')}
                className="w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-semibold shadow-md transition-all cursor-pointer"
                title="Nova Categoria"
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Nova</span>
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
              const excessAmount = isOverBudget && budget > 0 ? totalSpent - budget : 0;
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
                  data-parent-card-id={cat.id}
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
                  className={`bg-slate-900/60 border p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-between transition-all ${
                    isOver
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.01]'
                      : isDragging
                      ? 'border-dashed border-slate-600 opacity-40'
                      : 'border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div>
                    {/* Linha Superior: Cabeçalho com Ícone/Nome à esquerda, Barra no Desktop ao centro, e Ações à direita */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-2">
                      {/* Topo Mobile / Esquerda Desktop: [Chevron] + Ícone + Nome/Teto E Ações no Mobile */}
                      <div className="flex items-center justify-between w-full md:w-auto shrink-0">
                        {/* Bloco: Chevron + Ícone + Nome + Teto/Previsto */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {subs.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(cat.id);
                              }}
                              className="p-1 -ml-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title={isExpanded ? 'Recolher subcategorias' : `Expandir subcategorias (${subs.length})`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {/* No mobile exibe 'Previsto:' e no desktop 'Teto:' */}
                              <span className="md:hidden">Previsto:</span>
                              <span className="hidden md:inline">Teto:</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(cat)}
                                className="font-bold text-slate-200 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
                                title="Clique para editar teto previsto"
                              >
                                {budget > 0 ? formatCurrency(budget) : 'Sem teto definido'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Ações (Arrastar, Reordenar e Mais Opções) visíveis no topo no Mobile */}
                        <div className="flex items-center gap-1 md:hidden">
                          {/* Botões rápidos de subir/descer no mobile (exibidos sob demanda ao segurar o quadradinho) */}
                          {activeMoveControlsId === cat.id && (
                            <div className="flex items-center bg-slate-950 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 rounded-lg p-0.5 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveParentCategory(cat.id, 'up');
                                }}
                                className="p-1 text-emerald-400 hover:text-white hover:bg-slate-800 rounded active:bg-slate-700 transition-colors cursor-pointer"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveParentCategory(cat.id, 'down');
                                }}
                                className="p-1 text-emerald-400 hover:text-white hover:bg-slate-800 rounded active:bg-slate-700 transition-colors cursor-pointer"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Alça de arrastar com suporte a Touch, Drag nativo e Long-Press para exibir setas */}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toque no mobile também alterna as setas
                              setActiveMoveControlsId(prev => (prev === cat.id ? null : cat.id));
                            }}
                            onTouchStart={() => handleTouchStartParent(cat.id)}
                            onTouchMove={handleTouchMoveParent}
                            onTouchEnd={handleTouchEndParent}
                            className={`p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors touch-none ${
                              activeMoveControlsId === cat.id
                                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                            title="Segure para mostrar opções de mover ou arraste"
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

                      {/* Bloco Central: Barra de Progresso + Gastos (Desktop na mesma linha ao lado; Mobile empilhado logo abaixo) */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1 flex-wrap">
                            <span>Gasto Total:</span>
                            <strong className="text-white">{formatCurrency(totalSpent)}</strong>
                            {excessAmount > 0 && (
                              <span className="text-rose-400 font-bold ml-0.5">
                                ({formatCurrency(excessAmount)})
                              </span>
                            )}
                          </span>
                          <span className={`font-semibold shrink-0 ml-2 ${isOverBudget ? 'text-rose-400 flex items-center gap-1' : 'text-slate-300'}`}>
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

                      {/* Bloco Direito: Ações (Arrastar e Mais Opções) no Desktop */}
                      <div className="hidden md:flex items-center gap-1 shrink-0 self-center">
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
                  </div>

                  {/* Subcategorias Aninhadas (Exibidas quando expandido pelo chevron) */}
                  {subs.length > 0 && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <div className="space-y-2 pl-1 sm:pl-2 border-l-2 border-slate-800">
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

                            const isSubExpanded = Boolean(expandedSubs[sub.id]);
                            const subTransactions = filteredTransactions.filter(
                              t => t.categoryId === sub.id && t.type === 'expense'
                            );

                            return (
                              <div
                                key={sub.id}
                                data-sub-card-id={sub.id}
                                data-sub-parent-id={cat.id}
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
                                className={`p-2 sm:p-2.5 bg-slate-950/60 hover:bg-slate-900/90 border rounded-xl text-xs space-y-2 transition-all group select-none ${
                                  isSubOverDrag
                                    ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-slate-900'
                                    : isSubDragging
                                    ? 'border-dashed border-slate-600 opacity-40'
                                    : 'border-slate-800/40 hover:border-slate-700/70'
                                }`}
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                                  {/* Bloco Esquerdo: Chevron (se houver transações) + Drag/Move + Cor + Nome + Teto */}
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
                                    {/* Seta/Chevron para expandir os itens da subcategoria */}
                                    {subTransactions.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpandSub(sub.id);
                                        }}
                                        className="p-1 -ml-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
                                        title={isSubExpanded ? 'Recolher lançamentos' : `Ver lançamentos (${subTransactions.length})`}
                                      >
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="w-3.5 h-3.5 shrink-0" />
                                    )}

                                    {/* Botões rápidos de subir/descer subcategoria no mobile (exibidos sob demanda ao segurar o quadradinho) */}
                                    {activeMoveControlsId === sub.id && (
                                      <div className="flex md:hidden items-center bg-slate-950 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 rounded p-0.5 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveSubCategory(cat.id, sub.id, 'up');
                                          }}
                                          className="p-0.5 text-emerald-400 hover:text-white rounded active:bg-slate-700 transition-colors cursor-pointer"
                                          title="Mover subcategoria para cima"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveSubCategory(cat.id, sub.id, 'down');
                                          }}
                                          className="p-0.5 text-emerald-400 hover:text-white rounded active:bg-slate-700 transition-colors cursor-pointer"
                                          title="Mover subcategoria para baixo"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}

                                    {/* Alça de Arrastar Subcategoria (Desktop Drag + Mobile Touch + Long-press para mostrar setas) */}
                                    <div
                                      draggable
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMoveControlsId(prev => (prev === sub.id ? null : sub.id));
                                      }}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        setDraggedSubId(sub.id);
                                      }}
                                      onDragEnd={() => {
                                        setDraggedSubId(null);
                                        setDragOverSubId(null);
                                      }}
                                      onTouchStart={() => handleTouchStartSub(sub.id)}
                                      onTouchMove={(e) => handleTouchMoveSub(cat.id, e)}
                                      onTouchEnd={handleTouchEndSub}
                                      className={`p-1 rounded cursor-grab active:cursor-grabbing transition-colors touch-none ${
                                        activeMoveControlsId === sub.id
                                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                                          : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
                                      }`}
                                      title="Segure para mostrar opções de mover ou arraste"
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
                                          handleOpenEdit(sub);
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-emerald-400 font-normal shrink-0 transition-colors"
                                        title="Clique para editar teto da subcategoria"
                                      >
                                        ({formatCurrency(subBudget)})
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEdit(sub);
                                        }}
                                        className="text-[10px] text-slate-600 hover:text-emerald-400 font-normal shrink-0 transition-colors"
                                        title="Definir teto para esta subcategoria"
                                      >
                                        + teto
                                      </button>
                                    )}
                                  </div>

                                  {/* Bloco Central: Barra de Progresso no Desktop */}
                                  {subBudget > 0 && (
                                    <div className="flex-1 w-full md:w-auto min-w-0">
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
                                    </div>
                                  )}

                                  {/* Bloco Direito: Valor Gasto + Ações */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                                    <span className="font-semibold text-white">
                                      {formatCurrency(subSpent)}
                                      {isSubOver && subBudget > 0 && (
                                        <span className="font-bold text-rose-400 ml-1">
                                          ({formatCurrency(subSpent - subBudget)})
                                        </span>
                                      )}
                                    </span>
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

                                {/* Lançamentos da Subcategoria (Exibidos em Accordion Minimalista) */}
                                {isSubExpanded && subTransactions.length > 0 && (
                                  <div className="pt-2 border-t border-slate-800/80 pl-1.5 sm:pl-6 space-y-1.5">
                                    {subTransactions.map(tx => {
                                      const acc = accounts.find(a => a.id === tx.accountId);
                                      const card = creditCards.find(c => c.id === tx.creditCardId);
                                      const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
                                      const isEffectivelyPaid =
                                        tx.paid ||
                                        (card && invoicePeriod
                                          ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
                                          : false);
                                      const accountLabel = card ? card.name : (acc?.name || 'Conta');

                                      return (
                                        <div
                                          key={tx.id}
                                          onClick={() => setEditingTransaction(tx)}
                                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-colors cursor-pointer group/tx text-[11px]"
                                          title="Clique para editar lançamento"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-slate-200 group-hover/tx:text-emerald-400 font-medium truncate">
                                              {tx.description}
                                            </span>
                                            <span className="text-[10px] text-slate-500 shrink-0">
                                              {formatDateBR(tx.date)}
                                            </span>
                                            {card && (
                                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-cyan-400/80 shrink-0">
                                                <CreditCard className="w-3 h-3" />
                                                <span className="truncate max-w-[90px]">{accountLabel}</span>
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2.5 shrink-0 ml-2">
                                            <span className="font-semibold text-rose-400 text-xs">
                                              {formatCurrency(tx.amount)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateTransaction(tx.id, { paid: !isEffectivelyPaid });
                                              }}
                                              className={`w-4 h-4 rounded flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                                                isEffectivelyPaid
                                                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                                  : 'bg-rose-500 text-white hover:bg-rose-400'
                                              }`}
                                              title={isEffectivelyPaid ? 'Pago (Clique para marcar pendente)' : 'Pendente (Clique para pagar)'}
                                            >
                                              {isEffectivelyPaid ? (
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                              ) : (
                                                <span className="text-[10px] font-black leading-none">!</span>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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

              {/* Seção de Tetos Orçamentários (Padrão vs Mês Selecionado) */}
              {type === 'expense' && (
                <div className="space-y-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Definição de Teto Orçamentário
                    </span>
                  </div>

                  {/* Opção 1: Teto Previsto Padrão */}
                  <div
                    onClick={() => setBudgetMode('default')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      budgetMode === 'default'
                        ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={budgetMode === 'default'}
                          onChange={() => setBudgetMode('default')}
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">
                          Teto Previsto Padrão
                        </span>
                      </label>
                      {budgetMode === 'default' && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                          Em uso
                        </span>
                      )}
                    </div>
                    <div className="pl-6">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1500.00 (Opcional)"
                        value={budgetLimit}
                        disabled={budgetMode !== 'default'}
                        onChange={e => {
                          setBudgetLimit(e.target.value);
                          if (budgetMode !== 'default') setBudgetMode('default');
                        }}
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                          budgetMode === 'default'
                            ? 'border-slate-700 focus:border-emerald-500'
                            : 'border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Opção 2: Teto Previsto do Mês Específico */}
                  <div
                    onClick={() => setBudgetMode('month')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      budgetMode === 'month'
                        ? 'bg-slate-900 border-purple-500/60 ring-1 ring-purple-500/30'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={budgetMode === 'month'}
                          onChange={() => setBudgetMode('month')}
                          className="w-4 h-4 rounded text-purple-500 bg-slate-950 border-slate-700 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-white">
                          Teto Previsto {getMonthName(selectedMonth)}/{selectedYear}
                        </span>
                      </label>
                      {budgetMode === 'month' && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-medium">
                          Em uso
                        </span>
                      )}
                    </div>
                    <div className="pl-6">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1800.00"
                        value={monthBudgetLimit}
                        disabled={budgetMode !== 'month'}
                        onChange={e => {
                          setMonthBudgetLimit(e.target.value);
                          if (budgetMode !== 'month') setBudgetMode('month');
                        }}
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                          budgetMode === 'month'
                            ? 'border-purple-500/80 focus:border-purple-400'
                            : 'border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
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
