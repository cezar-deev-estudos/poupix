import { Account, Category, CreditCard, Transaction } from '@/types/finance';

export const INITIAL_CATEGORIES: Category[] = [
  // Despesas
  { id: 'cat-food', name: 'Alimentação', type: 'expense', icon: 'Utensils', color: '#EF4444', budgetLimit: 1500, isDefault: true },
  { id: 'cat-housing', name: 'Moradia', type: 'expense', icon: 'Home', color: '#F97316', budgetLimit: 2200, isDefault: true },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', icon: 'Car', color: '#F59E0B', budgetLimit: 600, isDefault: true },
  { id: 'cat-leisure', name: 'Lazer e Entretenimento', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6', budgetLimit: 500, isDefault: true },
  { id: 'cat-health', name: 'Saúde & Cuidados', type: 'expense', icon: 'HeartPulse', color: '#EC4899', budgetLimit: 400, isDefault: true },
  { id: 'cat-education', name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#3B82F6', budgetLimit: 350, isDefault: true },
  { id: 'cat-shopping', name: 'Compras & Vestuário', type: 'expense', icon: 'ShoppingBag', color: '#10B981', budgetLimit: 400, isDefault: true },
  { id: 'cat-subscriptions', name: 'Assinaturas & Serviços', type: 'expense', icon: 'Tv', color: '#6366F1', budgetLimit: 200, isDefault: true },
  { id: 'cat-other-exp', name: 'Outras Despesas', type: 'expense', icon: 'MoreHorizontal', color: '#6B7280', budgetLimit: 300, isDefault: true },

  // Receitas
  { id: 'cat-salary', name: 'Salário', type: 'income', icon: 'Banknote', color: '#10B981', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance & Extras', type: 'income', icon: 'Laptop', color: '#3B82F6', isDefault: true },
  { id: 'cat-invest-inc', name: 'Rendimentos & Dividendos', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', isDefault: true },
  { id: 'cat-bonus', name: 'Bônus / Premiações', type: 'income', icon: 'Award', color: '#F59E0B', isDefault: true },
  { id: 'cat-other-inc', name: 'Outras Receitas', type: 'income', icon: 'PlusCircle', color: '#6B7280', isDefault: true },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-nubank',
    name: 'Nubank Principal',
    type: 'checking',
    balance: 3840.50,
    initialBalance: 3840.50,
    color: '#820AD1',
    institution: 'Nubank',
    includeInTotal: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-inter',
    name: 'Banco Inter Reserva',
    type: 'savings',
    balance: 12500.00,
    initialBalance: 12500.00,
    color: '#FF7A00',
    institution: 'Inter',
    includeInTotal: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc-wallet',
    name: 'Carteira Física',
    type: 'wallet',
    balance: 240.00,
    initialBalance: 240.00,
    color: '#10B981',
    institution: 'Dinheiro',
    includeInTotal: true,
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-nubank-ultravioleta',
    name: 'Nubank Ultravioleta',
    brand: 'mastercard',
    color: '#340068',
    limit: 15000.00,
    closingDay: 20,
    dueDay: 27,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'card-xp-infinite',
    name: 'XP Visa Infinite',
    brand: 'visa',
    color: '#111827',
    limit: 25000.00,
    closingDay: 15,
    dueDay: 22,
    createdAt: new Date().toISOString(),
  }
];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Salário Mensal',
    amount: 8500.00,
    date: `${currentYear}-${currentMonth}-05`,
    type: 'income',
    categoryId: 'cat-salary',
    accountId: 'acc-nubank',
    paid: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-2',
    description: 'Projeto Freelance Design',
    amount: 1800.00,
    date: `${currentYear}-${currentMonth}-12`,
    type: 'income',
    categoryId: 'cat-freelance',
    accountId: 'acc-inter',
    paid: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-3',
    description: 'Aluguel do Apartamento',
    amount: 1950.00,
    date: `${currentYear}-${currentMonth}-10`,
    type: 'expense',
    categoryId: 'cat-housing',
    accountId: 'acc-nubank',
    paid: true,
    isRecurring: true,
    recurringPeriod: 'monthly',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-4',
    description: 'Supermercado Mensal Pão de Açúcar',
    amount: 684.30,
    date: `${currentYear}-${currentMonth}-14`,
    type: 'expense',
    categoryId: 'cat-food',
    creditCardId: 'card-nubank-ultravioleta',
    paid: true,
    tags: ['mercado', 'casa'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-5',
    description: 'Notebook Dell XPS (Parcela 2/6)',
    amount: 489.90,
    date: `${currentYear}-${currentMonth}-18`,
    type: 'expense',
    categoryId: 'cat-shopping',
    creditCardId: 'card-nubank-ultravioleta',
    installmentCurrent: 2,
    installmentTotal: 6,
    paid: true,
    tags: ['equipamento', 'trabalho'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-6',
    description: 'Jantar Restaurante Japonês',
    amount: 215.00,
    date: `${currentYear}-${currentMonth}-19`,
    type: 'expense',
    categoryId: 'cat-food',
    creditCardId: 'card-nubank-ultravioleta',
    paid: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-7',
    description: 'Combustível Posto Shell',
    amount: 260.00,
    date: `${currentYear}-${currentMonth}-20`,
    type: 'expense',
    categoryId: 'cat-transport',
    accountId: 'acc-nubank',
    paid: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-8',
    description: 'Netflix e Spotify',
    amount: 84.80,
    date: `${currentYear}-${currentMonth}-22`,
    type: 'expense',
    categoryId: 'cat-subscriptions',
    creditCardId: 'card-xp-infinite',
    paid: true,
    isRecurring: true,
    recurringPeriod: 'monthly',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-9',
    description: 'Dividendos FIIs',
    amount: 340.20,
    date: `${currentYear}-${currentMonth}-15`,
    type: 'income',
    categoryId: 'cat-invest-inc',
    accountId: 'acc-inter',
    paid: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-10',
    description: 'Farmácia Drogasil',
    amount: 145.60,
    date: `${currentYear}-${currentMonth}-23`,
    type: 'expense',
    categoryId: 'cat-health',
    accountId: 'acc-wallet',
    paid: true,
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_GOALS: import('@/types/finance').Goal[] = [
  {
    id: 'goal-emergency-fund',
    name: 'Reserva de Emergência (6 Meses)',
    targetAmount: 30000.00,
    currentAmount: 12500.00,
    targetDate: `${currentYear + 1}-06-30`,
    color: '#10B981',
    icon: 'Shield',
    category: 'Segurança',
    accountId: 'acc-inter',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-vacation-japan',
    name: 'Viagem de Férias para o Japão',
    targetAmount: 18000.00,
    currentAmount: 7200.00,
    targetDate: `${currentYear + 1}-10-15`,
    color: '#8B5CF6',
    icon: 'Plane',
    category: 'Viagens',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-new-car',
    name: 'Entrada Carro Novo Híbrido',
    targetAmount: 40000.00,
    currentAmount: 14500.00,
    targetDate: `${currentYear + 2}-03-01`,
    color: '#F59E0B',
    icon: 'Car',
    category: 'Bens',
    completed: false,
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_USERS: import('@/types/finance').UserProfile[] = [
  {
    id: 'user-cezar',
    name: 'Cezar Cardoso',
    email: 'cezar@poupix.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    currency: 'BRL (R$)',
    monthlyIncomeTarget: 10000.00,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-family',
    name: 'Conta Familiar / Conjunta',
    email: 'familia@poupix.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    currency: 'BRL (R$)',
    monthlyIncomeTarget: 15000.00,
    createdAt: new Date().toISOString(),
  }
];



