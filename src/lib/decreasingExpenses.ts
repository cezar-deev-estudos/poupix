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
 * OU se a nova despesa for uma decrescente, rebate com as despesas já existentes no período.
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
      const newAmount = Math.max(0, targetDec.amount - newTx.amount);

      updated[decIndex] = {
        ...targetDec,
        amount: Number(newAmount.toFixed(2)),
      };

      return {
        updatedTxs: updated,
        linkedDecreasingId: targetDec.id,
      };
    }
  }

  // CASO 2: A nova transação é a própria despesa decrescente prevista (criada após as despesas normais)
  if (newTx.isDecreasing) {
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

    if (matchingExpensesSum > 0) {
      newTx.amount = Math.max(0, Number((newTx.amount - matchingExpensesSum).toFixed(2)));
    }
  }

  return { updatedTxs: existingTxs };
}

/**
 * Reconcilia retroativamente todas as despesas decrescentes existentes no conjunto de transações.
 * Isso garante que transações antigas já salvas no Supabase ou importadas sejam recalculadas
 * dinamicamente com base nas despesas com o mesmo NanoTag no mesmo mês de competência.
 */
export function reconcileAllDecreasingExpenses(
  transactions: Transaction[],
  creditCards: CreditCard[] = [],
  categories: Category[] = []
): Transaction[] {
  const decExpenses = transactions.filter(t => t.type === 'expense' && Boolean(t.isDecreasing));
  if (decExpenses.length === 0) return transactions;

  // Mapa de despesa decrescente ID -> total abatido
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

  if (deductionsMap.size === 0) return transactions;

  return transactions.map(tx => {
    if (tx.type === 'expense' && tx.isDecreasing && deductionsMap.has(tx.id)) {
      const totalDeducted = deductionsMap.get(tx.id)!;
      // Se a transação já estiver abatida ou for calculada a partir do valor base,
      // aqui garantimos que o valor exibido não ultrapasse o saldo restante
      const remaining = Math.max(0, Number((tx.amount - totalDeducted).toFixed(2)));
      return {
        ...tx,
        amount: remaining,
      };
    }
    return tx;
  });
}
