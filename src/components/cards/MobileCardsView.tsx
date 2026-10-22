'use client';

import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { CardBrandLogo } from './CardBrandLogo';
import { CreditCardModal } from './CreditCardModal';
import { ArchivedCardsDrawer } from './ArchivedCardsDrawer';
import { DefaultCardDrawer } from './DefaultCardDrawer';
import { CardActionDrawer } from './CardActionDrawer';
import { AdvancePaymentModal } from './AdvancePaymentModal';
import { MobileCardInvoiceDetail } from './MobileCardInvoiceDetail';
import { NewTransactionModal } from '../transactions/NewTransactionModal';
import { ConfirmPaymentModal } from '../transactions/ConfirmPaymentModal';
import { isTransactionInInvoicePeriod, isInvoicePeriodPaid, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import {
  ArrowLeft,
  Archive,
  ListOrdered,
  MoreVertical,
  Plus,
  DollarSign,
  CheckSquare,
  Square,
  HelpCircle,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard as CardIcon,
} from 'lucide-react';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface MobileCardsViewProps {
  onBack?: () => void;
  onNavigateToTransactions?: () => void;
  initialCardId?: string | null;
}

export const MobileCardsView: React.FC<MobileCardsViewProps> = ({
  onBack,
  onNavigateToTransactions,
  initialCardId,
}) => {
  const {
    creditCards,
    transactions,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    updateTransaction,
  } = useFinance();

  // Seleção para Detalhe da Fatura
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<CreditCard | null>(() => {
    if (initialCardId) {
      return creditCards.find(c => c.id === initialCardId) || null;
    }
    return null;
  });
  const [detailFilterType, setDetailFilterType] = useState<'all' | 'fixed'>('all');

  React.useEffect(() => {
    if (initialCardId) {
      const target = creditCards.find(c => c.id === initialCardId);
      if (target) setSelectedCardForDetail(target);
    }
  }, [initialCardId, creditCards]);

  // Estados de Drawers e Modais
  const [isArchivedDrawerOpen, setIsArchivedDrawerOpen] = useState(false);
  const [isDefaultCardDrawerOpen, setIsDefaultCardDrawerOpen] = useState(false);
  const [defaultCardId, setDefaultCardId] = useState<string>(creditCards[0]?.id || '');

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [includeInHomeChecked, setIncludeInHomeChecked] = useState(true);
  const [monthlyViewChecked, setMonthlyViewChecked] = useState(false);
  const [expandChecked, setExpandChecked] = useState(false);

  // Drawer de Ações ⋮ de cada Cartão
  const [actionDrawerCard, setActionDrawerCard] = useState<CreditCard | null>(null);
  const [advancePaymentCard, setAdvancePaymentCard] = useState<CreditCard | null>(null);

  // Modal de Criação / Edição
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);

  // Modal de Transação Rápida
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalCreditCardId, setTxModalCreditCardId] = useState<string | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Modal de Confirmação de Pagamento de Fatura
  const [payingInvoiceCard, setPayingInvoiceCard] = useState<CreditCard | null>(null);

  // Cartões Ativos vs Arquivados
  const activeCards = useMemo(() => {
    return creditCards.filter(c => !c.isArchived);
  }, [creditCards]);

  const archivedCards = useMemo(() => {
    return creditCards.filter(c => !!c.isArchived);
  }, [creditCards]);

  // Mês e Ano de Referência (Mês Atual Real do Sistema)
  const currentRealMonth = useMemo(() => new Date().getMonth(), []);
  const currentRealYear = useMemo(() => new Date().getFullYear(), []);

  // Determinar qual aba está ativa comparando selectedMonth/selectedYear com o mês atual real
  const activeTabKey = useMemo((): 'previous_month' | 'current_month' | 'next_month' | 'custom' => {
    const prevMonth = (currentRealMonth + 11) % 12;
    const prevYear = currentRealMonth === 0 ? currentRealYear - 1 : currentRealYear;
    if (selectedMonth === prevMonth && selectedYear === prevYear) {
      return 'previous_month';
    }
    if (selectedMonth === currentRealMonth && selectedYear === currentRealYear) {
      return 'current_month';
    }
    const nextMonth = (currentRealMonth + 1) % 12;
    const nextYear = currentRealMonth === 11 ? currentRealYear + 1 : currentRealYear;
    if (selectedMonth === nextMonth && selectedYear === nextYear) {
      return 'next_month';
    }
    return 'custom';
  }, [selectedMonth, selectedYear, currentRealMonth, currentRealYear]);

  // Handlers para os 3 botões de meses (atualizam diretamente o contexto global)
  const handleSelectPreviousMonth = () => {
    const prevMonth = (currentRealMonth + 11) % 12;
    const prevYear = currentRealMonth === 0 ? currentRealYear - 1 : currentRealYear;
    setSelectedMonth(prevMonth);
    setSelectedYear(prevYear);
  };

  const handleSelectCurrentMonth = () => {
    setSelectedMonth(currentRealMonth);
    setSelectedYear(currentRealYear);
  };

  const handleSelectNextMonth = () => {
    const nextMonth = (currentRealMonth + 1) % 12;
    const nextYear = currentRealMonth === 11 ? currentRealYear + 1 : currentRealYear;
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  // Handlers para as setas do seletor de mês mobile
  const handleStepPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleStepNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Período alvo para as faturas (diretamente o mês e ano selecionados no seletor)
  const targetMonth = selectedMonth;
  const targetYear = selectedYear;

  // Chave do período
  const targetPeriodKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

  // Despesas por Cartão no período alvo (baseado no vencimento da fatura)
  const cardExpensesMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeCards.forEach(c => {
      const expenses = transactions
        .filter(t => isTransactionInInvoicePeriod(t, c, targetYear, targetMonth))
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
      map[c.id] = Math.max(0, expenses);
    });
    return map;
  }, [activeCards, transactions, targetMonth, targetYear]);

  // Resumo de Limite Disponível e Total de Faturas
  const totalLimitAvailable = useMemo(() => {
    return activeCards.reduce((sum, c) => {
      const spent = cardExpensesMap[c.id] || 0;
      return sum + Math.max(0, c.limit - spent);
    }, 0);
  }, [activeCards, cardExpensesMap]);

  const totalInvoicesAmount = useMemo(() => {
    return Object.values(cardExpensesMap).reduce((sum, v) => sum + v, 0);
  }, [cardExpensesMap]);

  // Melhor cartão para comprar hoje
  const bestCardToBuyToday = useMemo(() => {
    if (activeCards.length === 0) return null;
    const currentDay = new Date().getDate();

    let bestCard = activeCards[0];
    let maxDaysUntilClosing = -1;

    activeCards.forEach(card => {
      let days = card.closingDay - currentDay;
      if (days <= 0) days += 30;
      if (days > maxDaysUntilClosing) {
        maxDaysUntilClosing = days;
        bestCard = card;
      }
    });

    return bestCard;
  }, [activeCards]);

  // Formatação de data de fechamento ou vencimento por cartão
  const getClosingOrDueDateFormatted = (card: CreditCard) => {
    const status = getCardInvoiceStatus(card);
    if (status === 'overdue' || status === 'closed' || status === 'paid') {
      return `${card.dueDay} de ${MONTH_NAMES[targetMonth]} de ${targetYear}`;
    }
    return `${card.closingDay} de ${MONTH_NAMES[targetMonth]} de ${targetYear}`;
  };

  // Status de Fatura de cada Cartão (Aberta, Fechada, Vencida, Paga)
  const getCardInvoiceStatus = (card: CreditCard): 'open' | 'closed' | 'overdue' | 'paid' => {
    if (isInvoicePeriodPaid(card, transactions, targetYear, targetMonth)) {
      return 'paid';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(targetYear, targetMonth, card.dueDay);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) return 'overdue';

    const closingDate = new Date(targetYear, targetMonth, card.closingDay);
    closingDate.setHours(0, 0, 0, 0);
    if (today > closingDate) return 'closed';

    if (card.manualInvoiceStatus && card.manualInvoiceStatus[targetPeriodKey] === 'closed') {
      return 'closed';
    }

    return 'open';
  };

  // Alternar Status da Fatura (Reabrir / Fechar)
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

    if (newStatus === 'open') {
      transactions.forEach(tx => {
        if (tx.creditCardId === card.id) {
          const { periodKey } = getTransactionInvoicePeriod(tx, card);
          if (periodKey === period && tx.paid) {
            updateTransaction(tx.id, { paid: false });
          }
        }
      });
    }
  };

  // Solicitar Confirmação de Pagamento de Fatura
  const handleOpenPayInvoice = (card: CreditCard) => {
    setPayingInvoiceCard(card);
  };

  // Confirmar Execução do Pagamento da Fatura
  const handleConfirmPayInvoice = (paymentDate?: string) => {
    if (!payingInvoiceCard) return;
    const card = payingInvoiceCard;
    const period = targetPeriodKey;

    const updatedManual = {
      ...(card.manualInvoiceStatus || {}),
      [period]: 'paid' as const,
    };
    updateCreditCard(card.id, {
      manualInvoiceStatus: updatedManual,
    });

    transactions.forEach(tx => {
      if (tx.creditCardId === card.id) {
        const { periodKey } = getTransactionInvoicePeriod(tx, card);
        if (periodKey === period && !tx.paid) {
          updateTransaction(tx.id, {
            paid: true,
            ...(paymentDate ? { date: paymentDate } : {}),
          });
        }
      }
    });

    setPayingInvoiceCard(null);
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

  // Se um cartão estiver selecionado, renderiza a tela detalhada de fatura mobile
  if (selectedCardForDetail) {
    const currentSelected = activeCards.find(c => c.id === selectedCardForDetail.id) || selectedCardForDetail;
    return (
      <>
        <MobileCardInvoiceDetail
          card={currentSelected}
          allCards={activeCards}
          initialFilterType={detailFilterType}
          onBack={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const closingDate = new Date(targetYear, targetMonth, currentSelected.closingDay);
            closingDate.setHours(0, 0, 0, 0);

            if (today > closingDate && currentSelected.manualInvoiceStatus?.[targetPeriodKey] === 'open') {
              const updatedManual = {
                ...(currentSelected.manualInvoiceStatus || {}),
                [targetPeriodKey]: 'closed' as const,
              };
              updateCreditCard(currentSelected.id, {
                manualInvoiceStatus: updatedManual,
              });
            }

            setSelectedCardForDetail(null);
            setDetailFilterType('all');
          }}
          onSelectAnotherCard={c => setSelectedCardForDetail(c)}
          onOpenNewExpense={cardId => {
            setTxModalCreditCardId(cardId);
            setTransactionToEdit(null);
            setIsTxModalOpen(true);
          }}
          onEditTransaction={tx => {
            setTransactionToEdit(tx);
            setIsTxModalOpen(true);
          }}
          onToggleInvoiceStatus={c => handleToggleInvoiceStatus(c)}
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
          <h1 className="text-lg font-semibold text-white tracking-tight">Cartão de crédito</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Gaveta de Arquivados */}
          <button
            onClick={() => setIsArchivedDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cartões arquivados"
          >
            <Archive className="w-5 h-5" />
          </button>

          {/* Cartão Manual Padrão */}
          <button
            onClick={() => setIsDefaultCardDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cartão manual padrão"
          >
            <ListOrdered className="w-5 h-5" />
          </button>

          {/* Menu Dropdown ⋮ */}
          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Mais opções"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#2a2a30] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  onClick={() => setIncludeInHomeChecked(!includeInHomeChecked)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-slate-200 hover:bg-slate-800/80 text-left transition-colors cursor-pointer"
                >
                  <span>Incluir na tela inicial</span>
                  {includeInHomeChecked ? (
                    <CheckSquare className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => setMonthlyViewChecked(!monthlyViewChecked)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-slate-200 hover:bg-slate-800/80 text-left transition-colors cursor-pointer"
                >
                  <span>Visualização mensal</span>
                  {monthlyViewChecked ? (
                    <CheckSquare className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => setExpandChecked(!expandChecked)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-slate-200 hover:bg-slate-800/80 text-left transition-colors cursor-pointer"
                >
                  <span>Expandir</span>
                  {expandChecked ? (
                    <CheckSquare className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => setIsHeaderMenuOpen(false)}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/80 text-left transition-colors border-t border-slate-700/60 mt-1 pt-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Ajuda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seletor de Mês Mobile com Setas */}
      <div className="px-4 pt-1 pb-1 flex justify-center">
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-1.5 w-full max-w-sm shadow-md">
          <button
            type="button"
            onClick={handleStepPrevMonth}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-slate-800/60 rounded-lg transition-colors"
            onClick={handleSelectCurrentMonth}
            title="Ir para o mês atual"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-bold text-white text-xs select-none">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleStepNextMonth}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abas Pílula: Mês Anterior | Mês Atual | Próximo Mês */}
      <div className="px-4 py-2 flex justify-center">
        <div className="flex bg-[#25252c] p-1 rounded-2xl border border-slate-800 w-full max-w-sm">
          <button
            onClick={handleSelectPreviousMonth}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTabKey === 'previous_month'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Anterior
          </button>
          <button
            onClick={handleSelectCurrentMonth}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTabKey === 'current_month'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={handleSelectNextMonth}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTabKey === 'next_month'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Próximo Mês
          </button>
        </div>
      </div>

      {/* Lista de Cards de Cartões */}
      <div className="px-4 pt-2 space-y-3.5 flex-1">
        {activeCards.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhum cartão cadastrado.
          </div>
        ) : (
          activeCards.map(card => {
            const invoiceAmount = cardExpensesMap[card.id] || 0;
            const invoiceStatus = getCardInvoiceStatus(card);
            const isClosedOrOverdue = invoiceStatus === 'closed' || invoiceStatus === 'overdue' || invoiceStatus === 'paid';
            const limitUsedPercent = Math.min(100, (invoiceAmount / (card.limit || 1)) * 100);

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardForDetail(card)}
                className="bg-[#242428] border border-slate-800/90 rounded-3xl p-4 shadow-xl space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
              >
                {/* Linha 1: Bandeira + Nome + Menu ⋮ */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CardBrandLogo brand={card.brand} name={card.name} size="md" />
                    <h3 className="font-semibold text-white text-sm truncate">{card.name}</h3>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActionDrawerCard(card);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Linha 2: Valor Total / Parcial + Data Fechamento/Vencimento */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {isClosedOrOverdue ? 'Valor total' : 'Valor parcial'}
                    </span>
                    <span className="font-bold text-rose-500">
                      {formatCurrency(invoiceAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {invoiceStatus === 'overdue' ? 'Venceu em' : isClosedOrOverdue ? 'Vence em' : 'Fecha em'}
                    </span>
                    <span className="text-slate-200 font-medium">{getClosingOrDueDateFormatted(card)}</span>
                  </div>
                </div>

                {/* Linha 3: Barra de Limite */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${limitUsedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Disponível {formatCurrency(Math.max(0, card.limit - invoiceAmount))}</span>
                    <span>{limitUsedPercent.toFixed(limitUsedPercent % 1 === 0 ? 0 : 2)}%</span>
                  </div>
                </div>

                {/* Linha 4: Botão de Ação: FATURA PAGA / PAGAR FATURA / ADICIONAR DESPESA */}
                <div
                  className="pt-2 border-t border-slate-800/70 flex justify-end"
                  onClick={e => e.stopPropagation()}
                >
                  {invoiceStatus === 'paid' ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-teal-300 font-bold px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>FATURA PAGA</span>
                    </div>
                  ) : isClosedOrOverdue ? (
                    <button
                      onClick={() => handleOpenPayInvoice(card)}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-full px-3.5 py-1.5 transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {invoiceStatus === 'overdue' ? 'PAGAR FATURA - VENCIDA' : 'PAGAR FATURA'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTxModalCreditCardId(card.id);
                        setTransactionToEdit(null);
                        setIsTxModalOpen(true);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full px-3.5 py-1.5 transition-all uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      ADICIONAR DESPESA
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB Flutuante Ciano */}
      <button
        onClick={() => {
          setCardToEdit(null);
          setIsCardModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/40 z-30 transition-transform active:scale-95 cursor-pointer"
        title="Novo cartão"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Drawers e Modais */}
      <ArchivedCardsDrawer
        isOpen={isArchivedDrawerOpen}
        onClose={() => setIsArchivedDrawerOpen(false)}
        archivedCards={archivedCards}
        onUnarchive={handleUnarchiveCard}
        onDelete={deleteCreditCard}
      />

      <DefaultCardDrawer
        isOpen={isDefaultCardDrawerOpen}
        onClose={() => setIsDefaultCardDrawerOpen(false)}
        cards={activeCards}
        selectedCardId={defaultCardId}
        onSelectDefaultCard={setDefaultCardId}
      />

      <CardActionDrawer
        isOpen={!!actionDrawerCard}
        onClose={() => setActionDrawerCard(null)}
        card={actionDrawerCard}
        invoiceStatus={actionDrawerCard ? getCardInvoiceStatus(actionDrawerCard) : 'open'}
        isOverdue={
          actionDrawerCard
            ? (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(targetYear, targetMonth, actionDrawerCard.dueDay);
                dueDate.setHours(0, 0, 0, 0);
                return today > dueDate;
              })()
            : false
        }
        onToggleInvoiceStatus={c => handleToggleInvoiceStatus(c)}
        onPayInvoice={c => handleOpenPayInvoice(c)}
        onEdit={c => {
          setCardToEdit(c);
          setIsCardModalOpen(true);
        }}
        onViewInvoiceDetails={(c, filterType) => {
          setDetailFilterType(filterType || 'all');
          setSelectedCardForDetail(c);
        }}
        onArchive={handleArchiveCard}
        onAdvancePayment={c => setAdvancePaymentCard(c)}
      />

      <AdvancePaymentModal
        isOpen={!!advancePaymentCard}
        onClose={() => setAdvancePaymentCard(null)}
        card={advancePaymentCard}
        onConfirm={() => {
          if (advancePaymentCard) {
            setTxModalCreditCardId(advancePaymentCard.id);
            setTransactionToEdit(null);
            setIsTxModalOpen(true);
          }
        }}
      />

      <CreditCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setCardToEdit(null);
        }}
        onSave={handleSaveCard}
        cardToEdit={cardToEdit}
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

      {payingInvoiceCard && (
        <ConfirmPaymentModal
          isOpen={!!payingInvoiceCard}
          transaction={null}
          isGroupedCard={true}
          invoiceInfo={{
            cardName: `Fatura ${payingInvoiceCard.name}`,
            amount: cardExpensesMap[payingInvoiceCard.id] || 0,
            dueDate: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(payingInvoiceCard.dueDay).padStart(2, '0')}`,
          }}
          onConfirm={handleConfirmPayInvoice}
          onCancel={() => setPayingInvoiceCard(null)}
          onClose={() => setPayingInvoiceCard(null)}
          currentPaid={false}
        />
      )}
    </div>
  );
};
