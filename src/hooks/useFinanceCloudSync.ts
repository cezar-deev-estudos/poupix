'use client';

import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { fetchAllFromSupabase, syncAllToSupabase } from '@/lib/supabase/syncService';
import { Account, CreditCard, Category, Transaction, Goal, OpenFinanceConnection, UserProfile, Tag } from '@/types/finance';

interface UseFinanceCloudSyncProps {
  user: User | null;
  currentUser: UserProfile;
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  goals: Goal[];
  openFinanceConnections: OpenFinanceConnection[];
  isInitialized: boolean;
  onCloudDataLoaded: (data: {
    accounts?: Account[];
    creditCards?: CreditCard[];
    categories?: Category[];
    tags?: Tag[];
    transactions?: Transaction[];
    goals?: Goal[];
    openFinanceConnections?: OpenFinanceConnection[];
  }) => void;
}

export function useFinanceCloudSync({
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
  onCloudDataLoaded,
}: UseFinanceCloudSyncProps) {
  const isFirstSyncDone = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carregamento inicial da Nuvem quando o usuário faz login
  useEffect(() => {
    if (!user) {
      isFirstSyncDone.current = false;
      return;
    }

    let isMounted = true;

    async function loadCloudData() {
      try {
        const cloudData = await fetchAllFromSupabase(user!.id);
        if (isMounted && cloudData) {
          onCloudDataLoaded(cloudData);
          isFirstSyncDone.current = true;
        }
      } catch (err) {
        console.error('[CloudSync] Erro ao buscar dados da nuvem:', err);
      }
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Debounced Auto-Sync para Nuvem ao alterar dados locais
  useEffect(() => {
    if (!user || !isInitialized) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncAllToSupabase({
          currentUser,
          accounts,
          creditCards,
          categories,
          tags,
          transactions,
          goals,
          openFinanceConnections,
        });
      } catch (err) {
        console.error('[CloudSync] Falha no auto-sync:', err);
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, isInitialized, accounts, creditCards, categories, tags, transactions, goals, openFinanceConnections]);
}
