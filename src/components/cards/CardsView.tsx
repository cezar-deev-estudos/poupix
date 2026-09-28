'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Transaction } from '@/types/finance';
import { CreditCardCard } from './CreditCardCard';
import { CardInvoiceDetailView } from './CardInvoiceDetailView';
import { CreditCardModal } from './CreditCardModal';
import { ArchivedCardsModal } from './ArchivedCardsModal';
import { AdvancePaymentModal } from './AdvancePaymentModal';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import { Plus, MoreVertical, ThumbsUp, CreditCard as CardIcon, DollarSign } from 'lucide-react';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface CardsViewProps {
  onNavigateToTransactions?: () => void;
  initialCardId?: string | null;
}

export const CardsView: React.FC<CardsViewProps> = ({ onNavigateToTransactions, initialCardId }) => {
  const {
    creditCards,
    transactions,
    selectedMonth,
    selectedYear,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useFinance();

  // Filtro de Aba Superior: Fatura Mês Atual vs Fatura Próximo Mês
  const [invoiceTab, setInvoiceTab] = useState<'current_month' | 'next_month'>('current_month');

  // Seleção de Cartão para Visualização Detalhada da Fatura
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<CreditCard | null>(() => {
    if (initialCardId) {
      return creditCards.find(c => c.id === initialCardId) || null;
    }
    return null;
  });

  // Estados de Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [advancePaymentCard, setAdvancePaymentCard] = useState<CreditCard | null>(null);

  // Modal de Transação
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalCreditCardId, setTxModalCreditCardId] = useState<string | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Cartões Ativos vs Arquivados
  const activeCards = useMemo(() => {
    return creditCards.filter(c => !c.isArchived);
  }, [creditCards]);

  const archivedCards = useMemo(() => {
    return creditCards.filter(c => !!c.isArchived);
  }, [creditCards]);

  // Determinar o mês alvo para os cálculos baseado na aba ativa
  const targetMonth = useMemo(() => {
    if (invoiceTab === 'next_month') {
      return (selectedMonth + 1) % 12;
    }
    return selectedMonth;
  }, [invoiceTab, selectedMonth]);

  const targetYear = useMemo(() => {
    if (invoiceTab === 'next_month' && selectedMonth === 11) {
      return selectedYear + 1;
    }
    return selectedYear;
  }, [invoiceTab, selectedMonth, selectedYear]);

  // Chave do período alvo (ex: "2026-09")
  const targetPeriodKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

  // Cálculo de Despesas por Cartão no Mês Alvo
  const cardExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeCards.forEach(c => {
      const expenses = transactions
        .filter(t => {
          if (t.creditCardId !== c.id) return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
        })
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
      map[c.id] = Math.max(0, expenses);
    });
    return map;
  }, [activeCards, transactions, targetMonth, targetYear]);

  // Cálculos de Resumo da Direita
  const totalLimitAvailable = useMemo(() => {
    return activeCards.reduce((sum, c) => {
      const spent = cardExpensesMap[c.id] || 0;
      return sum + Math.max(0, c.limit - spent);
    }, 0);
  }, [activeCards, cardExpensesMap]);

  const totalInvoicesAmount = useMemo(() => {
    return Object.values(cardExpensesMap).reduce((sum, v) => sum + v, 0);
  }, [cardExpensesMap]);

  // Melhor cartão para comprar hoje (aquele cujo fechamento está mais distante a partir de hoje)
  const bestCardToBuyToday = useMemo(() => {
    if (activeCards.length === 0) return null;
    const currentDay = new Date().getDate();

    let bestCard = activeCards[0];
    let maxDaysUntilClosing = -1;

    activeCards.forEach(card => {
      let days = card.closingDay - currentDay;
      if (days <= 0) days += 30; // fecha no próximo ciclo
      if (days > maxDaysUntilClosing) {
        maxDaysUntilClosing = days;
        bestCard = card;
      }
    });

    return bestCard;
  }, [activeCards]);

  // Formatação de data de fechamento ou vencimento
  const getClosingOrDueDateFormatted = (card: CreditCard) => {
    const status = getCardInvoiceStatus(card);
    if (status === 'overdue') {
      return `${card.dueDay} de ${MONTH_NAMES[targetMonth]} de ${targetYear}`;
    }
    if (status === 'closed') {
      return `${card.dueDay} de ${MONTH_NAMES[targetMonth]} de ${targetYear}`;
    }
    return `${card.closingDay} de ${MONTH_NAMES[targetMonth]} de ${targetYear}`;
  };

  // Status da fatura de cada cartão (Aberta, Fechada, Vencida, Paga)
  const getCardInvoiceStatus = (card: CreditCard): 'open' | 'closed' | 'overdue' | 'paid' => {
    if (card.manualInvoiceStatus && card.manualInvoiceStatus[targetPeriodKey]) {
      const manual = card.manualInvoiceStatus[targetPeriodKey];
      if (manual === 'open') return 'open';
      if (manual === 'paid') return 'paid';
    }
    const today = new Date();
    const dueDate = new Date(targetYear, targetMonth, card.dueDay);
    if (today > dueDate) return 'overdue';
    const closingDate = new Date(targetYear, targetMonth, card.closingDay);
    if (today > closingDate) return 'closed';
    return 'open';
  };

  // Alternar Status da Fatura (Reabrir se Fechada/Vencida/Paga, ou Fechar se Aberta)
  const handleToggleInvoiceStatus = (card: CreditCard, period: string = targetPeriodKey) => {
    const currentStatus = getCardInvoiceStatus(card);
    const newStatus: 'open' | 'closed' = (currentStatus === 'closed' || currentStatus === 'overdue' || currentStatus === 'paid') ? 'open' : 'closed';

    const updatedManual = {
      ...(card.manualInvoiceStatus || {}),
      [period]: newStatus,
    };

    updateCreditCard(card.id, {
      manualInvoiceStatus: updatedManual,
    });
  };

  // Pagar Fatura
  const handlePayInvoice = (card: CreditCard, period: string = targetPeriodKey) => {
    const updatedManual = {
      ...(card.manualInvoiceStatus || {}),
      [period]: 'paid' as const,
    };
    updateCreditCard(card.id, {
      manualInvoiceStatus: updatedManual,
    });
  };

  // Handlers
  const handleSaveCard = (data: Omit<CreditCard, 'id' | 'createdAt'>, editId?: string) => {
    if (editId) {
      updateCreditCard(editId, data);
    } else {
      addCreditCard(data);
    }
  };

  const handleArchiveCard = (card: CreditCard) => {
    updateCreditCard(card.id, { isArchived: true });
    if (selectedCardForDetail?.id === card.id) {
      setSelectedCardForDetail(null);
    }
  };

  const handleUnarchiveCard = (cardId: string) => {
    updateCreditCard(cardId, { isArchived: false });
  };

  const handleOpenAddExpense = (card: CreditCard) => {
    setTxModalCreditCardId(card.id);
    setTransactionToEdit(null);
    setIsTxModalOpen(true);
  };

  // Se um cartão estiver selecionado, exibe a tela detalhada da fatura
  if (selectedCardForDetail) {
    const currentSelected = activeCards.find(c => c.id === selectedCardForDetail.id) || selectedCardForDetail;
    return (
      <>
        <CardInvoiceDetailView
          card={currentSelected}
          allCards={activeCards}
          onBack={() => setSelectedCardForDetail(null)}
          onSelectAnotherCard={card => setSelectedCardForDetail(card)}
          onOpenNewExpense={cardId => {
            setTxModalCreditCardId(cardId);
            setTransactionToEdit(null);
            setIsTxModalOpen(true);
          }}
          onEditTransaction={tx => {
            setTransactionToEdit(tx);
            setIsTxModalOpen(true);
          }}
          onToggleInvoiceStatus={(c, pKey) => handleToggleInvoiceStatus(c, pKey)}
        />

        {isTxModalOpen && (
          <NewTransactionModal
            isOpen={isTxModalOpen}
            onClose={() => {
              setIsTxModalOpen(false);
              setTxModalCreditCardId(null);
              setTransactionToEdit(null);
            }}
            defaultType="expense"
            flowType="creditCard"
            transactionToEdit={transactionToEdit}
            defaultCreditCardId={txModalCreditCardId || currentSelected.id}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Cartões de crédito</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador Toggle: Fatura Mês Atual | Fatura Próximo Mês */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs">
            <button
              onClick={() => setInvoiceTab('current_month')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                invoiceTab === 'current_month'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fatura Mês Atual
            </button>
            <button
              onClick={() => setInvoiceTab('next_month')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                invoiceTab === 'next_month'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fatura Próximo Mês
            </button>
          </div>

          {/* Botão + (Novo Cartão) */}
          <button
            onClick={() => {
              setCardToEdit(null);
              setIsCardModalOpen(true);
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-sm"
            title="Adicionar Novo Cartão"
          >
            <Plus className="w-4 h-4" />
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
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsArchivedModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors cursor-pointer"
                >
                  Cartões Arquivados ({archivedCards.length})
                </button>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    onNavigateToTransactions?.();
                  }}
                  className="w-full px-4 py-2.5 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors cursor-pointer border-t border-slate-700/50"
                >
                  Tipo de visualização
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Grade de Cartões (8 colunas) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card "+ Novo cartão de crédito" */}
            <div
              onClick={() => {
                setCardToEdit(null);
                setIsCardModalOpen(true);
              }}
              className="bg-[#18181b]/50 border-2 border-dashed border-slate-800/90 hover:border-teal-500/60 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] gap-3 cursor-pointer group transition-all"
            >
              <div className="w-12 h-12 rounded-full border border-teal-500/40 bg-teal-600/10 group-hover:bg-teal-600/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-all shadow-lg shadow-teal-600/10">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                Novo cartão de crédito
              </span>
            </div>

            {/* Lista de Cartões */}
            {activeCards.map(card => {
              const status = getCardInvoiceStatus(card);
              const today = new Date();
              const isOverdue = today > new Date(targetYear, targetMonth, card.dueDay);
              const isClosed = today > new Date(targetYear, targetMonth, card.closingDay);

              return (
                <CreditCardCard
                  key={card.id}
                  card={card}
                  invoiceAmount={cardExpensesMap[card.id] || 0}
                  invoiceStatus={status}
                  closingOrDueDateFormatted={getClosingOrDueDateFormatted(card)}
                  isOverdue={isOverdue}
                  isClosed={isClosed}
                  onSelectCard={c => setSelectedCardForDetail(c)}
                  onEdit={c => {
                    setCardToEdit(c);
                    setIsCardModalOpen(true);
                  }}
                  onArchive={handleArchiveCard}
                  onAddExpense={handleOpenAddExpense}
                  onPayInvoice={c => handlePayInvoice(c)}
                  onViewHistory={c => setSelectedCardForDetail(c)}
                  onViewFixedExpenses={c => setSelectedCardForDetail(c)}
                  onViewExpenseChart={c => setSelectedCardForDetail(c)}
                  onToggleInvoiceStatus={c => handleToggleInvoiceStatus(c)}
                  onAdvancePayment={c => setAdvancePaymentCard(c)}
                />
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Cards de Resumo dos Cartões (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Melhor cartão para comprar hoje */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs text-slate-400 font-medium block">
                O melhor cartão para comprar hoje é
              </span>
              <div className="text-base font-bold tracking-tight text-white mt-1.5 truncate">
                {bestCardToBuyToday ? bestCardToBuyToday.name : 'Nenhum cartão cadastrado'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30 shrink-0">
              <ThumbsUp className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* Card 2: Limite Disponível */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Limite Disponível</span>
              <div className="text-xl font-bold tracking-tight text-white mt-1.5">
                {formatCurrency(totalLimitAvailable)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <CardIcon className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* Card 3: Valor total */}
          <div className="bg-[#18181b]/90 border border-slate-800/90 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Valor total</span>
              <div className="text-xl font-bold tracking-tight text-white mt-1.5">
                {formatCurrency(totalInvoicesAmount)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
              <DollarSign className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Modais de Suporte */}
      <CreditCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setCardToEdit(null);
        }}
        onSave={handleSaveCard}
        cardToEdit={cardToEdit}
      />

      <ArchivedCardsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        archivedCards={archivedCards}
        onUnarchive={handleUnarchiveCard}
        onDelete={deleteCreditCard}
      />

      <AdvancePaymentModal
        isOpen={!!advancePaymentCard}
        onClose={() => setAdvancePaymentCard(null)}
        card={advancePaymentCard}
        onConfirm={() => {
          if (advancePaymentCard) {
            handleOpenAddExpense(advancePaymentCard);
          }
        }}
      />

      {isTxModalOpen && (
        <NewTransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setTxModalCreditCardId(null);
            setTransactionToEdit(null);
          }}
          defaultType="expense"
          flowType="creditCard"
          transactionToEdit={transactionToEdit}
          defaultCreditCardId={txModalCreditCardId}
        />
      )}
    </div>
  );
};
