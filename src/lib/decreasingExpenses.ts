import { Category, CreditCard, Transaction } from '@/types/finance';
import { getTransactionInvoicePeriod } from './invoiceHelpers';

/**
 * Normaliza uma string para comparação case-insensitive sem espaços extras
 */
export function normalizeKey(str?: string | null): string {
  return (str || '').trim().toLowerCase();
}

/**
 * Retorna o período financeiro de competência ("YYYY-MM") de uma transação.
 * Para cartão de crédito: utiliza o ano e mês da fatura (calculado ou invoiceDate).
 * Para conta/outros: utiliza a data do lançamento.
 */
export function getTransactionBudgetPeriod(
  tx: Transaction,
  creditCards: CreditCard[] = []
): string {
  if (tx.creditCardId) {
    const card = creditCards.find(c => c.id === tx.creditCardId);
    const { periodKey } = getTransactionInvoicePeriod(tx, card);
    return periodKey;
  }
  return tx.date ? tx.date.substring(0, 7) : '';
}

/**
 * Localiza o nanoName associado a uma transação.
 * A correspondência de nanoTag é feita quando:
 * 1. Uma das tags da transação corresponde exatamente ao nome de uma nano-categoria da subcategoria.
 * 2. OU a descrição da transação começa com o nome da nano-categoria da subcategoria (ou bate exatamente).
 * 3. OU (se não houver subcategoria carregada) bate com a descrição limpa.
 */
export function getMatchingNanoName(
  tx: Transaction,
  subcategories: Category[] = []
): string | null {
  const sub = subcategories.find(c => c.id === tx.categoryId);
  const nanos = sub?.nanoCategories || [];

  // 1. Checar se alguma tag da transação é o nome de uma nano da subcategoria
  if (tx.tags && tx.tags.length > 0 && nanos.length > 0) {
    for (const tag of tx.tags) {
      const normalizedTag = normalizeKey(tag);
      const matchedNano = nanos.find(n => normalizeKey(n.name) === normalizedTag);
      if (matchedNano) {
        return normalizeKey(matchedNano.name);
      }
    }
  }

  // 2. Checar correspondência por nano na descrição da subcategoria
  if (nanos.length > 0) {
    const desc = normalizeKey(tx.description);
    const matchedNano = nanos.find(n => {
      const nName = normalizeKey(n.name);
      return (
        desc === nName ||
        desc.startsWith(nName + ' ') ||
        desc.startsWith(nName + '-') ||
        desc.startsWith(nName + '/')
      );
    });
    if (matchedNano) {
      return normalizeKey(matchedNano.name);
    }
  }

  // Fallback: Se não houver nano definida na subcategoria, retorna a descrição limpa
  return normalizeKey(tx.description);
}

/**
 * Abate uma nova despesa de uma despesa decrescente prevista correspondente,
 * OU se a nova despesa for uma decrescente, calcula seu saldo atual a partir do valor inicial (initialAmount).
 */
