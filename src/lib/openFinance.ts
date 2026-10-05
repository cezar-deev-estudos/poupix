import {
  BankInstitution,
  OpenFinanceConnection,
  OpenFinanceSyncSettings,
  PendingBankTransaction,
  Transaction,
} from '@/types/finance';

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

export const DEFAULT_SYNC_SETTINGS: OpenFinanceSyncSettings = {
  syncBalance: true,
  syncTransactions: true,
  syncCreditCard: true,
  requireApproval: true,
};

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
    settings: { ...DEFAULT_SYNC_SETTINGS },
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
    settings: { ...DEFAULT_SYNC_SETTINGS },
    createdAt: new Date().toISOString(),
  }
];

// Mapeador inteligente de categorias por palavras-chave bancárias
export function guessCategoryByBankDescription(desc: string): { categoryId: string; confidence: 'high' | 'medium' | 'low' } {
  const text = desc.toLowerCase();

  if (text.includes('mercado') || text.includes('padaria') || text.includes('ifood') || text.includes('restaurante') || text.includes('burger')) {
    return { categoryId: 'cat-food', confidence: 'high' };
  }
  if (text.includes('uber') || text.includes('99app') || text.includes('posto') || text.includes('gasolina') || text.includes('estapar')) {
    return { categoryId: 'cat-transport', confidence: 'high' };
  }
  if (text.includes('farmacia') || text.includes('droga') || text.includes('hospital') || text.includes('consulta')) {
    return { categoryId: 'cat-health', confidence: 'high' };
  }
  if (text.includes('netflix') || text.includes('spotify') || text.includes('cinema') || text.includes('steam')) {
    return { categoryId: 'cat-leisure', confidence: 'high' };
  }
  if (text.includes('aluguel') || text.includes('condominio') || text.includes('enel') || text.includes('sabesp') || text.includes('luz') || text.includes('energia')) {
    return { categoryId: 'cat-housing', confidence: 'high' };
  }
  if (text.includes('salario') || text.includes('ted recebida') || text.includes('doc recebida') || text.includes('pix recebido') || text.includes('remunera')) {
    return { categoryId: 'cat-salary', confidence: 'medium' };
  }

  return { categoryId: 'cat-other-exp', confidence: 'low' };
}

// Gerador de transações bancárias pendentes para a fila de aprovação/conciliação
export function simulatePendingBankTransactions(
  connection: OpenFinanceConnection,
  targetAccountId?: string,
  targetCardId?: string
): PendingBankTransaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const yesterday = String(Math.max(1, now.getDate() - 1)).padStart(2, '0');

  const list: PendingBankTransaction[] = [];
  const settings = connection.settings || DEFAULT_SYNC_SETTINGS;

  if (settings.syncTransactions) {
    list.push({
      id: `pbt-${Date.now()}-1`,
      connectionId: connection.id,
      institutionId: connection.institutionId,
      institutionName: connection.institutionName,
      bankTransactionId: `bank_tx_${Date.now()}_101`,
      date: `${year}-${month}-${day}`,
      description: `PAG*PADARIA ESTRELA (${connection.institutionName})`,
      amount: 32.50,
      type: 'expense',
      suggestedCategoryId: 'cat-food',
      categoryConfidence: 'high',
      accountId: targetAccountId,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });

    list.push({
      id: `pbt-${Date.now()}-2`,
      connectionId: connection.id,
      institutionId: connection.institutionId,
      institutionName: connection.institutionName,
      bankTransactionId: `bank_tx_${Date.now()}_102`,
      date: `${year}-${month}-${day}`,
      description: `PIX RECEBIDO - REEMBOLSO (${connection.institutionName})`,
      amount: 180.00,
      type: 'income',
      suggestedCategoryId: 'cat-other-inc',
      categoryConfidence: 'medium',
      accountId: targetAccountId,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });
  }

  if (settings.syncCreditCard && targetCardId) {
    list.push({
      id: `pbt-${Date.now()}-3`,
      connectionId: connection.id,
      institutionId: connection.institutionId,
      institutionName: connection.institutionName,
      bankTransactionId: `bank_tx_${Date.now()}_103`,
      date: `${year}-${month}-${yesterday}`,
      description: `UBER*TRIP SP (${connection.institutionName})`,
      amount: 24.90,
      type: 'expense',
      suggestedCategoryId: 'cat-transport',
      categoryConfidence: 'high',
      creditCardId: targetCardId,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    });
  }

  return list;
}

export function simulateOpenFinanceSyncTransactions(
  institutionName: string,
  accountId?: string
): Omit<Transaction, 'id' | 'createdAt'>[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return [
    {
      description: `Pix Recebido - Open Finance (${institutionName})`,
      amount: 150.0,
      date: `${year}-${month}-${day}`,
      type: 'income',
      categoryId: 'cat-other-inc',
      accountId: accountId,
      paid: true,
      tags: ['open-finance', 'automatico'],
    },
    {
      description: `Compra Débito Padaria - Open Finance (${institutionName})`,
      amount: 28.5,
      date: `${year}-${month}-${day}`,
      type: 'expense',
      categoryId: 'cat-food',
      accountId: accountId,
      paid: true,
      tags: ['open-finance', 'automatico'],
    },
  ];
}
