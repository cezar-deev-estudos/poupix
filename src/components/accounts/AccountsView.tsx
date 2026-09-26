'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Account } from '@/types/finance';
import { AccountCard } from './AccountCard';
import { AccountModal } from './AccountModal';
import { BalanceAdjustmentModal } from './BalanceAdjustmentModal';
import { ArchivedAccountsModal } from './ArchivedAccountsModal';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import { MonthSelector } from '../layout/MonthSelector';
import {
  Plus,
  BarChart3,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Wallet2,
  Receipt,
  Check,
} from 'lucide-react';

const ITEMS_PER_PAGE = 5; // 1 card de "Nova Conta" + até 5 contas por página na grade de 2 colunas

interface AccountsViewProps {
  onNavigateToTransactions?: (accountId?: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onNavigateToTransactions }) => {
  const {
    accounts,
    filteredTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
  } = useFinance();

  // Estados de Modais
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [accountToAdjust, setAccountToAdjust] = useState<Account | null>(null);

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Modal de Transação Rápida
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [quickTxAccountId, setQuickTxAccountId] = useState<string | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);

  // Filtro de contas ativas vs arquivadas
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => !a.isArchived);
  }, [accounts]);

  const archivedAccounts = useMemo(() => {
    return accounts.filter(a => !!a.isArchived);
  }, [accounts]);

  // Cálculo de Saldos Gerais
  const totalCurrentBalance = useMemo(() => {
    return activeAccounts
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [activeAccounts]);

  // Cálculo de Saldo Previsto Geral (Saldo atual + Receitas pendentes do mês - Despesas pendentes do mês)
  const totalProjectedBalance = useMemo(() => {
    let balance = totalCurrentBalance;
    filteredTransactions.forEach(tx => {
      if (tx.ignoreInTotals || tx.paid) return;
      if (tx.type === 'income') {
        balance += tx.amount;
      } else if (tx.type === 'expense' && !tx.creditCardId) {
        balance -= tx.amount;
      }
    });
    return balance;
  }, [totalCurrentBalance, filteredTransactions]);

  // Mapa de saldo projetado por conta individual
  const projectedBalanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeAccounts.forEach(acc => {
      let accProjected = acc.balance || 0;
      filteredTransactions.forEach(tx => {
        if (tx.ignoreInTotals || tx.paid) return;
        if (tx.accountId === acc.id) {
          if (tx.type === 'income') {
            accProjected += tx.amount;
          } else if (tx.type === 'expense') {
            accProjected -= tx.amount;
          }
        }
      });
      map[acc.id] = accProjected;
    });
    return map;
  }, [activeAccounts, filteredTransactions]);

  // Paginação de Contas
  const totalPages = Math.ceil(activeAccounts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeAccounts.slice(start, start + ITEMS_PER_PAGE);
  }, [activeAccounts, currentPage]);

  // Handlers
  const handleSaveAccount = (
    data: Omit<Account, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    if (editId) {
      updateAccount(editId, data);
    } else {
      addAccount(data);
    }
  };

  const handleAdjustBalance = (accountId: string, newBalance: number, reason: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    const diff = newBalance - acc.balance;
    if (diff === 0) return;

    // Atualiza saldo da conta
    updateAccount(accountId, { balance: newBalance });

    // Lança transação de ajuste
    addTransaction({
      description: reason || 'Reajuste de saldo',
      amount: Math.abs(diff),
      date: new Date().toISOString().split('T')[0],
      type: diff > 0 ? 'income' : 'expense',
      categoryId: diff > 0 ? 'cat-other-inc' : 'cat-other-exp',
      accountId: accountId,
      paid: true,
      notes: `Ajuste manual de saldo (${diff > 0 ? '+' : ''}${formatCurrency(diff)})`,
    });
  };

  const handleArchiveAccount = (acc: Account) => {
    updateAccount(acc.id, { isArchived: true });
  };

  const handleUnarchiveAccount = (accountId: string) => {
    updateAccount(accountId, { isArchived: false });
  };

  const handleOpenEdit = (acc: Account) => {
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  const handleOpenAdjust = (acc: Account) => {
    setAccountToAdjust(acc);
    setIsAdjustModalOpen(true);
  };

  const handleAddExpenseForAccount = (acc: Account) => {
    setQuickTxAccountId(acc.id);
    setIsTxModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Contas</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Período Centralizado */}
          <MonthSelector />

          {/* Botão + (Nova Conta) */}
          <button
            onClick={() => {
              setAccountToEdit(null);
              setIsAccountModalOpen(true);
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
            title="Adicionar Nova Conta"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Botão Relatórios / Gráficos */}
          <button
            onClick={() => onNavigateToTransactions?.()}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
            title="Ver Relatórios / Fluxo"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Menu Dropdown de Opções ⋮ */}
          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
              title="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsArchivedModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors cursor-pointer"
                >
                  Contas arquivadas ({archivedAccounts.length})
                </button>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    onNavigateToTransactions?.();
                  }}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors cursor-pointer border-t border-slate-700/50"
                >
                  Transferências fixas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Grid de Contas (8 colunas) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card "+ Nova conta" sempre no primeiro slot na primeira página */}
            {currentPage === 1 && (
              <div
                onClick={() => {
                  setAccountToEdit(null);
                  setIsAccountModalOpen(true);
                }}
                className="bg-[#18181b]/50 border-2 border-dashed border-slate-800/90 hover:border-violet-500/60 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[195px] gap-3 cursor-pointer group transition-all"
              >
                <div className="w-12 h-12 rounded-full border border-violet-500/40 bg-violet-600/10 group-hover:bg-violet-600/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all shadow-lg shadow-violet-600/10">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  Nova conta
                </span>
              </div>
            )}

            {/* Lista de Contas */}
            {paginatedAccounts.map(acc => (
              <AccountCard
                key={acc.id}
                account={acc}
                projectedBalance={projectedBalanceMap[acc.id] ?? acc.balance}
                onEdit={handleOpenEdit}
                onArchive={handleArchiveAccount}
                onViewTransactions={acc => onNavigateToTransactions?.(acc.id)}
                onAdjustBalance={handleOpenAdjust}
                onAddExpense={handleAddExpenseForAccount}
              />
            ))}
          </div>

          {/* Paginação < 1 2 > */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 pt-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Coluna Direita: Cards de Resumo de Saldos (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Saldo Atual */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium hover:text-slate-300 cursor-pointer flex items-center gap-1">
                Saldo atual &gt;
              </span>
              <div
                className={`text-xl font-bold tracking-tight mt-1.5 ${
                  totalCurrentBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {formatCurrency(totalCurrentBalance)}
              </div>
            </div>

            <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Wallet2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card: Saldo Previsto */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium hover:text-slate-300 cursor-pointer flex items-center gap-1">
                Saldo previsto &gt;
              </span>
              <div
                className={`text-xl font-bold tracking-tight mt-1.5 ${
                  totalProjectedBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {formatCurrency(totalProjectedBalance)}
              </div>
            </div>

            <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Modais de Suporte */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
      />

      <BalanceAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAccountToAdjust(null);
        }}
        account={accountToAdjust}
        onAdjustBalance={handleAdjustBalance}
      />

      <ArchivedAccountsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        archivedAccounts={archivedAccounts}
        onUnarchive={handleUnarchiveAccount}
        onDelete={deleteAccount}
      />

      {isTxModalOpen && (
        <NewTransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setQuickTxAccountId(null);
          }}
          defaultType="expense"
        />
      )}
    </div>
  );
};
