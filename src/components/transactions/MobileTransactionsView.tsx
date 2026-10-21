'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR, getLocalDateString } from '@/lib/utils';
import { getTransactionInvoicePeriod, getEffectiveTransactionDate, isSameId } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { MobileTransactionDetailDrawer } from './MobileTransactionDetailDrawer';
import { SavedTransactionFilter } from '@/types/finance';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { SaveFilterModal } from './SaveFilterModal';
import {
  Check,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Scale,
  CreditCard,
  Repeat,
  Layers,
  Flame,
  Bookmark,
  Calendar,
} from 'lucide-react';
import { ExpenseHeatmapCalendar } from '../dashboard/ExpenseHeatmapCalendar';
import { TransactionsFilterModal, AdvancedFilterState } from './TransactionsFilterModal';
import { TransactionsOptionsMenu } from './TransactionsOptionsMenu';
import { NewTransactionModal } from './NewTransactionModal';
import { TransactionScopeModal } from './TransactionScopeModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MobileTransactionsViewProps {
  initialTypeFilter?: 'all' | 'income' | 'expense' | 'transfer';
  initialStatusFilter?: 'all' | 'pending' | 'paid';
}

export const MobileTransactionsView: React.FC<MobileTransactionsViewProps> = ({
  initialTypeFilter = 'all',
  initialStatusFilter = 'all',
}) => {
  const {
    filteredTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    summary,
    isPrivacyMode,
    updateTransaction,
    deleteTransaction,
    updateCreditCard,
    transactions: allTransactions,
    categories,
    accounts,
    creditCards,
    groupByCard,
    toggleGroupByCard,
  } = useFinance();

  // Filtros salvos
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
  const [heatmapModalDate, setHeatmapModalDate] = useState<string | null>(null);

  // Estados de Detalhe e Edição
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
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
    if (sf.type && sf.type !== 'creditCard') setActiveTypeFilter(sf.type);

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
          const card = creditCards.find((c) => isSameId(c.id, t.creditCardId));
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

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

  // Navegação de Mês ou Ano
  const handlePrevMonth = () => {
    setSelectedHeatmapDate(null);
    setHeatmapModalDate(null);
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
    setSelectedHeatmapDate(null);
    setHeatmapModalDate(null);
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

  // Cálculos de Despesas (pendentes, pagas e total)
  const pendingExpense = useMemo(() => {
    return baseTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const card = t.creditCardId ? creditCards.find((c) => isSameId(c.id, t.creditCardId)) : undefined;
        const invoicePeriod = card ? getTransactionInvoicePeriod(t, card) : null;
        const isEffectivelyPaid =
          t.paid ||
          (card && invoicePeriod
            ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
            : false);
        return !isEffectivelyPaid;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [baseTransactions, creditCards]);

  const paidExpense = useMemo(() => {
    return baseTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const card = t.creditCardId ? creditCards.find((c) => isSameId(c.id, t.creditCardId)) : undefined;
        const invoicePeriod = card ? getTransactionInvoicePeriod(t, card) : null;
        const isEffectivelyPaid =
          t.paid ||
          (card && invoicePeriod
            ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
            : false);
        return isEffectivelyPaid;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [baseTransactions, creditCards]);

  const totalExpense = pendingExpense + paidExpense;

  // Cálculos de Receitas (pendentes, recebidas e total)
  const pendingIncome = useMemo(() => {
    return baseTransactions
      .filter((t) => t.type === 'income' && !t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [baseTransactions]);

  const paidIncome = useMemo(() => {
    return baseTransactions
      .filter((t) => t.type === 'income' && t.paid)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [baseTransactions]);

  const totalIncome = pendingIncome + paidIncome;

  const getTxDate = (tx: Transaction) => {
    const card = creditCards.find((c) => isSameId(c.id, tx.creditCardId));
    return getEffectiveTransactionDate(tx, card);
  };

  // Filtragem Dinâmica
  const displayedTransactions = useMemo(() => {
    const filtered = baseTransactions.filter((tx) => {
      if (activeTypeFilter !== 'all' && tx.type !== activeTypeFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesDesc && !matchesAmount) return false;
      }

      const txDate = getTxDate(tx);
      if (advancedFilter.startDate && txDate < advancedFilter.startDate) return false;
      if (advancedFilter.endDate && txDate > advancedFilter.endDate) return false;

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
      const card = tx.creditCardId ? creditCards.find((c) => isSameId(c.id, tx.creditCardId)) : undefined;
      const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
      const isTxEffectivelyPaid =
        tx.paid ||
        (card && invoicePeriod
          ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
          : false);

      if (advancedFilter.status === 'paid' && !isTxEffectivelyPaid) return false;
      if (advancedFilter.status === 'pending' && isTxEffectivelyPaid) return false;
      if (advancedFilter.type === 'creditCard') {
        if (!tx.creditCardId) return false;
      } else if (advancedFilter.type === 'expense') {
        if (tx.type !== 'expense' || Boolean(tx.creditCardId)) return false;
      } else if (advancedFilter.type !== 'all' && tx.type !== advancedFilter.type) {
        return false;
      }

      return true;
    });

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

    // 3. Gerar item sintético de fatura para cada cartão com compras
    const aggregatedCardItems: Transaction[] = [];
    cardGroupsMap.forEach((txList, cardId) => {
      const card = creditCards.find(c => isSameId(c.id, cardId));
      const totalAmount = txList.reduce((acc, t) => acc + t.amount, 0);
      const isPaid = card?.manualInvoiceStatus?.[currentPeriodKey] === 'paid' || txList.every(t => t.paid);
      
      const dueDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(card?.dueDay || 10).padStart(2, '0')}`;
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
  }, [filteredTransactions, activeTypeFilter, searchQuery, advancedFilter, groupByCard, creditCards, accounts, categories, selectedYear, selectedMonth]);

  // Transações do dia selecionado para o card suspenso (Mobile)
  const effectiveHeatmapDate = useMemo(() => {
    if (selectedHeatmapDate) return selectedHeatmapDate;
    const todayStr = getLocalDateString(new Date());
    const [todayY, todayM] = todayStr.split('-').map(Number);
    if (todayY === selectedYear && todayM === selectedMonth + 1) {
      return todayStr;
    }
    return null;
  }, [selectedHeatmapDate, selectedYear, selectedMonth]);

  const heatmapDayModalData = useMemo(() => {
    if (!heatmapModalDate) {
      return { transactions: [], expenses: [], incomes: [], expenseTotal: 0, incomeTotal: 0, total: 0 };
    }
    const txs = baseTransactions.filter((t) => {
      const effectiveDateStr = getTxDate(t);
      const d = effectiveDateStr ? effectiveDateStr.split('T')[0] : '';
      return d === heatmapModalDate;
    });

    const expenseTxs = txs.filter(t => t.type === 'expense' || !!t.creditCardId);
    const incomeTxs = txs.filter(t => t.type === 'income');

    const expenseTotal = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
    const incomeTotal = incomeTxs.reduce((acc, t) => acc + t.amount, 0);

    return {
      transactions: txs,
      expenses: expenseTxs,
      incomes: incomeTxs,
      expenseTotal,
      incomeTotal,
      total: expenseTotal,
    };
  }, [baseTransactions, heatmapModalDate, creditCards]);


  // Agrupamento por Dias no padrão Mobills: "Ontem", "Hoje", "Segunda, 21", etc.
  const groupedByDate = useMemo(() => {
    const now = new Date();
    const today = getLocalDateString(now);

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);

    const sorted = [...displayedTransactions].sort((a, b) => {
      const dateA = getTxDate(a);
      const dateB = getTxDate(b);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const groups: { dateKey: string; label: string; items: Transaction[]; isToday?: boolean; isYesterday?: boolean }[] = [];

    sorted.forEach((tx) => {
      const effectiveDate = getTxDate(tx);
      const existing = groups.find((g) => g.dateKey === effectiveDate);
      if (existing) {
        existing.items.push(tx);
      } else {
        let label = '';
        const isToday = effectiveDate === today;
        const isYesterday = effectiveDate === yesterday;

        if (isToday) {
          label = 'Hoje';
        } else if (isYesterday) {
          label = 'Ontem';
        } else {
          const [y, m, d] = effectiveDate.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          const weekDay = WEEKDAY_NAMES[dt.getDay()];
          label = `${weekDay}, ${d}`;
        }

        groups.push({
          dateKey: effectiveDate,
          label,
          items: [tx],
          isToday,
          isYesterday,
        });
      }
    });

    return groups;
  }, [displayedTransactions, creditCards]);

  // Referência do cabeçalho fixo para medição dinâmica de altura
  const stickyHeaderRef = React.useRef<HTMLDivElement>(null);

  const [confirmingPayment, setConfirmingPayment] = useState<{
    tx: Transaction | null;
    isGroupedCard?: boolean;
    cardId?: string;
    periodKey?: string;
    invoiceInfo?: { cardName: string; amount: number; dueDate: string } | null;
    currentPaid: boolean;
  } | null>(null);

  const togglePaid = (e: React.MouseEvent, id: string, currentPaid: boolean, txItem?: Transaction) => {
    e.stopPropagation();

    // Se for fatura sintética de cartão
    if (id.startsWith('grouped-card-')) {
      const parts = id.replace('grouped-card-', '').split('-');
      const cardId = parts[0];
      const periodKey = `${parts[1]}-${parts[2]}`;
      const card = creditCards.find(c => c.id === cardId);
      setConfirmingPayment({
        tx: null,
        isGroupedCard: true,
        cardId,
        periodKey,
        invoiceInfo: {
          cardName: card?.name ? `Fatura Cartão ${card.name}` : 'Fatura Cartão de Crédito',
          amount: txItem?.amount || 0,
          dueDate: txItem?.date || '',
        },
        currentPaid,
      });
      return;
    }

    const tx = txItem || displayedTransactions.find(t => t.id === id) || null;
    setConfirmingPayment({
      tx,
      currentPaid,
    });
  };

  const handleConfirmExecutePayment = (paymentDate?: string) => {
    if (!confirmingPayment) return;
    const { tx, isGroupedCard, cardId, periodKey, currentPaid } = confirmingPayment;

    if (isGroupedCard && cardId && periodKey) {
      const card = creditCards.find(c => c.id === cardId);
      if (card) {
        const nextPaidStatus = !currentPaid;
        const newInvoiceStatus: 'open' | 'paid' = nextPaidStatus ? 'paid' : 'open';
        const updatedManual = {
          ...(card.manualInvoiceStatus || {}),
          [periodKey]: newInvoiceStatus,
        };
        updateCreditCard(card.id, {
          manualInvoiceStatus: updatedManual,
        });

        // Atualizar todas as compras vinculadas a esta fatura
        allTransactions.forEach(t => {
          if (t.creditCardId === card.id) {
            const { periodKey: txPeriodKey } = getTransactionInvoicePeriod(t, card);
            if (txPeriodKey === periodKey && t.paid !== nextPaidStatus) {
              updateTransaction(t.id, { paid: nextPaidStatus });
            }
          }
        });
      }
      setConfirmingPayment(null);
      return;
    }

    if (tx) {
      const nextPaid = !currentPaid;
      updateTransaction(tx.id, {
        paid: nextPaid,
        ...(paymentDate && nextPaid ? { paymentDate } : {}),
      });
    }

    setConfirmingPayment(null);
  };

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

  return (
    <div className="space-y-4 pb-28 animate-fadeIn text-slate-100">
      {/* Container Sticky Superior no Mobile (Fixa dropdown de tipo, mês e cards de resumo ao rolar) */}
      <div ref={stickyHeaderRef} className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md pt-1 pb-3 -mx-2 px-2 border-b border-slate-900/60 shadow-lg space-y-2.5">
        {/* 1. Header Superior Mobile com Dropdown de Tipo e Ações */}
        <div className="flex items-center justify-between pt-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              className="flex items-center gap-1.5 text-lg font-bold text-white tracking-tight cursor-pointer"
            >
              <span>
                {activeTypeFilter === 'income'
                  ? 'Receitas'
                  : activeTypeFilter === 'expense'
                  ? 'Despesas'
                  : activeTypeFilter === 'transfer'
                  ? 'Transferências'
                  : 'Transações'}
              </span>
              <span className="text-xs text-slate-400">▾</span>
            </button>

            {typeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setTypeDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-52 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-40 py-2 animate-scaleUp text-xs space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('all');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 text-slate-200 text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Todas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('expense');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 text-slate-200 text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Despesas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('income');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 text-slate-200 text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Receitas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTypeFilter('transfer');
                      setTypeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 text-slate-200 text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Transferências</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Ícones de Busca, Filtro e Mais Opções */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 bg-[#1e2330] border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white relative"
            >
              <Filter className="w-4 h-4" />
              {(advancedFilter.categoryId || advancedFilter.status !== 'all' || advancedFilter.tag) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                className="p-2 text-slate-400 hover:text-white"
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
          </div>
        </div>

        {/* Badge de Filtro Ativo / Ano Inteiro Mobile */}
        {(timeScope === 'year' || activeSavedFilter) && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-300 animate-fadeIn">
            <div className="flex items-center gap-1.5 truncate">
              <Bookmark className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="font-bold truncate text-indigo-200">
                {activeSavedFilter ? activeSavedFilter.name : `Ano todo: ${selectedYear}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearActiveSavedFilter}
              className="font-bold text-indigo-400 hover:text-white underline text-[10px] ml-2 shrink-0"
            >
              Limpar
            </button>
          </div>
        )}

        {/* 2. Navegador de Mês / Ano Centralizado Mobile */}
        <div className="flex items-center justify-center gap-3 py-1 text-xs font-semibold text-slate-300">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 text-slate-400 hover:text-white"
            title={timeScope === 'year' ? 'Ano anterior' : 'Mês anterior'}
          >
            <ChevronLeft className="w-4 h-4 text-indigo-400" />
          </button>

          <div className="flex items-center gap-1.5 bg-[#242042] border border-[#6366f1]/40 rounded-full px-3 py-1 shadow-inner">
            <button
              type="button"
              onClick={() => setTimeScope(timeScope === 'month' ? 'year' : 'month')}
              className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1.5"
            >
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>
                {timeScope === 'year'
                  ? `Ano: ${selectedYear}`
                  : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTimeScope(timeScope === 'month' ? 'year' : 'month')}
              className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 uppercase"
            >
              {timeScope === 'year' ? 'Mês' : 'Ano'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 text-slate-400 hover:text-white"
            title={timeScope === 'year' ? 'Próximo ano' : 'Próximo mês'}
          >
            <ChevronRight className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        {/* 3. Cards de Resumo Superior Mobile (Despesas, Receitas ou Saldo/Balanço) */}
        {activeTypeFilter === 'expense' ? (
          <div className="grid grid-cols-3 gap-2 animate-fadeIn">
            {/* Despesas pendentes */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({
                  ...prev,
                  status: prev.status === 'pending' ? 'all' : 'pending',
                }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'pending'
                  ? 'border-rose-500/70 bg-[#2b2229]'
                  : 'border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Despesas pendentes
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(pendingExpense)}
                </span>
              </div>
            </button>

            {/* Despesas pagas */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({
                  ...prev,
                  status: prev.status === 'paid' ? 'all' : 'paid',
                }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'paid'
                  ? 'border-rose-500/70 bg-[#2b2229]'
                  : 'border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Despesas pagas
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(paidExpense)}
                </span>
              </div>
            </button>

            {/* Total Despesas */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({ ...prev, status: 'all' }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'all'
                  ? 'border-slate-700/60'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Total
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(totalExpense)}
                </span>
              </div>
            </button>
          </div>
        ) : activeTypeFilter === 'income' ? (
          <div className="grid grid-cols-3 gap-2 animate-fadeIn">
            {/* Receitas pendentes */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({
                  ...prev,
                  status: prev.status === 'pending' ? 'all' : 'pending',
                }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'pending'
                  ? 'border-emerald-500/70 bg-[#1c2923]'
                  : 'border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Receitas pendentes
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(pendingIncome)}
                </span>
              </div>
            </button>

            {/* Receitas recebidas */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({
                  ...prev,
                  status: prev.status === 'paid' ? 'all' : 'paid',
                }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'paid'
                  ? 'border-emerald-500/70 bg-[#1c2923]'
                  : 'border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Receitas recebidas
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(paidIncome)}
                </span>
              </div>
            </button>

            {/* Total Receitas */}
            <button
              type="button"
              onClick={() =>
                setAdvancedFilter((prev) => ({ ...prev, status: 'all' }))
              }
              className={`bg-[#242732] border rounded-2xl p-2.5 shadow-md flex flex-col justify-between text-left transition-all cursor-pointer ${
                advancedFilter.status === 'all'
                  ? 'border-slate-700/60'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
              <div className="mt-2 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  Total
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {displayVal(totalIncome)}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-[#242732] border border-slate-700/60 rounded-3xl p-4 shadow-xl flex items-center justify-between animate-fadeIn">
            {/* Saldo Atual */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Saldo atual</span>
                <span
                  className={`text-sm font-bold block ${
                    summary.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {displayVal(summary.totalBalance)}
                </span>
              </div>
            </div>

            {/* Balanço Mensal */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Balanço mensal</span>
                <span
                  className={`text-sm font-bold block ${
                    summary.monthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {displayVal(summary.monthlySavings)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Retrátil e Card do Mapa de Calor */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsHeatmapOpen(!isHeatmapOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-900 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-3.5 h-3.5 fill-orange-400/40 stroke-[2.5]" />
            </span>
            <span className="text-white font-bold tracking-tight">Mapa de Calor do Mês</span>
            <span className="text-[10px] text-orange-300/80 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-500/20">
              {isHeatmapOpen ? 'Ocultar' : 'Ver ritmo diário'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {isHeatmapOpen ? '▲' : '▼'}
          </span>
        </button>

        {isHeatmapOpen && (
          <div className="animate-scaleUp">
            <ExpenseHeatmapCalendar
              transactions={filteredTransactions}
              year={selectedYear}
              month={selectedMonth}
              selectedDate={effectiveHeatmapDate}
              onSelectDate={(dateStr) => {
                setSelectedHeatmapDate(dateStr);
                setHeatmapModalDate(dateStr);
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Lista de Transações Agrupadas por Data */}
      {groupedByDate.length === 0 ? (
        <div className="bg-[#242732] border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs">
          Nenhuma transação encontrada para este período.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div
              key={group.dateKey}
              id={group.isToday ? 'tx-group-hoje' : group.isYesterday ? 'tx-group-ontem' : `tx-group-${group.dateKey}`}
              data-is-today={group.isToday ? 'true' : undefined}
              data-is-yesterday={group.isYesterday ? 'true' : undefined}
              data-date-key={group.dateKey}
              className="space-y-2 scroll-mt-52"
            >
              {/* Título do Dia */}
              <h4 className="text-sm font-bold text-slate-200 px-1">{group.label}</h4>

              {/* Itens do Dia */}
              <div className="space-y-1.5">
                {group.items.map((tx) => {
                  const directCat = categories.find((c) => c.id === tx.categoryId);
                  const parentCat = directCat?.parentId ? categories.find((c) => c.id === directCat.parentId) : null;
                  const cat = parentCat || directCat;
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const card = creditCards.find((c) => isSameId(c.id, tx.creditCardId));
                  const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
                  const isEffectivelyPaid =
                    tx.paid ||
                    (card && invoicePeriod
                      ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
                      : false);

                  const isGroupedCard = tx.id.startsWith('grouped-card-') || tx.categoryId === 'grouped-card-category';

                  const accountName =
                    tx.type === 'transfer'
                      ? `${acc?.name || 'Conta'} ➔ ${destAcc?.name || 'Conta'}`
                      : card
                      ? card.name
                      : acc?.name || 'Conta';
                  const categoryName = isGroupedCard ? 'Agrupada cartão' : (cat?.name || 'Geral');

                  return (
                    <div
                      key={tx.id}
                      onClick={() => !isGroupedCard && setSelectedTxDetail(tx)}
                      className={`flex items-center justify-between p-3.5 bg-[#242732]/90 border border-slate-800/70 hover:border-slate-700 rounded-2xl transition-all active:scale-[0.99] cursor-pointer ${
                        isGroupedCard ? 'border-teal-500/30 bg-[#1d2729]/60' : ''
                      }`}
                    >
                      {/* Ícone e Descrição */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {isGroupedCard ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0d9488] text-white font-bold text-xs shrink-0 shadow-md mt-0.5">
                            AG
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md mt-0.5"
                            style={{
                              backgroundColor:
                                cat?.color || (tx.type === 'transfer' ? '#3B82F6' : isExpense ? '#f97316' : '#84cc16'),
                            }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-normal text-slate-100 text-xs truncate">
                              {tx.description}
                            </span>
                            {tx.isRecurring && (
                              <span className="inline-flex items-center gap-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 text-[9px] font-normal px-1.5 py-0.2 rounded-md shrink-0 shadow-sm" title="Despesa/Receita Fixa">
                                <Repeat className="w-2 h-2" /> Fixo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                            <span className="truncate">{categoryName}</span>
                            <span className="text-slate-600">|</span>
                            {card ? (
                              <span className="inline-flex items-center gap-1 text-cyan-300 truncate">
                                <CreditCard className="w-3 h-3 shrink-0 text-cyan-400" />
                                <span className="truncate">{accountName}</span>
                              </span>
                            ) : (
                              <span className="truncate">{accountName}</span>
                            )}
                          </div>

                          {/* Observação / Notas */}
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 italic truncate mt-0.5 flex items-center gap-1">
                              <span className="text-slate-500 not-italic font-medium">Obs:</span> {tx.notes}
                            </p>
                          )}

                          {/* Tags */}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tx.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                                >
                                  #{tag.replace(/^#/, '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Valor e Botão de Status */}
                      <div className="flex items-center gap-2.5 shrink-0 ml-3 self-center">
                        <span
                          className={`text-xs font-normal ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-rose-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => togglePaid(e, tx.id, isEffectivelyPaid, tx)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                              isEffectivelyPaid
                                ? 'bg-[#22c55e] text-slate-950 shadow-sm'
                                : 'bg-[#ef4444] text-white shadow-sm'
                            }`}
                            title={isEffectivelyPaid ? 'Efetivado / Pago' : 'Pendente de pagamento'}
                          >
                            {isEffectivelyPaid ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <span className="text-[10px] font-black leading-none">!</span>
                            )}
                          </button>

                          {/* Mini ícone de cartão para itens agrupados */}
                          {isGroupedCard && (
                            <div
                              className="w-5 h-5 rounded-full bg-[#14b8a6] text-slate-950 flex items-center justify-center shadow-sm shrink-0"
                              title="Fatura de Cartão de Crédito Agrupada"
                            >
                              <CreditCard className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer de Detalhes da Transação Mobile */}
      <MobileTransactionDetailDrawer
        transaction={selectedTxDetail}
        isOpen={!!selectedTxDetail}
        onClose={() => setSelectedTxDetail(null)}
        onEdit={(tx) => {
          setSelectedTxDetail(null);
          setEditingTransaction(tx);
        }}
        onDelete={(tx) => {
          setSelectedTxDetail(null);
          setDeletingTransaction(tx);
        }}
      />

      {/* Modal de Confirmação de Efetivação / Pagamento com data */}
      {confirmingPayment && (
        <ConfirmPaymentModal
          isOpen={Boolean(confirmingPayment)}
          onClose={() => setConfirmingPayment(null)}
          onConfirm={handleConfirmExecutePayment}
          currentPaid={confirmingPayment.currentPaid}
          transaction={confirmingPayment.tx}
          isGroupedCard={confirmingPayment.isGroupedCard}
          invoiceInfo={confirmingPayment.invoiceInfo}
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

      {/* Modal para Salvar Filtro Atual com Nome (Mobile) */}
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

      {/* Modal de Edição */}
      {editingTransaction && (
        <NewTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}

      {/* Modal de Exclusão */}
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
          message={`Tem certeza que deseja excluir "${deletingTransaction?.description}"?`}
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}

      {/* Card Suspenso (Bottom Sheet) com Lançamentos do Dia Selecionado */}
      {heatmapModalDate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setHeatmapModalDate(null)}
          />

          {/* Drawer Suspenso */}
          <div className="relative w-full max-w-lg bg-[#181b24] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-10 animate-slideUp max-h-[80vh] flex flex-col">
            {/* Puxador decorativo */}
            <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mb-4" />

            {/* Cabeçalho do Card Suspenso */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                  Mapa de Calor
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Lançamentos de {heatmapModalDate.split('-').reverse().join('/')}
                </h3>
                <span className="text-xs text-slate-400">
                  {heatmapDayModalData.transactions.length}{' '}
                  {heatmapDayModalData.transactions.length === 1 ? 'lançamento' : 'lançamentos'}
                </span>
              </div>

              <div className="text-right flex items-center gap-2.5">
                <div className="flex flex-col items-end gap-0.5">
                  {heatmapDayModalData.incomeTotal > 0 && (
                    <span className="text-xs font-bold text-emerald-400">
                      + {formatCurrency(heatmapDayModalData.incomeTotal)}
                    </span>
                  )}
                  {heatmapDayModalData.expenseTotal > 0 && (
                    <span className="text-xs font-bold text-rose-400">
                      - {formatCurrency(heatmapDayModalData.expenseTotal)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setHeatmapModalDate(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista com scroll suave */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {heatmapDayModalData.transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs space-y-1">
                  <p className="font-semibold text-slate-400">Nenhum lançamento neste dia</p>
                  <p className="text-[11px] text-slate-600">Este dia foi livre de movimentações.</p>
                </div>
              ) : (
                <>
                  {/* Bloco de Receitas no Mobile */}
                  {heatmapDayModalData.incomes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 border-b border-emerald-500/10 pb-1">
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 tracking-wider uppercase">
                          Receitas ({heatmapDayModalData.incomes.length})
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400">
                          {formatCurrency(heatmapDayModalData.incomeTotal)}
                        </span>
                      </div>
                      {heatmapDayModalData.incomes.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const acc = tx.accountId ? accounts.find((a) => a.id === tx.accountId) : null;

                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setHeatmapModalDate(null);
                              setSelectedTxDetail(tx);
                            }}
                            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/20 active:bg-emerald-950/40 border border-emerald-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${cat?.color || '#10b981'}25`, color: cat?.color || '#10b981' }}
                              >
                                <CategoryIcon name={cat?.icon || 'HelpCircle'} size={16} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-normal text-slate-100 block truncate">
                                  {tx.description}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{cat?.name || 'Sem categoria'}</span>
                                  <span>•</span>
                                  <span>{acc?.name || 'Conta'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <span className="text-xs font-normal text-emerald-400 block">
                                + {formatCurrency(tx.amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">
                                {tx.paid ? (
                                  <span className="text-emerald-400">✓ Pago</span>
                                ) : (
                                  <span className="text-amber-400">⏳ Pendente</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bloco de Despesas no Mobile */}
                  {heatmapDayModalData.expenses.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1 pt-2 border-b border-rose-500/10 pb-1">
                        <span className="text-xs sm:text-sm font-bold text-rose-400 tracking-wider uppercase">
                          Despesas ({heatmapDayModalData.expenses.length})
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-400">
                          {formatCurrency(heatmapDayModalData.expenseTotal)}
                        </span>
                      </div>
                      {heatmapDayModalData.expenses.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const card = tx.creditCardId ? creditCards.find((c) => isSameId(c.id, tx.creditCardId)) : null;
                        const acc = tx.accountId ? accounts.find((a) => a.id === tx.accountId) : null;

                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setHeatmapModalDate(null);
                              setSelectedTxDetail(tx);
                            }}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 active:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${cat?.color || '#94a3b8'}20`, color: cat?.color || '#94a3b8' }}
                              >
                                <CategoryIcon name={cat?.icon || 'HelpCircle'} size={16} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-normal text-slate-100 block truncate">
                                  {tx.description}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{cat?.name || 'Sem categoria'}</span>
                                  <span>•</span>
                                  <span>{card ? `Cartão ${card.name}` : acc?.name || 'Conta'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <span className="text-xs font-normal text-rose-400 block">
                                - {formatCurrency(tx.amount)}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">
                                {tx.paid ? (
                                  <span className="text-emerald-400">✓ Pago</span>
                                ) : (
                                  <span className="text-amber-400">⏳ Pendente</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
