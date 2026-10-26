'use client';

import React, { useState, useMemo } from 'react';
import { Account, Transaction, CreditCard } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { BankBadge } from './BankBadge';
import { useAccountStatement } from '@/hooks/useAccountStatement';
import { isTransactionInInvoicePeriod, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Search,
  CreditCard as CreditCardIcon,
} from 'lucide-react';

interface MobileAccountDetailProps {
  account: Account;
  allAccounts: Account[];
  onBack: () => void;
  onSelectAnotherAccount: (account: Account) => void;
  onOpenNewTransaction: (accountId: string, type: 'income' | 'expense') => void;
  onEditTransaction: (tx: Transaction) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MobileAccountDetail: React.FC<MobileAccountDetailProps> = ({
  account,
  allAccounts,
  onBack,
  onSelectAnotherAccount,
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    transactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    categories,
    creditCards,
    updateTransaction,
    addTransaction,
    updateCreditCard,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isPayingInvoices, setIsPayingInvoices] = useState(false);

  // Período chave
  const currentPeriodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Identificar faturas pendentes que podem ser quitadas por esta conta
  const unpaidCardInvoices = useMemo(() => {
    return creditCards
      .filter(c => !c.isArchived)
      .map(card => {
        const cardExpenses = transactions
          .filter(t => isTransactionInInvoicePeriod(t, card, selectedYear, selectedMonth))
          .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

        const invoicePaidDesc = `Pagamento de Fatura - ${card.name}`;
        const hasPaymentRecord = transactions.some(
          t => t.accountId === account.id && t.description.toLowerCase() === invoicePaidDesc.toLowerCase() && t.date.startsWith(currentPeriodKey)
        );

        return {
          card,
          amount: Math.max(0, cardExpenses),
          isPaidInAccount: hasPaymentRecord,
        };
      })
      .filter(item => item.amount > 0 && !item.isPaidInAccount);
  }, [creditCards, transactions, selectedYear, selectedMonth, account.id, currentPeriodKey]);

  // Handler para pagamento de faturas nesta conta
  const handlePayAllInvoicesFromAccount = () => {
    if (unpaidCardInvoices.length === 0) return;
    setIsPayingInvoices(true);

    const defaultExpenseCategory = categories.find(c => c.type === 'expense');
    const todayStr = new Date().toISOString().split('T')[0];

    unpaidCardInvoices.forEach(({ card, amount }) => {
      const updatedManual = {
        ...(card.manualInvoiceStatus || {}),
        [currentPeriodKey]: 'paid' as const,
      };
      updateCreditCard(card.id, {
        manualInvoiceStatus: updatedManual,
      });

      transactions.forEach(t => {
        if (t.creditCardId === card.id) {
          const { periodKey } = getTransactionInvoicePeriod(t, card);
          if (periodKey === currentPeriodKey && !t.paid) {
            updateTransaction(t.id, { paid: true });
          }
        }
      });

      const dueDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;
      const paymentDate = dueDateStr <= todayStr ? dueDateStr : todayStr;

      addTransaction({
        description: `Pagamento de Fatura - ${card.name}`,
        amount,
        date: paymentDate,
        type: 'expense',
        accountId: account.id,
        categoryId: '',
        paid: true,
        ignoreInTotals: true,
      });
    });

    setIsPayingInvoices(false);
  };

  const {
    statementTxs,
    startingBalanceOfMonth,
    totalIncomeMonth,
    totalExpenseMonth,
    finalBalanceOfMonth,
  } = useAccountStatement(account, transactions, selectedYear, selectedMonth);

  const filteredTxs = useMemo(() => {
    if (!searchTerm.trim()) return statementTxs;
    const term = searchTerm.toLowerCase();
    return statementTxs.filter(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return (
        t.description.toLowerCase().includes(term) ||
        (cat && cat.name.toLowerCase().includes(term))
      );
    });
  }, [statementTxs, searchTerm, categories]);

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

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Bar Mobile */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-2 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Dropdown de Conta */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 p-1.5 px-3 rounded-2xl bg-slate-900 border border-slate-800 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BankBadge institution={account.institution} name={account.name} color={account.color} size="sm" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Extrato</span>
                <span className="text-xs font-bold text-white truncate block">{account.name}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
          </button>

          {isAccountDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-full bg-[#202024] border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
              {allAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    onSelectAnotherAccount(acc);
                    setIsAccountDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-800 text-xs text-white"
                >
                  <BankBadge institution={acc.institution} name={acc.name} color={acc.color} size="sm" />
                  <span className="truncate">{acc.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-1.5">
          {unpaidCardInvoices.length > 0 && (
            <button
              onClick={handlePayAllInvoicesFromAccount}
              disabled={isPayingInvoices}
              className="px-2.5 py-1.5 bg-teal-500/15 text-teal-300 rounded-xl border border-teal-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Quitar Faturas de Cartão"
            >
              <CreditCardIcon className="w-3.5 h-3.5" />
              <span>Faturas ({unpaidCardInvoices.length})</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewTransaction(account.id, 'expense')}
            className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 cursor-pointer"
            title="Nova Despesa"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navegador de Mês Mobile */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5">
        <button onClick={handlePrevMonth} className="p-1 text-slate-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-white uppercase tracking-tight">
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>
        <button onClick={handleNextMonth} className="p-1 text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Card de Resumo Financeiro Mobile */}
      <div className="bg-[#18181b] border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Entradas</span>
          </div>
          <span className="font-semibold text-emerald-400">{formatCurrency(totalIncomeMonth)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Saídas</span>
          </div>
          <span className="font-semibold text-rose-400">{formatCurrency(totalExpenseMonth)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
          <span className="text-slate-400">Balanço do Mês</span>
          <span className={`font-semibold ${finalBalanceOfMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(finalBalanceOfMonth)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm font-bold">
          <span className="text-slate-300">Saldo Atual da Conta</span>
          <span className={(account.balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {formatCurrency(account.balance || 0)}
          </span>
        </div>
      </div>

      {/* Lista de Transações com Saldo Resultante Linha a Linha */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
          Movimentações ({filteredTxs.length})
        </div>

        {filteredTxs.length === 0 ? (
          <div className="bg-[#18181b] border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
            Nenhuma transação nesta conta neste mês.
          </div>
        ) : (
          filteredTxs.map(tx => {
            const category = categories.find(c => c.id === tx.categoryId);
            const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.destinationAccountId === account.id);

            return (
              <div
                key={tx.id}
                onClick={() => onEditTransaction(tx)}
                className="bg-[#18181b] border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2 active:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTransaction(tx.id, { paid: !tx.paid });
                      }}
                      className="p-1"
                    >
                      {tx.paid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className="font-semibold text-white text-xs truncate block">{tx.description}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{formatDateBR(tx.date)}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {category?.name || 'Geral'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor do Lançamento */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                    </div>
                  </div>
                </div>

                {/* Linha de Saldo Resultante Após Este Lançamento */}
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-1.5 text-[11px]">
                  <span className="text-slate-400">Saldo da conta após:</span>
                  <span className={`font-semibold ${tx.runningBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.paid ? formatCurrency(tx.runningBalance) : 'Pendente'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
