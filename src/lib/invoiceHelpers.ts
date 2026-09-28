import { CreditCard, Transaction } from '@/types/finance';

/**
 * Retorna o período de vencimento da fatura (ano e mês, onde mês é 0-indexed) de uma transação de cartão.
 * Se a transação possui `invoiceDate` (YYYY-MM-DD), utiliza-a como prioridade máxima.
 * Caso contrário, infere a data de vencimento da fatura com base na data da transação e datas de fechamento/vencimento do cartão.
 */
export function getTransactionInvoicePeriod(
  tx: Transaction,
  card?: CreditCard
): { year: number; month: number; periodKey: string; invoiceDueDateStr: string } {
  if (tx.invoiceDate) {
    const parts = tx.invoiceDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      return { year, month, periodKey, invoiceDueDateStr: tx.invoiceDate };
    }
  }

  // Fallback: calcular com base no closingDay e dueDay do cartão
  const txDate = new Date(tx.date);
  const closingDay = card?.closingDay || 3;
  const dueDay = card?.dueDay || 10;

  let invoiceMonth = txDate.getMonth();
  let invoiceYear = txDate.getFullYear();

  // Se a data da compra for após o dia de fechamento, a fatura vence no mês seguinte
  if (txDate.getDate() > closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 11) {
      invoiceMonth = 0;
      invoiceYear += 1;
    }
  }

  const periodKey = `${invoiceYear}-${String(invoiceMonth + 1).padStart(2, '0')}`;
  const invDueDate = new Date(invoiceYear, invoiceMonth, dueDay);
  const invoiceDueDateStr = invDueDate.toISOString().split('T')[0];

  return { year: invoiceYear, month: invoiceMonth, periodKey, invoiceDueDateStr };
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
