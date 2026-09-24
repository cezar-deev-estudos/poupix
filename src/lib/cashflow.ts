import { Transaction, CashFlowMonthProjection } from '@/types/finance';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Calcula a projeção de fluxo de caixa mês a mês para até N meses futuros.
 * Leva em conta:
 * 1. Saldo atual total das contas
 * 2. Transações já agendadas e parceladas nos meses futuros
 * 3. Transações recorrentes (salário, assinaturas, aluguel)
 * 4. Média de receitas e despesas variáveis
 */
export function calculateCashFlowProjections(
  currentBalance: number,
  transactions: Transaction[],
  projectionMonthsCount: number = 12
): CashFlowMonthProjection[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Identificar transações recorrentes ativas
  const recurringIncomes = transactions.filter(t => t.type === 'income' && t.isRecurring);
  const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.isRecurring);

  const recurringIncomeTotal = recurringIncomes.reduce((sum, t) => sum + t.amount, 0);
  const recurringExpenseTotal = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);

  // 2. Média histórica de receitas/despesas não recorrentes do mês atual
  const nonRecurringIncomes = transactions.filter(t => t.type === 'income' && !t.isRecurring && !t.installmentTotal);
  const nonRecurringExpenses = transactions.filter(t => t.type === 'expense' && !t.isRecurring && !t.installmentTotal && !t.creditCardId);

  const baseExtraIncome = nonRecurringIncomes.reduce((sum, t) => sum + t.amount, 0);
  const baseExtraExpense = nonRecurringExpenses.reduce((sum, t) => sum + t.amount, 0);

  const projections: CashFlowMonthProjection[] = [];
  let runningBalance = currentBalance;

  for (let i = 0; i < projectionMonthsCount; i++) {
    const targetMonthIndex = (currentMonth + i) % 12;
    const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
    const monthLabel = `${MONTH_NAMES[targetMonthIndex]}/${String(targetYear).slice(2)}`;

    // Buscar transações reais já cadastradas para este mês/ano específico
    const monthTxs = transactions.filter(t => {
      if (!t.date) return false;
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === targetYear && (tMonth - 1) === targetMonthIndex;
    });

    // Separar por tipo
    let realIncome = 0;
    let realExpense = 0;
    let realCardInvoice = 0;

    monthTxs.forEach(t => {
      if (t.type === 'income') {
        realIncome += t.amount;
      } else if (t.type === 'expense') {
        if (t.creditCardId) {
          realCardInvoice += t.amount;
        } else {
          realExpense += t.amount;
        }
      }
    });

    // Se for um mês futuro com poucos dados registrados, projetar com base nas recorrências
    let projectedIncome = realIncome;
    let projectedExpense = realExpense;
    let projectedCardInvoice = realCardInvoice;

    if (i > 0) {
      // Se não houver receita registrada, aplicar receita recorrente + estimativa base
      if (projectedIncome === 0) {
        projectedIncome = Math.max(recurringIncomeTotal, baseExtraIncome > 0 ? baseExtraIncome : 4500);
      }
      // Se não houver despesa registrada, aplicar despesa recorrente estimada
      if (projectedExpense === 0 && recurringExpenseTotal > 0) {
        projectedExpense = recurringExpenseTotal;
      }
    }

    const totalMonthOutflows = projectedExpense + projectedCardInvoice;
    const netFlow = projectedIncome - totalMonthOutflows;
    runningBalance += netFlow;

    projections.push({
      month: targetMonthIndex,
      year: targetYear,
      label: monthLabel,
      projectedIncome,
      projectedExpense,
      projectedCardInvoice,
      netFlow,
      accumulatedBalance: runningBalance,
    });
  }

  return projections;
}
