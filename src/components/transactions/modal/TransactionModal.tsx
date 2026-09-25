'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { ExpenseForm } from './ExpenseForm';
import { IncomeForm } from './IncomeForm';
import { CreditCardExpenseForm } from './CreditCardExpenseForm';
import { TransferForm } from './TransferForm';
import { TransactionScopeModal } from '../TransactionScopeModal';
import { X, TrendingDown, TrendingUp, CreditCard, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export type TransactionFlowType = 'expense' | 'income' | 'creditCard' | 'transfer';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowType?: TransactionFlowType;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  flowType = 'expense',
  transactionToEdit = null,
}) => {
  const { addTransaction, updateTransaction } = useFinance();

  // Determinar fluxo inicial caso seja edição
  const getInitialFlow = (): TransactionFlowType => {
    if (transactionToEdit) {
      if (transactionToEdit.type === 'transfer') return 'transfer';
      if (transactionToEdit.creditCardId) return 'creditCard';
      if (transactionToEdit.type === 'income') return 'income';
      return 'expense';
    }
    return flowType;
  };

  const [activeFlow, setActiveFlow] = useState<TransactionFlowType>(getInitialFlow());
  const [isExpanded, setIsExpanded] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setActiveFlow(getInitialFlow());
    setIsExpanded(false);
    setSuccessToast(null);
  }, [flowType, transactionToEdit, isOpen]);

  const [pendingUpdateData, setPendingUpdateData] = useState<Omit<Transaction, 'id' | 'createdAt'> | null>(null);
  const [scopeMode, setScopeMode] = useState<'single' | 'following' | 'all'>('single');
  const [showScopeModal, setShowScopeModal] = useState(false);

  const isRecurringOrInstallment = !!(
    transactionToEdit?.recurringGroupId ||
    transactionToEdit?.isRecurring ||
    transactionToEdit?.installmentGroupId ||
    (transactionToEdit?.installmentTotal && transactionToEdit.installmentTotal > 1)
  );

  const handleSave = (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother: boolean = false) => {
    if (transactionToEdit) {
      if (isRecurringOrInstallment) {
        setPendingUpdateData(data);
        setScopeMode('single');
        setShowScopeModal(true);
        return;
      }
      updateTransaction(transactionToEdit.id, data, 'single');
      onClose();
    } else {
      addTransaction(data);
      if (createAnother) {
        setSuccessToast('Lançamento salvo com sucesso!');
        setTimeout(() => setSuccessToast(null), 2500);
      } else {
        onClose();
      }
    }
  };

  const handleConfirmScopeEdit = () => {
    if (transactionToEdit && pendingUpdateData) {
      updateTransaction(transactionToEdit.id, pendingUpdateData, scopeMode);
      setShowScopeModal(false);
      setPendingUpdateData(null);
      onClose();
    }
  };

  const getTitle = () => {
    if (transactionToEdit) {
      switch (activeFlow) {
        case 'income':
          return 'Editar Receita';
        case 'creditCard':
          return 'Editar Despesa Cartão';
        case 'transfer':
          return 'Editar Transferência';
        case 'expense':
        default:
          return 'Editar Despesa';
      }
    }
    switch (activeFlow) {
      case 'income':
        return 'Nova receita';
      case 'creditCard':
        return 'Nova despesa cartão de crédito';
      case 'transfer':
        return 'Nova transferência';
      case 'expense':
      default:
        return 'Nova Despesa';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full ${
          isExpanded ? 'max-w-4xl' : 'max-w-lg'
        } max-h-[92vh] overflow-hidden shadow-2xl flex flex-col transition-all duration-300 my-auto`}
      >
        {/* Header com Título e Botão Fechar no Topo */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight whitespace-nowrap">
              {getTitle()}
            </h2>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Abas de Tipo Posicionadas Abaixo do Título */}
          {!transactionToEdit && (
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFlow('expense')}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeFlow === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Despesa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFlow('income')}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeFlow === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Receita</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFlow('creditCard')}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeFlow === 'creditCard'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartão</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFlow('transfer')}
                className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeFlow === 'transfer'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferência</span>
              </button>
            </div>
          )}
        </div>

        {/* Toast Feedback de 'Salvar e Criar Nova' */}
        {successToast && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Formulário Especializado com Scroll Suave */}
        <div className="overflow-y-auto flex-1">
          {activeFlow === 'expense' && (
            <ExpenseForm
              initialData={transactionToEdit}
              onSave={handleSave}
              onCancel={onClose}
              onToggleDetails={setIsExpanded}
            />
          )}

          {activeFlow === 'income' && (
            <IncomeForm
              initialData={transactionToEdit}
              onSave={handleSave}
              onCancel={onClose}
              onToggleDetails={setIsExpanded}
            />
          )}

          {activeFlow === 'creditCard' && (
            <CreditCardExpenseForm
              initialData={transactionToEdit}
              onSave={handleSave}
              onCancel={onClose}
              onToggleDetails={setIsExpanded}
            />
          )}

          {activeFlow === 'transfer' && (
            <TransferForm
              initialData={transactionToEdit}
              onSave={handleSave}
              onCancel={onClose}
              onToggleDetails={setIsExpanded}
            />
          )}
        </div>
      </div>

      {/* Modal de Escopo para Edição de Recorrentes / Parcelados */}
      {showScopeModal && (
        <TransactionScopeModal
          isOpen={showScopeModal}
          actionType="edit"
          transaction={transactionToEdit}
          selectedMode={scopeMode}
          onSelectMode={setScopeMode}
          onConfirm={handleConfirmScopeEdit}
          onCancel={() => {
            setShowScopeModal(false);
            setPendingUpdateData(null);
          }}
        />
      )}
    </div>
  );
};
