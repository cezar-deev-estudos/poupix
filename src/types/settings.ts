export type DashboardCardId =
  | 'categoryExpenseChart'
  | 'creditCardInfo'
  | 'monthlyBalanceCard'
  | 'categoryIncomeChart'
  | 'monthlyBalanceChart'
  | 'recentTransactions';

export interface DashboardCardDefinition {
  id: DashboardCardId;
  label: string;
}

export const ALL_DASHBOARD_CARDS: Record<DashboardCardId, DashboardCardDefinition> = {
  categoryExpenseChart: { id: 'categoryExpenseChart', label: 'Gráfico de despesas por categoria' },
  creditCardInfo: { id: 'creditCardInfo', label: 'Informações de cartão de crédito' },
  monthlyBalanceCard: { id: 'monthlyBalanceCard', label: 'Card do balanço mensal' },
  categoryIncomeChart: { id: 'categoryIncomeChart', label: 'Gráfico de receitas por categoria' },
  monthlyBalanceChart: { id: 'monthlyBalanceChart', label: 'Gráfico de evolução mensal' },
  recentTransactions: { id: 'recentTransactions', label: 'Últimas transações do mês' },
};

export type MobileDashboardCardId =
  | 'pendingAlerts'
  | 'monthlyBalance'
  | 'categoryExpenses'
  | 'creditCards'
  | 'accounts'
  | 'recentTransactions'
  | 'expenseHeatmap'
  | 'monthlyPlanning';

export interface MobileDashboardCardDefinition {
  id: MobileDashboardCardId;
  label: string;
}

export const ALL_MOBILE_DASHBOARD_CARDS: Record<MobileDashboardCardId, MobileDashboardCardDefinition> = {
  pendingAlerts: { id: 'pendingAlerts', label: 'Pendências e alertas' },
  monthlyBalance: { id: 'monthlyBalance', label: 'Balanço mensal' },
  categoryExpenses: { id: 'categoryExpenses', label: 'Despesas por categoria' },
  creditCards: { id: 'creditCards', label: 'Cartões de crédito' },
  accounts: { id: 'accounts', label: 'Contas' },
  recentTransactions: { id: 'recentTransactions', label: 'Últimas transações do mês' },
  expenseHeatmap: { id: 'expenseHeatmap', label: 'Mapa de calor de despesas' },
  monthlyPlanning: { id: 'monthlyPlanning', label: 'Planejamento mensal' },
};

export interface MobileDashboardLayoutPreferences {
  order: MobileDashboardCardId[];
  enabled: Record<MobileDashboardCardId, boolean>;
}

export const DEFAULT_MOBILE_DASHBOARD_LAYOUT: MobileDashboardLayoutPreferences = {
  order: [
    'pendingAlerts',
    'monthlyBalance',
    'categoryExpenses',
    'creditCards',
    'accounts',
    'recentTransactions',
    'expenseHeatmap',
    'monthlyPlanning',
  ],
  enabled: {
    pendingAlerts: true,
    monthlyBalance: true,
    categoryExpenses: true,
    creditCards: true,
    accounts: true,
    recentTransactions: true,
    expenseHeatmap: true,
    monthlyPlanning: true,
  },
};

export function mergeMobileDashboardLayout(savedRaw?: any): MobileDashboardLayoutPreferences {
  if (!savedRaw) return DEFAULT_MOBILE_DASHBOARD_LAYOUT;
  try {
    const parsed = typeof savedRaw === 'string' ? JSON.parse(savedRaw) : savedRaw;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_MOBILE_DASHBOARD_LAYOUT;

    const allValidIds = Object.keys(ALL_MOBILE_DASHBOARD_CARDS) as MobileDashboardCardId[];
    const savedOrder = (parsed.order || []).filter((id: any) => allValidIds.includes(id));

    // Adiciona cards novos que não estavam salvos
    allValidIds.forEach(id => {
      if (!savedOrder.includes(id)) {
        savedOrder.push(id);
      }
    });

    return {
      order: savedOrder.length ? savedOrder : DEFAULT_MOBILE_DASHBOARD_LAYOUT.order,
      enabled: {
        ...DEFAULT_MOBILE_DASHBOARD_LAYOUT.enabled,
        ...(parsed.enabled || {}),
      },
    };
  } catch {
    return DEFAULT_MOBILE_DASHBOARD_LAYOUT;
  }
}

export interface DashboardLayoutPreferences {
  leftColumn: DashboardCardId[];
  rightColumn: DashboardCardId[];
  enabled: Record<DashboardCardId, boolean>;
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutPreferences = {
  leftColumn: [
    'categoryExpenseChart',
    'monthlyBalanceCard',
    'recentTransactions',
  ],
  rightColumn: [
    'creditCardInfo',
    'categoryIncomeChart',
    'monthlyBalanceChart',
  ],
  enabled: {
    categoryExpenseChart: true,
    creditCardInfo: true,
    monthlyBalanceCard: true,
    categoryIncomeChart: true,
    monthlyBalanceChart: true,
    recentTransactions: true,
  },
};

export function mergeDashboardLayout(savedRaw?: any): DashboardLayoutPreferences {
  if (!savedRaw) return DEFAULT_DASHBOARD_LAYOUT;
  try {
    const parsed = typeof savedRaw === 'string' ? JSON.parse(savedRaw) : savedRaw;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_DASHBOARD_LAYOUT;

    const allValidIds = Object.keys(ALL_DASHBOARD_CARDS) as DashboardCardId[];

    const left = (parsed.leftColumn || []).filter((id: any) => allValidIds.includes(id));
    const right = (parsed.rightColumn || []).filter((id: any) => allValidIds.includes(id));

    // Adiciona novos cards cadastrados no sistema que não existiam no layout salvo
    allValidIds.forEach(id => {
      if (!left.includes(id) && !right.includes(id)) {
        if (DEFAULT_DASHBOARD_LAYOUT.leftColumn.includes(id)) {
          left.push(id);
        } else {
          right.push(id);
        }
      }
    });

    return {
      leftColumn: left.length ? left : DEFAULT_DASHBOARD_LAYOUT.leftColumn,
      rightColumn: right.length ? right : DEFAULT_DASHBOARD_LAYOUT.rightColumn,
      enabled: {
        ...DEFAULT_DASHBOARD_LAYOUT.enabled,
        ...(parsed.enabled || {}),
      },
    };
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

export interface AppPreferences {
  language: string;
  currency: string;
  theme: 'dark' | 'light';
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'pt-BR',
  currency: 'BRL',
  theme: 'dark',
};

export interface NotificationPreferences {
  receiveNotifications: boolean;
  financialAlerts: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  receiveNotifications: true,
  financialAlerts: true,
};
