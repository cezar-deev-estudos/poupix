'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Account, Category, CreditCard, Transaction, FinancialSummary, Goal, AlertNotification, OpenFinanceConnection, Tag } from '@/types/finance';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_CREDIT_CARDS, INITIAL_TRANSACTIONS, INITIAL_GOALS, INITIAL_TAGS } from '@/data/initialData';
import { generateSmartAlerts } from '@/lib/alerts';
import { INITIAL_OPEN_FINANCE_CONNECTIONS, simulateOpenFinanceSyncTransactions } from '@/lib/openFinance';

interface FinanceContextType {
  users: import('@/types/finance').UserProfile[];
  currentUser: import('@/types/finance').UserProfile;
  switchUser: (userId: string) => void;
  addUser: (user: Omit<import('@/types/finance').UserProfile, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<import('@/types/finance').UserProfile>) => void;
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
  selectedMonth: number; // 0-11
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

const STORAGE_KEYS = {
  USERS: 'mobills_users_v1',
  CURRENT_USER: 'mobills_current_user_v1',
  ACCOUNTS: 'mobills_accounts_v1',
  CARDS: 'mobills_cards_v1',
  CATEGORIES: 'mobills_categories_v1',
  TRANSACTIONS: 'mobills_transactions_v1',
  GOALS: 'mobills_goals_v1',
  READ_ALERTS: 'mobills_read_alerts_v1',
  OPEN_FINANCE: 'mobills_open_finance_v1',
  PRIVACY: 'mobills_privacy_mode_v1',
  THEME: 'mobills_theme_v1',
};

import { useAuth } from './AuthContext';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [users, setUsers] = useState<import('@/types/finance').UserProfile[]>([]);
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

  // Prefix dinâmico de storage: isolado por UID do usuário autenticado ou demo
  const userStoragePrefix = user ? `mobills_user_${user.id}_` : isDemoMode ? 'mobills_demo_' : 'mobills_';

  // Carregar dados salvos ou usar defaults
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
      const savedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light' | null;

