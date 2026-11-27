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
  Search,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard as CreditCardIcon,
  CheckCheck,
} from 'lucide-react';

interface AccountDetailViewProps {
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

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
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
    updateTransactionsBatch,
    addTransaction,
    updateCreditCard,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const {
    statementTxs,
    startingBalanceOfMonth,
    totalIncomeMonth,
    totalExpenseMonth,
    finalBalanceOfMonth,
  } = useAccountStatement(account, transactions, selectedYear, selectedMonth);

  // Normalização de texto sem acentos para busca
  const normalize = (text: string) =>
    (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Filtro de busca textual insensível a acentos
  const filteredTxs = useMemo(() => {
    if (!searchTerm.trim()) return statementTxs;
    const term = normalize(searchTerm);
    return statementTxs.filter(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const isCardInvoice = /^Pagamento de Fatura\s*-\s*/i.test(t.description);
      const descNorm = normalize(t.description);
      const catNorm = cat ? normalize(cat.name) : '';
      const notesNorm = t.notes ? normalize(t.notes) : '';
      const cardInvoiceTag = isCardInvoice ? 'fatura cartao debito automatico' : '';

      return (
        descNorm.includes(term) ||
        catNorm.includes(term) ||
        notesNorm.includes(term) ||
        cardInvoiceTag.includes(term)
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header com Botão Voltar e Seletor de Conta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Voltar para Contas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Dropdown de Seleção de Contas */}
          <div className="relative">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-left"
            >
              <BankBadge institution={account.institution} name={account.name} color={account.color} size="sm" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">Extrato da Conta</span>
                <span className="text-base font-bold text-white tracking-tight">{account.name}</span>
              </div>
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Trocar de Conta
                </div>
                {allAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onSelectAnotherAccount(acc);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-800 transition-colors ${
                      acc.id === account.id ? 'bg-slate-800/70 text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    <BankBadge institution={acc.institution} name={acc.name} color={acc.color} size="sm" />
                    <span className="text-xs font-semibold truncate">{acc.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Seletor Mensal e Botões de Adição Rápida */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Navegador de Mês */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white tracking-tight uppercase">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenNewTransaction(account.id, 'income')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receita</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction(account.id, 'expense')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Despesa</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo do Extrato do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas do Mês */}
        <div className="bg-[#18181b]/90 border border-slate-800/80 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Entradas</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalIncomeMonth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Receitas efetivadas no mês</span>
        </div>

        {/* Saídas do Mês */}
        <div className="bg-[#18181b]/90 border border-slate-800/80 p-4 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Saídas</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalExpenseMonth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Despesas debitadas no mês</span>
        </div>

        {/* Balanço do Mês */}
        <div className="bg-[#18181b]/90 border border-slate-800/80 p-4 rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Balanço do Mês</span>
          <div className={`text-xl font-bold mt-1 ${finalBalanceOfMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(finalBalanceOfMonth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Entradas menos saídas deste mês</span>
        </div>

        {/* Saldo Atual da Conta */}
        <div className="bg-[#18181b]/90 border border-slate-800/80 p-4 rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Saldo Atual da Conta</span>
          <div className={`text-xl font-bold mt-1 ${(account.balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(account.balance || 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Saldo real disponível na conta</span>
        </div>
      </div>

      {/* Barra de Busca de Lançamentos */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181b] border border-slate-800/90 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {filteredTxs.length} {filteredTxs.length === 1 ? 'lançamento' : 'lançamentos'}
        </div>
      </div>

      {/* Tabela do Extrato com Coluna de Saldo Resultante/Histórico */}
      <div className="bg-[#18181b]/90 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Conta / Cartão</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-right">Saldo Resultante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhuma transação encontrada nesta conta para este mês.
                  </td>
                </tr>
              ) : (
                filteredTxs.map(tx => {
                  const category = categories.find(c => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.destinationAccountId === account.id);
                  const isCardInvoice = /^Pagamento de Fatura\s*-\s*/i.test(tx.description);

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onEditTransaction(tx)}
                      className={`transition-colors cursor-pointer group ${
                        isCardInvoice
                          ? 'bg-sky-500/10 hover:bg-sky-500/20 border-l-2 border-l-sky-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTransaction(tx.id, { paid: !tx.paid });
                          }}
                          className="flex items-center gap-1.5 cursor-pointer"
                          title={tx.paid ? 'Efetivado (Clique para desmarcar)' : 'Pendente (Clique para efetivar)'}
                        >
                          {tx.paid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                          <span className={tx.paid ? 'text-emerald-400 text-[11px]' : 'text-amber-400 text-[11px]'}>
                            {tx.paid ? 'Efetivado' : 'Pendente'}
                          </span>
                        </button>
                      </td>

                      {/* Data */}
                      <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                        {formatDateBR(tx.date)}
                      </td>

                      {/* Descrição */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.notes}</div>
                        )}
                      </td>

                      {/* Conta / Cartão */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.type === 'transfer' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                            <span>Transferência</span>
                          </span>
                        ) : /^Pagamento de Fatura\s*-\s*/i.test(tx.description) ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            <CreditCardIcon className="w-3 h-3 text-cyan-400" />
                            <span>Fatura Cartão</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                            <BankBadge institution={account.institution} name={account.name} color={account.color} size="sm" />
                            <span>{account.name}</span>
                          </span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {category?.name || 'Geral'}
                        </span>
                      </td>

                      {/* Valor do Lançamento */}
                      <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                      </td>

                      {/* Coluna Saldo Resultante (Histórico da Conta) */}
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap text-slate-200">
                        {tx.paid ? (
                          <span className={tx.runningBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatCurrency(tx.runningBalance)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Pendente</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
