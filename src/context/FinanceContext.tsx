'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Account,
  Category,
  CreditCard,
  Transaction,
  FinancialSummary,
  Goal,
  AlertNotification,
  OpenFinanceConnection,
  Tag,
  UserProfile,
} from '@/types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_CREDIT_CARDS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
  INITIAL_TAGS,
  INITIAL_USERS,
} from '@/data/initialData';
import { generateSmartAlerts } from '@/lib/alerts';
import { INITIAL_OPEN_FINANCE_CONNECTIONS, simulateOpenFinanceSyncTransactions } from '@/lib/openFinance';
import { useAuth } from './AuthContext';
import { useFinanceCloudSync } from '@/hooks/useFinanceCloudSync';
import { transactionManager } from '@/hooks/useTransactionsManager';
import { entityManager } from '@/hooks/useEntityManager';

interface FinanceContextType {
  users: UserProfile[];
  currentUser: UserProfile;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  goals: Goal[];
  alerts: AlertNotification[];
  openFinanceConnections: OpenFinanceConnection[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  unreadAlertsCount: number;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  importTransactions: (txs: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>, mode?: 'single' | 'following' | 'all') => void;
  deleteTransaction: (id: string, mode?: 'single' | 'following' | 'all') => void;
  addAccount: (acc: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, acc: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, sourceAccountId?: string) => void;
  connectBank: (institutionId: string, institutionName: string) => void;
  syncBankConnection: (connectionId: string) => void;
  disconnectBank: (connectionId: string) => void;
  exportDatabaseBackup: () => string;
  importDatabaseBackup: (jsonString: string) => boolean;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  summary: FinancialSummary;
  filteredTransactions: Transaction[];
  resetToDefaults: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user-cezar');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openFinanceConnections, setOpenFinanceConnections] = useState<OpenFinanceConnection[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const userStoragePrefix = user ? `mobills_user_${user.id}_` : isDemoMode ? 'mobills_demo_' : 'mobills_';

  // 1. Carregamento LocalStorage Inicial
  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem(`${userStoragePrefix}accounts`);
      const savedCards = localStorage.getItem(`${userStoragePrefix}cards`);
      const savedCategories = localStorage.getItem(`${userStoragePrefix}categories`);
      const savedTags = localStorage.getItem(`${userStoragePrefix}tags`);
      const savedTransactions = localStorage.getItem(`${userStoragePrefix}transactions`);
      const savedGoals = localStorage.getItem(`${userStoragePrefix}goals`);
      const savedReadAlerts = localStorage.getItem(`${userStoragePrefix}read_alerts`);
      const savedOpenFinance = localStorage.getItem(`${userStoragePrefix}open_finance`);
      const savedPrivacy = localStorage.getItem('mobills_privacy_mode');
      const savedTheme = localStorage.getItem('mobills_theme') as 'dark' | 'light' | null;

      if (user) {
        const authProfile: UserProfile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'admin',
          currency: 'BRL',
          createdAt: user.created_at || new Date().toISOString(),
        };
        setUsers([authProfile]);
        setCurrentUserId(user.id);
        setAccounts(savedAccounts ? JSON.parse(savedAccounts) : []);
        setCreditCards(savedCards ? JSON.parse(savedCards) : []);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setTags(savedTags ? JSON.parse(savedTags) : INITIAL_TAGS);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
        setGoals(savedGoals ? JSON.parse(savedGoals) : []);
        setOpenFinanceConnections(savedOpenFinance ? JSON.parse(savedOpenFinance) : []);
      } else {
        setUsers(INITIAL_USERS);
        setCurrentUserId(INITIAL_USERS[0]?.id || 'user-cezar');
        setAccounts(savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS);
        setCreditCards(savedCards ? JSON.parse(savedCards) : INITIAL_CREDIT_CARDS);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setTags(savedTags ? JSON.parse(savedTags) : INITIAL_TAGS);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : INITIAL_TRANSACTIONS);
        setGoals(savedGoals ? JSON.parse(savedGoals) : INITIAL_GOALS);
        setOpenFinanceConnections(savedOpenFinance ? JSON.parse(savedOpenFinance) : INITIAL_OPEN_FINANCE_CONNECTIONS);
      }

      setReadAlertIds(savedReadAlerts ? JSON.parse(savedReadAlerts) : []);
      setIsPrivacyMode(savedPrivacy ? JSON.parse(savedPrivacy) : false);
      if (savedTheme) setTheme(savedTheme);
    } catch (e) {
      console.error('[FinanceContext] Erro ao carregar localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, [user, isDemoMode, userStoragePrefix]);

  // 2. Persistência LocalStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(`${userStoragePrefix}accounts`, JSON.stringify(accounts));
    localStorage.setItem(`${userStoragePrefix}cards`, JSON.stringify(creditCards));
    localStorage.setItem(`${userStoragePrefix}categories`, JSON.stringify(categories));
    localStorage.setItem(`${userStoragePrefix}tags`, JSON.stringify(tags));
    localStorage.setItem(`${userStoragePrefix}transactions`, JSON.stringify(transactions));
    localStorage.setItem(`${userStoragePrefix}goals`, JSON.stringify(goals));
    localStorage.setItem(`${userStoragePrefix}read_alerts`, JSON.stringify(readAlertIds));
    localStorage.setItem(`${userStoragePrefix}open_finance`, JSON.stringify(openFinanceConnections));
    localStorage.setItem('mobills_privacy_mode', JSON.stringify(isPrivacyMode));
    localStorage.setItem('mobills_theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [accounts, creditCards, categories, tags, transactions, goals, readAlertIds, openFinanceConnections, isPrivacyMode, theme, isInitialized, userStoragePrefix]);

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || {
      id: 'user-default',
      name: 'Usuário Poupix',
      email: 'usuario@poupix.com',
      role: 'admin',
      currency: 'BRL',
      createdAt: new Date().toISOString(),
    };
  }, [users, currentUserId]);

  // 3. Callback de dados vindos da nuvem (Supabase)
  const handleCloudDataLoaded = useCallback((cloudData: {
    accounts?: Account[];
    creditCards?: CreditCard[];
    categories?: Category[];
    tags?: Tag[];
    transactions?: Transaction[];
    goals?: Goal[];
    openFinanceConnections?: OpenFinanceConnection[];
  }) => {
    if (cloudData.accounts && cloudData.accounts.length > 0) setAccounts(cloudData.accounts);
    if (cloudData.creditCards && cloudData.creditCards.length > 0) setCreditCards(cloudData.creditCards);
    if (cloudData.categories && cloudData.categories.length > 0) setCategories(cloudData.categories);
    if (cloudData.tags && cloudData.tags.length > 0) setTags(cloudData.tags);
    if (cloudData.transactions && cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
    if (cloudData.goals && cloudData.goals.length > 0) setGoals(cloudData.goals);
    if (cloudData.openFinanceConnections && cloudData.openFinanceConnections.length > 0) setOpenFinanceConnections(cloudData.openFinanceConnections);
  }, []);

  // 4. Hook de Sincronização em Nuvem (Debounced & Auto-Fetch)
  useFinanceCloudSync({
    user,
    currentUser,
    accounts,
    creditCards,
    categories,
    tags,
    transactions,
    goals,
    openFinanceConnections,
    isInitialized,
    onCloudDataLoaded: handleCloudDataLoaded,
  });

  // Filtros de Transações por Período
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === selectedYear && (tMonth - 1) === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Alertas Inteligentes
  const alerts = useMemo(() => {
    const raw = generateSmartAlerts(creditCards, transactions, categories, goals, selectedMonth, selectedYear);
    return raw.map(a => ({ ...a, isRead: readAlertIds.includes(a.id) }));
  }, [creditCards, transactions, categories, goals, selectedMonth, selectedYear, readAlertIds]);

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  // Resumo Financeiro
  const summary: FinancialSummary = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let expectedMonthlyIncome = 0;
    let expectedMonthlyExpense = 0;
    let creditCardTotalInvoice = 0;

    filteredTransactions.forEach(t => {
      if (t.ignoreInTotals) return;
      if (t.type === 'income') {
        expectedMonthlyIncome += t.amount;
        monthlyIncome += t.amount;
      } else if (t.type === 'expense') {
        expectedMonthlyExpense += t.amount;
        monthlyExpense += t.amount;
        if (t.creditCardId) creditCardTotalInvoice += t.amount;
      }
    });

    const totalBalance = accounts.filter(a => a.includeInTotal).reduce((sum, a) => sum + (a.balance || 0), 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      expectedMonthlyIncome,
      expectedMonthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      creditCardTotalInvoice,
    };
  }, [filteredTransactions, accounts]);

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        creditCards,
        categories,
        tags,
        transactions,
        goals,
        alerts,
        openFinanceConnections,
        theme,
        toggleTheme: () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark')),
        isPrivacyMode,
        togglePrivacyMode: () => setIsPrivacyMode(prev => !prev),
        unreadAlertsCount,
        users,
        currentUser,
        switchUser: setCurrentUserId,
        addUser: data => setUsers(prev => [...prev, { ...data, id: 'user-' + Date.now(), createdAt: new Date().toISOString() }]),
        updateUser: (id, up) => setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...up } : u))),
        deleteUser: id => setUsers(prev => prev.filter(u => u.id !== id)),
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        addTransaction: tx => transactionManager.addTransaction(tx, setTransactions, setAccounts),
        importTransactions: txs => transactionManager.importTransactions(txs, setTransactions, setAccounts),
        updateTransaction: (id, up, mode = 'single') => transactionManager.updateTransaction(id, up, mode, transactions, setTransactions),
        deleteTransaction: (id, mode = 'single') => transactionManager.deleteTransaction(id, mode, transactions, setTransactions),
        addAccount: acc => entityManager.addAccount(acc, setAccounts),
        updateAccount: (id, up) => entityManager.updateAccount(id, up, setAccounts),
        deleteAccount: id => entityManager.deleteAccount(id, setAccounts),
        addCreditCard: card => entityManager.addCreditCard(card, setCreditCards),
        updateCreditCard: (id, up) => entityManager.updateCreditCard(id, up, setCreditCards),
        deleteCreditCard: id => entityManager.deleteCreditCard(id, setCreditCards),
        addCategory: cat => entityManager.addCategory(cat, setCategories),
        updateCategory: (id, up) => entityManager.updateCategory(id, up, setCategories),
        deleteCategory: id => entityManager.deleteCategory(id, setCategories),
        addTag: tag => entityManager.addTag(tag, setTags),
        updateTag: (id, up) => entityManager.updateTag(id, up, tags, setTags, setTransactions),
        deleteTag: id => entityManager.deleteTag(id, tags, setTags, setTransactions),
        addGoal: goal => entityManager.addGoal(goal, setGoals),
        updateGoal: (id, up) => entityManager.updateGoal(id, up, setGoals),
        deleteGoal: id => entityManager.deleteGoal(id, setGoals),
        contributeToGoal: (goalId, amount, sourceAccountId) => {
          setGoals(prev => prev.map(g => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount, completed: g.currentAmount + amount >= g.targetAmount } : g)));
          if (sourceAccountId) {
            setAccounts(prev => prev.map(acc => (acc.id === sourceAccountId ? { ...acc, balance: acc.balance - amount } : acc)));
          }
        },
        connectBank: (id, name) => {
          setOpenFinanceConnections(prev => [...prev, { id: 'of-conn-' + Date.now(), institutionId: id, institutionName: name, status: 'connected', lastSyncAt: new Date().toISOString(), consentExpiresAt: new Date(Date.now() + 365 * 864e5).toISOString(), syncedAccountsCount: 1, syncedCardsCount: 1, autoSync: true, createdAt: new Date().toISOString() }]);
        },
        syncBankConnection: id => {
          setOpenFinanceConnections(prev => prev.map(c => (c.id === id ? { ...c, status: 'syncing' } : c)));
          setTimeout(() => {
            const conn = openFinanceConnections.find(c => c.id === id);
            if (conn) {
              const targetAcc = accounts.find(a => a.name.toLowerCase().includes(conn.institutionName.toLowerCase())) || accounts[0];
              const simTxs = simulateOpenFinanceSyncTransactions(conn.institutionName, targetAcc?.id);
              transactionManager.importTransactions(simTxs, setTransactions, setAccounts);
              setOpenFinanceConnections(prev => prev.map(c => (c.id === id ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c)));
            }
          }, 1200);
        },
        disconnectBank: id => setOpenFinanceConnections(prev => prev.filter(c => c.id !== id)),
        exportDatabaseBackup: () => JSON.stringify({ version: '3.0.0', exportedAt: new Date().toISOString(), accounts, creditCards, categories, transactions, goals, openFinanceConnections }, null, 2),
        importDatabaseBackup: jsonStr => {
          try {
            const data = JSON.parse(jsonStr);
            if (!data.accounts || !data.transactions) return false;
            setAccounts(data.accounts || []);
            setCreditCards(data.creditCards || []);
            setCategories(data.categories || []);
            setTransactions(data.transactions || []);
            setGoals(data.goals || []);
            setOpenFinanceConnections(data.openFinanceConnections || []);
            return true;
          } catch {
            return false;
          }
        },
        markAlertAsRead: alertId => setReadAlertIds(prev => (prev.includes(alertId) ? prev : [...prev, alertId])),
        markAllAlertsAsRead: () => setReadAlertIds(alerts.map(a => a.id)),
        summary,
        filteredTransactions,
        resetToDefaults: () => {
          setAccounts(INITIAL_ACCOUNTS);
          setCreditCards(INITIAL_CREDIT_CARDS);
          setCategories(INITIAL_CATEGORIES);
          setTransactions(INITIAL_TRANSACTIONS);
          setGoals(INITIAL_GOALS);
          setOpenFinanceConnections(INITIAL_OPEN_FINANCE_CONNECTIONS);
          setReadAlertIds([]);
        },
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  return context;
};