export function applyDecreasingDeduction(
  newTx: Transaction,
  existingTxs: Transaction[],
  creditCards: CreditCard[] = [],
  categories: Category[] = []
): { updatedTxs: Transaction[]; linkedDecreasingId?: string } {
  if (newTx.type !== 'expense' || !newTx.description) {
    return { updatedTxs: existingTxs };
  }

  const txPeriod = getTransactionBudgetPeriod(newTx, creditCards);
  const txNanoName = getMatchingNanoName(newTx, categories);

  if (!txPeriod || !txNanoName) {
    return { updatedTxs: existingTxs };
  }

  // CASO 1: A nova transação é uma despesa normal e deve abater a decrescente prevista existente
  if (!newTx.isDecreasing) {
    const decIndex = existingTxs.findIndex(t => {
      if (t.type !== 'expense' || !t.isDecreasing) return false;
      const decPeriod = getTransactionBudgetPeriod(t, creditCards);
      if (decPeriod !== txPeriod) return false;
      const decNanoName = getMatchingNanoName(t, categories);
      return decNanoName === txNanoName;
    });

    if (decIndex !== -1) {
      const updated = [...existingTxs];
      const targetDec = updated[decIndex];
      let baseInitial = targetDec.initialAmount;
      if (baseInitial === undefined || baseInitial === null) {
        const sub = categories.find(c => c.id === targetDec.categoryId);
        const matchedNano = sub?.nanoCategories?.find(n => normalizeKey(n.name) === txNanoName);
        if (matchedNano?.budgetLimit && matchedNano.budgetLimit > 0) {
          baseInitial = matchedNano.budgetLimit;
        } else {
          baseInitial = targetDec.amount;
        }
      }
      const newAmount = Math.max(0, targetDec.amount - newTx.amount);

      updated[decIndex] = {
        ...targetDec,
        initialAmount: baseInitial,
        amount: Number(newAmount.toFixed(2)),
      };

      return {
        updatedTxs: updated,
        linkedDecreasingId: targetDec.id,
      };
    }
  }

  // CASO 2: A nova transação é a própria despesa decrescente prevista
  if (newTx.isDecreasing) {
    // Garante que o initialAmount fique registrado com o valor original digitado
    if (newTx.initialAmount === undefined) {
      newTx.initialAmount = newTx.amount;
    }

    // Somar todas as despesas normais já existentes no mesmo mês com o mesmo nanoTag
    const matchingExpensesSum = existingTxs
      .filter(t => {
        if (t.type !== 'expense' || t.isDecreasing || t.id === newTx.id) return false;
        const tPeriod = getTransactionBudgetPeriod(t, creditCards);
        if (tPeriod !== txPeriod) return false;
        const tNano = getMatchingNanoName(t, categories);
        return tNano === txNanoName;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const baseAmount = newTx.initialAmount !== undefined ? newTx.initialAmount : newTx.amount;
    newTx.amount = Math.max(0, Number((baseAmount - matchingExpensesSum).toFixed(2)));
  }

  return { updatedTxs: existingTxs };
}

/**
 * Reconcilia retroativamente todas as despesas decrescentes existentes no conjunto de transações.
 * Sempre calcula o saldo atual a partir do valor inicial (initialAmount):
 * saldoAtual = Math.max(0, initialAmount - somaGastosNormais)
 */
export function reconcileAllDecreasingExpenses(
  transactions: Transaction[],
  creditCards: CreditCard[] = [],
  categories: Category[] = []
): Transaction[] {
  const decExpenses = transactions.filter(t => t.type === 'expense' && Boolean(t.isDecreasing));
  if (decExpenses.length === 0) return transactions;

  // Mapa de despesa decrescente ID -> total abatido de despesas normais
  const deductionsMap = new Map<string, number>();

  transactions.forEach(tx => {
    // Apenas despesas normais (não decrescentes) abatem a decrescente correspondente
    if (tx.type !== 'expense' || tx.isDecreasing || !tx.amount) return;

    const txPeriod = getTransactionBudgetPeriod(tx, creditCards);
    const txNano = getMatchingNanoName(tx, categories);
    if (!txPeriod || !txNano) return;

    // Encontra a despesa decrescente correspondente no mesmo mês
    const targetDec = decExpenses.find(dec => {
      const decPeriod = getTransactionBudgetPeriod(dec, creditCards);
      if (decPeriod !== txPeriod) return false;
      const decNano = getMatchingNanoName(dec, categories);
      return decNano === txNano;
    });

    if (targetDec) {
      const currentDeduction = deductionsMap.get(targetDec.id) || 0;
      deductionsMap.set(targetDec.id, currentDeduction + tx.amount);
    }
  });

  return transactions.map(tx => {
    if (tx.type === 'expense' && tx.isDecreasing) {
      const totalDeducted = deductionsMap.get(tx.id) || 0;
      
      // Determinação do valor inicial de partida (baseInitial):
      // 1. Se initialAmount foi definido no banco/transação, usa-o diretamente.
      // 2. Se for indefinido/nulo, busca se existe um teto definido na nano-categoria associada (ex: teto de R$ 90,00).
      // 3. Fallback: reconstrói somando o valor armazenado com o que já foi deduzido (tx.amount + totalDeducted).
      let baseInitial = tx.initialAmount;
      if (baseInitial === undefined || baseInitial === null) {
        const txNano = getMatchingNanoName(tx, categories);
        const sub = categories.find(c => c.id === tx.categoryId);
        const matchedNano = sub?.nanoCategories?.find(n => normalizeKey(n.name) === txNano);
        if (matchedNano?.budgetLimit && matchedNano.budgetLimit > 0) {
          baseInitial = matchedNano.budgetLimit;
        } else {
          baseInitial = Number((tx.amount + totalDeducted).toFixed(2));
        }
      }

      const remaining = Math.max(0, Number((baseInitial - totalDeducted).toFixed(2)));

      return {
        ...tx,
        initialAmount: baseInitial,
        amount: remaining,
      };
    }
    return tx;
  });
}
