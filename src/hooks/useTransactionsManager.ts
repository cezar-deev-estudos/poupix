'use client';

import { Transaction, Account, CreditCard, Category } from '@/types/finance';
import { deleteTransactionFromSupabase, upsertTransactionsDirectlyToSupabase } from '@/lib/supabase/syncService';
import { getNextInvoiceDate, isSameId } from '@/lib/invoiceHelpers';
import { applyDecreasingDeduction, getTransactionBudgetPeriod, getMatchingNanoName } from '@/lib/decreasingExpenses';

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

// Helper interno para calcular o impacto de uma transação no saldo de uma conta
const getAccountDelta = (tx: Partial<Transaction>, targetAccId: string): number => {
  if (!tx.paid || tx.creditCardId) return 0;
  if (tx.type === 'income' && isSameId(tx.accountId, targetAccId)) return tx.amount || 0;
  if (tx.type === 'expense' && isSameId(tx.accountId, targetAccId)) return -(tx.amount || 0);
  if (tx.type === 'transfer') {
    if (isSameId(tx.accountId, targetAccId)) return -(tx.amount || 0);
    if (isSameId(tx.destinationAccountId, targetAccId)) return tx.amount || 0;
  }
  return 0;
};

export interface TransactionManagerActions {
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>,
    creditCards?: CreditCard[],
    categories?: Category[],
    userId?: string
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
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>,
    creditCards?: CreditCard[],
    categories?: Category[],
    userId?: string
  ) => void;
  deleteTransaction: (
    id: string,
    mode: 'single' | 'following' | 'all',
    transactions: Transaction[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    onTransactionDeleted?: (deletedIds: string[]) => void,
    userId?: string,
    setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>,
    creditCards?: CreditCard[],
    categories?: Category[]
  ) => void;
  updateTransactionsBatch: (
    ids: string[],
    updated: Partial<Transaction>,
    transactions: Transaction[],
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
    setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>,
    creditCards?: CreditCard[],
    categories?: Category[],
    userId?: string
  ) => void;
}

