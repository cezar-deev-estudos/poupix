'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getEffectiveTransactionDate } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CheckCircle2, Clock, Trash2, Pencil, ArrowRightLeft, CreditCard, Wallet } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';
import { NewTransactionModal } from './NewTransactionModal';
import { TransactionScopeModal } from './TransactionScopeModal';

interface TransactionListProps {
  limit?: number;
  showAll?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ limit, showAll = false }) => {
  const { filteredTransactions, categories, accounts, creditCards, updateTransaction, deleteTransaction } = useFinance();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'following' | 'all'>('single');
  const [confirmingTx, setConfirmingTx] = useState<Transaction | null>(null);

  const transactionsToDisplay = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;

  const handleRequestTogglePaid = (tx: Transaction) => {
    setConfirmingTx(tx);
  };

  const handleConfirmExecutePayment = (paymentDate?: string) => {
    if (!confirmingTx) return;
    const nextPaid = !confirmingTx.paid;
    updateTransaction(confirmingTx.id, {
      paid: nextPaid,
      ...(paymentDate && nextPaid ? { paymentDate } : {}),
    });
    setConfirmingTx(null);
  };

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

  const isInstallment = !!(
    deletingTransaction?.installmentGroupId ||
    (deletingTransaction?.installmentTotal && deletingTransaction.installmentTotal > 1)
  );

  if (transactionsToDisplay.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-sm">
        <p>Nenhuma transação cadastrada para este período.</p>
        <p className="text-xs text-slate-600 mt-1">Clique no botão de novo lançamento para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {transactionsToDisplay.map((tx) => {
          const directCat = categories.find((c) => c.id === tx.categoryId);
          const parentCat = directCat?.parentId ? categories.find((c) => c.id === directCat.parentId) : null;
          const cat = parentCat || directCat;
          const acc = accounts.find((a) => a.id === tx.accountId);
          const card = creditCards.find((c) => c.id === tx.creditCardId);
          const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

          const isExpense = tx.type === 'expense';
          const isIncome = tx.type === 'income';

          const accountName =
            tx.type === 'transfer'
              ? `${acc?.name || 'Conta'} ➔ ${destAcc?.name || 'Conta'}`
              : card
              ? card.name
              : acc?.name || 'Conta';
          const categoryName = cat?.name || 'Geral';

          return (
            <div
              key={tx.id}
              onClick={() => setEditingTransaction(tx)}
              className="flex items-center justify-between p-3.5 bg-[#242732]/90 border border-slate-800/70 hover:border-slate-700 rounded-2xl transition-all active:scale-[0.99] cursor-pointer group"
            >
              {/* Ícone e Detalhes da Transação */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md mt-0.5"
                  style={{
                    backgroundColor:
                      cat?.color || (tx.type === 'transfer' ? '#3B82F6' : isExpense ? '#f97316' : '#84cc16'),
                  }}
                >
                  <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-normal text-slate-100 text-xs truncate group-hover:text-white transition-colors">
                      {tx.description}
                    </span>
                    {tx.isRecurring && (
                      <span className="inline-flex items-center gap-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 text-[9px] font-normal px-1.5 py-0.2 rounded-md shrink-0 shadow-sm" title="Despesa/Receita Fixa">
                        Fixa
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                    <span className="truncate">{categoryName}</span>
                    <span className="text-slate-600">|</span>
                    {card ? (
                      <span className="inline-flex items-center gap-1 text-cyan-300 truncate">
                        <CreditCard className="w-3 h-3 shrink-0 text-cyan-400" />
                        <span className="truncate">{accountName}</span>
                      </span>
                    ) : (
                      <span className="truncate">{accountName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Valor e Botão Circular de Status */}
              <div className="flex items-center gap-2.5 shrink-0 ml-3 self-center">
                <span
                  className={`text-xs font-semibold ${
                    isIncome
                      ? 'text-emerald-400'
                      : isExpense
                      ? 'text-rose-400'
                      : 'text-blue-400'
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestTogglePaid(tx);
                  }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                    tx.paid
                      ? 'bg-[#22c55e] text-slate-950 shadow-sm'
                      : 'bg-[#ef4444] text-white shadow-sm'
                  }`}
                  title={tx.paid ? 'Efetivado / Pago' : 'Pendente de pagamento'}
                >
                  {tx.paid ? (
                    <span className="text-[10px] font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] font-black leading-none">!</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação de Efetivação / Pagamento com data */}
      {confirmingTx && (
        <ConfirmPaymentModal
          isOpen={Boolean(confirmingTx)}
          onClose={() => setConfirmingTx(null)}
          onConfirm={handleConfirmExecutePayment}
          currentPaid={confirmingTx.paid}
          transaction={confirmingTx}
        />
      )}

      {/* Modal de Edição de Transação */}
      {editingTransaction && (
        <NewTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}

      {/* Modal de Confirmação de Exclusão Especial para Recorrência / Parcelas */}
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
        /* Modal Padrão de Confirmação de Exclusão para Transações Simples */
        <ConfirmModal
          isOpen={!!deletingTransaction}
          title="Excluir Lançamento"
          message={`Tem certeza que deseja excluir o lançamento "${deletingTransaction?.description}" no valor de ${deletingTransaction ? formatCurrency(deletingTransaction.amount) : ''}? Esta ação não poderá ser desfeita.`}
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}
    </>
  );
};
