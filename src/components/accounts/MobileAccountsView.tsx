'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Account } from '@/types/finance';
import { BankBadge } from './BankBadge';
import { AccountModal } from './AccountModal';
import { BalanceAdjustmentModal } from './BalanceAdjustmentModal';
import { ArchivedAccountsDrawer } from './ArchivedAccountsDrawer';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import {
  ArrowLeft,
  Archive,
  ArrowRightLeft,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Scale,
  CheckSquare,
  Square,
  HelpCircle,
  BarChart3,
  Check,
} from 'lucide-react';

interface MobileAccountsViewProps {
  onBack?: () => void;
  onNavigateToTransactions?: (accountId?: string) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MobileAccountsView: React.FC<MobileAccountsViewProps> = ({
  onBack,
  onNavigateToTransactions,
}) => {
  const {
    accounts,
    filteredTransactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
  } = useFinance();

  // Estados de Modais e Drawers
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [accountToAdjust, setAccountToAdjust] = useState<Account | null>(null);

  const [isArchivedDrawerOpen, setIsArchivedDrawerOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [activeMenuAccountId, setActiveMenuAccountId] = useState<string | null>(null);

  // Modal de Nova Transferência / Nova Transação
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [includeInHomeChecked, setIncludeInHomeChecked] = useState(true);

  // Filtro de contas ativas vs arquivadas
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => !a.isArchived);
  }, [accounts]);

  const archivedAccounts = useMemo(() => {
    return accounts.filter(a => !!a.isArchived);
  }, [accounts]);

  // Cálculo de Saldos
  const totalCurrentBalance = useMemo(() => {
    return activeAccounts
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [activeAccounts]);

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

    updateAccount(accountId, { balance: newBalance });

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
    setActiveMenuAccountId(null);
  };

  const handleUnarchiveAccount = (accountId: string) => {
    updateAccount(accountId, { isArchived: false });
  };

  return (
    <div className="min-h-screen bg-[#131316] text-slate-100 flex flex-col pb-24">
      {/* Top Header Mobile */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white tracking-tight">Contas</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Gaveta / Arquivados */}
          <button
            onClick={() => setIsArchivedDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors relative"
            title="Contas arquivadas"
          >
            <Archive className="w-5 h-5" />
          </button>

          {/* Botão Transferência Rápida */}
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors"
            title="Nova transferência"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          {/* Menu Dropdown ⋮ */}
          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Mais opções"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#2a2a30] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  onClick={() => setIncludeInHomeChecked(!includeInHomeChecked)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-slate-200 hover:bg-slate-800/80 text-left transition-colors"
                >
                  <span>Incluir na tela inicial</span>
                  {includeInHomeChecked ? (
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    onNavigateToTransactions?.();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/80 text-left transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span>Gráficos</span>
                </button>

                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsTransferModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/80 text-left transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                  <span>Transferência fixa</span>
                </button>

                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/80 text-left transition-colors"
                >
                  <span>Conta manual padrão</span>
                </button>

                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/80 text-left transition-colors border-t border-slate-700/60 mt-1 pt-2"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Ajuda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seletor de Mês/Ano Compacto */}
      <div className="flex items-center justify-between px-8 py-2 text-slate-300">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium tracking-tight">
          {MONTH_NAMES[selectedMonth]}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Card Grande de Topo (Container Cinza Escuro Arredondado) */}
      <div className="mx-3 mt-1 bg-[#25252c] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
        {/* Bloco de Saldos de Topo */}
        <div className="grid grid-cols-2 p-5 gap-4 border-b border-slate-700/40">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Saldo atual</span>
            <span
              className={`text-base font-bold tracking-tight ${
                totalCurrentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(totalCurrentBalance)}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Saldo previsto</span>
            <span
              className={`text-base font-bold tracking-tight ${
                totalProjectedBalance >= 0 ? 'text-slate-200' : 'text-rose-400'
              }`}
            >
              {formatCurrency(totalProjectedBalance)}
            </span>
          </div>
        </div>

        {/* Lista Vertical de Contas */}
        <div className="divide-y divide-slate-700/40">
          {activeAccounts.map(acc => {
            const accCurrent = acc.balance || 0;
            const accProjected = projectedBalanceMap[acc.id] ?? acc.balance;
            const isMenuOpen = activeMenuAccountId === acc.id;

            return (
              <div key={acc.id} className="p-4 space-y-2 relative">
                {/* Linha 1: Badge + Nome + Menu ⋮ */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <BankBadge
                      institution={acc.institution}
                      name={acc.name}
                      color={acc.color}
                      size="md"
                    />
                    <h3 className="font-semibold text-white text-sm truncate">{acc.name}</h3>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuAccountId(isMenuOpen ? null : acc.id)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-[#2a2a30] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <button
                          onClick={() => {
                            setActiveMenuAccountId(null);
                            setAccountToEdit(acc);
                            setIsAccountModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-200 hover:bg-slate-800 text-left"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleArchiveAccount(acc)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-200 hover:bg-slate-800 text-left"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-400" />
                          <span>Arquivar</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuAccountId(null);
                            onNavigateToTransactions?.(acc.id);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-200 hover:bg-slate-800 text-left"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                          <span>Transações</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuAccountId(null);
                            setAccountToAdjust(acc);
                            setIsAdjustModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-200 hover:bg-slate-800 text-left border-t border-slate-700/50 mt-1 pt-1.5"
                        >
                          <Scale className="w-3.5 h-3.5 text-violet-400" />
                          <span>Reajuste de saldo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linha 2: Saldo Atual & Saldo Previsto */}
                <div className="pl-13 pr-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Saldo atual</span>
                    <span
                      className={`font-semibold ${
                        accCurrent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(accCurrent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Saldo previsto</span>
                    <span
                      className={`font-medium ${
                        accProjected >= 0 ? 'text-slate-400' : 'text-rose-400/90'
                      }`}
                    >
                      {formatCurrency(accProjected)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (+) Roxo */}
      <button
        onClick={() => {
          setAccountToEdit(null);
          setIsAccountModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-violet-600/40 z-30 transition-transform active:scale-95 cursor-pointer"
        title="Nova conta"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modais e Drawers */}
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

      <ArchivedAccountsDrawer
        isOpen={isArchivedDrawerOpen}
        onClose={() => setIsArchivedDrawerOpen(false)}
        archivedAccounts={archivedAccounts}
        onUnarchive={handleUnarchiveAccount}
        onDelete={deleteAccount}
      />

      {isTransferModalOpen && (
        <NewTransactionModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          defaultType="transfer"
        />
      )}
    </div>
  );
};
