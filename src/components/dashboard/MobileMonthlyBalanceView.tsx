'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Category, Transaction } from '@/types/finance';
import { CategoryIcon } from '../ui/CategoryIcon';
import { MobileCategoryDetailDrawer } from './MobileCategoryDetailDrawer';
import { MonthDropdownModal } from '../layout/MonthDropdownModal';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  MoreVertical,
  CircleDollarSign,
  Banknote,
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MobileMonthlyBalanceViewProps {
  onBack: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const MobileMonthlyBalanceView: React.FC<MobileMonthlyBalanceViewProps> = ({
  onBack,
  onEditTransaction,
}) => {
  const {
    filteredTransactions,
    categories,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useFinance();

  const [activeTabType, setActiveTabType] = useState<'category' | 'account'>('category');
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Cálculo das transações e totais por categoria
  const { incomeCategories, expenseCategories, totalIncome, totalExpense } = useMemo(() => {
    const incomeMap: Record<string, { category: Category; total: number; transactions: Transaction[] }> = {};
    const expenseMap: Record<string, { category: Category; total: number; transactions: Transaction[] }> = {};

    let incomeSum = 0;
    let expenseSum = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'transfer') return;

      const directCat = categories.find(c => c.id === tx.categoryId);
      // Busca categoria raiz (pai), se a categoria atual tiver parentId
      let parentCat = directCat;
      if (directCat?.parentId) {
        const foundParent = categories.find(c => c.id === directCat.parentId);
        if (foundParent) parentCat = foundParent;
      }

      const cat: Category = parentCat || directCat || {
        id: tx.categoryId,
        name: tx.type === 'income' ? 'Outras Receitas' : 'Outras Despesas',
        color: tx.type === 'income' ? '#10b981' : '#f43f5e',
        icon: 'Tag',
        type: tx.type,
      };

      if (tx.type === 'income') {
        incomeSum += tx.amount;
        if (!incomeMap[cat.id]) {
          incomeMap[cat.id] = { category: cat, total: 0, transactions: [] };
        }
        incomeMap[cat.id].total += tx.amount;
        incomeMap[cat.id].transactions.push(tx);
      } else if (tx.type === 'expense') {
        expenseSum += tx.amount;
        if (!expenseMap[cat.id]) {
          expenseMap[cat.id] = { category: cat, total: 0, transactions: [] };
        }
        expenseMap[cat.id].total += tx.amount;
        expenseMap[cat.id].transactions.push(tx);
      }
    });

    // Ordena do maior valor para o menor
    const sortedIncome = Object.values(incomeMap).sort((a, b) => b.total - a.total);
    const sortedExpense = Object.values(expenseMap).sort((a, b) => b.total - a.total);

    return {
      incomeCategories: sortedIncome,
      expenseCategories: sortedExpense,
      totalIncome: incomeSum,
      totalExpense: expenseSum,
    };
  }, [filteredTransactions, categories]);

  const balance = totalIncome - totalExpense;

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    // Retorna todas as transações que pertencem diretamente à categoria pai OU a qualquer subcategoria dela
    const childCategoryIds = new Set(
      categories.filter(c => c.parentId === selectedCategory.id).map(c => c.id)
    );
    childCategoryIds.add(selectedCategory.id);

    return filteredTransactions.filter(
      t => childCategoryIds.has(t.categoryId) && t.type === selectedCategory.type
    );
  }, [filteredTransactions, categories, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#131316] text-slate-100 flex flex-col pb-24 animate-fadeIn">
      {/* 1. Header Superior com Botão Voltar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white tracking-tight">Balanço mensal</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMonthModalOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Selecionar Mês"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Navegador de Mês Centralizado (< Outubro >) */}
      <div className="flex items-center justify-center gap-6 py-2 text-xs font-semibold text-slate-300">
        <button type="button" onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsMonthModalOpen(true)}
          className="hover:text-white transition-colors cursor-pointer font-bold text-sm"
        >
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </button>
        <button type="button" onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Pílulas de Alternância (Balanço por categoria / Balanço por conta) */}
      <div className="px-4 pt-2">
        <div className="bg-[#21242d] rounded-2xl p-1 flex items-center gap-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTabType('category')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTabType === 'category'
                ? 'bg-[#5b4f73] text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Balanço por categoria
          </button>
          <button
            type="button"
            onClick={() => setActiveTabType('account')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTabType === 'account'
                ? 'bg-[#5b4f73] text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Balanço por conta
          </button>
        </div>
      </div>

      {/* 4. Card Central de Balanço */}
      <div className="px-4 pt-3">
        <div className="bg-[#242732] border border-slate-800/80 rounded-2xl p-4 shadow-lg space-y-3">
          {/* Valor Central do Balanço */}
          <div className="text-center space-y-0.5">
            <span className="text-xs font-medium text-slate-300">Balanço</span>
            <div className={`text-lg font-bold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(balance)}
            </div>
          </div>

          {/* Linha de Totais (Receitas e Despesas lado a lado) */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Receitas */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-normal leading-tight">Receitas</span>
                <span className="text-xs font-semibold text-emerald-400 block truncate leading-tight mt-0.5">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </div>

            {/* Despesas */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <Banknote className="w-4 h-4 text-rose-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block font-normal leading-tight">Despesas</span>
                <span className="text-xs font-semibold text-rose-400 block truncate leading-tight mt-0.5">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Grid em 2 Colunas com Categorias (Receitas à Esquerda, Despesas à Direita) */}
      <div className="px-4 pt-4 flex-1">
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Coluna Esquerda: Categorias de Receita */}
          <div className="space-y-2.5">
            {incomeCategories.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-3 text-center bg-[#1d2028]/60 rounded-2xl border border-slate-800/40">
                Sem receitas
              </div>
            ) : (
              incomeCategories.map(item => (
                <div
                  key={item.category.id}
                  onClick={() => setSelectedCategory(item.category)}
                  className="flex items-center gap-2.5 p-2.5 bg-[#1d2028] hover:bg-[#252934] active:scale-[0.98] border border-slate-800/80 rounded-2xl transition-all cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: item.category.color || '#10b981' }}
                  >
                    <CategoryIcon name={item.category.icon || 'Tag'} size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-200 block truncate">
                      {item.category.name}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 block truncate">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Coluna Direita: Categorias de Despesa */}
          <div className="space-y-2.5">
            {expenseCategories.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-3 text-center bg-[#1d2028]/60 rounded-2xl border border-slate-800/40">
                Sem despesas
              </div>
            ) : (
              expenseCategories.map(item => (
                <div
                  key={item.category.id}
                  onClick={() => setSelectedCategory(item.category)}
                  className="flex items-center gap-2.5 p-2.5 bg-[#1d2028] hover:bg-[#252934] active:scale-[0.98] border border-slate-800/80 rounded-2xl transition-all cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: item.category.color || '#f97316' }}
                  >
                    <CategoryIcon name={item.category.icon || 'Tag'} size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-200 block truncate">
                      {item.category.name}
                    </span>
                    <span className="text-[11px] font-bold text-rose-400 block truncate">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drawer de Detalhes da Categoria Selecionada */}
      {selectedCategory && (
        <MobileCategoryDetailDrawer
          isOpen={Boolean(selectedCategory)}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          transactions={selectedCategoryTransactions}
          onEditTransaction={tx => {
            setSelectedCategory(null);
            onEditTransaction?.(tx);
          }}
        />
      )}

      {/* Modal de Seleção de Mês */}
      <MonthDropdownModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
      />
    </div>
  );
};
