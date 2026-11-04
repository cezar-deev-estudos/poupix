import { CreditCard, Transaction } from '@/types/finance';
import { ensureValidUUID } from './supabase/syncService';

/**
 * Compara dois identificadores (seja ID direto ou UUID gerado), garantindo resiliência.
 */
export function isSameId(id1?: string | null, id2?: string | null): boolean {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  try {
    return ensureValidUUID(id1).toLowerCase() === ensureValidUUID(id2).toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Calcula a data de vencimento padrão da fatura com base na data da compra e no dia de fechamento do cartão.
 */
export function calculateDefaultInvoiceDueDate(
  txDate: string,
  card?: CreditCard
): { year: number; month: number; periodKey: string; invoiceDueDateStr: string } {
  const dueDay = card?.dueDay || 10;
  const closingDay = card?.closingDay || 3;

  const txParts = (txDate || '').split('-');
  let txYear = new Date().getFullYear();
  let txMonth = new Date().getMonth(); // 0-indexed
  let txDay = new Date().getDate();

  if (txParts.length === 3) {
    const y = parseInt(txParts[0], 10);
    const m = parseInt(txParts[1], 10) - 1; // 0-indexed
    const d = parseInt(txParts[2], 10);
    if (!isNaN(y) && !isNaN(m)) {
      txYear = y;
      txMonth = m;
      if (!isNaN(d)) txDay = d;
    }
  }

  let invoiceYear = txYear;
  let invoiceMonth = txMonth;

  // Se o dia da compra ultrapassou o dia de fechamento, a fatura de vencimento cai no mês seguinte
  if (txDay > closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 11) {
      invoiceMonth = 0;
      invoiceYear += 1;
    }
  }

  const periodKey = `${invoiceYear}-${String(invoiceMonth + 1).padStart(2, '0')}`;
  const invoiceDueDateStr = `${invoiceYear}-${String(invoiceMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  return { year: invoiceYear, month: invoiceMonth, periodKey, invoiceDueDateStr };
}

/**
 * Retorna o período de vencimento da fatura (ano e mês, onde mês é 0-indexed) de uma transação de cartão.
 * Mapeia diretamente o ano/mês da transação (ou do invoiceDate) para a fatura correspondente.
 */
export function getTransactionInvoicePeriod(
  tx: Transaction,
  card?: CreditCard
): { year: number; month: number; periodKey: string; invoiceDueDateStr: string } {
  // Se a transação possui invoiceDate explícito (escolhido no formulário), usa ele
  if (tx.invoiceDate) {
    const invParts = tx.invoiceDate.split('-');
    if (invParts.length === 3) {
      const y = parseInt(invParts[0], 10);
      const m = parseInt(invParts[1], 10) - 1; // 0-indexed
      if (!isNaN(y) && !isNaN(m)) {
        const periodKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        return { year: y, month: m, periodKey, invoiceDueDateStr: tx.invoiceDate };
      }
    }
  }

  // Caso contrário, calcula a fatura padrão com base no fechamento do cartão
  return calculateDefaultInvoiceDueDate(tx.date, card);
}

/**
 * Normaliza e preenche o campo invoiceDate de transações que ainda não o possuem
 * e garante que todas as parcelas de um cartão de crédito compartilhem a mesma data de compra (a data da parcela 1).
 */
export function normalizeTransactionsInvoiceDates(
  transactions: Transaction[],
  creditCards: CreditCard[]
): Transaction[] {
  // 1. Mapeia a data da compra original (parcela 1 ou menor parcela encontrada) de cada grupo de parcelamento de cartão
  const groupPurchaseDateMap = new Map<string, string>();
  const descGroupPurchaseDateMap = new Map<string, string>();

  // Passada inicial: agrupa parcelas por installmentGroupId ou por padrão de descrição "Nome (X/Y)"
  transactions.forEach(tx => {
    if (!tx.creditCardId) return;

    if (tx.installmentGroupId) {
      const isFirst = tx.installmentCurrent === 1;
      const existing = groupPurchaseDateMap.get(tx.installmentGroupId);
      if (isFirst || !existing) {
        groupPurchaseDateMap.set(tx.installmentGroupId, tx.date);
      }
    }

    // Suporte a compras parceladas que tenham descrição no padrão "Produto (X/Y)"
    const match = (tx.description || '').match(/^(.*?)\s*\((\d+)\/(\d+)\)\s*$/);
    if (match) {
      const baseDesc = match[1].trim().toLowerCase();
      const currentInst = parseInt(match[2], 10);
      const totalInst = parseInt(match[3], 10);
      const key = `${tx.creditCardId}_${baseDesc}_${totalInst}`;
      const isFirst = currentInst === 1;
      const existing = descGroupPurchaseDateMap.get(key);
      if (isFirst || !existing) {
        descGroupPurchaseDateMap.set(key, tx.date);
      }
    }
  });

  return transactions.map(tx => {
    if (!tx.creditCardId) return tx;

    // Se a transação pertence a um parcelamento de cartão, sincroniza sua data de compra com a data da 1ª parcela
    let purchaseDate = tx.date;
    if (tx.installmentGroupId && groupPurchaseDateMap.has(tx.installmentGroupId)) {
      purchaseDate = groupPurchaseDateMap.get(tx.installmentGroupId)!;
    } else {
      const match = (tx.description || '').match(/^(.*?)\s*\((\d+)\/(\d+)\)\s*$/);
      if (match) {
        const baseDesc = match[1].trim().toLowerCase();
        const totalInst = parseInt(match[3], 10);
        const key = `${tx.creditCardId}_${baseDesc}_${totalInst}`;
        if (descGroupPurchaseDateMap.has(key)) {
          purchaseDate = descGroupPurchaseDateMap.get(key)!;
        }
      }
    }

    // Se já possui invoiceDate explícito, preserva-o; caso contrário calcula o vencimento
    if (tx.invoiceDate) {
      if (purchaseDate !== tx.date) {
        return {
          ...tx,
          date: purchaseDate,
        };
      }
      return tx;
    }

    const card = creditCards.find(c => isSameId(c.id, tx.creditCardId));
    const { invoiceDueDateStr } = getTransactionInvoicePeriod(tx, card);
    return {
      ...tx,
      date: purchaseDate,
      invoiceDate: invoiceDueDateStr,
    };
  });
}

/**
 * Calcula a data de vencimento da fatura com um deslocamento de meses (offset).
 * Se baseInvoiceDate for fornecido (YYYY-MM-DD), avança `monthOffset` meses mantendo o dia de vencimento.
 */
export function getNextInvoiceDate(baseInvoiceDate: string, monthOffset: number, fallbackDueDay: number = 10): string {
  if (!baseInvoiceDate) return '';
  const [baseYear, baseMonth, baseDay] = baseInvoiceDate.split('-').map(Number);
  const totalMonths = (baseMonth - 1) + monthOffset;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12 + 1;
  const targetDueDay = baseDay || fallbackDueDay;
  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const day = Math.min(targetDueDay, maxDays);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Verifica se uma transação pertence ao período de fatura especificado (ano e mês 0-indexed).
 */
export function isTransactionInInvoicePeriod(
  tx: Transaction,
  card: CreditCard | undefined,
  targetYear: number,
  targetMonth: number
): boolean {
  if (!card || !tx.creditCardId) return false;
  if (!isSameId(tx.creditCardId, card.id)) return false;
  const { year, month } = getTransactionInvoicePeriod(tx, card);
  return year === targetYear && month === targetMonth;
}

/**
 * Retorna a data efetiva de exibição e ordenação de uma transação.
 * Para despesas de cartão de crédito, retorna a data de vencimento da fatura (invoiceDate ou vencimento calculado).
 * Para transações normais de conta/carteira, retorna a data original (date).
 */
export function getEffectiveTransactionDate(tx: Transaction, card?: CreditCard): string {
  if (tx.creditCardId) {
    if (tx.invoiceDate) return tx.invoiceDate;
    if (card) {
      return getTransactionInvoicePeriod(tx, card).invoiceDueDateStr;
    }
    return calculateDefaultInvoiceDueDate(tx.date, card).invoiceDueDateStr;
  }
  return tx.date || '';
}

/**
 * Determina se a fatura de um período específico está paga.
 * Considera paga se o status manual for 'paid' OU se houver compras e todas estiverem com paid = true.
 */
export function isInvoicePeriodPaid(
  card: CreditCard | undefined,
  transactions: Transaction[],
  targetYear: number,
  targetMonth: number
): boolean {
  if (!card) return false;
  const periodKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
  if (card.manualInvoiceStatus?.[periodKey] === 'paid') {
    return true;
  }

  const periodTxs = transactions.filter(t => isTransactionInInvoicePeriod(t, card, targetYear, targetMonth));
  if (periodTxs.length > 0 && periodTxs.every(t => t.paid)) {
    return true;
  }

  return false;
}

/**
 * Corrige e redistribui parcelas fora de cartão que estejam acidentalmente presas
 * na mesma data devido a edições anteriores em lote.
 */
export function repairCorruptedInstallmentDates(transactions: Transaction[]): {
  repaired: Transaction[];
  hasChanges: boolean;
} {
  // Agrupa transações com indicador de parcelamento "(X/Total)" sem creditCardId
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach(tx => {
    if (tx.creditCardId) return;
    const match = (tx.description || '').match(/^(.*?)\s*\((\d+)\/(\d+)\)\s*$/);
    if (!match) return;

    const baseName = match[1].trim();
    const current = parseInt(match[2], 10);
    const total = parseInt(match[3], 10);

    if (total <= 1 || isNaN(current) || isNaN(total)) return;

    const groupKey = tx.installmentGroupId || `${baseName}_${total}_${tx.amount}_${tx.categoryId}`;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(tx);
  });

  const idToNewDate: Record<string, string> = {};
  let anyChange = false;

  Object.values(groups).forEach(items => {
    // Se o grupo tem 2 ou mais parcelas e todas têm exatamente a mesma data
    if (items.length > 1) {
      const dates = new Set(items.map(t => t.date));
      if (dates.size === 1) {
        // Encontramos parcelas com datas idênticas que deveriam estar distribuídas mês a mês
        const sampleDate = items[0].date;
        const [baseYear, , baseDay] = sampleDate.split('-').map(Number);

        items.forEach(item => {
          const match = (item.description || '').match(/\((\d+)\/(\d+)\)/);
          const parcelNum = match ? parseInt(match[1], 10) : item.installmentCurrent || 1;
          const targetMonth = Math.min(Math.max(parcelNum, 1), 12);
          const maxDays = new Date(baseYear, targetMonth, 0).getDate();
          const targetDay = Math.min(baseDay, maxDays);
          const correctDate = `${baseYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

          if (item.date !== correctDate) {
            idToNewDate[item.id] = correctDate;
            anyChange = true;
          }
        });
      }
    }
  });

  if (!anyChange) {
    return { repaired: transactions, hasChanges: false };
  }

  const repaired = transactions.map(t => {
    if (idToNewDate[t.id]) {
      return { ...t, date: idToNewDate[t.id] };
    }
    return t;
  });

  return { repaired, hasChanges: true };
}


