'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { CardBrandLogo } from './CardBrandLogo';
import {
  ArrowLeft,
  ChevronDown,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  FileText,
  CreditCard as CardIcon,
  Check,
} from 'lucide-react';
import { CardActionDrawer } from './CardActionDrawer';
import { AdvancePaymentModal } from './AdvancePaymentModal';
import { isTransactionInInvoicePeriod } from '@/lib/invoiceHelpers';

interface MobileCardInvoiceDetailProps {
  card: CreditCard;
  allCards: CreditCard[];
  initialFilterType?: 'all' | 'fixed';
  onBack: () => void;
  onSelectAnotherCard: (card: CreditCard) => void;
  onOpenNewExpense: (cardId: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onToggleInvoiceStatus: (card: CreditCard) => void;
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

const WEEK_DAYS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

export const MobileCardInvoiceDetail: React.FC<MobileCardInvoiceDetailProps> = ({
  card,
  allCards,
  initialFilterType = 'all',
  onBack,
  onSelectAnotherCard,
  onOpenNewExpense,
  onEditTransaction,
  onToggleInvoiceStatus,
}) => {
  const {
    transactions,
    categories,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    updateCreditCard,
  } = useFinance();

  const [filterType, setFilterType] = useState<'all' | 'fixed'>(initialFilterType);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false);
  const [isAdvancePaymentOpen, setIsAdvancePaymentOpen] = useState(false);

  useEffect(() => {
    setFilterType(initialFilterType);
  }, [initialFilterType]);

  // Período
  const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Transações do cartão para o mês (baseado na data de vencimento da fatura)
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

  // Total da fatura
  const invoiceTotal = useMemo(() => {
    return invoiceTransactions.reduce((sum, tx) => {
      if (tx.type === 'expense') return sum + tx.amount;
      if (tx.type === 'income') return sum - tx.amount;
      return sum;
    }, 0);
  }, [invoiceTransactions]);

  // Datas de fechamento e vencimento
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closingDate = new Date(selectedYear, selectedMonth, card.closingDay);
  closingDate.setHours(0, 0, 0, 0);
  const dueDate = new Date(selectedYear, selectedMonth, card.dueDay);
  dueDate.setHours(0, 0, 0, 0);

  const isClosed = today > closingDate;
  const isOverdue = today > dueDate;

  // Status calculado da fatura
  // Regra: se o usuário reabriu manualmente, tem prioridade enquanto estiver na tela.
  const invoiceStatus = useMemo((): 'open' | 'closed' | 'overdue' | 'paid' => {
    if (card.manualInvoiceStatus && card.manualInvoiceStatus[periodKey] === 'paid') {
      return 'paid';
    }
    if (card.manualInvoiceStatus && card.manualInvoiceStatus[periodKey] === 'open') {
      return 'open';
    }
    if (isOverdue) return 'overdue';
    if (isClosed) return 'closed';
    if (card.manualInvoiceStatus && card.manualInvoiceStatus[periodKey] === 'closed') {
      return 'closed';
    }
    return 'open';
  }, [card.manualInvoiceStatus, periodKey, isOverdue, isClosed]);

  const isClosedOrOverdue = invoiceStatus === 'closed' || invoiceStatus === 'overdue' || invoiceStatus === 'paid';

  // Handler para Confirmar Pagamento
  const handleConfirmPayment = () => {
    const updatedManual = {
      ...(card.manualInvoiceStatus || {}),
      [periodKey]: 'paid' as const,
    };
    updateCreditCard(card.id, {
      manualInvoiceStatus: updatedManual,
    });
  };

  // Agrupamento por Data (ex: "ter., 11/08/2026")
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};

