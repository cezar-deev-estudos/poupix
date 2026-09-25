'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { MobileTransactionDetailDrawer } from './MobileTransactionDetailDrawer';
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
} from 'lucide-react';
import { TransactionsFilterModal, AdvancedFilterState } from './TransactionsFilterModal';
import { TransactionsOptionsMenu } from './TransactionsOptionsMenu';
import { NewTransactionModal } from './NewTransactionModal';
import { TransactionScopeModal } from './TransactionScopeModal';
import { ConfirmModal } from '../ui/ConfirmModal';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MobileTransactionsViewProps {
  initialTypeFilter?: 'all' | 'income' | 'expense' | 'transfer';
}

export const MobileTransactionsView: React.FC<MobileTransactionsViewProps> = ({
  initialTypeFilter = 'all',
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
    categories,
    accounts,
    creditCards,
  } = useFinance();

  // Estados de Filtros e Visualização
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>(initialTypeFilter);

  React.useEffect(() => {
    if (initialTypeFilter) {
      setActiveTypeFilter(initialTypeFilter);
    }
  }, [initialTypeFilter]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [groupByCard, setGroupByCard] = useState(false);
  const [alertPending, setAlertPending] = useState(false);

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
    status: 'all',
    type: 'all',
    saveFilter: false,
  });

  const displayVal = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••••';
    return formatCurrency(amount);
  };

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

  // Filtragem Dinâmica
  const displayedTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (activeTypeFilter !== 'all' && tx.type !== activeTypeFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesDesc && !matchesAmount) return false;
      }

      if (advancedFilter.startDate && tx.date < advancedFilter.startDate) return false;
      if (advancedFilter.endDate && tx.date > advancedFilter.endDate) return false;
      if (advancedFilter.categoryId && tx.categoryId !== advancedFilter.categoryId) return false;
      if (advancedFilter.accountId && tx.accountId !== advancedFilter.accountId) return false;
      if (advancedFilter.tag && (!tx.tags || !tx.tags.includes(advancedFilter.tag))) return false;
      if (advancedFilter.status === 'paid' && !tx.paid) return false;
      if (advancedFilter.status === 'pending' && tx.paid) return false;
      if (advancedFilter.type !== 'all' && tx.type !== advancedFilter.type) return false;

      return true;
    });
  }, [filteredTransactions, activeTypeFilter, searchQuery, advancedFilter]);

  // Agrupamento por Dias no padrão Mobills: "Ontem", "Hoje", "Segunda, 21", etc.
  const groupedByDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const sorted = [...displayedTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: { dateKey: string; label: string; items: Transaction[] }[] = [];

    sorted.forEach((tx) => {
      const existing = groups.find((g) => g.dateKey === tx.date);
      if (existing) {
        existing.items.push(tx);
      } else {
        let label = '';
        if (tx.date === today) {
          label = 'Hoje';
        } else if (tx.date === yesterday) {
          label = 'Ontem';
        } else {
          const [y, m, d] = tx.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          const weekDay = WEEKDAY_NAMES[dt.getDay()];
          label = `${weekDay}, ${d}`;
        }

        groups.push({
          dateKey: tx.date,
          label,
          items: [tx],
        });
      }
    });

    return groups;
  }, [displayedTransactions]);

  const togglePaid = (e: React.MouseEvent, id: string, currentPaid: boolean) => {
    e.stopPropagation();
    updateTransaction(id, { paid: !currentPaid });
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
              onToggleGroupByCard={() => setGroupByCard(!groupByCard)}
              alertPending={alertPending}
              onToggleAlertPending={() => setAlertPending(!alertPending)}
            />
          </div>
        </div>
      </div>

      {/* 2. Navegador de Mês Centralizado */}
      <div className="flex items-center justify-center gap-6 py-1 text-xs font-semibold text-slate-300">
        <button type="button" onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span>{MONTH_NAMES[selectedMonth]}</span>

        <button type="button" onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Card Compacto de Saldo Atual e Balanço Mensal */}
      <div className="bg-[#242732] border border-slate-700/60 rounded-3xl p-4 shadow-xl flex items-center justify-between">
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

      {/* 4. Lista de Transações Agrupadas por Data */}
      {groupedByDate.length === 0 ? (
        <div className="bg-[#242732] border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-xs">
          Nenhuma transação encontrada para este período.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Título do Dia */}
              <h4 className="text-sm font-bold text-slate-200 px-1">{group.label}</h4>

              {/* Itens do Dia */}
              <div className="space-y-1.5">
                {group.items.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const card = creditCards.find((c) => c.id === tx.creditCardId);
                  const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  const accountName =
                    tx.type === 'transfer'
                      ? `${acc?.name || 'Conta'} ➔ ${destAcc?.name || 'Conta'}`
                      : card
                      ? card.name
                      : acc?.name || 'Conta';
                  const categoryName = cat?.name || 'Geral';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTxDetail(tx)}
                      className="flex items-center justify-between p-3.5 bg-[#242732]/90 border border-slate-800/70 hover:border-slate-700 rounded-2xl transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {/* Ícone e Descrição */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md mt-0.5"
                          style={{
                            backgroundColor:
                              cat?.color || (tx.type === 'transfer' ? '#3B82F6' : isExpense ? '#f97316' : '#84cc16'),
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-white text-xs block truncate">
                            {tx.description}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {categoryName} | {accountName}
                          </span>

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
                          className={`text-xs font-bold ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-rose-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => togglePaid(e, tx.id, tx.paid)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            tx.paid
                              ? 'bg-[#22c55e] text-slate-950'
                              : 'border border-slate-600 bg-slate-800 text-slate-500'
                          }`}
                        >
                          {tx.paid ? <Check className="w-3 h-3 stroke-[3]" /> : <Clock className="w-2.5 h-2.5" />}
                        </button>
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

      {/* Modal de Filtros Avançados */}
      <TransactionsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filter={advancedFilter}
        onApplyFilter={setAdvancedFilter}
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
    </div>
  );
};
