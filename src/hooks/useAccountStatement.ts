'use client';

import React, { useMemo } from 'react';
import { Account, Transaction } from '@/types/finance';
import { isSameId } from '@/lib/invoiceHelpers';

export interface RunningBalanceTransaction extends Transaction {
  runningBalance: number;
}

export function useAccountStatement(
  account: Account | null,
  transactions: Transaction[],
  selectedYear: number,
  selectedMonth: number
) {
  return useMemo(() => {
    if (!account) {
      return {
        statementTxs: [] as RunningBalanceTransaction[],
        startingBalanceOfMonth: 0,
        totalIncomeMonth: 0,
        totalExpenseMonth: 0,
        finalBalanceOfMonth: 0,
      };
    }

    // 1. Filtrar todas as transações efetivadas que afetam esta conta
    const accountTxs = transactions.filter(t => {
      if (t.creditCardId) return false; // Cartão de crédito não afeta conta diretamente até o pagamento da fatura
      if (!t.paid) return false; // Extrato da conta lista estritamente lançamentos efetivados
      return isSameId(t.accountId, account.id) || isSameId(t.destinationAccountId, account.id);
    });

    // Período selecionado
    const selectedMonthStartStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    // Próximo mês
    const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const nextMonthMonth = selectedMonth === 11 ? 1 : selectedMonth + 2;
    const nextMonthStartStr = `${nextMonthYear}-${String(nextMonthMonth).padStart(2, '0')}-01`;

    // 2. Transações do mês selecionado
    const currentMonthTxs = accountTxs.filter(t => {
      return t.date >= selectedMonthStartStr && t.date < nextMonthStartStr;
    });

    // Ordenar cronologicamente crescente (mais antigas primeiro para computar saldo progressivo)
    const sortedTxsAsc = [...currentMonthTxs].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    // 3. Saldo inicial do mês: inicia zerado (R$ 0,00) conforme solicitado
    const baseInitial = 0;

    // 4. Calcular saldo progressivo linha a linha no mês
    let running = baseInitial;
    let totalIncomeMonth = 0;
    let totalExpenseMonth = 0;

    const statementWithBalance: RunningBalanceTransaction[] = sortedTxsAsc.map(tx => {
      let delta = 0;
      if (tx.type === 'income' && isSameId(tx.accountId, account.id)) {
        delta = tx.amount;
        if (tx.paid) totalIncomeMonth += tx.amount;
      } else if (tx.type === 'expense' && isSameId(tx.accountId, account.id)) {
        delta = -tx.amount;
        if (tx.paid) totalExpenseMonth += tx.amount;
      } else if (tx.type === 'transfer') {
        if (isSameId(tx.accountId, account.id)) {
          delta = -tx.amount;
          if (tx.paid) totalExpenseMonth += tx.amount;
        } else if (isSameId(tx.destinationAccountId, account.id)) {
          delta = tx.amount;
          if (tx.paid) totalIncomeMonth += tx.amount;
        }
      }

      // Se a transação estiver paga, o saldo corrente acumula
      if (tx.paid) {
        running += delta;
      }

      return {
        ...tx,
        runningBalance: running,
      };
    });

    // Ordenar de volta descrescente para visualização (mais recentes no topo)
    const statementTxs = [...statementWithBalance].reverse();

    return {
      statementTxs,
      startingBalanceOfMonth: baseInitial,
      totalIncomeMonth,
      totalExpenseMonth,
      finalBalanceOfMonth: running,
    };
  }, [account, transactions, selectedYear, selectedMonth]);
}
