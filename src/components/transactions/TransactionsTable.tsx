'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR, getLocalDateString } from '@/lib/utils';
import { getTransactionInvoicePeriod, getEffectiveTransactionDate, isSameId } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { TransactionRowMenu } from './TransactionRowMenu';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';
import { BatchEditModal } from './BatchEditModal';
import { Check, Clock, CreditCard, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Repeat, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Search, Edit3, Trash2 } from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
  showTypeColumn?: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onAttach?: (tx: Transaction) => void;
  onConvertTransfer?: (tx: Transaction) => void;
  onExportExcel?: (filteredList: Transaction[]) => void;
  onFilteredTransactionsChange?: (filtered: Transaction[]) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  showTypeColumn = true,
  onEdit,
  onDelete,
  onAttach,
  onConvertTransfer,
  onExportExcel,
  onFilteredTransactionsChange,
}) => {
  const { categories, accounts, creditCards, selectedMonth, selectedYear, updateTransaction, updateTransactionsBatch, deleteTransaction, addTransaction, updateCreditCard, transactions: allTransactions } = useFinance();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
  const [openMenuTxId, setOpenMenuTxId] = useState<string | null>(null);

  // Estado para caixa box de confirmação de pagamento
  const [confirmingPayment, setConfirmingPayment] = useState<{
    tx: Transaction | null;
    isGroupedCard?: boolean;
    cardId?: string;
    periodKey?: string;
    invoiceInfo?: { cardName: string; amount: number; dueDate: string } | null;
    currentPaid: boolean;
  } | null>(null);

  // Estados de Ordenação por Coluna (Padrão: data crescente, menor data do mês primeiro)
  type SortField = 'date' | 'status' | 'type' | 'description' | 'category' | 'account' | 'amount';
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estados de Filtro por Coluna
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDescription, setFilterDescription] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');

  // Controle de Dropdown de Filtro Aberto no Cabeçalho
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  const getTxDate = (tx: Transaction) => {
    const card = creditCards.find((c) => isSameId(c.id, tx.creditCardId));
    return getEffectiveTransactionDate(tx, card);
  };

  const getTxAccountOrCardName = (tx: Transaction) => {
    if (tx.type === 'transfer') {
      const from = accounts.find((a) => isSameId(a.id, tx.accountId))?.name || 'Conta';
      const to = accounts.find((a) => isSameId(a.id, tx.destinationAccountId))?.name || 'Conta';
      return `${from} -> ${to}`;
    }
    const card = creditCards.find((c) => isSameId(c.id, tx.creditCardId));
    if (card) return card.name;
    const acc = accounts.find((a) => isSameId(a.id, tx.accountId));
    return acc?.name || 'Conta';
  };

  const getTxCategoryName = (tx: Transaction) => {
    const cat = categories.find((c) => isSameId(c.id, tx.categoryId));
    return cat?.name || 'Sem Categoria';
  };

  const getTxTypeLabel = (tx: Transaction) => {
    if (tx.type === 'income') return 'Receita';
    if (tx.type === 'transfer') return 'Transferência';
    if (tx.creditCardId || tx.id.startsWith('grouped-card-')) return 'Despesa Cartão';
    return 'Despesa';
  };

  const hasActiveColumnFilters = 
    filterStatus !== 'all' || 
    filterType !== 'all' || 
    filterDescription.trim() !== '' || 
    filterCategoryId !== 'all' || 
    filterAccountId !== 'all';

  const clearAllColumnFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setFilterDescription('');
    setFilterCategoryId('all');
    setFilterAccountId('all');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // 1. Filtragem das transações pelas colunas
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filtro de Situação
      if (filterStatus === 'paid' && !tx.paid) return false;
      if (filterStatus === 'pending' && tx.paid) return false;

      // Filtro de Tipo
      if (filterType !== 'all') {
        const typeLabel = getTxTypeLabel(tx);
        if (filterType === 'income' && typeLabel !== 'Receita') return false;
        if (filterType === 'expense' && typeLabel !== 'Despesa') return false;
        if (filterType === 'creditCard' && typeLabel !== 'Despesa Cartão') return false;
        if (filterType === 'transfer' && typeLabel !== 'Transferência') return false;
      }

      // Filtro de Descrição
      if (filterDescription.trim()) {
        const q = filterDescription.trim().toLowerCase();
        if (!tx.description.toLowerCase().includes(q)) return false;
      }

      // Filtro de Categoria
      if (filterCategoryId !== 'all') {
        if (!isSameId(tx.categoryId, filterCategoryId)) {
          const directCat = categories.find(c => isSameId(c.id, tx.categoryId));
          if (!directCat?.parentId || !isSameId(directCat.parentId, filterCategoryId)) {
            return false;
          }
        }
      }

      // Filtro de Conta / Cartão
      if (filterAccountId !== 'all') {
        if (filterAccountId.startsWith('card-')) {
          const cardId = filterAccountId.replace('card-', '');
          if (!isSameId(tx.creditCardId, cardId)) return false;
        } else if (filterAccountId.startsWith('acc-')) {
          const accId = filterAccountId.replace('acc-', '');
          const matchFrom = isSameId(tx.accountId, accId);
          const matchTo = isSameId(tx.destinationAccountId, accId);
          if (!matchFrom && !matchTo) return false;
        }
      }

      return true;
    });
  }, [transactions, filterStatus, filterType, filterDescription, filterCategoryId, filterAccountId, categories, accounts, creditCards]);

  // 2. Ordenação das transações filtradas
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date': {
          const dateA = getTxDate(a);
          const dateB = getTxDate(b);
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
          break;
        }
        case 'status': {
          comparison = (a.paid === b.paid) ? 0 : a.paid ? 1 : -1;
          break;
        }
        case 'type': {
          const labelA = getTxTypeLabel(a);
          const labelB = getTxTypeLabel(b);
          comparison = labelA.localeCompare(labelB, 'pt-BR');
          break;
        }
        case 'description': {
          comparison = (a.description || '').localeCompare(b.description || '', 'pt-BR');
          break;
        }
        case 'category': {
          const catA = getTxCategoryName(a);
          const catB = getTxCategoryName(b);
          comparison = catA.localeCompare(catB, 'pt-BR');
          break;
        }
        case 'account': {
          const accA = getTxAccountOrCardName(a);
          const accB = getTxAccountOrCardName(b);
          comparison = accA.localeCompare(accB, 'pt-BR');
          break;
        }
        case 'amount': {
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortDirection, creditCards, categories, accounts]);

  // Notificar componente pai sobre os itens filtrados na tabela
  useEffect(() => {
    onFilteredTransactionsChange?.(sortedTransactions);
  }, [sortedTransactions, onFilteredTransactionsChange]);

  // Paginação
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return sortedTransactions.slice(start, start + rowsPerPage);
  }, [sortedTransactions, safeCurrentPage, rowsPerPage]);

  // Agrupamento por dia (usado apenas quando a ordenação for por data)
  const isDateSort = sortField === 'date';

  const dailyGroups = useMemo(() => {
    if (!isDateSort) return [];
    const groups: { date: string; items: Transaction[]; dayBalance: number }[] = [];

    paginatedTransactions.forEach((tx) => {
      const txEffectiveDate = getTxDate(tx);
      const existing = groups.find((g) => g.date === txEffectiveDate);
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      if (existing) {
        existing.items.push(tx);
        existing.dayBalance += delta;
      } else {
        groups.push({
          date: txEffectiveDate,
          items: [tx],
          dayBalance: delta,
        });
      }
    });

    return groups;
  }, [paginatedTransactions, isDateSort, creditCards]);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === sortedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedTransactions.map(t => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectedTransactionsList = useMemo(() => {
    const idsSet = new Set(selectedIds);
    return transactions.filter(t => idsSet.has(t.id));
  }, [transactions, selectedIds]);

  const handleApplyBatchEdit = (updates: Partial<Transaction>) => {
    if (selectedIds.length === 0) return;
    updateTransactionsBatch(selectedIds, updates);
    setSelectedIds([]);
  };

  const handleBatchTogglePaid = (targetPaid: boolean) => {
    if (selectedIds.length === 0) return;
    updateTransactionsBatch(selectedIds, { paid: targetPaid });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      deleteTransaction(id, 'single');
    });
    setSelectedIds([]);
  };

  const handleRequestTogglePaid = (id: string, currentPaid: boolean, txItem?: Transaction) => {
    // Se for uma linha sintética de fatura agrupada
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

    const tx = txItem || sortedTransactions.find(t => t.id === id) || null;
    setConfirmingPayment({
      tx,
      currentPaid,
    });
  };

  const handleConfirmExecutePayment = (paymentDate?: string, accountId?: string) => {
    if (!confirmingPayment) return;
    const { tx, isGroupedCard, cardId, periodKey, currentPaid, invoiceInfo } = confirmingPayment;

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

  const paginationStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const paginationEnd = Math.min(safeCurrentPage * rowsPerPage, totalItems);

  const renderTransactionRow = (tx: Transaction) => {
    const directCat = categories.find((c) => c.id === tx.categoryId);
    const parentCat = directCat?.parentId ? categories.find((c) => c.id === directCat.parentId) : null;
    const cat = parentCat || directCat;
    const acc = accounts.find((a) => a.id === tx.accountId);
    const card = creditCards.find((c) => isSameId(c.id, tx.creditCardId));
    const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

    const effectiveDate = getEffectiveTransactionDate(tx, card);
    const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
    const isEffectivelyPaid =
      tx.paid ||
      (card && invoicePeriod
        ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
        : false);

    const isExpense = tx.type === 'expense';
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const isSelected = selectedIds.includes(tx.id);

    const isGroupedCard = tx.id.startsWith('grouped-card-') || tx.categoryId === 'grouped-card-category';

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    const isToday = effectiveDate === todayStr;
    const isYesterday = effectiveDate === yesterdayStr;

    return (
      <tr
        key={tx.id}
        id={isToday ? 'desktop-tx-row-hoje' : isYesterday ? 'desktop-tx-row-ontem' : undefined}
        className={`hover:bg-[#1e2330]/70 transition-colors ${
          isSelected ? 'bg-indigo-950/20' : ''
        } ${isGroupedCard ? 'bg-[#151921]/60' : ''} ${
          isToday ? 'bg-indigo-500/5' : ''
        }`}
      >
        {/* Checkbox */}
        <td className="py-3 px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleSelect(tx.id)}
            className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
          />
        </td>

        {/* Situação */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRequestTogglePaid(tx.id, isEffectivelyPaid, tx)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all select-none cursor-pointer ${
                isEffectivelyPaid
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-[#ef4444] text-white shadow-sm'
              }`}
              title={isEffectivelyPaid ? 'Efetivado / Pago' : 'Pendente de pagamento'}
            >
              {isEffectivelyPaid ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <span className="text-xs font-black leading-none">!</span>
              )}
            </button>

            {/* Mini badge teal de cartão quando a linha for agrupada */}
            {isGroupedCard && (
              <div
                className="w-6 h-6 rounded-full bg-[#14b8a6] text-slate-950 flex items-center justify-center shadow-sm shrink-0"
                title="Fatura de Cartão de Crédito Agrupada"
              >
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </td>

        {/* Tipo (exibido apenas em visualização mista) */}
        {showTypeColumn && (
          <td className="py-3 px-3 whitespace-nowrap">
            {isIncome && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Receita
              </span>
            )}
            {isExpense && (
              Boolean(tx.creditCardId || isGroupedCard) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Despesa Cartão
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  Despesa
                </span>
              )
            )}
            {isTransfer && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Transferência
              </span>
            )}
          </td>
        )}

        {/* Data */}
        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span>{formatDateBR(effectiveDate)}</span>
            {isToday && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hoje
              </span>
            )}
            {!isToday && isYesterday && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                Ontem
              </span>
            )}
          </div>
        </td>

        {/* Descrição */}
        <td className="py-3 px-4 min-w-[180px] max-w-[280px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-white truncate" title={tx.description}>
              {tx.description}
            </span>
            {tx.isRecurring && (
              <span className="inline-flex items-center gap-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 shadow-sm" title="Despesa/Receita Fixa">
                <Repeat className="w-2.5 h-2.5" /> Fixo
              </span>
            )}
            {tx.isDecreasing && (
              <span className="inline-flex items-center gap-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/70 text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 shadow-sm" title="Despesa Prevista (Reserva mensal decrescente)">
                📉 Previsto
              </span>
            )}
          </div>

          {/* Observação */}
          {tx.notes && (
            <span
              className="text-[11px] text-slate-400 italic block truncate mt-0.5"
              title={`Observação: ${tx.notes}`}
            >
              {tx.notes}
            </span>
          )}

          {/* Tags */}
          {tx.tags && tx.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tx.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </td>

        {/* Categoria */}
        <td className="py-3 px-4">
          {isGroupedCard ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-[10px] tracking-tight shrink-0 shadow-sm">
                AG
              </div>
              <span className="text-slate-300 truncate font-normal">Agrupada cartão</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: cat?.color || '#6B7280' }}
              >
                <CategoryIcon name={cat?.icon || 'Tag'} size={12} />
              </div>
              <span className="text-slate-300 truncate">{cat?.name || 'Geral'}</span>
            </div>
          )}
        </td>

        {/* Conta / Cartão */}
        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
          {isTransfer ? (
            <span>{acc?.name || 'Conta'} ➔ {destAcc?.name || 'Conta'}</span>
          ) : card ? (
            <div className="inline-flex items-center gap-1.5 text-cyan-300 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{card.name}</span>
            </div>
          ) : (
            <span>{acc?.name || 'Conta'}</span>
          )}
        </td>

        {/* Valor */}
        <td
          className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
            isIncome
              ? 'text-emerald-400'
              : isExpense
              ? 'text-rose-400'
              : 'text-blue-400'
          }`}
        >
          {formatCurrency(tx.amount)}
        </td>

        {/* Ações */}
        <td className="py-3 px-4 text-center relative">
          {isGroupedCard ? (
            <button
              type="button"
              onClick={() => handleRequestTogglePaid(tx.id, isEffectivelyPaid, tx)}
              className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
              title={isEffectivelyPaid ? 'Marcar fatura como pendente' : 'Marcar fatura como paga'}
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <TransactionRowMenu
                transaction={tx}
                isOpen={openMenuTxId === tx.id}
                onClose={() => setOpenMenuTxId(null)}
                onEdit={onEdit}
                onDelete={onDelete}
                onAttach={onAttach || (() => {})}
                onConvertTransfer={onConvertTransfer || (() => {})}
                openUpward={(() => {
                  const globalIndex = paginatedTransactions.findIndex(t => t.id === tx.id);
                  return globalIndex !== -1 && globalIndex >= paginatedTransactions.length - 4;
                })()}
              />
            </>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-[#181c24] border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl space-y-0 relative">
      {/* Barra Flutuante de Ações em Lote */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-700/60 shadow-xl text-xs animate-fadeIn sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                {selectedIds.length}
              </span>
              <span>{selectedIds.length === 1 ? 'transação selecionada' : 'transações selecionadas'}</span>
            </span>

            {/* Opção para selecionar todas as linhas filtradas caso haja paginação */}
            {sortedTransactions.length > paginatedTransactions.length && selectedIds.length < sortedTransactions.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-indigo-400 hover:text-indigo-200 underline cursor-pointer text-[11px] ml-1"
              >
                Selecionar todas as {sortedTransactions.length} filtradas
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Editar em Lote */}
            <button
              type="button"
              onClick={() => setIsBatchEditOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar em Lote</span>
            </button>

            {/* Botão Marcar como Paga */}
            <button
              type="button"
              onClick={() => handleBatchTogglePaid(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Marcar todas selecionadas como Pagas"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Marcar Pagas</span>
            </button>

            {/* Botão Marcar como Pendente */}
            <button
              type="button"
              onClick={() => handleBatchTogglePaid(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Marcar todas selecionadas como Pendentes"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Marcar Pendentes</span>
            </button>

            {/* Botão Excluir */}
            <button
              type="button"
              onClick={handleBatchDelete}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
              title="Excluir selecionadas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Botão Desmarcar */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white px-2 py-1 text-xs cursor-pointer ml-1"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Barra de Filtros Ativos das Colunas */}
      {hasActiveColumnFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-indigo-950/30 border-b border-indigo-900/40 text-xs text-indigo-300">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold flex items-center gap-1.5 text-indigo-200">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Filtros ativos na tabela:
            </span>
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
                Situação: {filterStatus === 'paid' ? 'Efetivadas' : 'Pendentes'}
                <button onClick={() => setFilterStatus('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
                Tipo: {filterType === 'income' ? 'Receitas' : filterType === 'expense' ? 'Despesas' : filterType === 'creditCard' ? 'Cartão' : 'Transferências'}
                <button onClick={() => setFilterType('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterDescription.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
                Descrição: "{filterDescription}"
                <button onClick={() => setFilterDescription('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterCategoryId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
                Categoria: {categories.find(c => isSameId(c.id, filterCategoryId))?.name || 'Selecionada'}
                <button onClick={() => setFilterCategoryId('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterAccountId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px]">
                Conta/Cartão: {filterAccountId.startsWith('card-')
                  ? creditCards.find(c => isSameId(c.id, filterAccountId.replace('card-', '')))?.name || 'Cartão'
                  : accounts.find(a => isSameId(a.id, filterAccountId.replace('acc-', '')))?.name || 'Conta'}
                <button onClick={() => setFilterAccountId('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearAllColumnFilters}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-200 transition-colors cursor-pointer underline underline-offset-2"
            >
              Limpar Filtros
            </button>

            {onExportExcel && (
              <button
                type="button"
                onClick={() => onExportExcel(sortedTransactions)}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-2"
                title="Exportar exatamente estes resultados filtrados para Excel"
              >
                <span>Baixar Filtrados ({sortedTransactions.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#14171f]">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
              </th>

              {/* Coluna: Situação */}
              <th className="py-3 px-3 relative">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold uppercase"
                    title="Ordenar por Situação (Pagas/Pendentes)"
                  >
                    <span>Situação</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')}
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors ${
                      filterStatus !== 'all' ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Filtrar por Situação"
                  >
                    <Filter className="w-3 h-3" />
                  </button>
                </div>

                {activeFilterDropdown === 'status' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
                    <div className="absolute left-2 top-full mt-1 w-36 bg-[#1e2330] border border-slate-700 rounded-2xl shadow-2xl z-40 py-1.5 text-xs normal-case animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => { setFilterStatus('all'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterStatus === 'all' ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFilterStatus('paid'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterStatus === 'paid' ? 'text-emerald-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                      >
                        ✓ Pagas / Efetivadas
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFilterStatus('pending'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterStatus === 'pending' ? 'text-rose-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                      >
                        ! Pendentes
                      </button>
                    </div>
                  </>
                )}
              </th>

              {/* Coluna: Tipo */}
              {showTypeColumn && (
                <th className="py-3 px-3 relative">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort('type')}
                      className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold uppercase"
                      title="Ordenar por Tipo"
                    >
                      <span>Tipo</span>
                      {sortField === 'type' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'type' ? null : 'type')}
                      className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors ${
                        filterType !== 'all' ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Filtrar por Tipo"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>

                  {activeFilterDropdown === 'type' && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
                      <div className="absolute left-2 top-full mt-1 w-40 bg-[#1e2330] border border-slate-700 rounded-2xl shadow-2xl z-40 py-1.5 text-xs normal-case animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => { setFilterType('all'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterType === 'all' ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          Todos os tipos
                        </button>
                        <button
                          type="button"
                          onClick={() => { setFilterType('expense'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterType === 'expense' ? 'text-rose-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          Despesas
                        </button>
                        <button
                          type="button"
                          onClick={() => { setFilterType('creditCard'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterType === 'creditCard' ? 'text-cyan-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          Despesa Cartão
                        </button>
                        <button
                          type="button"
                          onClick={() => { setFilterType('income'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterType === 'income' ? 'text-emerald-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          Receitas
                        </button>
                        <button
                          type="button"
                          onClick={() => { setFilterType('transfer'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterType === 'transfer' ? 'text-blue-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          Transferências
                        </button>
                      </div>
                    </>
                  )}
                </th>
              )}

              {/* Coluna: Data */}
              <th className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('date')}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer font-semibold uppercase"
                  title="Clique para alternar ordenação por data (Mais recente / Mais antiga)"
                >
                  <span>Data</span>
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                  )}
                </button>
              </th>

              {/* Coluna: Descrição */}
              <th className="py-3 px-4 relative">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSort('description')}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold uppercase"
                    title="Ordenar por Descrição (A-Z / Z-A)"
                  >
                    <span>Descrição</span>
                    {sortField === 'description' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'description' ? null : 'description')}
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors ${
                      filterDescription.trim() ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Buscar na descrição"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                </div>

                {activeFilterDropdown === 'description' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
                    <div className="absolute left-2 top-full mt-1 w-64 bg-[#1e2330] border border-slate-700 rounded-2xl shadow-2xl z-40 p-3 text-xs normal-case animate-fadeIn">
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700/70 text-slate-300 font-semibold">
                        <span>Filtrar Descrição</span>
                        {filterDescription && (
                          <button
                            type="button"
                            onClick={() => { setFilterDescription(''); setCurrentPage(1); }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus
                          value={filterDescription}
                          onChange={(e) => { setFilterDescription(e.target.value); setCurrentPage(1); }}
                          placeholder="Digite o texto..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </th>

              {/* Coluna: Categoria */}
              <th className="py-3 px-4 relative">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSort('category')}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold uppercase"
                    title="Ordenar por Categoria (A-Z / Z-A)"
                  >
                    <span>Categoria</span>
                    {sortField === 'category' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'category' ? null : 'category')}
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors ${
                      filterCategoryId !== 'all' ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Filtrar por Categoria"
                  >
                    <Filter className="w-3 h-3" />
                  </button>
                </div>

                {activeFilterDropdown === 'category' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
                    <div className="absolute left-2 top-full mt-1 w-52 max-h-64 overflow-y-auto bg-[#1e2330] border border-slate-700 rounded-2xl shadow-2xl z-40 py-1.5 text-xs normal-case animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => { setFilterCategoryId('all'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterCategoryId === 'all' ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                      >
                        Todas as categorias
                      </button>
                      {categories.filter(c => !c.parentId).map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setFilterCategoryId(cat.id); setActiveFilterDropdown(null); setCurrentPage(1); }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterCategoryId === cat.id ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </th>

              {/* Coluna: Conta / Cartão */}
              <th className="py-3 px-4 relative">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSort('account')}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-semibold uppercase"
                    title="Ordenar por Conta/Cartão (A-Z / Z-A)"
                  >
                    <span>Conta / Cartão</span>
                    {sortField === 'account' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'account' ? null : 'account')}
                    className={`p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors ${
                      filterAccountId !== 'all' ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Filtrar por Conta ou Cartão"
                  >
                    <Filter className="w-3 h-3" />
                  </button>
                </div>

                {activeFilterDropdown === 'account' && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
                    <div className="absolute left-2 top-full mt-1 w-52 max-h-64 overflow-y-auto bg-[#1e2330] border border-slate-700 rounded-2xl shadow-2xl z-40 py-1.5 text-xs normal-case animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => { setFilterAccountId('all'); setActiveFilterDropdown(null); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterAccountId === 'all' ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                      >
                        Todas as contas e cartões
                      </button>

                      {creditCards.length > 0 && (
                        <>
                          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cartões</div>
                          {creditCards.map(card => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => { setFilterAccountId(`card-${card.id}`); setActiveFilterDropdown(null); setCurrentPage(1); }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterAccountId === `card-${card.id}` ? 'text-cyan-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                            >
                              <CreditCard className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{card.name}</span>
                            </button>
                          ))}
                        </>
                      )}

                      {accounts.length > 0 && (
                        <>
                          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contas Bancárias</div>
                          {accounts.map(acc => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => { setFilterAccountId(`acc-${acc.id}`); setActiveFilterDropdown(null); setCurrentPage(1); }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/60 transition-colors ${filterAccountId === `acc-${acc.id}` ? 'text-indigo-400 font-bold bg-slate-800/80' : 'text-slate-300'}`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                              <span className="truncate">{acc.name}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </th>

              {/* Coluna: Valor */}
              <th className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('amount')}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer font-semibold uppercase"
                  title="Ordenar por Valor (Menor / Maior)"
                >
                  <span>Valor</span>
                  {sortField === 'amount' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400 opacity-60" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 text-center w-16">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isDateSort ? (
              dailyGroups.map((group) => {
                const now = new Date();
                const todayStr = getLocalDateString(now);
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayStr = getLocalDateString(yesterdayDate);

                const isTodayGroup = group.date === todayStr;
                const isYesterdayGroup = group.date === yesterdayStr;

                return (
                  <React.Fragment key={group.date}>
                    {/* Cabeçalho Diário */}
                    <tr
                      id={isTodayGroup ? 'desktop-tx-row-hoje' : isYesterdayGroup ? 'desktop-tx-row-ontem' : undefined}
                      className="bg-[#14171f]/90 border-t border-slate-800/80"
                    >
                      <td colSpan={showTypeColumn ? 9 : 8} className="py-2.5 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isTodayGroup ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                Hoje
                                <span className="text-indigo-400/70 font-normal">({formatDateBR(group.date)})</span>
                              </span>
                            ) : isYesterdayGroup ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/70 shadow-sm">
                                Ontem
                                <span className="text-slate-400 font-normal">({formatDateBR(group.date)})</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-300 px-1">
                                {formatDateBR(group.date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {group.items.map((tx) => renderTransactionRow(tx))}
                  </React.Fragment>
                );
              })
            ) : (
              paginatedTransactions.map((tx) => renderTransactionRow(tx))
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior de Paginação */}
      <div className="flex flex-wrap items-center justify-end gap-6 px-6 py-3 border-t border-slate-800 bg-[#14171f] text-xs text-slate-400">
        {/* Seletor de Linhas por página */}
        <div className="flex items-center gap-2 relative">
          <span>Linhas por página:</span>
          <button
            type="button"
            onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
            className="flex items-center gap-1 bg-[#232733] border border-slate-700 text-white px-2.5 py-1 rounded-xl cursor-pointer hover:border-slate-600 transition-colors"
          >
            <span>{rowsPerPage}</span>
            <span className="text-[10px]">▾</span>
          </button>

          {isRowsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsRowsDropdownOpen(false)} />
              <div className="absolute bottom-full mb-1 left-0 w-20 bg-[#232733] border border-slate-700 rounded-xl shadow-2xl z-40 py-1 overflow-hidden">
                {[5, 10, 25, 50, 100, 150, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setRowsPerPage(val);
                      setCurrentPage(1);
                      setIsRowsDropdownOpen(false);
                    }}
                    className={`w-full text-center py-1 text-xs hover:bg-slate-700 cursor-pointer ${
                      rowsPerPage === val ? 'text-indigo-400 font-bold bg-slate-800' : 'text-slate-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Indicador de faixa: 1-25 de 163 */}
        <span>
          {paginationStart}-{paginationEnd} de {totalItems}
        </span>

        {/* Controles de Navegação de Página */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Primeira página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Box de Confirmação de Pagamento / Efetivação */}
      <ConfirmPaymentModal
        isOpen={Boolean(confirmingPayment)}
        transaction={confirmingPayment?.tx || null}
        invoiceInfo={confirmingPayment?.invoiceInfo}
        onConfirm={handleConfirmExecutePayment}
        onCancel={() => setConfirmingPayment(null)}
      />

      {/* Modal de Edição em Lote */}
      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        selectedTransactions={selectedTransactionsList}
        categories={categories}
        creditCards={creditCards}
        accounts={accounts}
        onApply={handleApplyBatchEdit}
      />
    </div>
  );
};