      if (user) {
        // Usuário autenticado
        const authProfile: import('@/types/finance').UserProfile = {
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
        // Modo Demonstração ou Fallback
        const initialUsers = require('@/data/initialData').INITIAL_USERS;
        setUsers(initialUsers);
        setCurrentUserId(initialUsers[0]?.id || 'user-cezar');
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
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.error('Erro ao inicializar contexto financeiro', e);
    } finally {
      setIsInitialized(true);
    }
  }, [user, isDemoMode, userStoragePrefix]);

  // Salvar alterações
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
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(isPrivacyMode));
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

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
      currency: 'BRL (R$)',
      createdAt: new Date().toISOString(),
    };
  }, [users, currentUserId]);

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  const addUser = (userData: Omit<import('@/types/finance').UserProfile, 'id' | 'createdAt'>) => {
    const newUser: import('@/types/finance').UserProfile = {
      ...userData,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updated: Partial<import('@/types/finance').UserProfile>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Não é possível excluir o único usuário.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUserId === id) {
      const nextUser = users.find(u => u.id !== id);
      if (nextUser) setCurrentUserId(nextUser.id);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode(prev => !prev);
  };
  // Transações filtradas pelo mês e ano selecionados
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tYear === selectedYear && (tMonth - 1) === selectedMonth;
  });

  // Geração e gerenciamento de Alertas Inteligentes
  const alerts = useMemo(() => {
    const rawAlerts = generateSmartAlerts(creditCards, transactions, categories, goals, selectedMonth, selectedYear);
    return rawAlerts.map(a => ({
      ...a,
      isRead: readAlertIds.includes(a.id),
    }));
  }, [creditCards, transactions, categories, goals, selectedMonth, selectedYear, readAlertIds]);

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const markAlertAsRead = (alertId: string) => {
    setReadAlertIds(prev => prev.includes(alertId) ? prev : [...prev, alertId]);
  };

  const markAllAlertsAsRead = () => {
    setReadAlertIds(alerts.map(a => a.id));
  };

  // Cálculo do Resumo Financeiro
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
        if (t.paid) monthlyIncome += t.amount;
      } else if (t.type === 'expense') {
        expectedMonthlyExpense += t.amount;
        if (t.paid) monthlyExpense += t.amount;
        if (t.creditCardId) {
          creditCardTotalInvoice += t.amount;
        }
      }
    });

    const totalBalance = accounts
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + (a.balance || 0), 0);

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

  // Helper para cálculo robusto de datas mês a mês (respeitando último dia de cada mês)
  const getNextMonthDate = (baseDateStr: string, monthOffset: number): string => {
    const [baseYear, baseMonth, baseDay] = baseDateStr.split('-').map(Number);
    const totalMonths = (baseMonth - 1) + monthOffset;
    const targetYear = baseYear + Math.floor(totalMonths / 12);
    const targetMonth = (totalMonths % 12) + 1;
    const maxDays = new Date(targetYear, targetMonth, 0).getDate();
    const day = Math.min(baseDay, maxDays);
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Ações de Transação
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    // 1. Caso seja Repetição / Parcelamento (Repetir N vezes)
    if (tx.installmentTotal && tx.installmentTotal > 1 && !tx.installmentGroupId) {
      const groupId = 'parc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const parcelTransactions: Transaction[] = [];

      for (let i = 1; i <= tx.installmentTotal; i++) {
        const parcelDate = getNextMonthDate(tx.date, i - 1);
        parcelTransactions.push({
          ...tx,
          id: `tx-parc-${Date.now()}-${i}`,
          description: `${tx.description} (${i}/${tx.installmentTotal})`,
          date: parcelDate,
          installmentCurrent: i,
          installmentTotal: tx.installmentTotal,
          installmentGroupId: groupId,
          paid: i === 1 ? tx.paid : false,
          createdAt: new Date().toISOString(),
        });
      }

      setTransactions(prev => [...parcelTransactions, ...prev]);

      if (tx.accountId && !tx.creditCardId && tx.paid) {
        setAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount
            };
          }
          if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
            return { ...a, balance: a.balance + tx.amount };
          }
          return a;
        }));
      }
      return;
    }

    // 2. Caso seja Despesa / Receita / Transferência Fixa (Recorrente mensal por 12 meses)
    if (tx.isRecurring && !tx.recurringGroupId) {
      const recurringGroupId = 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const recurringTransactions: Transaction[] = [];

      for (let i = 0; i < 12; i++) {
        const recDate = getNextMonthDate(tx.date, i);
        recurringTransactions.push({
          ...tx,
          id: `tx-rec-${Date.now()}-${i + 1}`,
          date: recDate,
          isRecurring: true,
          recurringPeriod: 'monthly',
          recurringGroupId,
          paid: i === 0 ? tx.paid : false,
          createdAt: new Date().toISOString(),
        });
      }

      setTransactions(prev => [...recurringTransactions, ...prev]);

      if (tx.accountId && !tx.creditCardId && tx.paid) {
        setAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            return {
              ...a,
              balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount
            };
          }
          if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
            return { ...a, balance: a.balance + tx.amount };
          }
          return a;
        }));
      }
      return;
    }

    // 3. Caso padrão: Transação Única
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);

    if (tx.paid && tx.accountId && !tx.creditCardId) {
      setAccounts(prev => prev.map(a => {
        if (a.id === tx.accountId) {
          if (tx.type === 'income') return { ...a, balance: a.balance + tx.amount };
          if (tx.type === 'expense') return { ...a, balance: a.balance - tx.amount };
        }
        if (tx.type === 'transfer' && a.id === tx.destinationAccountId) {
          return { ...a, balance: a.balance + tx.amount };
        }
        return a;
      }));
    }
  };

  const importTransactions = (newTxs: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const formatted: Transaction[] = newTxs.map((tx, idx) => ({
      ...tx,
      id: 'tx-imp-' + Date.now() + '-' + idx,
      createdAt: new Date().toISOString(),
    }));

    setTransactions(prev => [...formatted, ...prev]);

    const accountBalanceDiff: Record<string, number> = {};
    formatted.forEach(tx => {
      if (tx.paid && tx.accountId && !tx.creditCardId) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        accountBalanceDiff[tx.accountId] = (accountBalanceDiff[tx.accountId] || 0) + delta;
      }
    });

    if (Object.keys(accountBalanceDiff).length > 0) {
      setAccounts(prev => prev.map(acc => {
        if (accountBalanceDiff[acc.id]) {
          return { ...acc, balance: acc.balance + accountBalanceDiff[acc.id] };
        }
        return acc;
      }));
    }
  };

  const updateTransaction = (
    id: string,
    updated: Partial<Transaction>,
    mode: 'single' | 'following' | 'all' = 'single'
  ) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    if (mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
      setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
      return;
    }

    if (mode === 'following') {
      if (target.recurringGroupId) {
        setTransactions(prev =>
          prev.map(t => {
            if (t.recurringGroupId === target.recurringGroupId && t.date >= target.date && (!t.paid || t.id === target.id)) {
              return {
                ...t,
                ...updated,
                id: t.id,
                date: t.id === target.id ? (updated.date || t.date) : t.date,
              };
            }
            return t;
          })
        );
      } else if (target.installmentGroupId) {
        setTransactions(prev =>
          prev.map(t => {
            if (
              t.installmentGroupId === target.installmentGroupId &&
              (t.installmentCurrent || 0) >= (target.installmentCurrent || 0) &&
              (!t.paid || t.id === target.id)
            ) {
              return {
                ...t,
                ...updated,
                id: t.id,
                date: t.id === target.id ? (updated.date || t.date) : t.date,
                installmentCurrent: t.installmentCurrent,
                installmentTotal: t.installmentTotal,
              };
            }
            return t;
          })
        );
      }
      return;
    }

    if (mode === 'all') {
      if (target.recurringGroupId) {
        setTransactions(prev =>
          prev.map(t =>
            t.recurringGroupId === target.recurringGroupId
              ? { ...t, ...updated, id: t.id, date: t.id === target.id ? (updated.date || t.date) : t.date }
              : t
          )
        );
      } else if (target.installmentGroupId) {
        setTransactions(prev =>
          prev.map(t =>
            t.installmentGroupId === target.installmentGroupId
              ? {
                  ...t,
                  ...updated,
                  id: t.id,
                  date: t.id === target.id ? (updated.date || t.date) : t.date,
                  installmentCurrent: t.installmentCurrent,
                  installmentTotal: t.installmentTotal,
                }
              : t
          )
        );
      }
    }
  };

  const deleteTransaction = (id: string, mode: 'single' | 'following' | 'all' = 'single') => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    if (mode === 'single' || (!target.recurringGroupId && !target.installmentGroupId)) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    if (mode === 'following') {
      if (target.recurringGroupId) {
        setTransactions(prev =>
          prev.filter(t => !(t.recurringGroupId === target.recurringGroupId && t.date >= target.date && (!t.paid || t.id === target.id)))
        );
      } else if (target.installmentGroupId) {
        setTransactions(prev =>
          prev.filter(
            t =>
              !(
                t.installmentGroupId === target.installmentGroupId &&
                (t.installmentCurrent || 0) >= (target.installmentCurrent || 0) &&
                (!t.paid || t.id === target.id)
              )
          )
        );
      }
      return;
    }

    if (mode === 'all') {
      if (target.recurringGroupId) {
        setTransactions(prev => prev.filter(t => t.recurringGroupId !== target.recurringGroupId));
      } else if (target.installmentGroupId) {
        setTransactions(prev => prev.filter(t => t.installmentGroupId !== target.installmentGroupId));
      }
    }
  };

  // Ações de Tags
  const addTag = (tag: Omit<Tag, 'id' | 'createdAt'>) => {
    const newTag: Tag = {
      ...tag,
      id: 'tag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    setTags(prev => [...prev, newTag]);
  };

  const updateTag = (id: string, updated: Partial<Tag>) => {
    const existing = tags.find(t => t.id === id);
    if (!existing) return;
    setTags(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    // Se o nome mudou, atualizar nas transações existentes
    if (updated.name && updated.name !== existing.name) {
      setTransactions(prev =>
        prev.map(tx => {
          if (!tx.tags || !tx.tags.includes(existing.name)) return tx;
          return {
            ...tx,
            tags: tx.tags.map(t => (t === existing.name ? updated.name! : t)),
          };
        })
      );
    }
  };

  const deleteTag = (id: string) => {
    const existing = tags.find(t => t.id === id);
    if (!existing) return;
    setTags(prev => prev.filter(t => t.id !== id));
    // Remover a tag das transações existentes
    setTransactions(prev =>
      prev.map(tx => {
        if (!tx.tags || !tx.tags.includes(existing.name)) return tx;
        return {
          ...tx,
          tags: tx.tags.filter(t => t !== existing.name),
        };
      })
    );
  };

  // Ações de Contas
  const addAccount = (acc: Omit<Account, 'id' | 'createdAt'>) => {
    const newAcc: Account = {
      ...acc,
      id: 'acc-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, updated: Partial<Account>) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Ações de Cartões
  const addCreditCard = (card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = {
      ...card,
      id: 'card-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCreditCards(prev => [...prev, newCard]);
  };

  const updateCreditCard = (id: string, updated: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  // Ações de Categorias
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now(),
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Ações de Metas (Goals)
  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: 'goal-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updated: Partial<Goal>) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const next = { ...g, ...updated };
        if (next.currentAmount >= next.targetAmount) {
          next.completed = true;
        }
        return next;
      }
      return g;
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = (goalId: string, amount: number, sourceAccountId?: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const newTotal = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newTotal,
          completed: newTotal >= g.targetAmount,
        };
      }
      return g;
    }));

    if (sourceAccountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === sourceAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        return acc;
      }));

      const targetGoal = goals.find(g => g.id === goalId);
      const nowStr = new Date().toISOString().split('T')[0];
      setTransactions(prev => [
        {
          id: 'tx-goal-' + Date.now(),
          description: `Aporte Meta: ${targetGoal ? targetGoal.name : 'Poupança'}`,
          amount: amount,
          date: nowStr,
          type: 'expense',
          categoryId: 'cat-invest-inc',
          accountId: sourceAccountId,
          paid: true,
          tags: ['meta', 'economia'],
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  // Ações Open Finance (Fase 3)
  const connectBank = (institutionId: string, institutionName: string) => {
    const existing = openFinanceConnections.find(c => c.institutionId === institutionId);
    if (existing) {
      setOpenFinanceConnections(prev => prev.map(c => c.institutionId === institutionId ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c));
      return;
    }

    const newConnection: OpenFinanceConnection = {
      id: 'of-conn-' + Date.now(),
      institutionId,
      institutionName,
      status: 'connected',
      lastSyncAt: new Date().toISOString(),
      consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      syncedAccountsCount: 1,
      syncedCardsCount: 1,
      autoSync: true,
      createdAt: new Date().toISOString(),
    };

    setOpenFinanceConnections(prev => [...prev, newConnection]);
  };

  const syncBankConnection = (connectionId: string) => {
    setOpenFinanceConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'syncing' } : c));

    setTimeout(() => {
      const conn = openFinanceConnections.find(c => c.id === connectionId);
      if (!conn) return;

      const targetAccount = accounts.find(a => a.name.toLowerCase().includes(conn.institutionName.toLowerCase())) || accounts[0];
      const newSimulatedTxs = simulateOpenFinanceSyncTransactions(conn.institutionName, targetAccount?.id);

      importTransactions(newSimulatedTxs);

      setOpenFinanceConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c));
    }, 1200);
  };

  const disconnectBank = (connectionId: string) => {
    setOpenFinanceConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  // Exportação e Backup Geral
  const exportDatabaseBackup = (): string => {
    const backupData = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      accounts,
      creditCards,
      categories,
      transactions,
      goals,
      openFinanceConnections,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importDatabaseBackup = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.accounts || !data.transactions) return false;

      setAccounts(data.accounts || []);
      setCreditCards(data.creditCards || []);
      setCategories(data.categories || []);
      setTransactions(data.transactions || []);
      setGoals(data.goals || []);
      setOpenFinanceConnections(data.openFinanceConnections || []);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setGoals(INITIAL_GOALS);
    setOpenFinanceConnections(INITIAL_OPEN_FINANCE_CONNECTIONS);
    setReadAlertIds([]);
  };

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
        toggleTheme,
        isPrivacyMode,
        togglePrivacyMode,
        unreadAlertsCount,
        users,
        currentUser,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        addTransaction,
        importTransactions,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addCategory,
        updateCategory,
        deleteCategory,
        addTag,
        updateTag,
        deleteTag,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        connectBank,
        syncBankConnection,
        disconnectBank,
        exportDatabaseBackup,
        importDatabaseBackup,
        markAlertAsRead,
        markAllAlertsAsRead,
        summary,
        filteredTransactions,
        resetToDefaults,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};


