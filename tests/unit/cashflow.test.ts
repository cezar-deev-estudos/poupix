import { describe, it, expect } from 'vitest';
import { calculateCashFlowProjections } from '@/lib/cashflow';
import { Transaction } from '@/types/finance';

describe('Cash Flow Projections Engine', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Salário Mensal',
      amount: 8000,
      date: '2026-09-05',
      type: 'income',
      categoryId: 'cat-salario',
      paid: true,
      isRecurring: true,
      recurringPeriod: 'monthly',
      createdAt: '2026-09-01',
    },
    {
      id: 'tx-2',
      description: 'Aluguel Fixo',
      amount: 2500,
      date: '2026-09-10',
      type: 'expense',
      categoryId: 'cat-moradia',
      paid: true,
      isRecurring: true,
      recurringPeriod: 'monthly',
      createdAt: '2026-09-01',
    },
  ];

  it('deve calcular 6 meses de projeção de fluxo de caixa', () => {
    const initialBalance = 5000;
    const projections = calculateCashFlowProjections(
      initialBalance,
      mockTransactions,
      6
    );

    expect(projections).toHaveLength(6);
    expect(projections[0].projectedIncome).toBe(8000);
    expect(projections[0].projectedExpense).toBe(2500);
    expect(projections[0].netFlow).toBe(5500);
    expect(projections[0].accumulatedBalance).toBe(10500);
  });
});
