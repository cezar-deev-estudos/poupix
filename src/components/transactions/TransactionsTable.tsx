'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getTransactionInvoicePeriod, getEffectiveTransactionDate } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { TransactionRowMenu } from './TransactionRowMenu';
import { Check, Clock, CreditCard, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Repeat } from 'lucide-react';

interface TransactionsTableProps {
  transactions: Transaction[];
  showTypeColumn?: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onAttach?: (tx: Transaction) => void;
  onConvertTransfer?: (tx: Transaction) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  showTypeColumn = true,
  onEdit,
  onDelete,
  onAttach,
  onConvertTransfer,
}) => {
  const { categories, accounts, creditCards, updateTransaction, updateCreditCard, transactions: allTransactions } = useFinance();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
  const [openMenuTxId, setOpenMenuTxId] = useState<string | null>(null);

  const getTxDate = (tx: Transaction) => {
    const card = creditCards.find((c) => c.id === tx.creditCardId);
    return getEffectiveTransactionDate(tx, card);
  };

  // Ordenar transações decrescente por data efetiva (vencimento para cartões)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = getTxDate(a);
      const dateB = getTxDate(b);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [transactions, creditCards]);

  // Paginação
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return sortedTransactions.slice(start, start + rowsPerPage);
  }, [sortedTransactions, safeCurrentPage, rowsPerPage]);

  // Agrupamento por dia para calcular saldo do final do dia
  const dailyGroups = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dayBalance: number }[] = [];

    paginatedTransactions.forEach((tx) => {
      const txEffectiveDate = getTxDate(tx);
      const existing = groups.find((g) => g.date === txEffectiveDate);
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      if (existing) {
        existing.items.push(tx);
        existing.dayBalance += delta;
      } else {
        groups.push({
          date: txEffectiveDate,
          items: [tx],
          dayBalance: delta,
        });
      }
    });

    return groups;
  }, [paginatedTransactions, creditCards]);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const togglePaid = (id: string, currentPaid: boolean, txItem?: Transaction) => {
    // Se for uma linha sintética de fatura agrupada: grouped-card-${cardId}-${currentPeriodKey}
    if (id.startsWith('grouped-card-')) {
      const parts = id.replace('grouped-card-', '').split('-');
      const cardId = parts[0];
      const periodKey = `${parts[1]}-${parts[2]}`;
      const card = creditCards.find(c => c.id === cardId);
      if (card) {
        const nextPaidStatus = !currentPaid;
        const newInvoiceStatus: 'open' | 'paid' = nextPaidStatus ? 'paid' : 'open';
        const updatedManual = {
          ...(card.manualInvoiceStatus || {}),
          [periodKey]: newInvoiceStatus,
        };
        updateCreditCard(card.id, {
          manualInvoiceStatus: updatedManual,
        });

        // Atualizar todas as compras vinculadas a esta fatura
        allTransactions.forEach(tx => {
          if (tx.creditCardId === card.id) {
            const { periodKey: txPeriodKey } = getTransactionInvoicePeriod(tx, card);
            if (txPeriodKey === periodKey && tx.paid !== nextPaidStatus) {
              updateTransaction(tx.id, { paid: nextPaidStatus });
            }
          }
        });
      }
      return;
    }

    updateTransaction(id, { paid: !currentPaid });
  };

  const paginationStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const paginationEnd = Math.min(safeCurrentPage * rowsPerPage, totalItems);

  return (
    <div className="bg-[#181c24] border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#14171f]">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">Situação</th>
              {showTypeColumn && <th className="py-3 px-3">Tipo</th>}
              <th className="py-3 px-3">Data ↓</th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Conta / Cartão</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center w-16">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {dailyGroups.map((group) => (
              <React.Fragment key={group.date}>
                {group.items.map((tx) => {
                  const directCat = categories.find((c) => c.id === tx.categoryId);
                  const parentCat = directCat?.parentId ? categories.find((c) => c.id === directCat.parentId) : null;
                  const cat = parentCat || directCat;
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const card = creditCards.find((c) => c.id === tx.creditCardId);
                  const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

                  const effectiveDate = getEffectiveTransactionDate(tx, card);
                  const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
                  const isEffectivelyPaid =
                    tx.paid ||
                    (card && invoicePeriod
                      ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
                      : false);

                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isSelected = selectedIds.includes(tx.id);

                  const isGroupedCard = tx.id.startsWith('grouped-card-') || tx.categoryId === 'grouped-card-category';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[#1e2330]/70 transition-colors ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      } ${isGroupedCard ? 'bg-[#151921]/60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => togglePaid(tx.id, isEffectivelyPaid)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all select-none cursor-pointer ${
                              isEffectivelyPaid
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'bg-[#ef4444] text-white shadow-sm'
                            }`}
                            title={isEffectivelyPaid ? 'Efetivado / Pago' : 'Pendente de pagamento'}
                          >
                            {isEffectivelyPaid ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="text-xs font-black leading-none">!</span>
                            )}
                          </button>

                          {/* Mini badge teal de cartão quando a linha for agrupada */}
                          {isGroupedCard && (
                            <div
                              className="w-6 h-6 rounded-full bg-[#14b8a6] text-slate-950 flex items-center justify-center shadow-sm shrink-0"
                              title="Fatura de Cartão de Crédito Agrupada"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tipo (exibido apenas em visualização mista) */}
                      {showTypeColumn && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isIncome && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Receita
                            </span>
                          )}
                          {isExpense && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              {Boolean(tx.creditCardId || isGroupedCard) ? 'Despesa Cartão' : 'Despesa'}
                            </span>
                          )}
                          {isTransfer && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Transferência
                            </span>
                          )}
                        </td>
                      )}

                      {/* Data */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {formatDateBR(effectiveDate)}
                      </td>

                      {/* Descrição */}
                      <td className="py-3 px-4 min-w-[180px] max-w-[280px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-white truncate" title={tx.description}>
                            {tx.description}
                          </span>
                          {tx.isRecurring && (
                            <span className="inline-flex items-center gap-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 shadow-sm" title="Despesa/Receita Fixa">
                              <Repeat className="w-2.5 h-2.5" /> Fixo
                            </span>
                          )}
                        </div>

                        {/* Observação */}
                        {tx.notes && (
                          <span
                            className="text-[11px] text-slate-400 italic block truncate mt-0.5"
                            title={`Observação: ${tx.notes}`}
                          >
                            <span className="text-slate-500 not-italic font-medium">Obs:</span> {tx.notes}
                          </span>
                        )}

                        {/* Tags */}
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tx.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                              >
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4">
                        {isGroupedCard ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-[10px] tracking-tight shrink-0 shadow-sm">
                              AG
                            </div>
                            <span className="text-slate-300 truncate font-normal">Agrupada cartão</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: cat?.color || '#6B7280' }}
                            >
                              <CategoryIcon name={cat?.icon || 'Tag'} size={12} />
                            </div>
                            <span className="text-slate-300 truncate">{cat?.name || 'Geral'}</span>
                          </div>
                        )}
                      </td>

                      {/* Conta / Cartão */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {isTransfer ? (
                          <span>{acc?.name || 'Conta'} ➔ {destAcc?.name || 'Conta'}</span>
                        ) : card ? (
                          <div className="inline-flex items-center gap-1.5 text-cyan-300 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{card.name}</span>
                          </div>
                        ) : (
                          <span>{acc?.name || 'Conta'}</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td
                        className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                          isIncome
                            ? 'text-emerald-400'
                            : isExpense
                            ? 'text-rose-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center relative">
                        {isGroupedCard ? (
                          <button
                            type="button"
                            onClick={() => togglePaid(tx.id, isEffectivelyPaid)}
                            className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                            title={isEffectivelyPaid ? 'Marcar fatura como pendente' : 'Marcar fatura como paga'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            <TransactionRowMenu
                              transaction={tx}
                              isOpen={openMenuTxId === tx.id}
                              onClose={() => setOpenMenuTxId(null)}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onAttach={onAttach || (() => {})}
                              onConvertTransfer={onConvertTransfer || (() => {})}
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Subtotal Diário (Saldo do Final do Dia) */}
                <tr className="bg-[#14171f]/80">
                  <td colSpan={showTypeColumn ? 9 : 8} className="py-2 text-center">
                    <span className="inline-block bg-[#232733] border border-slate-700/60 text-[11px] font-semibold text-slate-300 px-3.5 py-1 rounded-full shadow-sm">
                      Saldo do Final do Dia ({formatDateBR(group.date)}):{' '}
                      <strong className={group.dayBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(group.dayBalance)}
                      </strong>
                    </span>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior de Paginação */}
      <div className="flex flex-wrap items-center justify-end gap-6 px-6 py-3 border-t border-slate-800 bg-[#14171f] text-xs text-slate-400">
        {/* Seletor de Linhas por página */}
        <div className="flex items-center gap-2 relative">
          <span>Linhas por página:</span>
          <button
            type="button"
            onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
            className="flex items-center gap-1 bg-[#232733] border border-slate-700 text-white px-2.5 py-1 rounded-xl cursor-pointer hover:border-slate-600 transition-colors"
          >
            <span>{rowsPerPage}</span>
            <span className="text-[10px]">▾</span>
          </button>

          {isRowsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsRowsDropdownOpen(false)} />
              <div className="absolute bottom-full mb-1 left-0 w-20 bg-[#232733] border border-slate-700 rounded-xl shadow-2xl z-40 py-1 overflow-hidden">
                {[5, 10, 25, 50, 100, 150, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setRowsPerPage(val);
                      setCurrentPage(1);
                      setIsRowsDropdownOpen(false);
                    }}
                    className={`w-full text-center py-1 text-xs hover:bg-slate-700 cursor-pointer ${
                      rowsPerPage === val ? 'text-indigo-400 font-bold bg-slate-800' : 'text-slate-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Indicador de faixa: 1-25 de 163 */}
        <span>
          {paginationStart}-{paginationEnd} de {totalItems}
        </span>

        {/* Controles de Navegação de Página */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Primeira página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1 text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
