'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CreditCard, Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ChevronDown,
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CreditCard as CardIcon,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Download,
  DollarSign,
  Receipt,
  Lock,
  Unlock,
} from 'lucide-react';
import { AdvancePaymentModal } from './AdvancePaymentModal';
import { isTransactionInInvoicePeriod } from '@/lib/invoiceHelpers';

interface CardInvoiceDetailViewProps {
  card: CreditCard;
  allCards: CreditCard[];
  initialFilterType?: 'all' | 'fixed';
  onBack: () => void;
  onSelectAnotherCard: (card: CreditCard) => void;
  onOpenNewExpense: (cardId: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onToggleInvoiceStatus: (card: CreditCard, periodKey: string) => void;
  onPayInvoice?: (card: CreditCard, periodKey: string) => void;
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

export const CardInvoiceDetailView: React.FC<CardInvoiceDetailViewProps> = ({
  card,
  allCards,
  initialFilterType = 'all',
  onBack,
  onSelectAnotherCard,
  onOpenNewExpense,
  onEditTransaction,
  onToggleInvoiceStatus,
  onPayInvoice,
}) => {
  const {
    transactions,
    categories,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    deleteTransaction,
  } = useFinance();

  // Estados de dropdown e busca
  const [filterType, setFilterType] = useState<'all' | 'fixed'>(initialFilterType);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isAdvancePaymentOpen, setIsAdvancePaymentOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    setFilterType(initialFilterType);
  }, [initialFilterType]);

