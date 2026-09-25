import { describe, it, expect } from 'vitest';
import { Category, Transaction } from '@/types/finance';

describe('Category and Subcategory Aggregation Engine', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-transporte',
      name: 'Transporte',
      type: 'expense',
      icon: 'Car',
      color: '#3B82F6',
      budgetLimit: 1000,
    },
    {
      id: 'sub-uber',
      name: 'Uber / 99',
      type: 'expense',
      icon: 'Car',
      color: '#3B82F6',
      parentId: 'cat-transporte',
      budgetLimit: 400,
    },
    {
      id: 'sub-combustivel',
      name: 'Combustível',
      type: 'expense',
      icon: 'Fuel',
      color: '#3B82F6',
      parentId: 'cat-transporte',
      budgetLimit: 600,
    },
    {
      id: 'cat-salario',
      name: 'Salário',
      type: 'income',
      icon: 'Briefcase',
      color: '#10B981',
      budgetLimit: 0,
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Corrida de Uber',
      amount: 150,
      date: '2026-09-10',
      type: 'expense',
      categoryId: 'sub-uber',
      paid: true,
      createdAt: '2026-09-10',
    },
    {
      id: 'tx-2',
      description: 'Posto Ipiranga',
      amount: 300,
      date: '2026-09-12',
      type: 'expense',
      categoryId: 'sub-combustivel',
      paid: true,
      createdAt: '2026-09-12',
    },
    {
      id: 'tx-3',
      description: 'Pedágio',
      amount: 50,
      date: '2026-09-15',
      type: 'expense',
      categoryId: 'cat-transporte',
      paid: true,
      createdAt: '2026-09-15',
    },
  ];

  it('deve identificar pais e subcategorias corretamente', () => {
    const parentCategories = mockCategories.filter(c => !c.parentId);
    const subCategories = mockCategories.filter(c => c.parentId === 'cat-transporte');

    expect(parentCategories).toHaveLength(2);
    expect(subCategories).toHaveLength(2);
    expect(subCategories.map(s => s.name)).toEqual(['Uber / 99', 'Combustível']);
  });

  it('deve consolidar o total gasto de uma categoria pai incluindo suas subcategorias', () => {
    const parentId = 'cat-transporte';
    const subCategoryIds = mockCategories
      .filter(c => c.parentId === parentId)
      .map(c => c.id);
    const allRelevantIds = [parentId, ...subCategoryIds];

    const totalSpent = mockTransactions
      .filter(t => t.categoryId && allRelevantIds.includes(t.categoryId) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalSpent).toBe(500); // 150 + 300 + 50
  });

  it('deve calcular gasto individual por subcategoria', () => {
    const uberSpent = mockTransactions
      .filter(t => t.categoryId === 'sub-uber')
      .reduce((sum, t) => sum + t.amount, 0);

    const fuelSpent = mockTransactions
      .filter(t => t.categoryId === 'sub-combustivel')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(uberSpent).toBe(150);
    expect(fuelSpent).toBe(300);
  });
});
