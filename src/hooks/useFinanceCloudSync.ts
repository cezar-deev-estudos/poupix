'use client';

import { useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
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
  const isApplyingRemoteData = useRef(false);
  const isSyncingToCloud = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimestampRef = useRef<number>(0);
  const hasPendingLocalChangesRef = useRef<boolean>(false);

  // Função centralizada para carregar os dados mais recentes do Supabase
  const loadCloudData = useCallback(async (force: boolean = false) => {
    if (!user) return;
    // Se há alterações locais pendentes de envio ou uma gravação em curso, ignora fetch remoto concorrente
    if (!force && (hasPendingLocalChangesRef.current || isSyncingToCloud.current || syncTimeoutRef.current !== null)) {
      return;
    }
    try {
      const cloudData = await fetchAllFromSupabase(user.id);
      if (cloudData) {
        // Verifica novamente se não houve novas alterações locais enquanto a request estava em voo
        if (!force && (hasPendingLocalChangesRef.current || isSyncingToCloud.current || syncTimeoutRef.current !== null)) {
          return;
        }
        isApplyingRemoteData.current = true;
        onCloudDataLoaded(cloudData);
        isFirstSyncDone.current = true;
        lastSyncTimestampRef.current = Date.now();
        // Reseta a flag após o ciclo de renderização
        setTimeout(() => {
          isApplyingRemoteData.current = false;
        }, 1000);
      }
    } catch (err) {
      console.error('[CloudSync] Erro ao buscar dados da nuvem:', err);
    }
  }, [user, onCloudDataLoaded]);

  // 1. Carregamento inicial da Nuvem e Realtime Channel Subscriptions
  useEffect(() => {
    if (!user) {
      isFirstSyncDone.current = false;
      return;
    }

    loadCloudData(true);

    // Inscrição em Tempo Real (Supabase Realtime) para refletir instantaneamente alterações do Desktop no Celular
    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel(`realtime-finance-sync-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` },
          () => {
            // Ao receber qualquer evento de inserção, alteração ou deleção remota, recarrega apenas se não estivermos gravando
            if (!isSyncingToCloud.current && !hasPendingLocalChangesRef.current && syncTimeoutRef.current === null) {
              loadCloudData();
            }
          }
        )
        .subscribe();
    }

    // 2. Revalidação automática ao voltar para o app (desbloquear celular ou alternar abas)
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastSync = Date.now() - lastSyncTimestampRef.current;
        // Evita chamadas duplicadas se já sincronizou há menos de 3 segundos
        if (timeSinceLastSync > 3000 && !isSyncingToCloud.current && !hasPendingLocalChangesRef.current && syncTimeoutRef.current === null) {
          loadCloudData();
        }
      }
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    // 3. Polling de segurança a cada 45 segundos quando a janela estiver ativa
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !isSyncingToCloud.current && !hasPendingLocalChangesRef.current && syncTimeoutRef.current === null) {
        loadCloudData();
      }
    }, 45000);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
      clearInterval(intervalId);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, loadCloudData]);

  // 4. Debounced Auto-Sync para Nuvem ao alterar dados locais (apenas quando não é atualização remota)
  useEffect(() => {
    if (!user || !isInitialized || !isFirstSyncDone.current) return;
    if (isApplyingRemoteData.current) return;

    hasPendingLocalChangesRef.current = true;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      syncTimeoutRef.current = null;
      isSyncingToCloud.current = true;
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
        lastSyncTimestampRef.current = Date.now();
        hasPendingLocalChangesRef.current = false;
      } catch (err) {
        console.error('[CloudSync] Falha no auto-sync:', err);
      } finally {
        isSyncingToCloud.current = false;
      }
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, isInitialized, currentUser, accounts, creditCards, categories, tags, transactions, goals, openFinanceConnections]);
}

