export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 'checking' | 'savings' | 'wallet' | 'investment' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  color: string;
  institution?: string;
  includeInTotal: boolean;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other';
  color: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceTotal?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  budgetLimit?: number; // Teto de gastos mensal
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date YYYY-MM-DD
  type: TransactionType;
  categoryId: string;
  accountId?: string; // Para despesa/receita de conta corrente
  destinationAccountId?: string; // Para transferências
  creditCardId?: string; // Se foi lançado no cartão de crédito
  paid: boolean;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  installmentCurrent?: number;
  installmentTotal?: number;
  installmentGroupId?: string;
  createdAt: string;
}

export interface Invoice {
  creditCardId: string;
  month: number; // 0-11
  year: number;
  totalAmount: number;
  closingDate: string;
  dueDate: string;
  status: 'open' | 'closed' | 'paid';
  transactions: Transaction[];
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  expectedMonthlyIncome: number;
  expectedMonthlyExpense: number;
  monthlySavings: number;
  creditCardTotalInvoice: number;
}

// ---- FASE 2: TIPOS ADICIONAIS ----

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  color: string;
  icon: string;
  category?: string;
  accountId?: string; // Conta associada à reserva da meta (opcional)
  completed: boolean;
  createdAt: string;
}

export type AlertType = 'card_due' | 'expense_due' | 'budget_warning' | 'budget_exceeded' | 'goal_reached';

export interface AlertNotification {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  date: string;
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export interface CashFlowMonthProjection {
  month: number; // 0-11
  year: number;
  label: string; // "Out/26", "Nov/26"
  projectedIncome: number;
  projectedExpense: number;
  projectedCardInvoice: number;
  netFlow: number; // Income - (Expense + Card)
  accumulatedBalance: number;
}

export interface ImportedTransactionPreview {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategoryId: string;
  selected: boolean;
  fitId?: string; // ID único bancário do OFX/FITID para evitar duplicatas
}

// ---- FASE 3: OPEN FINANCE & RELATÓRIOS AVANÇADOS ----

export type OpenFinanceStatus = 'connected' | 'syncing' | 'error' | 'disconnected';

export interface BankInstitution {
  id: string;
  name: string;
  code: string;
  logo: string;
  primaryColor: string;
  type: 'bank' | 'fintech' | 'broker';
  supportsCreditCards: boolean;
  supportsInvestments: boolean;
}

export interface OpenFinanceConnection {
  id: string;
  institutionId: string;
  institutionName: string;
  status: OpenFinanceStatus;
  lastSyncAt: string;
  consentExpiresAt: string;
  syncedAccountsCount: number;
  syncedCardsCount: number;
  autoSync: boolean;
  createdAt: string;
}

export interface ExportReportOptions {
  month: number;
  year: number;
  format: 'csv' | 'json';
  includeCategories: boolean;
  includeAccounts: boolean;
}

// ---- CONTROLE DE USUÁRIOS & PERFIL ----

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member' | 'guest';
  currency: string;
  monthlyIncomeTarget?: number;
  createdAt: string;
}



