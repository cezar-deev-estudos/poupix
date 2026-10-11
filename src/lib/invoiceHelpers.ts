import { CreditCard, Transaction } from '@/types/finance';

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
 * Normaliza e preenche o campo invoiceDate de transações que ainda não o possuem.
 */
export function normalizeTransactionsInvoiceDates(
  transactions: Transaction[],
  creditCards: CreditCard[]
): Transaction[] {
  const cardMap = new Map<string, CreditCard>();
  creditCards.forEach(c => cardMap.set(c.id, c));

  return transactions.map(tx => {
    if (!tx.creditCardId) return tx;
    if (tx.invoiceDate) return tx; // Respeita o invoiceDate já salvo
    const card = cardMap.get(tx.creditCardId);
    const { invoiceDueDateStr } = getTransactionInvoicePeriod(tx, card);
    return {
      ...tx,
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
  if (tx.creditCardId !== card?.id) return false;
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


