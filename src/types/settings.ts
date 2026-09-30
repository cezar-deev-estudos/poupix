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
  categoryExpenseChart: { id: 'categoryExpenseChart', label: 'Mostrar gráfico de despesas por categoria?' },
  creditCardInfo: { id: 'creditCardInfo', label: 'Mostrar informações de cartão de crédito?' },
  monthlyBalanceCard: { id: 'monthlyBalanceCard', label: 'Mostrar card do balanço mensal?' },
  categoryIncomeChart: { id: 'categoryIncomeChart', label: 'Mostrar gráfico de receitas por categoria?' },
  monthlyBalanceChart: { id: 'monthlyBalanceChart', label: 'Mostrar gráfico de evolução mensal (anual)?' },
  recentTransactions: { id: 'recentTransactions', label: 'Mostrar últimas transações do mês?' },
};

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