    const sorted = [...invoiceTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    return Object.entries(groups).map(([date, txs]) => {
      const [year, month, day] = date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const weekDay = WEEK_DAYS[d.getDay()];
      const formattedDate = `${weekDay}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

      return {
        date,
        formattedDate,
        transactions: txs,
      };
    });
  }, [invoiceTransactions]);

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

  return (
    <div className="min-h-screen bg-[#131316] text-slate-100 flex flex-col pb-24">
      {/* Top Header Mobile */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Dropdown de Cartão */}
          <div className="relative">
            <button
              onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
              className="flex items-center gap-1.5 text-base font-bold text-white tracking-tight cursor-pointer"
            >
              <span>{card.name}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isCardDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-[#2a2a30] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {allCards.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsCardDropdownOpen(false);
                      onSelectAnotherCard(c);
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      c.id === card.id
                        ? 'bg-teal-500/15 text-teal-300 font-bold'
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsActionDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Mais opções"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Input de Busca Condicional */}
      {isSearchActive && (
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      )}

      {/* Seletor de Período Compacto */}
      <div className="flex items-center justify-between px-8 py-2 text-slate-300">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium tracking-tight">
            {MONTH_NAMES[selectedMonth]}
          </span>
          {filterType === 'fixed' && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-500/20 border border-teal-500/40 rounded-full text-[10px] text-teal-300 font-medium">
              <span>Despesas fixas</span>
              <button
                onClick={() => setFilterType('all')}
                className="ml-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Card Grande de Topo: Logo + Nome + 4 Métricas em Grade + Botão CONFIRMAR PAGAMENTO */}
      <div className="mx-3 mt-1 bg-[#25252c] rounded-3xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
        {/* Logo Central da Bandeira & Nome */}
        <div className="flex flex-col items-center justify-center gap-2 py-1">
          <CardBrandLogo brand={card.brand} name={card.name} size="lg" />
          <h2 className="text-base font-bold text-white tracking-tight">{card.name}</h2>
        </div>

        {/* Grade 2x2 com as 4 métricas adaptativas */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/40 text-xs">
          {/* Dia de fechamento (Fechou em / Fecha em) */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Dia do fechamento</span>
              <span className="text-white font-semibold">
                {isClosed ? 'Fechou em ' : 'Fecha em '}
                {String(card.closingDay).padStart(2, '0')} {MONTH_NAMES[selectedMonth].substring(0, 3).toLowerCase()}.
              </span>
            </div>
          </div>

          {/* Data vencimento */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Data vencimento</span>
              <span className="text-white font-semibold">
                {String(card.dueDay).padStart(2, '0')} {MONTH_NAMES[selectedMonth].substring(0, 3).toLowerCase()}.
              </span>
            </div>
          </div>

          {/* Status da fatura */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Status da fatura</span>
              <span
                className={`font-semibold ${
                  invoiceStatus === 'open'
                    ? 'text-amber-400'
                    : invoiceStatus === 'paid'
                    ? 'text-teal-300'
                    : invoiceStatus === 'overdue'
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-300'
                }`}
              >
                {invoiceStatus === 'open'
                  ? 'Fatura aberta'
                  : invoiceStatus === 'paid'
                  ? 'Fatura paga'
                  : invoiceStatus === 'overdue'
                  ? 'Fatura vencida'
                  : 'Fatura fechada'}
              </span>
            </div>
          </div>

          {/* Total fatura */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total fatura</span>
              <span className="text-rose-500 font-bold">
                {formatCurrency(invoiceTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão CONFIRMAR PAGAMENTO (quando fechada ou vencida) */}
        {isClosedOrOverdue && invoiceStatus !== 'paid' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>CONFIRMAR PAGAMENTO</span>
            </button>
          </div>
        )}

        {/* Badge se Fatura já está Paga */}
        {invoiceStatus === 'paid' && (
          <div className="pt-2">
            <div className="w-full py-2.5 bg-teal-500/15 border border-teal-500/30 rounded-2xl flex items-center justify-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>FATURA PAGA</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Despesas Agrupadas por Data */}
      <div className="px-4 pt-5 space-y-5">
        {groupedTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhuma despesa lançada nesta fatura.
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.date} className="space-y-2">
              {/* Header de Data (ex: ter., 11/08/2026) */}
              <div className="text-xs font-semibold text-slate-400 tracking-tight">
                {group.formattedDate}
              </div>

              {/* Itens do Dia */}
              <div className="space-y-2.5">
                {group.transactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const parentCat = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
                  const categoryDisplayName = parentCat ? `${parentCat.name} / ${cat?.name}` : cat?.name || 'Geral';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (invoiceStatus === 'open') {
                          onEditTransaction(tx);
                        }
                      }}
                      className={`bg-[#1c1c20]/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-transform ${
                        invoiceStatus === 'open'
                          ? 'active:scale-[0.99] cursor-pointer hover:border-slate-700'
                          : 'cursor-default opacity-90'
                      }`}
                    >
                      {/* Ícone Categoria + Descrição */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md"
                          style={{ backgroundColor: cat?.color || '#3b82f6' }}
                        >
                          {cat?.name ? cat.name.substring(0, 2).toUpperCase() : 'CC'}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-normal text-slate-100 text-sm truncate">
                            {tx.description}
                          </h4>
                          <span className="text-xs text-slate-400 block truncate">
                            {categoryDisplayName}
                          </span>
                          {tx.notes && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                              <span>✏️</span>
                              <span className="truncate">{tx.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Valor + Badges Pequenos */}
                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-sm font-normal text-rose-500 block">
                          {formatCurrency(tx.amount)}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          <span className="p-0.5 rounded bg-teal-500/20 text-teal-300">
                            <CardIcon className="w-3 h-3" />
                          </span>
                          {tx.isRecurring && (
                            <span className="p-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                              📌
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB Flutuante Ciano */}
      <button
        onClick={() => {
          if (isClosedOrOverdue) {
            onToggleInvoiceStatus(card);
            onOpenNewExpense(card.id);
          } else {
            onOpenNewExpense(card.id);
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/40 z-30 transition-transform active:scale-95 cursor-pointer"
        title="Adicionar despesa neste cartão"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Drawer de Ações do Cartão */}
      <CardActionDrawer
        isOpen={isActionDrawerOpen}
        onClose={() => setIsActionDrawerOpen(false)}
        card={card}
        invoiceStatus={invoiceStatus}
        onToggleInvoiceStatus={c => onToggleInvoiceStatus(c)}
        onEdit={() => {}}
        onViewInvoiceDetails={() => {}}
        onArchive={() => {}}
        onAdvancePayment={() => setIsAdvancePaymentOpen(true)}
      />

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
