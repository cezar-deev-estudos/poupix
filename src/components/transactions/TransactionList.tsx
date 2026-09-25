'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CheckCircle2, Clock, Trash2, Pencil, ArrowRightLeft, CreditCard, Wallet } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { ConfirmModal } from '../ui/ConfirmModal';
import { NewTransactionModal } from './NewTransactionModal';

interface TransactionListProps {
  limit?: number;
  showAll?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ limit, showAll = false }) => {
  const { filteredTransactions, categories, accounts, creditCards, updateTransaction, deleteTransaction } = useFinance();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'following' | 'all'>('single');

  const transactionsToDisplay = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;

  const togglePaid = (id: string, currentPaid: boolean) => {
    updateTransaction(id, { paid: !currentPaid });
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
      <div className="space-y-2.5">
        {transactionsToDisplay.map(tx => {
          const cat = categories.find(c => c.id === tx.categoryId);
          const parentCat = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
          const categoryDisplayName = parentCat ? `${parentCat.name} / ${cat?.name}` : cat?.name || 'Geral';
          const acc = accounts.find(a => a.id === tx.accountId);
          const card = creditCards.find(c => c.id === tx.creditCardId);
          const destAcc = accounts.find(a => a.id === tx.destinationAccountId);

          const isExpense = tx.type === 'expense';
          const isIncome = tx.type === 'income';
          const isTransfer = tx.type === 'transfer';

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition-all group"
            >
              {/* Ícone e Detalhes da Esquerda */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                  style={{
                    backgroundColor: isTransfer ? '#3B82F6' : cat?.color || '#6B7280',
                  }}
                >
                  {isTransfer ? (
                    <ArrowRightLeft className="w-5 h-5" />
                  ) : (
                    <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm truncate">{tx.description}</span>
                    {!isTransfer && (
                      <span className="bg-slate-800 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-none">
                        {categoryDisplayName}
                      </span>
                    )}
                    {tx.installmentCurrent && tx.installmentTotal && (
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-md">
                        {tx.installmentCurrent}/{tx.installmentTotal}x
                      </span>
                    )}
                    {tx.isRecurring && (
                      <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-800 text-[10px] px-1.5 py-0.5 rounded-md">
                        Fixa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                    <span>{formatDateBR(tx.date)}</span>
                    <span>•</span>
                    {isTransfer ? (
                      <span className="truncate">{acc?.name} ➔ {destAcc?.name}</span>
                    ) : card ? (
                      <span className="flex items-center gap-1 text-violet-400 truncate">
                        <CreditCard className="w-3 h-3" />
                        {card.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 truncate">
                        <Wallet className="w-3 h-3" />
                        {acc?.name || 'Conta'}
                      </span>
                    )}
                    {tx.tags && tx.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400/80">#{tx.tags[0]}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Valor e Ações da Direita */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <span
                    className={`font-bold text-sm sm:text-base block ${
                      isIncome
                        ? 'text-emerald-400'
                        : isExpense
                        ? 'text-rose-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {isExpense ? '- ' : isIncome ? '+ ' : ''}
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => togglePaid(tx.id, tx.paid)}
                    className={`text-[10px] flex items-center gap-1 ml-auto font-medium transition-colors ${
                      tx.paid ? 'text-emerald-500/80 hover:text-emerald-400' : 'text-amber-500/80 hover:text-amber-400'
                    }`}
                    title={tx.paid ? 'Transação confirmada/paga (clique para alternar)' : 'Transação pendente (clique para alternar)'}
                  >
                    {tx.paid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Efetivado
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Pendente
                      </>
                    )}
                  </button>
                </div>

                {/* Ações de Edição e Exclusão */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingTransaction(tx)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Editar lançamento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteMode('single');
                      setDeletingTransaction(tx);
                    }}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-white">
                  {isInstallment ? 'Excluir Parcela' : 'Excluir Despesa Fixa'}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {deletingTransaction.description} ({formatCurrency(deletingTransaction.amount)})
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs text-slate-300 font-medium">
                Como você deseja aplicar esta exclusão?
              </p>

              <button
                type="button"
                onClick={() => setDeleteMode('single')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  deleteMode === 'single'
                    ? 'bg-rose-500/10 border-rose-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {isInstallment ? 'Apenas esta parcela' : 'Apenas esta despesa'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Remove somente o lançamento do mês selecionado.
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deleteMode === 'single' ? 'border-rose-500 bg-rose-500' : 'border-slate-700'
                  }`}
                >
                  {deleteMode === 'single' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode('following')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  deleteMode === 'following'
                    ? 'bg-rose-500/10 border-rose-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {isInstallment ? 'Esta e as próximas pendentes' : 'Esta e as futuras pendentes'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Cancela os lançamentos futuros não pagos desta série.
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deleteMode === 'following' ? 'border-rose-500 bg-rose-500' : 'border-slate-700'
                  }`}
                >
                  {deleteMode === 'following' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode('all')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  deleteMode === 'all'
                    ? 'bg-rose-500/10 border-rose-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {isInstallment ? 'Todas as parcelas' : 'Todas as despesas da série'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Remove todo o histórico e pendências vinculadas.
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deleteMode === 'all' ? 'border-rose-500 bg-rose-500' : 'border-slate-700'
                  }`}
                >
                  {deleteMode === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
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
