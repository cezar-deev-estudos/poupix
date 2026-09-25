'use client';

import { Account, CreditCard, Category, Tag, Goal, OpenFinanceConnection, Transaction } from '@/types/finance';
import { deleteEntityFromSupabase } from '@/lib/supabase/syncService';

export interface EntityManagerActions {
  // Contas
  addAccount: (acc: Omit<Account, 'id' | 'createdAt'>, setAccounts: React.Dispatch<React.SetStateAction<Account[]>>) => void;
  updateAccount: (id: string, updated: Partial<Account>, setAccounts: React.Dispatch<React.SetStateAction<Account[]>>) => void;
  deleteAccount: (id: string, setAccounts: React.Dispatch<React.SetStateAction<Account[]>>) => void;

  // Cartões
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>, setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>) => void;
  updateCreditCard: (id: string, updated: Partial<CreditCard>, setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>) => void;
  deleteCreditCard: (id: string, setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>) => void;

  // Categorias
  addCategory: (cat: Omit<Category, 'id'>, setCategories: React.Dispatch<React.SetStateAction<Category[]>>) => void;
  updateCategory: (id: string, updated: Partial<Category>, setCategories: React.Dispatch<React.SetStateAction<Category[]>>) => void;
  deleteCategory: (id: string, setCategories: React.Dispatch<React.SetStateAction<Category[]>>) => void;

  // Tags
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>, setTags: React.Dispatch<React.SetStateAction<Tag[]>>) => void;
  updateTag: (
    id: string,
    updated: Partial<Tag>,
    tags: Tag[],
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  ) => void;
  deleteTag: (
    id: string,
    tags: Tag[],
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
  ) => void;

  // Metas
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>, setGoals: React.Dispatch<React.SetStateAction<Goal[]>>) => void;
  updateGoal: (id: string, updated: Partial<Goal>, setGoals: React.Dispatch<React.SetStateAction<Goal[]>>) => void;
  deleteGoal: (id: string, setGoals: React.Dispatch<React.SetStateAction<Goal[]>>) => void;
}

export const entityManager: EntityManagerActions = {
  addAccount: (acc, setAccounts) => {
    const newAcc: Account = { ...acc, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setAccounts(prev => [...prev, newAcc]);
  },
  updateAccount: (id, updated, setAccounts) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)));
  },
  deleteAccount: (id, setAccounts) => {
    deleteEntityFromSupabase('accounts', id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  },

  addCreditCard: (card, setCreditCards) => {
    const newCard: CreditCard = { ...card, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setCreditCards(prev => [...prev, newCard]);
  },
  updateCreditCard: (id, updated, setCreditCards) => {
    setCreditCards(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  },
  deleteCreditCard: (id, setCreditCards) => {
    deleteEntityFromSupabase('credit_cards', id);
    setCreditCards(prev => prev.filter(c => c.id !== id));
  },

  addCategory: (cat, setCategories) => {
    const newCat: Category = { ...cat, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCat]);
  },
  updateCategory: (id, updated, setCategories) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  },
  deleteCategory: (id, setCategories) => {
    deleteEntityFromSupabase('categories', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  },

  addTag: (tag, setTags) => {
    const newTag: Tag = { ...tag, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTags(prev => [...prev, newTag]);
  },
  updateTag: (id, updated, tags, setTags, setTransactions) => {
    const existing = tags.find(t => t.id === id);
    if (!existing) return;
    setTags(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    if (updated.name && updated.name !== existing.name) {
      setTransactions(prev =>
        prev.map(tx => {
          if (!tx.tags || !tx.tags.includes(existing.name)) return tx;
          return { ...tx, tags: tx.tags.map(t => (t === existing.name ? updated.name! : t)) };
        })
      );
    }
  },
  deleteTag: (id, tags, setTags, setTransactions) => {
    const existing = tags.find(t => t.id === id);
    if (!existing) return;
    setTags(prev => prev.filter(t => t.id !== id));
    setTransactions(prev =>
      prev.map(tx => {
        if (!tx.tags || !tx.tags.includes(existing.name)) return tx;
        return { ...tx, tags: tx.tags.filter(t => t !== existing.name) };
      })
    );
  },

  addGoal: (goal, setGoals) => {
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setGoals(prev => [...prev, newGoal]);
  },
  updateGoal: (id, updated, setGoals) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === id) {
          const next = { ...g, ...updated };
          if (next.currentAmount >= next.targetAmount) next.completed = true;
          return next;
        }
        return g;
      })
    );
  },
  deleteGoal: (id, setGoals) => {
    deleteEntityFromSupabase('goals', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  },
};
