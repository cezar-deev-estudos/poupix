import { CreditCard, Transaction } from '@/types/finance';

/**
 * Retorna o período de vencimento da fatura (ano e mês, onde mês é 0-indexed) de uma transação de cartão.
 * Mapeia diretamente o ano/mês da transação (ou do invoiceDate) para a fatura correspondente.
 */
export function getTransactionInvoicePeriod(
  tx: Transaction,
  card?: CreditCard
): { year: number; month: number; periodKey: string; invoiceDueDateStr: string } {
  const dueDay = card?.dueDay || 10;

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

  // Caso contrário, extrai ano e mês da data da transação (YYYY-MM-DD)
  const txParts = (tx.date || '').split('-');
  let txYear = new Date().getFullYear();
  let txMonth = new Date().getMonth(); // 0-indexed

  if (txParts.length === 3) {
    const y = parseInt(txParts[0], 10);
    const m = parseInt(txParts[1], 10) - 1; // 0-indexed
    if (!isNaN(y) && !isNaN(m)) {
      txYear = y;
      txMonth = m;
    }
  }

  const periodKey = `${txYear}-${String(txMonth + 1).padStart(2, '0')}`;
  const invoiceDueDateStr = `${txYear}-${String(txMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  return { year: txYear, month: txMonth, periodKey, invoiceDueDateStr };
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
