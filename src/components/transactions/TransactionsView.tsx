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
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Plus,
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface TransactionsViewProps {
  initialTypeFilter?: 'all' | 'income' | 'expense' | 'transfer';
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  initialTypeFilter = 'all',
}) => {
  const {
    filteredTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    updateTransaction,
    deleteTransaction,
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
    status: 'all',
    type: 'all',
    saveFilter: false,
  });

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
      if (advancedFilter.categoryId && tx.categoryId !== advancedFilter.categoryId) return false;
      if (advancedFilter.accountId && tx.accountId !== advancedFilter.accountId) return false;
      if (advancedFilter.tag && (!tx.tags || !tx.tags.includes(advancedFilter.tag))) return false;
      if (advancedFilter.status === 'paid' && !tx.paid) return false;
      if (advancedFilter.status === 'pending' && tx.paid) return false;
      if (advancedFilter.type !== 'all' && tx.type !== advancedFilter.type) return false;

      return true;
    });
  }, [filteredTransactions, activeTypeFilter, searchQuery, advancedFilter]);

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
    <div className="space-y-6 animate-fadeIn pb-12">
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
              onToggleGroupByCard={() => setGroupByCard(!groupByCard)}
              alertPending={alertPending}
              onToggleAlertPending={() => setAlertPending(!alertPending)}
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

      {/* 2. Cards de Resumo Superior com Suporte a Despesas, Receitas e Todas */}
      <TransactionsHeaderCards
        activeTypeFilter={activeTypeFilter}
        onSelectTypeFilter={setActiveTypeFilter}
        activeStatusFilter={advancedFilter.status}
        onSelectStatusFilter={(status) =>
          setAdvancedFilter((prev) => ({ ...prev, status }))
        }
      />

      {/* 3. Seletor de Período Centralizado no Card da Tabela */}
      <div className="flex items-center justify-center gap-3 py-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5 text-indigo-400" />
        </button>

        <span className="bg-[#242042] border border-[#6366f1]/40 text-indigo-200 px-5 py-1.5 rounded-full text-xs font-bold shadow-inner">
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Próximo mês"
        >
          <ChevronRight className="w-5 h-5 text-indigo-400" />
        </button>
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

      {/* Modal de Criação / Edição */}
      {isNewTxModalOpen && (
        <NewTransactionModal
          isOpen={isNewTxModalOpen}
          onClose={() => setIsNewTxModalOpen(false)}
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
