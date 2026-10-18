'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { TransactionsHeaderCards } from './TransactionsHeaderCards';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsFilterModal, AdvancedFilterState } from './TransactionsFilterModal';
import { TransactionsOptionsMenu } from './TransactionsOptionsMenu';
import { TransactionScopeModal } from './TransactionScopeModal';
import { NewTransactionModal } from './NewTransactionModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { formatCurrency } from '@/lib/utils';
import { getEffectiveTransactionDate, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { SavedTransactionFilter } from '@/types/finance';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { SaveFilterModal } from './SaveFilterModal';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { ExpenseHeatmapCalendar } from '../dashboard/ExpenseHeatmapCalendar';
import { CategoryIcon } from '../ui/CategoryIcon';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface TransactionsViewProps {
  initialTypeFilter?: 'all' | 'income' | 'expense' | 'transfer';
  initialStatusFilter?: 'all' | 'pending' | 'paid';
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  initialTypeFilter = 'all',
  initialStatusFilter = 'all',
}) => {
  const {
    filteredTransactions,
    transactions: allTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    updateTransaction,
    deleteTransaction,
    creditCards,
    accounts,
    categories,
    groupByCard,
    toggleGroupByCard,
  } = useFinance();

  // Filtros salvos via Hook
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();
  const [activeSavedFilter, setActiveSavedFilter] = useState<SavedTransactionFilter | null>(null);
  const [isSaveFilterModalOpen, setIsSaveFilterModalOpen] = useState(false);

  // Estados de Filtros e Visualização
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>(initialTypeFilter);

  // Escopo de Período: 'month' (mês selecionado) ou 'year' (ano inteiro)
  const [timeScope, setTimeScope] = useState<'month' | 'year'>('month');

  React.useEffect(() => {
    if (initialTypeFilter) {
      setActiveTypeFilter(initialTypeFilter);
    }
  }, [initialTypeFilter]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [alertPending, setAlertPending] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(true);
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  // Estados de Modais
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'following' | 'all'>('single');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Filtro Avançado
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilterState>({
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
    tag: '',
    status: initialStatusFilter || 'all',
    type: 'all',
    saveFilter: false,
  });

  React.useEffect(() => {
    if (initialStatusFilter) {
      setAdvancedFilter(prev => ({ ...prev, status: initialStatusFilter }));
    }
  }, [initialStatusFilter]);

  // Aplicação de Filtro Salvo
  const handleApplySavedFilter = (sf: SavedTransactionFilter) => {
    setActiveSavedFilter(sf);
    if (sf.searchQuery !== undefined) setSearchQuery(sf.searchQuery);
    if (sf.scope) setTimeScope(sf.scope);
    if (sf.year) setSelectedYear(sf.year);
    if (sf.type) setActiveTypeFilter(sf.type);

    setAdvancedFilter({
      startDate: sf.startDate || '',
      endDate: sf.endDate || '',
      categoryId: sf.categoryId || '',
      subcategoryId: sf.subcategoryId || '',
      accountId: sf.accountId || '',
      tag: sf.tag || '',
      status: sf.status || 'all',
      type: sf.type || 'all',
      saveFilter: false,
    });
  };

  const handleClearActiveSavedFilter = () => {
    setActiveSavedFilter(null);
    setSearchQuery('');
    setTimeScope('month');
    setAdvancedFilter({
      startDate: '',
      endDate: '',
      categoryId: '',
      subcategoryId: '',
      accountId: '',
      tag: '',
      status: 'all',
      type: 'all',
      saveFilter: false,
    });
  };

  // Base de transações de acordo com o escopo (mês ou ano inteiro)
  const baseTransactions = useMemo(() => {
    if (timeScope === 'year') {
      return (allTransactions || []).filter((t) => {
        if (t.creditCardId) {
          const card = creditCards.find((c) => c.id === t.creditCardId);
          const { year } = getTransactionInvoicePeriod(t, card);
          return year === selectedYear;
        }
        if (!t.date) return false;
        const [tYear] = t.date.split('-').map(Number);
        return tYear === selectedYear;
      });
    }
    return filteredTransactions;
  }, [timeScope, allTransactions, filteredTransactions, selectedYear, creditCards]);

  // Navegação de Mês ou Ano
  const handlePrevMonth = () => {
    if (timeScope === 'year') {
      setSelectedYear(selectedYear - 1);
      return;
    }
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (timeScope === 'year') {
      setSelectedYear(selectedYear + 1);
      return;
    }
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filtragem Dinâmica
  const displayedTransactions = useMemo(() => {
    const filtered = baseTransactions.filter((tx) => {
      // 1. Tipo Rápido
      if (activeTypeFilter !== 'all' && tx.type !== activeTypeFilter) return false;

      // 2. Busca Textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesDesc && !matchesAmount) return false;
      }

      // 3. Filtros Avançados
      if (advancedFilter.startDate && tx.date < advancedFilter.startDate) return false;
      if (advancedFilter.endDate && tx.date > advancedFilter.endDate) return false;

      // Filtro de Categoria e Subcategoria
      if (advancedFilter.subcategoryId) {
        // Se uma subcategoria específica foi escolhida, deve bater exatamente com ela
        if (tx.categoryId !== advancedFilter.subcategoryId) return false;
      } else if (advancedFilter.categoryId) {
        // Se apenas a categoria pai foi escolhida, inclui transações vinculadas diretamente a ela OU a qualquer de suas subcategorias filhas
        const matchingCategoryIds = new Set([
          advancedFilter.categoryId,
          ...categories.filter((c) => c.parentId === advancedFilter.categoryId).map((c) => c.id),
        ]);
        if (!matchingCategoryIds.has(tx.categoryId)) return false;
      }

      if (advancedFilter.accountId && tx.accountId !== advancedFilter.accountId) return false;
      if (advancedFilter.tag && (!tx.tags || !tx.tags.includes(advancedFilter.tag))) return false;
      if (advancedFilter.status === 'paid' && !tx.paid) return false;
      if (advancedFilter.status === 'pending' && tx.paid) return false;
      if (advancedFilter.type !== 'all' && tx.type !== advancedFilter.type) return false;

      return true;
    });

    // Se NÃO estiver agrupando por cartão, retorna as transações individuais normais
    if (!groupByCard) {
      return filtered;
    }

    // Se estiver agrupando por cartão:
    // 1. Manter todas as transações que NÃO são de cartão
    const nonCardTransactions = filtered.filter(tx => !tx.creditCardId);

    // 2. Agrupar transações por cada cartão de crédito presente
    const cardGroupsMap = new Map<string, Transaction[]>();
    filtered.forEach(tx => {
      if (tx.creditCardId) {
        const list = cardGroupsMap.get(tx.creditCardId) || [];
        list.push(tx);
        cardGroupsMap.set(tx.creditCardId, list);
      }
    });

    const currentPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    // 3. Gerar item sintético de fatura para cada cartão que tem compras
    const aggregatedCardItems: Transaction[] = [];
    cardGroupsMap.forEach((txList, cardId) => {
      const card = creditCards.find(c => c.id === cardId);
      const totalAmount = txList.reduce((acc, t) => acc + t.amount, 0);
      const isPaid = card?.manualInvoiceStatus?.[currentPeriodKey] === 'paid' || txList.every(t => t.paid);
      
      // Data de vencimento da fatura do mês selecionado
      const dueDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(card?.dueDay || 10).padStart(2, '0')}`;

      // Conta bancária de referência (primeira conta com lançamentos desse cartão ou a conta padrão do sistema)
      const linkedAccountId = txList.find(t => t.accountId)?.accountId || accounts[0]?.id;

      aggregatedCardItems.push({
        id: `grouped-card-${cardId}-${currentPeriodKey}`,
        description: card ? `Cartão ${card.name}` : 'Cartão de Crédito',
        amount: totalAmount,
        date: dueDateStr,
        invoiceDate: dueDateStr,
        type: 'expense',
        categoryId: 'grouped-card-category',
        creditCardId: cardId,
        accountId: linkedAccountId,
        paid: isPaid,
        createdAt: new Date().toISOString(),
        notes: `${txList.length} compras agrupadas na fatura`,
      });
    });

    return [...nonCardTransactions, ...aggregatedCardItems];
  }, [baseTransactions, activeTypeFilter, searchQuery, advancedFilter, groupByCard, creditCards, accounts, categories, selectedYear, selectedMonth]);

  // Transações do dia selecionado no Mapa de Calor
  const {
    selectedDateTransactions,
    selectedDateExpenses,
    selectedDateIncomes,
    selectedDateExpenseTotal,
    selectedDateIncomeTotal,
    selectedDateTotal,
    effectiveSelectedDate,
  } = useMemo(() => {
    let targetDate = selectedHeatmapDate;
    if (!targetDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const [todayY, todayM] = todayStr.split('-').map(Number);
      if (todayY === selectedYear && todayM === selectedMonth + 1) {
        targetDate = todayStr;
      }
    }

    if (!targetDate) {
      return {
        selectedDateTransactions: [],
        selectedDateExpenses: [],
        selectedDateIncomes: [],
        selectedDateExpenseTotal: 0,
        selectedDateIncomeTotal: 0,
        selectedDateTotal: 0,
        effectiveSelectedDate: null,
      };
    }

    const txs = displayedTransactions.filter(t => {
      const d = t.date ? t.date.split('T')[0] : '';
      return d === targetDate;
    });

    const expenseTxs = txs.filter(t => t.type === 'expense' || !!t.creditCardId);
    const incomeTxs = txs.filter(t => t.type === 'income');

    const expenseTotal = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
    const incomeTotal = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

    return {
      selectedDateTransactions: txs,
      selectedDateExpenses: expenseTxs,
      selectedDateIncomes: incomeTxs,
      selectedDateExpenseTotal: expenseTotal,
      selectedDateIncomeTotal: incomeTotal,
      selectedDateTotal: expenseTotal,
      effectiveSelectedDate: targetDate,
    };
  }, [displayedTransactions, selectedHeatmapDate, selectedYear, selectedMonth]);

  // Exclusão
  const handleConfirmDelete = () => {
    if (deletingTransaction) {
      deleteTransaction(deletingTransaction.id, deleteMode);
      setDeletingTransaction(null);
      setDeleteMode('single');
    }
  };

  const isRecurringOrInstallment = !!(
    deletingTransaction?.recurringGroupId ||
    deletingTransaction?.isRecurring ||
    deletingTransaction?.installmentGroupId ||
    (deletingTransaction?.installmentTotal && deletingTransaction.installmentTotal > 1)
  );

  // Labels do Dropdown de Tipo
  const getTypeLabel = () => {
    switch (activeTypeFilter) {
      case 'income':
        return 'Receitas';
      case 'expense':
        return 'Despesas';
      case 'transfer':
        return 'Transferências';
      case 'all':
      default:
        return 'Todas';
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* 1. Barra de Título Superior com Seletor Roxo e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-tight">Transações</h2>

          {/* Seletor de Tipo com Cor Contextual */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                activeTypeFilter === 'expense'
                  ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-rose-500/20'
                  : activeTypeFilter === 'income'
                  ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-emerald-500/20'
                  : activeTypeFilter === 'transfer'
                  ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-blue-500/20'
                  : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-purple-500/20'
              }`}
            >
              <span className="text-[11px]">⌵</span>
              <span>{getTypeLabel()}</span>
            </button>

            {typeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setTypeDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-56 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-40 py-2 animate-scaleUp text-xs space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('all');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                    <span className="font-semibold">Todas as transações</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('expense');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                    <span className="font-semibold">Despesas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('income');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                    <span className="font-semibold">Receitas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('transfer');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 text-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                    <span className="font-semibold">Transferências</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ferramentas do Lado Direito: Busca, Filtro, Opções e Nova Transação */}
        <div className="flex items-center gap-2">
          {/* Busca Expandível */}
          {isSearchOpen ? (
            <div className="relative animate-fadeIn">
              <input
                type="text"
                autoFocus
                placeholder="Buscar por descrição ou valor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-[#1e2330] border border-slate-700 rounded-2xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 bg-[#1e2330] hover:bg-[#282e3e] border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Pesquisar"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Botão de Filtros */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="p-2.5 bg-[#1e2330] hover:bg-[#282e3e] border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer relative"
            title="Filtros avançados"
          >
            <Filter className="w-4 h-4" />
            {(advancedFilter.categoryId || advancedFilter.status !== 'all' || advancedFilter.tag) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* Menu de Mais Opções */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="p-2.5 bg-[#1e2330] hover:bg-[#282e3e] border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              title="Opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <TransactionsOptionsMenu
              isOpen={isOptionsMenuOpen}
              onClose={() => setIsOptionsMenuOpen(false)}
              groupByCard={groupByCard}
              onToggleGroupByCard={toggleGroupByCard}
              alertPending={alertPending}
              onToggleAlertPending={() => setAlertPending(!alertPending)}
              savedFilters={savedFilters}
              activeFilterId={activeSavedFilter?.id}
              onApplySavedFilter={handleApplySavedFilter}
              onOpenSaveFilterModal={() => setIsSaveFilterModalOpen(true)}
              onDeleteSavedFilter={deleteFilter}
              onClearActiveSavedFilter={handleClearActiveSavedFilter}
            />
          </div>

          {/* Botão Contextual de Novo Lançamento */}
          {activeTypeFilter === 'expense' ? (
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#221c24] hover:bg-[#2e2330] border border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-2xl text-xs font-bold transition-all cursor-pointer ml-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>NOVA DESPESA</span>
            </button>
          ) : activeTypeFilter === 'income' ? (
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#192420] hover:bg-[#203028] border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-2xl text-xs font-bold transition-all cursor-pointer ml-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>NOVA RECEITA</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer ml-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          )}
        </div>
      </div>

      {/* Badge de Filtro Ativo / Ano Inteiro */}
      {(timeScope === 'year' || activeSavedFilter) && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold flex items-center gap-1.5 text-indigo-200">
              <Bookmark className="w-3.5 h-3.5" />
              {activeSavedFilter ? `Filtro ativo: "${activeSavedFilter.name}"` : 'Visualização Anual Ativa'}
            </span>
            <span className="text-[11px] text-indigo-400">
              {timeScope === 'year' ? `Exibindo lançamentos de todos os 12 meses de ${selectedYear}` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearActiveSavedFilter}
            className="text-[11px] font-bold text-indigo-300 hover:text-white underline cursor-pointer shrink-0 ml-2"
          >
            Voltar para visualização mensal padrão
          </button>
        </div>
      )}

      {/* 2. Cards de Resumo Superior com Suporte a Despesas, Receitas e Todas */}
      <TransactionsHeaderCards
        activeTypeFilter={activeTypeFilter}
        onSelectTypeFilter={setActiveTypeFilter}
        activeStatusFilter={advancedFilter.status}
        onSelectStatusFilter={(status) =>
          setAdvancedFilter((prev) => ({ ...prev, status }))
        }
      />

      {/* 3. Seletor de Período Centralizado no Card da Tabela (Permite Mês ou Ano Inteiro) */}
      <div className="flex items-center justify-center gap-3 py-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={timeScope === 'year' ? 'Ano anterior' : 'Mês anterior'}
        >
          <ChevronLeft className="w-5 h-5 text-indigo-400" />
        </button>

        <div className="flex items-center gap-1.5 bg-[#242042] border border-[#6366f1]/40 rounded-full p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setTimeScope(timeScope === 'month' ? 'year' : 'month')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              timeScope === 'year'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-indigo-200 hover:text-white'
            }`}
            title="Clique para alternar entre ver o Mês Selecionado ou o Ano Inteiro"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
            <span>
              {timeScope === 'year'
                ? `Ano Inteiro: ${selectedYear}`
                : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
            </span>
          </button>

          {/* Botão de Toggle Rápido para Mês / Ano */}
          <button
            type="button"
            onClick={() => setTimeScope(timeScope === 'month' ? 'year' : 'month')}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 transition-colors cursor-pointer"
            title="Alternar entre ver só este mês ou o ano todo"
          >
            {timeScope === 'year' ? 'Ver Mês' : 'Ver Ano Todo'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={timeScope === 'year' ? 'Próximo ano' : 'Próximo mês'}
        >
          <ChevronRight className="w-5 h-5 text-indigo-400" />
        </button>
      </div>

      {/* Toggle Retrátil e Card do Mapa de Calor no Desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsHeatmapOpen(!isHeatmapOpen)}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/30 hover:border-orange-500/60 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-md"
          >
            <span className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-3.5 h-3.5 fill-orange-400/40 stroke-[2.5]" />
            </span>
            <span className="text-white font-bold tracking-tight">Mapa de Calor do Mês</span>
            <span className="text-[10px] text-orange-300/80 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-500/20">
              {isHeatmapOpen ? 'Ocultar' : 'Ver ritmo diário de gastos'}
            </span>
            <span className="text-xs text-slate-400 font-bold ml-1">
              {isHeatmapOpen ? '▲' : '▼'}
            </span>
          </button>
        </div>

        {isHeatmapOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-scaleUp">
            {/* Coluna da Esquerda: Mapa de Calor (7 colunas no Desktop) */}
            <div className="lg:col-span-7">
              <ExpenseHeatmapCalendar
                transactions={filteredTransactions}
                year={selectedYear}
                month={selectedMonth}
                selectedDate={effectiveSelectedDate}
                compact={true}
                onSelectDate={(dateStr) => {
                  setSelectedHeatmapDate(dateStr);
                }}
              />
            </div>

            {/* Coluna da Direita: Painel de Lançamentos do Dia Selecionado (5 colunas no Desktop) */}
            <div className="lg:col-span-5 bg-[#181b24] border border-slate-800/90 rounded-3xl p-4 shadow-2xl flex flex-col h-full min-h-[300px]">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Calendar className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {effectiveSelectedDate
                        ? `Lançamentos de ${effectiveSelectedDate.split('-').reverse().join('/')}`
                        : 'Lançamentos do Dia'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {selectedDateTransactions.length}{' '}
                      {selectedDateTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedDateIncomeTotal > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Receitas</span>
                      <span className="text-xs font-bold text-emerald-400">
                        + {formatCurrency(selectedDateIncomeTotal)}
                      </span>
                    </div>
                  )}
                  {selectedDateExpenseTotal > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Despesas</span>
                      <span className="text-xs font-bold text-rose-400">
                        - {formatCurrency(selectedDateExpenseTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Itens do Dia */}
              {selectedDateTransactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-400">Nenhum lançamento neste dia</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Clique em outro dia no mapa de calor para ver os lançamentos detalhados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                  {/* Bloco de Receitas (se houver) */}
                  {selectedDateIncomes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 border-b border-emerald-500/10 pb-1">
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 tracking-wider uppercase">
                          Receitas ({selectedDateIncomes.length})
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400">
                          {formatCurrency(selectedDateIncomeTotal)}
                        </span>
                      </div>
                      {selectedDateIncomes.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const acc = tx.accountId ? accounts.find((a) => a.id === tx.accountId) : null;

                        return (
                          <div
                            key={tx.id}
                            onClick={() => setEditingTransaction(tx)}
                            className="group flex items-center justify-between p-2 rounded-2xl bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${cat?.color || '#10b981'}25`, color: cat?.color || '#10b981' }}
                              >
                                <CategoryIcon name={cat?.icon || 'HelpCircle'} size={15} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-normal text-slate-200 block truncate group-hover:text-white transition-colors">
                                  {tx.description}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>{cat?.name || 'Sem categoria'}</span>
                                  <span>•</span>
                                  <span>{acc?.name || 'Conta'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-2">
                              <span className="text-xs font-normal text-emerald-400 block">
                                + {formatCurrency(tx.amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center justify-end gap-0.5">
                                {tx.paid ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Pago
                                  </span>
                                ) : (
                                  <span className="text-amber-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" /> Pendente
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bloco de Despesas (se houver) */}
                  {selectedDateExpenses.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 pt-2 border-b border-rose-500/10 pb-1">
                        <span className="text-xs sm:text-sm font-bold text-rose-400 tracking-wider uppercase">
                          Despesas ({selectedDateExpenses.length})
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-400">
                          {formatCurrency(selectedDateExpenseTotal)}
                        </span>
                      </div>
                      {selectedDateExpenses.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const card = tx.creditCardId ? creditCards.find((c) => c.id === tx.creditCardId) : null;
                        const acc = tx.accountId ? accounts.find((a) => a.id === tx.accountId) : null;

                        return (
                          <div
                            key={tx.id}
                            onClick={() => setEditingTransaction(tx)}
                            className="group flex items-center justify-between p-2 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${cat?.color || '#94a3b8'}20`, color: cat?.color || '#94a3b8' }}
                              >
                                <CategoryIcon name={cat?.icon || 'HelpCircle'} size={15} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-normal text-slate-200 block truncate group-hover:text-white transition-colors">
                                  {tx.description}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>{cat?.name || 'Sem categoria'}</span>
                                  <span>•</span>
                                  <span>{card ? `Cartão ${card.name}` : acc?.name || 'Conta'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-2">
                              <span className="text-xs font-normal text-rose-400 block">
                                - {formatCurrency(tx.amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center justify-end gap-0.5">
                                {tx.paid ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Pago
                                  </span>
                                ) : (
                                  <span className="text-amber-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" /> Pendente
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Tabela de Transações Completa */}
      {displayedTransactions.length === 0 ? (
        <div className="bg-[#181c24] border border-slate-800/90 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-2">
          <p className="font-semibold text-slate-400">Nenhuma transação encontrada.</p>
          <p className="text-xs text-slate-600">Altere os filtros ou adicione um novo lançamento para este período.</p>
        </div>
      ) : (
        <TransactionsTable
          transactions={displayedTransactions}
          showTypeColumn={activeTypeFilter === 'all'}
          onEdit={(tx) => setEditingTransaction(tx)}
          onDelete={(tx) => setDeletingTransaction(tx)}
        />
      )}

      {/* Modal de Filtros Avançados */}
      <TransactionsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filter={advancedFilter}
        onApplyFilter={(newFilter) => {
          setAdvancedFilter(newFilter);
          if (newFilter.saveFilter && newFilter.filterName) {
            saveFilter({
              name: newFilter.filterName,
              searchQuery,
              scope: timeScope,
              year: selectedYear,
              type: newFilter.type,
              status: newFilter.status,
              categoryId: newFilter.categoryId,
              subcategoryId: newFilter.subcategoryId,
              accountId: newFilter.accountId,
              tag: newFilter.tag,
              startDate: newFilter.startDate,
              endDate: newFilter.endDate,
            });
          }
        }}
        onResetFilter={() =>
          setAdvancedFilter({
            startDate: '',
            endDate: '',
            categoryId: '',
            accountId: '',
            tag: '',
            status: 'all',
            type: 'all',
            saveFilter: false,
          })
        }
        savedFilters={savedFilters}
        onApplySavedFilter={handleApplySavedFilter}
        onDeleteSavedFilter={deleteFilter}
      />

      {/* Modal para Salvar Filtro Atual com Nome */}
      <SaveFilterModal
        isOpen={isSaveFilterModalOpen}
        onClose={() => setIsSaveFilterModalOpen(false)}
        currentSearchQuery={searchQuery}
        currentYear={selectedYear}
        currentScope={timeScope}
        onSave={(name, scope) => {
          const sf = saveFilter({
            name,
            searchQuery,
            scope,
            year: selectedYear,
            type: activeTypeFilter,
            status: advancedFilter.status,
            categoryId: advancedFilter.categoryId,
            subcategoryId: advancedFilter.subcategoryId,
            accountId: advancedFilter.accountId,
            tag: advancedFilter.tag,
            startDate: advancedFilter.startDate,
            endDate: advancedFilter.endDate,
          });
          setActiveSavedFilter(sf);
          setTimeScope(scope);
        }}
      />

      {/* Modal de Criação / Edição */}
      {isNewTxModalOpen && (
        <NewTransactionModal
          isOpen={isNewTxModalOpen}
          onClose={() => setIsNewTxModalOpen(false)}
          defaultType={activeTypeFilter === 'income' ? 'income' : activeTypeFilter === 'transfer' ? 'transfer' : 'expense'}
          flowType={activeTypeFilter === 'income' ? 'income' : activeTypeFilter === 'transfer' ? 'transfer' : 'expense'}
        />
      )}

      {editingTransaction && (
        <NewTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}

      {/* Modal de Exclusão com Escopo Recorrente/Parcelado */}
      {deletingTransaction && isRecurringOrInstallment ? (
        <TransactionScopeModal
          isOpen={!!deletingTransaction}
          actionType="delete"
          transaction={deletingTransaction}
          selectedMode={deleteMode}
          onSelectMode={setDeleteMode}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeletingTransaction(null);
            setDeleteMode('single');
          }}
        />
      ) : (
        <ConfirmModal
          isOpen={!!deletingTransaction}
          title="Excluir Lançamento"
          message={`Tem certeza que deseja excluir "${deletingTransaction?.description}" no valor de ${
            deletingTransaction ? formatCurrency(deletingTransaction.amount) : ''
          }? Esta ação não poderá ser desfeita.`}
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}
    </div>
  );
};
