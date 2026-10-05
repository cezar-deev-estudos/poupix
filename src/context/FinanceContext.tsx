'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import {
  INITIAL_OPEN_FINANCE_CONNECTIONS,
  simulateOpenFinanceSyncTransactions,
  simulatePendingBankTransactions,
  DEFAULT_SYNC_SETTINGS,
} from '@/lib/openFinance';
import { PendingBankTransaction, OpenFinanceSyncSettings } from '@/types/finance';
import { useAuth } from './AuthContext';
import { useFinanceCloudSync } from '@/hooks/useFinanceCloudSync';
import { transactionManager } from '@/hooks/useTransactionsManager';
import { entityManager } from '@/hooks/useEntityManager';
import { normalizeTransactionsInvoiceDates, getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ensureValidUUID } from '@/lib/supabase/syncService';

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
  pendingBankTransactions: import('@/types/finance').PendingBankTransaction[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  groupByCard: boolean;
  toggleGroupByCard: () => void;
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
  updateBankSyncSettings: (connectionId: string, settings: Partial<import('@/types/finance').OpenFinanceSyncSettings>) => void;
  approveBankTransaction: (pendingId: string, overrides?: Partial<Transaction>) => void;
  discardBankTransaction: (pendingId: string) => void;
  linkBankTransaction: (pendingId: string, existingTxId: string) => void;
  approveAllBankTransactions: () => void;
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
  const [pendingBankTransactions, setPendingBankTransactions] = useState<PendingBankTransaction[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [groupByCard, setGroupByCard] = useState<boolean>(false);
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
      const savedPendingBank = localStorage.getItem(`${userStoragePrefix}pending_bank_txs`);
      const savedPrivacy = localStorage.getItem('mobills_privacy_mode');
      const savedTheme = localStorage.getItem('mobills_theme') as 'dark' | 'light' | null;

      const savedGroupByCard = localStorage.getItem(`${userStoragePrefix}group_by_card`);

      if (user) {
        const authProfile: UserProfile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'admin',
          currency: 'BRL',
          createdAt: user.created_at || new Date().toISOString(),
        };
        const loadedCards: CreditCard[] = savedCards ? JSON.parse(savedCards) : [];
        const rawTxs: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : [];
        const normalizedTxs = normalizeTransactionsInvoiceDates(rawTxs, loadedCards);

        setUsers([authProfile]);
        setCurrentUserId(user.id);
        setAccounts(savedAccounts ? JSON.parse(savedAccounts) : []);
        setCreditCards(loadedCards);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setTags(savedTags ? JSON.parse(savedTags) : INITIAL_TAGS);
        setTransactions(normalizedTxs);
        setGoals(savedGoals ? JSON.parse(savedGoals) : []);
        setOpenFinanceConnections(savedOpenFinance ? JSON.parse(savedOpenFinance) : []);

        if (user.user_metadata?.group_by_card !== undefined) {
          setGroupByCard(Boolean(user.user_metadata.group_by_card));
        } else if (savedGroupByCard !== null) {
          setGroupByCard(JSON.parse(savedGroupByCard));
        }
      } else {
        const loadedCards: CreditCard[] = savedCards ? JSON.parse(savedCards) : INITIAL_CREDIT_CARDS;
        const rawTxs: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : INITIAL_TRANSACTIONS;
        const normalizedTxs = normalizeTransactionsInvoiceDates(rawTxs, loadedCards);

        setUsers(INITIAL_USERS);
        setCurrentUserId(INITIAL_USERS[0]?.id || 'user-cezar');
        setAccounts(savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS);
        setCreditCards(loadedCards);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setTags(savedTags ? JSON.parse(savedTags) : INITIAL_TAGS);
        setTransactions(normalizedTxs);
        setGoals(savedGoals ? JSON.parse(savedGoals) : INITIAL_GOALS);
        setOpenFinanceConnections(savedOpenFinance ? JSON.parse(savedOpenFinance) : INITIAL_OPEN_FINANCE_CONNECTIONS);
        if (savedPendingBank) {
          setPendingBankTransactions(JSON.parse(savedPendingBank));
        }
        if (savedGroupByCard !== null) {
          setGroupByCard(JSON.parse(savedGroupByCard));
        }
      }

      if (savedPendingBank) {
        setPendingBankTransactions(JSON.parse(savedPendingBank));
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
    localStorage.setItem(`${userStoragePrefix}pending_bank_txs`, JSON.stringify(pendingBankTransactions));
    localStorage.setItem(`${userStoragePrefix}group_by_card`, JSON.stringify(groupByCard));
    localStorage.setItem('mobills_privacy_mode', JSON.stringify(isPrivacyMode));
    localStorage.setItem('mobills_theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [accounts, creditCards, categories, tags, transactions, goals, readAlertIds, openFinanceConnections, isPrivacyMode, groupByCard, theme, isInitialized, userStoragePrefix]);

  const toggleGroupByCard = useCallback(async () => {
    const nextVal = !groupByCard;
    setGroupByCard(nextVal);
    try {
      localStorage.setItem(`${userStoragePrefix}group_by_card`, JSON.stringify(nextVal));
      if (user) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.updateUser({
            data: { group_by_card: nextVal }
          });
        }
      }
    } catch (err) {
      console.error('[FinanceContext] Erro ao salvar groupByCard no Supabase:', err);
    }
  }, [groupByCard, user, userStoragePrefix]);

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

  // Referência estável para creditCards para evitar que handleCloudDataLoaded seja recriado a cada sincronização
  const creditCardsRef = useRef(creditCards);
  creditCardsRef.current = creditCards;

  // Tombstones de IDs excluídos recentemente persistidos no localStorage para evitar que buscas em nuvem ressuscitem transações apagadas
  const deletedTransactionIdsRef = useRef<Set<string>>(
    (() => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('mobills_deleted_tx_ids');
          if (saved) return new Set<string>(JSON.parse(saved));
        } catch {}
      }
      return new Set<string>();
    })()
  );

  const handleTransactionDeleted = useCallback((deletedIds: string[]) => {
    deletedIds.forEach(id => {
      deletedTransactionIdsRef.current.add(id);
      deletedTransactionIdsRef.current.add(ensureValidUUID(id));
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'mobills_deleted_tx_ids',
          JSON.stringify(Array.from(deletedTransactionIdsRef.current))
        );
      } catch {}
    }

    // Limpa os tombstones após 30 minutos
    setTimeout(() => {
      deletedIds.forEach(id => {
        deletedTransactionIdsRef.current.delete(id);
        deletedTransactionIdsRef.current.delete(ensureValidUUID(id));
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'mobills_deleted_tx_ids',
            JSON.stringify(Array.from(deletedTransactionIdsRef.current))
          );
        } catch {}
      }
    }, 30 * 60 * 1000);
  }, []);

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
    let currentCards = creditCardsRef.current;
    if (cloudData.accounts !== undefined) setAccounts(cloudData.accounts);
    if (cloudData.creditCards !== undefined) {
      setCreditCards(prevLocalCards => {
        const localStatusMap = new Map<string, Record<string, 'open' | 'closed' | 'paid'>>();
        prevLocalCards.forEach(c => {
          if (c.manualInvoiceStatus) {
            localStatusMap.set(c.id, c.manualInvoiceStatus);
          }
        });
        const mergedCards = (cloudData.creditCards || []).map(cloudCard => {
          const preservedStatus = cloudCard.manualInvoiceStatus || localStatusMap.get(cloudCard.id);
          return {
            ...cloudCard,
            manualInvoiceStatus: preservedStatus,
          };
        });
        currentCards = mergedCards;
        return mergedCards;
      });
    }
    if (cloudData.categories !== undefined && cloudData.categories.length > 0) {
      setCategories(cloudData.categories);
    }
    if (cloudData.tags !== undefined) setTags(cloudData.tags);
    if (cloudData.transactions !== undefined) {
      // Filtra transações que foram excluídas recentemente pelo usuário
      const tombstones = deletedTransactionIdsRef.current;
      const validCloudTxs = cloudData.transactions.filter(t => !tombstones.has(t.id) && !tombstones.has(ensureValidUUID(t.id)));
      const normalizedCloudTxs = normalizeTransactionsInvoiceDates(validCloudTxs, currentCards);

      setTransactions(prevLocalTxs => {
        // Nuvem é referência, e remove transações que já foram excluídas
        const cloudIdSet = new Set<string>();
        normalizedCloudTxs.forEach(t => {
          cloudIdSet.add(t.id);
          cloudIdSet.add(ensureValidUUID(t.id));
        });

        // Mantém apenas transações locais não sincronizadas que NÃO foram excluídas
        const unsyncedLocalTxs = prevLocalTxs.filter(t => {
          if (tombstones.has(t.id) || tombstones.has(ensureValidUUID(t.id))) return false;
          return !cloudIdSet.has(t.id) && !cloudIdSet.has(ensureValidUUID(t.id));
        });

        if (unsyncedLocalTxs.length > 0) {
          return [...unsyncedLocalTxs, ...normalizedCloudTxs];
        }
        return normalizedCloudTxs;
      });
    }
    if (cloudData.goals !== undefined) setGoals(cloudData.goals);
    if (cloudData.openFinanceConnections !== undefined) setOpenFinanceConnections(cloudData.openFinanceConnections);
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
      if (t.creditCardId) {
        const card = creditCards.find(c => c.id === t.creditCardId);
        const { year, month } = getTransactionInvoicePeriod(t, card);
        return year === selectedYear && month === selectedMonth;
      }
      if (!t.date) return false;
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === selectedYear && (tMonth - 1) === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth, creditCards]);

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
        groupByCard,
        toggleGroupByCard,
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
        deleteTransaction: (id, mode = 'single') => transactionManager.deleteTransaction(id, mode, transactions, setTransactions, handleTransactionDeleted, currentUserId),
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
        pendingBankTransactions,
        connectBank: (id, name) => {
          setOpenFinanceConnections(prev => [
            ...prev,
            {
              id: 'of-conn-' + Date.now(),
              institutionId: id,
              institutionName: name,
              status: 'connected',
              lastSyncAt: new Date().toISOString(),
              consentExpiresAt: new Date(Date.now() + 365 * 864e5).toISOString(),
              syncedAccountsCount: 1,
              syncedCardsCount: 1,
              autoSync: true,
              settings: { ...DEFAULT_SYNC_SETTINGS },
              createdAt: new Date().toISOString(),
            },
          ]);
        },
        updateBankSyncSettings: (connId, newSettings) => {
          setOpenFinanceConnections(prev =>
            prev.map(c =>
              c.id === connId
                ? { ...c, settings: { ...(c.settings || DEFAULT_SYNC_SETTINGS), ...newSettings } }
                : c
            )
          );
        },
        syncBankConnection: async id => {
          setOpenFinanceConnections(prev => prev.map(c => (c.id === id ? { ...c, status: 'syncing' } : c)));

          const conn = openFinanceConnections.find(c => c.id === id);
          if (!conn) return;

          const settings = conn.settings || DEFAULT_SYNC_SETTINGS;
          const targetAcc = accounts.find(a => a.name.toLowerCase().includes(conn.institutionName.toLowerCase())) || accounts[0];
          const targetCard = creditCards.find(c => c.name.toLowerCase().includes(conn.institutionName.toLowerCase())) || creditCards[0];

          // Se for uma conexão real Pluggy (id prefixado com 'pluggy-')
          if (conn.institutionId.startsWith('pluggy-')) {
            const rawItemId = conn.institutionId.replace('pluggy-', '');
            try {
              const res = await fetch('/api/openfinance/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  itemId: rawItemId,
                  connectionId: conn.id,
                  institutionName: conn.institutionName,
                  targetAccountId: targetAcc?.id,
                  targetCardId: targetCard?.id,
                }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.pendingTransactions && data.pendingTransactions.length > 0) {
                  if (settings.requireApproval) {
                    setPendingBankTransactions(prev => {
                      const existingIds = new Set(prev.map(p => p.bankTransactionId));
                      const newItems = data.pendingTransactions.filter((p: PendingBankTransaction) => !existingIds.has(p.bankTransactionId));
                      return [...newItems, ...prev];
                    });
                  } else {
                    const toImport = data.pendingTransactions.map((p: PendingBankTransaction) => ({
                      description: p.description,
                      amount: p.amount,
                      date: p.date,
                      type: p.type,
                      categoryId: p.suggestedCategoryId,
                      accountId: p.accountId,
                      creditCardId: p.creditCardId,
                      paid: true,
                      notes: `Importado via Open Finance (${p.institutionName})`,
                      tags: ['open-finance', 'pluggy'],
                    }));
                    transactionManager.importTransactions(toImport, setTransactions, setAccounts);
                  }
                }

                if (settings.syncBalance && typeof data.updatedBalance === 'number' && targetAcc) {
                  setAccounts(prev =>
                    prev.map(a => (a.id === targetAcc.id ? { ...a, balance: data.updatedBalance } : a))
                  );
                }
              }
            } catch (err) {
              console.error('[OpenFinance Real Sync Error]:', err);
            }

            setOpenFinanceConnections(prev =>
              prev.map(c => (c.id === id ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c))
            );
            return;
          }

          // Fallback para conexões simuladas
          setTimeout(() => {
            if (settings.requireApproval) {
              const pendingItems = simulatePendingBankTransactions(conn, targetAcc?.id, targetCard?.id);
              setPendingBankTransactions(prev => {
                const existingIds = new Set(prev.map(p => p.bankTransactionId));
                const newItems = pendingItems.filter(p => !existingIds.has(p.bankTransactionId));
                return [...newItems, ...prev];
              });
            } else {
              const simTxs = simulateOpenFinanceSyncTransactions(conn.institutionName, targetAcc?.id);
              transactionManager.importTransactions(simTxs, setTransactions, setAccounts);
            }

            if (settings.syncBalance && targetAcc) {
              setAccounts(prev =>
                prev.map(a =>
                  a.id === targetAcc.id
                    ? { ...a, balance: a.balance + (Math.floor(Math.random() * 50) + 10) }
                    : a
                )
              );
            }

            setOpenFinanceConnections(prev =>
              prev.map(c => (c.id === id ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c))
            );
          }, 1200);
        },
        approveBankTransaction: (pendingId, overrides) => {
          const item = pendingBankTransactions.find(p => p.id === pendingId);
          if (!item) return;

          const newTx: Omit<Transaction, 'id' | 'createdAt'> = {
            description: overrides?.description || item.description,
            amount: overrides?.amount !== undefined ? overrides.amount : item.amount,
            date: overrides?.date || item.date,
            type: overrides?.type || item.type,
            categoryId: overrides?.categoryId || item.suggestedCategoryId,
            accountId: overrides?.accountId || item.accountId,
            creditCardId: overrides?.creditCardId || item.creditCardId,
            paid: true,
            notes: `Importado via Open Finance (${item.institutionName})`,
            tags: ['open-finance', 'conciliado'],
          };

          transactionManager.addTransaction(newTx, setTransactions, setAccounts);
          setPendingBankTransactions(prev => prev.filter(p => p.id !== pendingId));
        },
        discardBankTransaction: pendingId => {
          setPendingBankTransactions(prev => prev.filter(p => p.id !== pendingId));
        },
        linkBankTransaction: (pendingId, existingTxId) => {
          const item = pendingBankTransactions.find(p => p.id === pendingId);
          if (!item) return;

          // Marca a transação manual existente como conciliada via nota/tag
          transactionManager.updateTransaction(
            existingTxId,
            {
              paid: true,
              notes: `Conciliado com extrato Open Finance (${item.institutionName})`,
            },
            'single',
            transactions,
            setTransactions
          );

          setPendingBankTransactions(prev => prev.filter(p => p.id !== pendingId));
        },
        approveAllBankTransactions: () => {
          if (pendingBankTransactions.length === 0) return;

          const txsToImport: Omit<Transaction, 'id' | 'createdAt'>[] = pendingBankTransactions.map(item => ({
            description: item.description,
            amount: item.amount,
            date: item.date,
            type: item.type,
            categoryId: item.suggestedCategoryId,
            accountId: item.accountId,
            creditCardId: item.creditCardId,
            paid: true,
            notes: `Importado via Open Finance (${item.institutionName})`,
            tags: ['open-finance', 'conciliado'],
          }));

          transactionManager.importTransactions(txsToImport, setTransactions, setAccounts);
          setPendingBankTransactions([]);
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
