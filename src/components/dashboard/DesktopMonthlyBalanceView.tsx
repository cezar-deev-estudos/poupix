'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Category, Transaction } from '@/types/finance';
import { CategoryIcon } from '../ui/CategoryIcon';
import { DesktopCategoryDetailModal } from './DesktopCategoryDetailModal';
import { MonthDropdownModal } from '../layout/MonthDropdownModal';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Banknote,
  Scale,
  Calendar,
  Plus,
} from 'lucide-react';
import { NewTransactionPopover } from '../layout/NewTransactionPopover';
import { TransactionFlowType } from '../transactions/modal/TransactionModal';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface DesktopMonthlyBalanceViewProps {
  onBack: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onOpenNewTransaction?: (flowType?: TransactionFlowType) => void;
}

export const DesktopMonthlyBalanceView: React.FC<DesktopMonthlyBalanceViewProps> = ({
  onBack,
  onEditTransaction,
  onOpenNewTransaction,
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

  const { incomeCategories, expenseCategories, totalIncome, totalExpense } = useMemo(() => {
    const incomeMap: Record<string, { category: Category; total: number; transactions: Transaction[] }> = {};
    const expenseMap: Record<string, { category: Category; total: number; transactions: Transaction[] }> = {};

    let incomeSum = 0;
    let expenseSum = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'transfer') return;

      const directCat = categories.find(c => c.id === tx.categoryId);
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
    const childCategoryIds = new Set(
      categories.filter(c => c.parentId === selectedCategory.id).map(c => c.id)
    );
    childCategoryIds.add(selectedCategory.id);

    return filteredTransactions.filter(
      t => childCategoryIds.has(t.categoryId) && t.type === selectedCategory.type
    );
  }, [filteredTransactions, categories, selectedCategory]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Desktop com Navegação e Seletor de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Voltar ao Painel Principal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Balanço Mensal</h2>
            </div>
            <p className="text-xs text-slate-400">Detalhamento completo de receitas e despesas por categoria</p>
          </div>
        </div>

        {/* Ações e Controles de Mês */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Botão + Novo */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] text-xs"
              title="Novo Lançamento"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo</span>
            </button>

            <NewTransactionPopover
              isOpen={isPopoverOpen}
              onClose={() => setIsPopoverOpen(false)}
              onSelectFlow={flow => onOpenNewTransaction?.(flow)}
            />
          </div>

          {/* Controles de Mês */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3 py-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMonthModalOpen(true)}
              className="flex items-center gap-2 px-2 py-1 text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Card Retangular de Balanço e Totais (Desktop Banner) */}
      <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          {/* Receitas Totais */}
          <div className="flex items-center gap-4 pt-2 md:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total de Receitas</span>
              <span className="text-xl font-bold text-emerald-400 block tracking-tight mt-0.5">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>

          {/* Despesas Totais */}
          <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total de Despesas</span>
              <span className="text-xl font-bold text-rose-400 block tracking-tight mt-0.5">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Balanço Líquido */}
          <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              balance >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Balanço do Mês</span>
              <span className={`text-2xl font-bold block tracking-tight mt-0.5 ${
                balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grid Retangular em 2 Colunas para Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Coluna Esquerda: Receitas por Categoria */}
        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CircleDollarSign className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Receitas por Categoria</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              {incomeCategories.length} {incomeCategories.length === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {incomeCategories.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
                Nenhuma receita registrada neste mês.
              </div>
            ) : (
              incomeCategories.map(item => {
                const percentage = totalIncome > 0 ? ((item.total / totalIncome) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={item.category.id}
                    onClick={() => setSelectedCategory(item.category)}
                    className="flex items-center justify-between p-3.5 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: item.category.color || '#10b981' }}
                      >
                        <CategoryIcon name={item.category.icon || 'Tag'} size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-200 block truncate group-hover:text-emerald-400 transition-colors">
                          {item.category.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.transactions.length} {item.transactions.length === 1 ? 'item' : 'itens'} ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-sm font-bold text-emerald-400 block tracking-tight">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Despesas por Categoria */}
        <div className="bg-[#1c202a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Banknote className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-base">Despesas por Categoria</h3>
            </div>
            <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl">
              {expenseCategories.length} {expenseCategories.length === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {expenseCategories.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
                Nenhuma despesa registrada neste mês.
              </div>
            ) : (
              expenseCategories.map(item => {
                const percentage = totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={item.category.id}
                    onClick={() => setSelectedCategory(item.category)}
                    className="flex items-center justify-between p-3.5 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: item.category.color || '#f97316' }}
                      >
                        <CategoryIcon name={item.category.icon || 'Tag'} size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-200 block truncate group-hover:text-rose-400 transition-colors">
                          {item.category.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.transactions.length} {item.transactions.length === 1 ? 'item' : 'itens'} ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-sm font-bold text-rose-400 block tracking-tight">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Categoria Selecionada */}
      {selectedCategory && (
        <DesktopCategoryDetailModal
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
