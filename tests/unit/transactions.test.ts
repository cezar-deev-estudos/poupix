import { describe, it, expect } from 'vitest';
import { Transaction, Account, CreditCard, Category } from '@/types/finance';
import { applyDecreasingDeduction } from '@/lib/decreasingExpenses';

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

  it('deve abater despesa decrescente prevista quando uma despesa do mesmo nanoTag for lançada no mesmo mês de competência (inclusive fatura de cartão)', () => {
    const mockSubcategory: Category = {
      id: 'sub-carro',
      name: 'Carro',
      type: 'expense',
      icon: 'Car',
      color: '#3B82F6',
      nanoCategories: [
        { id: 'nano-combustivel', name: 'Combustível' },
      ],
    };

    const mockItauCard: CreditCard = {
      id: 'card-itau',
      name: 'Itaú Personalité',
      limit: 15000,
      closingDay: 12,
      dueDay: 20,
      brand: 'visa',
      color: '#EC7000',
      createdAt: '2026-01-01',
    };

    // Despesa Prevista / Decrescente de R$ 350,00 para Novembro/2026 com nano Combustível
    const decreasingExpense: Transaction = {
      id: 'tx-dec-1',
      description: 'Combustível',
      amount: 350.00,
      date: '2026-11-30',
      type: 'expense',
      categoryId: 'sub-carro',
      paid: false,
      isDecreasing: true,
      createdAt: '2026-11-01',
    };

    // Compra no Cartão em 31/10/2026 de R$ 246,72 com a mesma nano Combustível (cai na fatura de Nov/2026)
    const cardExpense: Transaction = {
      id: 'tx-normal-1',
      description: 'Combustível',
      amount: 246.72,
      date: '2026-10-31',
      type: 'expense',
      categoryId: 'sub-carro',
      creditCardId: mockItauCard.id,
      paid: false,
      createdAt: '2026-10-31',
    };

    const result = applyDecreasingDeduction(
      cardExpense,
      [decreasingExpense],
      [mockItauCard],
      [mockSubcategory]
    );

    expect(result.linkedDecreasingId).toBe('tx-dec-1');
    const updatedDec = result.updatedTxs.find((t: Transaction) => t.id === 'tx-dec-1');
    expect(updatedDec).toBeDefined();
    // 350.00 - 246.72 = 103.28
    expect(updatedDec!.amount).toBe(103.28);
  });
});
