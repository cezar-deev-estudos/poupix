'use client';

import React from 'react';
import { TransactionModal, TransactionFlowType } from './modal/TransactionModal';
import { Transaction, TransactionType } from '@/types/finance';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  flowType?: TransactionFlowType;
  transactionToEdit?: Transaction | null;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  flowType,
  transactionToEdit = null,
}) => {
  const getFlowType = (): TransactionFlowType => {
    if (flowType) return flowType;
    if (transactionToEdit) {
      if (transactionToEdit.type === 'transfer') return 'transfer';
      if (transactionToEdit.creditCardId) return 'creditCard';
      if (transactionToEdit.type === 'income') return 'income';
      return 'expense';
    }
    return defaultType === 'income' ? 'income' : defaultType === 'transfer' ? 'transfer' : 'expense';
  };

  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      flowType={getFlowType()}
      transactionToEdit={transactionToEdit}
    />
  );
};