export const transactionManager: TransactionManagerActions = {
  addTransaction: (tx, setTransactions, setAccounts, creditCards = [], categories = [], userId) => {
    // 1. Caso seja Parcelamento / Repetição
    if (tx.installmentTotal && tx.installmentTotal > 1 && !tx.installmentGroupId) {
      const groupId = crypto.randomUUID();
      const parcelTransactions: Transaction[] = [];

      for (let i = 1; i <= tx.installmentTotal; i++) {
        // Para despesas de cartão de crédito, a data da transação (date) é SEMPRE a data da compra original.
        // O posicionamento no mês em que o cartão será pago é controlado exclusivamente pelo invoiceDate.
        const parcelDate = tx.creditCardId ? tx.date : getNextMonthDate(tx.date, i - 1);
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
          if (isSameId(a.id, tx.accountId)) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount,
            };
          }
          if (tx.type === 'transfer' && isSameId(a.id, tx.destinationAccountId)) {
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
          if (isSameId(a.id, tx.accountId)) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount,
            };
          }
          if (tx.type === 'transfer' && isSameId(a.id, tx.destinationAccountId)) {
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

    setTransactions(prev => {
      // Abatimento inteligente em despesas previstas / decrescentes via nanoTag/competência
      const { updatedTxs, linkedDecreasingId } = applyDecreasingDeduction(
        newTx,
        prev,
        creditCards,
        categories
      );

      if (linkedDecreasingId) {
        newTx.linkedDecreasingId = linkedDecreasingId;
      }

      // Se atualizou alguma decrescente no banco de dados, persiste imediatamente
      if (userId && linkedDecreasingId) {
        const alteredDec = updatedTxs.find(t => t.id === linkedDecreasingId);
        if (alteredDec) {
          upsertTransactionsDirectlyToSupabase([alteredDec], userId);
        }
      }

      return [newTx, ...updatedTxs];
    });

    if (tx.paid && tx.accountId && !tx.creditCardId) {
      setAccounts(prev => prev.map(a => {
        if (isSameId(a.id, tx.accountId)) {
          if (tx.type === 'income') return { ...a, balance: a.balance + tx.amount };
          if (tx.type === 'expense') return { ...a, balance: a.balance - tx.amount };
        }
        if (tx.type === 'transfer' && isSameId(a.id, tx.destinationAccountId)) {
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

  updateTransaction: (id, updated, mode, transactions, setTransactions, setAccounts) => {
    // 1. Calcular delta de saldo nas contas caso setAccounts tenha sido fornecido
    if (setAccounts) {
      const prevTarget = transactions.find(t => t.id === id);
      if (prevTarget) {
        const nextTarget: Transaction = { ...prevTarget, ...updated };
        // Impacto prévio vs novo
        setAccounts(prevAccounts => {
          return prevAccounts.map(acc => {
            const oldDelta = getAccountDelta(prevTarget, acc.id);
            const newDelta = getAccountDelta(nextTarget, acc.id);
            const netDiff = newDelta - oldDelta;
            if (netDiff !== 0) {
              return { ...acc, balance: acc.balance + netDiff };
            }
            return acc;
          });
        });
      }
    }

    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) {
        return prev.map(t => (t.id === id ? { ...t, ...updated } : t));
      }

      if (mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
        return prev.map(t => {
          if (t.id === id) {
            const next = { ...t, ...updated };
            if (updated.type === 'expense' && !updated.creditCardId) {
              delete next.creditCardId;
              delete next.invoiceDate;
            }
            return next;
          }
          return t;
        });
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

      // Helper para ajustar apenas o DIA da data de cada lançamento caso o usuário tenha alterado o dia na edição
      const computeAdjustedDate = (origDate: string, updatedDate?: string): string => {
        if (!updatedDate) return origDate;
        // Se a data editada for idêntica à data do item alvo original, mantém a data própria de cada item
        if (updatedDate === target.date) return origDate;
        const [origY, origM] = origDate.split('-').map(Number);
        const [, , newD] = updatedDate.split('-').map(Number);
        const maxDaysInOrigMonth = new Date(origY, origM, 0).getDate();
        const adjustedDay = Math.min(newD, maxDaysInOrigMonth);
        return `${origY}-${String(origM).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
      };

      const computeAdjustedInvoiceDate = (origInvDate?: string, updatedInvDate?: string): string | undefined => {
        if (!origInvDate) return origInvDate;
        if (!updatedInvDate) return origInvDate;
        if (updatedInvDate === target.invoiceDate) return origInvDate;
        const [origY, origM] = origInvDate.split('-').map(Number);
        const [, , newD] = updatedInvDate.split('-').map(Number);
        const maxDaysInOrigMonth = new Date(origY, origM, 0).getDate();
        const adjustedDay = Math.min(newD, maxDaysInOrigMonth);
        return `${origY}-${String(origM).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
      };

      if (mode === 'following') {
        if (target.recurringGroupId) {
          return prev.map(t => {
            if (t.recurringGroupId === target.recurringGroupId && t.date >= target.date) {
              const newDate = computeAdjustedDate(t.date, updated.date);
              const newInvoiceDate = computeAdjustedInvoiceDate(t.invoiceDate, updated.invoiceDate);
              const itemToUpdate = {
                ...t,
                ...updated,
                id: t.id,
                date: newDate,
                invoiceDate: newInvoiceDate,
              };
              if (updated.type === 'expense' && !updated.creditCardId) {
                delete itemToUpdate.creditCardId;
                delete itemToUpdate.invoiceDate;
              }
              return itemToUpdate;
            }
            return t;
          });
        }
        if (target.installmentGroupId) {
          const isCardInstallment = Boolean(target.creditCardId);
          return prev.map(t => {
            if (t.installmentGroupId === target.installmentGroupId && (t.installmentCurrent || 0) >= (target.installmentCurrent || 0)) {
              // Se for cartão, a data da compra (date) é a mesma em todas as parcelas; se for fora de cartão, ajusta apenas o dia
              const newDate = isCardInstallment && updated.date ? updated.date : computeAdjustedDate(t.date, updated.date);
              const newInvoiceDate = computeAdjustedInvoiceDate(t.invoiceDate, updated.invoiceDate);
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
          return prev.map(t => {
            if (t.recurringGroupId === target.recurringGroupId) {
              const newDate = computeAdjustedDate(t.date, updated.date);
              const newInvoiceDate = computeAdjustedInvoiceDate(t.invoiceDate, updated.invoiceDate);
              const itemToUpdate = {
                ...t,
                ...updated,
                id: t.id,
                date: newDate,
                invoiceDate: newInvoiceDate,
              };
              if (updated.type === 'expense' && !updated.creditCardId) {
                delete itemToUpdate.creditCardId;
                delete itemToUpdate.invoiceDate;
              }
              return itemToUpdate;
            }
            return t;
          });
        }
        if (target.installmentGroupId) {
          const isCardInstallment = Boolean(target.creditCardId);
          return prev.map(t => {
            if (t.installmentGroupId === target.installmentGroupId) {
              // Se for cartão, a data da compra (date) é a mesma em todas as parcelas; se for fora de cartão, ajusta apenas o dia
              const newDate = isCardInstallment && updated.date ? updated.date : computeAdjustedDate(t.date, updated.date);
              const newInvoiceDate = computeAdjustedInvoiceDate(t.invoiceDate, updated.invoiceDate);
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

  deleteTransaction: (id, mode, transactions, setTransactions, onTransactionDeleted, userId, setAccounts, creditCards = [], categories = []) => {
    // 1. Estornar saldo se a transação excluída estava paga
    if (setAccounts) {
      const target = transactions.find(t => t.id === id);
      if (target) {
        setAccounts(prevAccounts => {
          return prevAccounts.map(acc => {
            const oldDelta = getAccountDelta(target, acc.id);
            if (oldDelta !== 0) {
              // Inverte o delta para estornar
              return { ...acc, balance: acc.balance - oldDelta };
            }
            return acc;
          });
        });
      }
    }

    setTransactions(prev => {
      const target = prev.find(t => t.id === id) || transactions.find(t => t.id === id);
      const deletedIds: string[] = [id];

      if (!target || mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
        deleteTransactionFromSupabase(id, target?.recurringGroupId, target?.installmentGroupId, 'single', userId, deletedIds);
        onTransactionDeleted?.(deletedIds);

        // Estorno na despesa decrescente se houver vínculo
        let nextTxs = prev.filter(t => t.id !== id);
        if (target && target.type === 'expense' && target.amount > 0) {
          const decId = target.linkedDecreasingId;
          const txPeriod = getTransactionBudgetPeriod(target, creditCards);
          const txNano = getMatchingNanoName(target, categories);

          const decIndex = nextTxs.findIndex(t => 
            t.type === 'expense' &&
            Boolean(t.isDecreasing) &&
            ((decId && t.id === decId) || (getTransactionBudgetPeriod(t, creditCards) === txPeriod && getMatchingNanoName(t, categories) === txNano))
          );

          if (decIndex !== -1) {
            const decTx = nextTxs[decIndex];
            const restoredDec = {
              ...decTx,
              amount: Number((decTx.amount + target.amount).toFixed(2)),
            };
            nextTxs = [...nextTxs];
            nextTxs[decIndex] = restoredDec;

            // Persiste restauração do saldo no Supabase imediatamente
            if (userId) {
              upsertTransactionsDirectlyToSupabase([restoredDec], userId);
            }
          }
        }

        return nextTxs;
      }

      if (mode === 'following') {
        let remaining = prev;
        if (target.recurringGroupId) {
          const removed = prev.filter(t => (t.recurringGroupId === target.recurringGroupId && t.date >= target.date));
          removed.forEach(t => deletedIds.push(t.id));
          remaining = prev.filter(t => !(t.recurringGroupId === target.recurringGroupId && t.date >= target.date));
        } else if (target.installmentGroupId) {
          const removed = prev.filter(
            t =>
              t.installmentGroupId === target.installmentGroupId &&
              (t.installmentCurrent || 0) >= (target.installmentCurrent || 0)
          );
          removed.forEach(t => deletedIds.push(t.id));
          remaining = prev.filter(
            t =>
              !(
                t.installmentGroupId === target.installmentGroupId &&
                (t.installmentCurrent || 0) >= (target.installmentCurrent || 0)
              )
          );
        }
        deleteTransactionFromSupabase(id, target.recurringGroupId, target.installmentGroupId, 'following', userId, deletedIds);
        onTransactionDeleted?.(deletedIds);
        return remaining;
      }

      if (mode === 'all') {
        let remaining = prev;
        if (target.recurringGroupId) {
          const removed = prev.filter(t => t.recurringGroupId === target.recurringGroupId);
          removed.forEach(t => deletedIds.push(t.id));
          remaining = prev.filter(t => t.recurringGroupId !== target.recurringGroupId);
        } else if (target.installmentGroupId) {
          const removed = prev.filter(t => t.installmentGroupId === target.installmentGroupId);
          removed.forEach(t => deletedIds.push(t.id));
          remaining = prev.filter(t => t.installmentGroupId !== target.installmentGroupId);
        }
        deleteTransactionFromSupabase(id, target.recurringGroupId, target.installmentGroupId, 'all', userId, deletedIds);
        onTransactionDeleted?.(deletedIds);
        return remaining;
      }

      deleteTransactionFromSupabase(id, target?.recurringGroupId, target?.installmentGroupId, mode, userId, deletedIds);
      onTransactionDeleted?.(deletedIds);
      return prev.filter(t => t.id !== id);
    });
  },

  updateTransactionsBatch: (ids, updated, transactions, setTransactions, setAccounts) => {
    const idsSet = new Set(ids);

    // Calcular delta de contas se aplicável
    if (setAccounts) {
      const targets = transactions.filter(t => idsSet.has(t.id));
      if (targets.length > 0) {
        setAccounts(prevAccounts => {
          return prevAccounts.map(acc => {
            let totalDiff = 0;
            targets.forEach(prevTarget => {
              const nextTarget: Transaction = { ...prevTarget, ...updated };
              const oldDelta = getAccountDelta(prevTarget, acc.id);
              const newDelta = getAccountDelta(nextTarget, acc.id);
              totalDiff += (newDelta - oldDelta);
            });
            if (totalDiff !== 0) {
              return { ...acc, balance: acc.balance + totalDiff };
            }
            return acc;
          });
        });
      }
    }

    setTransactions(prev => {
      return prev.map(t => {
        if (!idsSet.has(t.id)) return t;

        const next: Transaction = { ...t, ...updated };

        // Se foi transformado explicitamente em despesa de conta (sem cartão)
        if (updated.type === 'expense' && !updated.creditCardId) {
          delete next.creditCardId;
          delete next.invoiceDate;
        }

        // Se foi associado a um cartão de crédito, garante que mantenha o creditCardId
        if (updated.creditCardId) {
          next.creditCardId = updated.creditCardId;
          if (updated.invoiceDate) {
            next.invoiceDate = updated.invoiceDate;
          }
        }

        return next;
      });
    });
  },
};
