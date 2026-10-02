'use client';

import { Transaction, Account } from '@/types/finance';
import { deleteTransactionFromSupabase } from '@/lib/supabase/syncService';
import { getNextInvoiceDate } from '@/lib/invoiceHelpers';

// Helper para cálculo robusto de datas mês a mês (respeitando o último dia do mês)
export const getNextMonthDate = (baseDateStr: string, monthOffset: number): string => {
  const [baseYear, baseMonth, baseDay] = baseDateStr.split('-').map(Number);
  const totalMonths = (baseMonth - 1) + monthOffset;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const day = Math.min(baseDay, maxDays);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export interface TransactionManagerActions {
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
  ) => void;
  importTransactions: (
    newTxs: Omit<Transaction, 'id' | 'createdAt'>[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
  ) => void;
  updateTransaction: (
    id: string,
    updated: Partial<Transaction>,
    mode: 'single' | 'following' | 'all',
    transactions: Transaction[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  ) => void;
  deleteTransaction: (
    id: string,
    mode: 'single' | 'following' | 'all',
    transactions: Transaction[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  ) => void;
}

export const transactionManager: TransactionManagerActions = {
  addTransaction: (tx, setTransactions, setAccounts) => {
    // 1. Caso seja Parcelamento / Repetição
    if (tx.installmentTotal && tx.installmentTotal > 1 && !tx.installmentGroupId) {
      const groupId = crypto.randomUUID();
      const parcelTransactions: Transaction[] = [];

      for (let i = 1; i <= tx.installmentTotal; i++) {
        const parcelDate = getNextMonthDate(tx.date, i - 1);
        const parcelInvoiceDate = tx.creditCardId && tx.invoiceDate
          ? getNextInvoiceDate(tx.invoiceDate, i - 1)
          : tx.invoiceDate;

        parcelTransactions.push({
          ...tx,
          id: crypto.randomUUID(),
          description: `${tx.description} (${i}/${tx.installmentTotal})`,
          date: parcelDate,
          invoiceDate: parcelInvoiceDate,
          installmentCurrent: i,
          installmentTotal: tx.installmentTotal,
          installmentGroupId: groupId,
          paid: i === 1 ? tx.paid : false,
          createdAt: new Date().toISOString(),
        });
      }

      setTransactions(prev => [...parcelTransactions, ...prev]);

      if (tx.accountId && !tx.creditCardId && tx.paid) {
        setAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount,
            };
          }
          if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
            return { ...a, balance: a.balance + tx.amount };
          }
          return a;
        }));
      }
      return;
    }

    // 2. Caso seja Despesa / Receita Recorrente Fixa (12 meses)
    if (tx.isRecurring && !tx.recurringGroupId) {
      const recurringGroupId = crypto.randomUUID();
      const recurringTransactions: Transaction[] = [];

      for (let i = 0; i < 12; i++) {
        const recDate = getNextMonthDate(tx.date, i);
        const recInvoiceDate = tx.creditCardId && tx.invoiceDate
          ? getNextInvoiceDate(tx.invoiceDate, i)
          : tx.invoiceDate;

        recurringTransactions.push({
          ...tx,
          id: crypto.randomUUID(),
          date: recDate,
          invoiceDate: recInvoiceDate,
          isRecurring: true,
          recurringPeriod: 'monthly',
          recurringGroupId,
          paid: i === 0 ? tx.paid : false,
          createdAt: new Date().toISOString(),
        });
      }

      setTransactions(prev => [...recurringTransactions, ...prev]);

      if (tx.accountId && !tx.creditCardId && tx.paid) {
        setAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount,
            };
          }
          if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
            return { ...a, balance: a.balance + tx.amount };
          }
          return a;
        }));
      }
      return;
    }

    // 3. Transação Única
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);

    if (tx.paid && tx.accountId && !tx.creditCardId) {
      setAccounts(prev => prev.map(a => {
        if (a.id === tx.accountId) {
          if (tx.type === 'income') return { ...a, balance: a.balance + tx.amount };
          if (tx.type === 'expense') return { ...a, balance: a.balance - tx.amount };
        }
        if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
          return { ...a, balance: a.balance + tx.amount };
        }
        return a;
      }));
    }
  },

  importTransactions: (newTxs, setTransactions, setAccounts) => {
    const formatted: Transaction[] = newTxs.map((tx, idx) => ({
      ...tx,
      id: 'tx-imp-' + Date.now() + '-' + idx,
      createdAt: new Date().toISOString(),
    }));

    setTransactions(prev => [...formatted, ...prev]);

    const accountBalanceDiff: Record<string, number> = {};
    formatted.forEach(tx => {
      if (tx.paid && tx.accountId && !tx.creditCardId) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        accountBalanceDiff[tx.accountId] = (accountBalanceDiff[tx.accountId] || 0) + delta;
      }
    });

    if (Object.keys(accountBalanceDiff).length > 0) {
      setAccounts(prev => prev.map(acc => {
        if (accountBalanceDiff[acc.id]) {
          return { ...acc, balance: acc.balance + accountBalanceDiff[acc.id] };
        }
        return acc;
      }));
    }
  },

  updateTransaction: (id, updated, mode, _transactions, setTransactions) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) {
        return prev.map(t => (t.id === id ? { ...t, ...updated } : t));
      }

      if (mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
        return prev.map(t => (t.id === id ? { ...t, ...updated } : t));
      }

      // Função auxiliar para calcular a descrição adequada de cada parcela ao editar em lote
      const computeInstallmentDescription = (item: Transaction): string => {
        if (!updated.description) return item.description;
        // Remove qualquer sufixo de parcela existente da nova descrição para obter o texto base
        const cleanBaseDescription = updated.description.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
        if (item.installmentCurrent && item.installmentTotal) {
          return `${cleanBaseDescription} (${item.installmentCurrent}/${item.installmentTotal})`;
        }
        return updated.description;
      };

      if (mode === 'following') {
        if (target.recurringGroupId) {
          const targetIndex = target.installmentCurrent || 1;
          return prev.map(t => {
            if (t.recurringGroupId === target.recurringGroupId && t.date >= target.date) {
              const offset = (t.installmentCurrent ? t.installmentCurrent - targetIndex : 0);
              const newDate = updated.date ? getNextMonthDate(updated.date, offset) : t.date;
              const newInvoiceDate = updated.invoiceDate ? getNextInvoiceDate(updated.invoiceDate, offset) : t.invoiceDate;
              return {
                ...t,
                ...updated,
                id: t.id,
                date: newDate,
                invoiceDate: newInvoiceDate,
              };
            }
            return t;
          });
        }
        if (target.installmentGroupId) {
          const targetIndex = target.installmentCurrent || 1;
          return prev.map(t => {
            if (t.installmentGroupId === target.installmentGroupId && (t.installmentCurrent || 0) >= (target.installmentCurrent || 0)) {
              const offset = (t.installmentCurrent || 1) - targetIndex;
              const newDate = updated.date ? getNextMonthDate(updated.date, offset) : t.date;
              const newInvoiceDate = updated.invoiceDate ? getNextInvoiceDate(updated.invoiceDate, offset) : t.invoiceDate;
              return {
                ...t,
                ...updated,
                id: t.id,
                description: computeInstallmentDescription(t),
                date: newDate,
                invoiceDate: newInvoiceDate,
                installmentCurrent: t.installmentCurrent,
                installmentTotal: t.installmentTotal,
              };
            }
            return t;
          });
        }
      }

      if (mode === 'all') {
        if (target.recurringGroupId) {
          const targetIndex = target.installmentCurrent || 1;
          return prev.map(t => {
            if (t.recurringGroupId === target.recurringGroupId) {
              const offset = (t.installmentCurrent ? t.installmentCurrent - targetIndex : 0);
              const newDate = updated.date ? getNextMonthDate(updated.date, offset) : t.date;
              const newInvoiceDate = updated.invoiceDate ? getNextInvoiceDate(updated.invoiceDate, offset) : t.invoiceDate;
              return {
                ...t,
                ...updated,
                id: t.id,
                date: newDate,
                invoiceDate: newInvoiceDate,
              };
            }
            return t;
          });
        }
        if (target.installmentGroupId) {
          const targetIndex = target.installmentCurrent || 1;
          return prev.map(t => {
            if (t.installmentGroupId === target.installmentGroupId) {
              const offset = (t.installmentCurrent || 1) - targetIndex;
              const newDate = updated.date ? getNextMonthDate(updated.date, offset) : t.date;
              const newInvoiceDate = updated.invoiceDate ? getNextInvoiceDate(updated.invoiceDate, offset) : t.invoiceDate;
              return {
                ...t,
                ...updated,
                id: t.id,
                description: computeInstallmentDescription(t),
                date: newDate,
                invoiceDate: newInvoiceDate,
                installmentCurrent: t.installmentCurrent,
                installmentTotal: t.installmentTotal,
              };
            }
            return t;
          });
        }
      }

      return prev.map(t => (t.id === id ? { ...t, ...updated } : t));
    });
  },

  deleteTransaction: (id, mode, transactions, setTransactions) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id) || transactions.find(t => t.id === id);
      if (target) {
        deleteTransactionFromSupabase(id, target.recurringGroupId, target.installmentGroupId, mode);
      } else {
        deleteTransactionFromSupabase(id, undefined, undefined, 'single');
      }

      if (!target || mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
        return prev.filter(t => t.id !== id);
      }

      if (mode === 'following') {
        if (target.recurringGroupId) {
          return prev.filter(t => !(t.recurringGroupId === target.recurringGroupId && t.date >= target.date && (!t.paid || t.id === target.id)));
        }
        if (target.installmentGroupId) {
          return prev.filter(
            t =>
              !(
                t.installmentGroupId === target.installmentGroupId &&
                (t.installmentCurrent || 0) >= (target.installmentCurrent || 0) &&
                (!t.paid || t.id === target.id)
              )
          );
        }
      }

      if (mode === 'all') {
        if (target.recurringGroupId) {
          return prev.filter(t => t.recurringGroupId !== target.recurringGroupId);
        }
        if (target.installmentGroupId) {
          return prev.filter(t => t.installmentGroupId !== target.installmentGroupId);
        }
      }

      return prev.filter(t => t.id !== id);
    });
  },
};