  const cardDropdownRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardDropdownRef.current && !cardDropdownRef.current.contains(event.target as Node)) {
        setIsCardDropdownOpen(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chave do período da fatura (ex: "2026-09")
  const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Transações do Cartão para o Mês Selecionado (baseado na data de vencimento da fatura)
  const invoiceTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!isTransactionInInvoicePeriod(tx, card, selectedYear, selectedMonth)) return false;

      if (filterType === 'fixed' && !tx.isRecurring) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return tx.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [transactions, card, selectedMonth, selectedYear, filterType, searchTerm]);

  // Total da Fatura
  const invoiceTotal = useMemo(() => {
    return invoiceTransactions.reduce((sum, tx) => {
      if (tx.type === 'expense') return sum + tx.amount;
      if (tx.type === 'income') return sum - tx.amount; // estornos
      return sum;
    }, 0);
  }, [invoiceTransactions]);

  // Cálculo de Status da Fatura (Aberto / Fechado / Pago)
  // Regra: se hoje > data de fechamento, a fatura fecha automaticamente
  const invoiceStatus = useMemo((): 'open' | 'closed' | 'paid' => {
    if (card.manualInvoiceStatus && card.manualInvoiceStatus[periodKey] === 'paid') {
      return 'paid';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closingDate = new Date(selectedYear, selectedMonth, card.closingDay);
    closingDate.setHours(0, 0, 0, 0);
    if (today > closingDate) return 'closed';

    if (card.manualInvoiceStatus && card.manualInvoiceStatus[periodKey] === 'closed') {
      return 'closed';
    }
    return 'open';
  }, [card.manualInvoiceStatus, periodKey, selectedYear, selectedMonth, card.closingDay]);

  // Cálculo de Vencimento
  const isOverdue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(selectedYear, selectedMonth, card.dueDay);
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate;
  }, [selectedYear, selectedMonth, card.dueDay]);

  const isOpen = invoiceStatus === 'open';
  const isClosedOrPaid = invoiceStatus === 'closed' || invoiceStatus === 'paid';

  // Navegação de Período
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

  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Botão Voltar + Seletor Pílula Ciano + Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Voltar para lista de cartões"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Pílula Dropdown: Cartão: [Nome] */}
          <div className="relative" ref={cardDropdownRef}>
            <button
              onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 text-slate-950" />
              <span>Cartão:{card.name}</span>
            </button>

            {isCardDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {allCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsCardDropdownOpen(false);
                      onSelectAnotherCard(c);
                    }}
                    className={`w-full px-4 py-2.5 text-left transition-colors cursor-pointer flex items-center justify-between ${
                      c.id === card.id
                        ? 'bg-teal-500/15 text-teal-400 font-bold'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.name}</span>
                    {c.id === card.id && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões do Topo Direito: + , Busca, Menu ⋮ */}
        <div className="flex items-center gap-2.5">
          {/* Botão + (Reabre e lança se fechada) */}
          {isClosedOrPaid ? (
            <button
              onClick={() => {
                onToggleInvoiceStatus(card, periodKey);
                onOpenNewExpense(card.id);
              }}
              className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-1 text-xs font-semibold"
              title="Fatura Fechada - Clique para Reabrir e Lançar"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Reabrir e Lançar</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenNewExpense(card.id)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
              title="Adicionar despesa neste cartão"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className={`p-2.5 border rounded-2xl transition-all cursor-pointer shadow-sm ${
              isSearchActive
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Buscar transações"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Menu Dropdown ⋮ de Ações da Fatura */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
              title="Mais opções da fatura"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {/* Ação Reabrir / Fechar Fatura */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    onToggleInvoiceStatus(card, periodKey);
                  }}
                  className={`w-full px-4 py-2.5 font-bold text-left transition-colors cursor-pointer flex items-center gap-2 ${
                    isClosedOrPaid
                      ? 'text-teal-300 hover:bg-teal-500/20'
                      : 'text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  {isClosedOrPaid ? (
                    <>
                      <Unlock className="w-4 h-4 text-teal-400" />
                      <span>Reabrir fatura</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Fechar fatura</span>
                    </>
                  )}
                </button>

                {/* Se não estiver paga */}
                {invoiceStatus !== 'paid' && (
                  <>
                    {isOverdue || !isOpen ? (
                      <button
                        onClick={() => {
                          setIsOptionsMenuOpen(false);
                          if (onPayInvoice) {
                            onPayInvoice(card, periodKey);
                          } else {
                            onToggleInvoiceStatus(card, periodKey);
                          }
                        }}
                        className="w-full px-4 py-2 text-teal-300 font-semibold hover:bg-teal-500/20 text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span>Pagar fatura</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsOptionsMenuOpen(false);
                          setIsAdvancePaymentOpen(true);
                        }}
                        className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5"
                      >
                        Pagar adiantado
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Lançar estorno
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Ajustar fatura
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Limpar fatura
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5"
                >
                  Histórico de faturas
                </button>
                <button
                  onClick={() => {
                    setFilterType('fixed');
                    setIsOptionsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left transition-colors cursor-pointer flex items-center justify-between ${
                    filterType === 'fixed'
                      ? 'bg-teal-500/15 text-teal-400 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Despesas fixas</span>
                  {filterType === 'fixed' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Transações ignoradas
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Gráfico despesas
                </button>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setIsOptionsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left transition-colors cursor-pointer flex items-center justify-between border-t border-slate-700/50 mt-1 pt-1.5 ${
                    filterType === 'all'
                      ? 'text-teal-400 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Todas as despesas</span>
                  {filterType === 'all' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-1.5"
                >
                  Exportar para Excel
                </button>
                <button
                  onClick={() => setIsOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  Exportar para CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input de Busca Condicional */}
      {isSearchActive && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 animate-in fade-in duration-100">
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      )}

      {/* Grid Principal: Extrato da Fatura (Esquerda) + 4 Cards de Resumo (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Extrato da Fatura (8 colunas) */}
        <div className="lg:col-span-8 bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          {/* Seletor de Mês/Ano com Borda Ciano */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
              {filterType === 'fixed' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/15 border border-teal-500/30 rounded-xl text-xs text-teal-300">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Despesas fixas</span>
                  <button
                    onClick={() => setFilterType('all')}
                    className="ml-1 text-slate-400 hover:text-white cursor-pointer text-xs"
                    title="Limpar filtro e ver todas"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-5 py-1.5 border border-teal-500/50 rounded-2xl bg-teal-950/20 text-teal-300 font-semibold text-xs select-none">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="w-8" />
          </div>

          {/* Tabela de Lançamentos da Fatura */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-medium pb-2">
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Valor</th>
                  {isOpen && <th className="py-2.5 px-3 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoiceTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={isOpen ? 6 : 5} className="py-12 text-center text-slate-500">
                      Nenhuma transação lançada nesta fatura.
                    </td>
                  </tr>
                ) : (
                  invoiceTransactions.map(tx => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const parentCat = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
                    const categoryDisplayName = parentCat ? `${parentCat.name} / ${cat?.name}` : cat?.name || 'Geral';
                    const isExpense = tx.type === 'expense';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                        {/* Situação */}
                        <td className="py-3 px-3">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                            <CardIcon className="w-3.5 h-3.5" />
                          </div>
                        </td>

                        {/* Data */}
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {formatShortDate(tx.date)}
                        </td>

                        {/* Descrição com ícone azul de notas/anexos se houver */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate max-w-[200px]" title={tx.description}>
                              {tx.description}
                            </span>
                            {tx.notes && (
                              <div
                                className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 cursor-help"
                                title={tx.notes}
                              >
                                <FileText className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Categoria com Chip Colorido */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${cat?.color || '#64748b'}20`,
                              color: cat?.color || '#94a3b8',
                              border: `1px solid ${cat?.color || '#64748b'}40`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cat?.color || '#94a3b8' }}
                            />
                            {categoryDisplayName}
                          </span>
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              isExpense ? 'text-rose-500' : 'text-emerald-400'
                            }`}
                          >
                            {isExpense ? formatCurrency(tx.amount) : `-${formatCurrency(tx.amount)}`}
                          </span>
                        </td>

                        {/* Ações (Apenas se a fatura estiver aberta) */}
                        {isOpen && (
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => onEditTransaction(tx)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir "${tx.description}"?`)) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna Direita: 4 Cards de Resumo da Fatura (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Valor da fatura */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Valor da fatura</span>
              <div className="text-xl font-bold tracking-tight text-white mt-1.5">
                {formatCurrency(invoiceTotal)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <DollarSign className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* Card 2: Status */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <div className="text-base font-bold tracking-tight text-white mt-1.5 flex items-center gap-1.5">
                {invoiceStatus === 'open' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Unlock className="w-4 h-4" /> Fatura aberta
                  </span>
                ) : invoiceStatus === 'paid' ? (
                  <span className="text-teal-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Fatura paga
                  </span>
                ) : (
                  <span className="text-slate-300 flex items-center gap-1">
                    <Lock className="w-4 h-4" /> Fatura fechada
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <Receipt className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* Card 3: Dia de fechamento */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Dia de fechamento</span>
              <div className="text-base font-bold tracking-tight text-white mt-1.5">
                {card.closingDay} de {MONTH_NAMES[selectedMonth].toLowerCase()}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <Calendar className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* Card 4: Data vencimento */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Data vencimento</span>
              <div className="text-base font-bold tracking-tight text-white mt-1.5">
                {card.dueDay} de {MONTH_NAMES[selectedMonth].toLowerCase()}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <CheckCircle2 className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Pagamento Adiantado */}
      <AdvancePaymentModal
        isOpen={isAdvancePaymentOpen}
        onClose={() => setIsAdvancePaymentOpen(false)}
        card={card}
        onConfirm={() => {
          onOpenNewExpense(card.id);
        }}
      />
    </div>
  );
};
