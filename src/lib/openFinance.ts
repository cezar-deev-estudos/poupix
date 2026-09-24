import { BankInstitution, OpenFinanceConnection, Transaction } from '@/types/finance';

export const SUPPORTED_INSTITUTIONS: BankInstitution[] = [
  {
    id: 'inst-nubank',
    name: 'Nubank',
    code: '260',
    logo: '🟣',
    primaryColor: '#820AD1',
    type: 'fintech',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-inter',
    name: 'Banco Inter',
    code: '077',
    logo: '🟠',
    primaryColor: '#FF7A00',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-itau',
    name: 'Itaú Unibanco',
    code: '341',
    logo: '🟧',
    primaryColor: '#EC7000',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-bradesco',
    name: 'Bradesco',
    code: '237',
    logo: '🔴',
    primaryColor: '#CC092F',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-santander',
    name: 'Santander Brasil',
    code: '033',
    logo: '🔺',
    primaryColor: '#EA1D2C',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-bb',
    name: 'Banco do Brasil',
    code: '001',
    logo: '🟡',
    primaryColor: '#FDF001',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-xp',
    name: 'XP Investimentos',
    code: '102',
    logo: '⬛',
    primaryColor: '#111827',
    type: 'broker',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-btg',
    name: 'BTG Pactual',
    code: '208',
    logo: '🔷',
    primaryColor: '#002B49',
    type: 'bank',
    supportsCreditCards: true,
    supportsInvestments: true,
  },
  {
    id: 'inst-mercadopago',
    name: 'Mercado Pago',
    code: '323',
    logo: '🔵',
    primaryColor: '#009EE3',
    type: 'fintech',
    supportsCreditCards: true,
    supportsInvestments: false,
  }
];

export const INITIAL_OPEN_FINANCE_CONNECTIONS: OpenFinanceConnection[] = [
  {
    id: 'of-conn-nubank',
    institutionId: 'inst-nubank',
    institutionName: 'Nubank',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    syncedAccountsCount: 1,
    syncedCardsCount: 1,
    autoSync: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'of-conn-inter',
    institutionId: 'inst-inter',
    institutionName: 'Banco Inter',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    syncedAccountsCount: 1,
    syncedCardsCount: 0,
    autoSync: true,
    createdAt: new Date().toISOString(),
  }
];

// Gerador de transações simuladas pelo webhook do Open Finance ao sincronizar
export function simulateOpenFinanceSyncTransactions(institutionName: string, accountId?: string): Omit<Transaction, 'id' | 'createdAt'>[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(Math.max(1, now.getDate() - 1)).padStart(2, '0');

  return [
    {
      description: `Pix Recebido - Open Finance (${institutionName})`,
      amount: 150.00,
      date: `${year}-${month}-${day}`,
      type: 'income',
      categoryId: 'cat-other-inc',
      accountId: accountId,
      paid: true,
      tags: ['open-finance', 'automatico'],
    },
    {
      description: `Compra Débito Padaria - Open Finance (${institutionName})`,
      amount: 28.50,
      date: `${year}-${month}-${day}`,
      type: 'expense',
      categoryId: 'cat-food',
      accountId: accountId,
      paid: true,
      tags: ['open-finance', 'automatico'],
    }
  ];
}
