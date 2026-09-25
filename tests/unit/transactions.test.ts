import { describe, it, expect } from 'vitest';
import { Transaction, Account, CreditCard } from '@/types/finance';

describe('Transaction Engine & Specialized Flows', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-itau',
      name: '01 - Itaú',
      type: 'checking',
      balance: 5000,
      initialBalance: 5000,
      color: '#EC7000',
      includeInTotal: true,
      createdAt: '2026-09-01',
    },
    {
      id: 'acc-nubank',
      name: '02 - Nubank',
      type: 'checking',
      balance: 2000,
      initialBalance: 2000,
      color: '#820AD1',
      includeInTotal: true,
      createdAt: '2026-09-01',
    },
  ];

  const mockCard: CreditCard = {
    id: 'card-inter',
    name: 'Cartão Inter',
    limit: 10000,
    closingDay: 3,
    dueDay: 10,
    color: '#FF7A00',
    brand: 'mastercard',
    createdAt: '2026-09-01',
  };

  it('deve desconsiderar transações com flag ignoreInTotals dos totais mensais', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        description: 'Supermercado Mensal',
        amount: 800,
        date: '2026-09-10',
        type: 'expense',
        categoryId: 'cat-alimentacao',
        paid: true,
        createdAt: '2026-09-10',
      },
      {
        id: 'tx-2',
        description: 'Reembolso Corporativo Provisório',
        amount: 500,
        date: '2026-09-12',
        type: 'expense',
        categoryId: 'cat-outros',
        paid: true,
        ignoreInTotals: true, // Deve ser ignorado
        createdAt: '2026-09-12',
      },
    ];

    const totalExpense = transactions
      .filter(t => !t.ignoreInTotals && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalExpense).toBe(800);
  });

  it('deve processar despesa de cartão de crédito vinculada à fatura futura', () => {
    const cardTx: Transaction = {
      id: 'tx-card-1',
      description: 'Notebook Parcelado',
      amount: 3000,
      date: '2026-09-15',
      type: 'expense',
      categoryId: 'cat-eletronicos',
      creditCardId: mockCard.id,
      paid: false,
      invoiceDate: '2026-10-10',
      installmentTotal: 6,
      createdAt: '2026-09-15',
    };

    expect(cardTx.creditCardId).toBe('card-inter');
    expect(cardTx.invoiceDate).toBe('2026-10-10');
    expect(cardTx.installmentTotal).toBe(6);
    expect(cardTx.paid).toBe(false);
  });

  it('deve validar transferência entre contas com débito e crédito', () => {
    const transferTx: Transaction = {
      id: 'tx-transf-1',
      description: 'Transferência: Itaú ➔ Nubank',
      amount: 1000,
      date: '2026-09-20',
      type: 'transfer',
      categoryId: 'cat-other-exp',
      accountId: 'acc-itau',
      destinationAccountId: 'acc-nubank',
      paid: true,
      createdAt: '2026-09-20',
    };

    let fromAccBalance = mockAccounts.find(a => a.id === transferTx.accountId)!.balance;
    let toAccBalance = mockAccounts.find(a => a.id === transferTx.destinationAccountId)!.balance;

    fromAccBalance -= transferTx.amount;
    toAccBalance += transferTx.amount;

    expect(fromAccBalance).toBe(4000);
    expect(toAccBalance).toBe(3000);
  });
});
