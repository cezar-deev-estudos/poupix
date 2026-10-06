import { describe, it, expect } from 'vitest';
import { Category, Transaction, getCategoryBudgetForPeriod } from '@/types/finance';

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

  it('deve priorizar teto dinâmico do mês e fazer fallback para o padrão quando não configurado', () => {
    const catWithCustomMonth: Category = {
      id: 'cat-alimentacao',
      name: 'Alimentação',
      type: 'expense',
      icon: 'Utensils',
      color: '#EF4444',
      budgetLimit: 1200, // Teto padrão
      monthlyBudgets: {
        '2027-01': 1500, // Janeiro 2027 personalizado
        '2027-02': 1800, // Fevereiro 2027 personalizado
      },
    };

    // Janeiro 2027 (monthIndex = 0) deve retornar 1500 customizado
    const jan2027 = getCategoryBudgetForPeriod(catWithCustomMonth, 2027, 0);
    expect(jan2027.amount).toBe(1500);
    expect(jan2027.isCustomMonth).toBe(true);

    // Fevereiro 2027 (monthIndex = 1) deve retornar 1800 customizado
    const feb2027 = getCategoryBudgetForPeriod(catWithCustomMonth, 2027, 1);
    expect(feb2027.amount).toBe(1800);
    expect(feb2027.isCustomMonth).toBe(true);

    // Março 2027 (monthIndex = 2) não tem custom, deve retornar teto padrão (1200)
    const mar2027 = getCategoryBudgetForPeriod(catWithCustomMonth, 2027, 2);
    expect(mar2027.amount).toBe(1200);
    expect(mar2027.isCustomMonth).toBe(false);

    // Ano diferente (2026-09) sem custom deve retornar padrão
    const sep2026 = getCategoryBudgetForPeriod(catWithCustomMonth, 2026, 8);
    expect(sep2026.amount).toBe(1200);
    expect(sep2026.isCustomMonth).toBe(false);
  });
});
