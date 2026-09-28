export type DashboardCardId =
  | 'categoryExpenseChart'
  | 'creditCardInfo'
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
  categoryIncomeChart: { id: 'categoryIncomeChart', label: 'Mostrar gráfico de receitas por categoria?' },
  monthlyBalanceChart: { id: 'monthlyBalanceChart', label: 'Mostrar gráfico do balanço mensal?' },
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
    'monthlyBalanceChart',
    'recentTransactions',
  ],
  rightColumn: [
    'creditCardInfo',
    'categoryIncomeChart',
  ],
  enabled: {
    categoryExpenseChart: true,
    creditCardInfo: true,
    categoryIncomeChart: true,
    monthlyBalanceChart: true,
    recentTransactions: true,
  },
};

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
