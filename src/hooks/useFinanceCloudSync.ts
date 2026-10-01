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
  // Timestamp até o qual o loadCloudData deve ser bloqueado após um sync local
  const blockRemoteFetchUntilRef = useRef<number>(0);

  // Mantém referência sempre fresca do callback para evitar re-criação de loadCloudData
  const onCloudDataLoadedRef = useRef(onCloudDataLoaded);
  onCloudDataLoadedRef.current = onCloudDataLoaded;

  // Verifica se é seguro carregar dados da nuvem agora
  const canFetchFromCloud = useCallback((force: boolean): boolean => {
    if (force) return true;
    // Bloqueia se há alterações locais em fila ou gravação em andamento
    if (hasPendingLocalChangesRef.current) return false;
    if (isSyncingToCloud.current) return false;
    if (syncTimeoutRef.current !== null) return false;
    // Bloqueia se ainda estamos dentro do cooldown pós-sync
    if (Date.now() < blockRemoteFetchUntilRef.current) return false;
    return true;
  }, []);

  // Função centralizada para carregar os dados mais recentes do Supabase
  const loadCloudData = useCallback(async (force: boolean = false) => {
    if (!user) return;
    if (!canFetchFromCloud(force)) return;

    try {
      const cloudData = await fetchAllFromSupabase(user.id);
      if (!cloudData) return;

      // Verifica novamente após o await (pode ter iniciado uma edição local durante o fetch)
      if (!canFetchFromCloud(force)) return;

      isApplyingRemoteData.current = true;
      onCloudDataLoadedRef.current(cloudData);
      isFirstSyncDone.current = true;
      lastSyncTimestampRef.current = Date.now();

      // Libera a flag após o React aplicar as atualizações de estado
      setTimeout(() => {
        isApplyingRemoteData.current = false;
      }, 500);
    } catch (err) {
      console.error('[CloudSync] Erro ao buscar dados da nuvem:', err);
      isApplyingRemoteData.current = false;
    }
  }, [user, canFetchFromCloud]);

  // Mantém loadCloudData e canFetchFromCloud em ref para o listener e timers
  const loadCloudDataRef = useRef(loadCloudData);
  loadCloudDataRef.current = loadCloudData;
  const canFetchRef = useRef(canFetchFromCloud);
  canFetchRef.current = canFetchFromCloud;

  // Referência para cancelar timeout de busca por Realtime
  const realtimeFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carregamento inicial + Realtime + Revalidação por visibilidade (apenas 1x por usuário)
  useEffect(() => {
    if (!user) {
      isFirstSyncDone.current = false;
      return;
    }

    // Carregamento inicial forçado ao logar
    loadCloudDataRef.current(true);

    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      // Inscrição no Realtime por tabela de transações
      channel = supabase
        .channel(`finance-sync-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => {
            // Se houver alteração local em fila ou sincronização ativa, ignorar o Realtime
            if (canFetchRef.current(false)) {
              if (realtimeFetchTimeoutRef.current) clearTimeout(realtimeFetchTimeoutRef.current);
              realtimeFetchTimeoutRef.current = setTimeout(() => {
                if (canFetchRef.current(false)) {
                  loadCloudDataRef.current();
                }
              }, 1200);
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CloudSync] Realtime conectado com sucesso');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('[CloudSync] Erro no canal Realtime — usando polling como fallback');
          }
        });
    }

    // Revalidação ao retornar para a aba (mobile/desktop)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastSync = Date.now() - lastSyncTimestampRef.current;
        if (timeSinceLastSync > 5000 && canFetchRef.current(false)) {
          loadCloudDataRef.current();
        }
      }
    };

    const handleWindowFocus = () => {
      const timeSinceLastSync = Date.now() - lastSyncTimestampRef.current;
      if (timeSinceLastSync > 5000 && canFetchRef.current(false)) {
        loadCloudDataRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Polling de segurança a cada 60s
    const pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && canFetchRef.current(false)) {
        loadCloudDataRef.current();
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(pollingInterval);
      if (realtimeFetchTimeoutRef.current) clearTimeout(realtimeFetchTimeoutRef.current);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  // 2. Debounced Auto-Sync ao alterar dados locais (rápido: 400ms)
  useEffect(() => {
    if (!user || !isInitialized || !isFirstSyncDone.current) return;
    // Não dispara sync se estamos aplicando dados vindos da nuvem
    if (isApplyingRemoteData.current) return;

    hasPendingLocalChangesRef.current = true;
    // Cancela qualquer busca remota pendente do Realtime para não atropelar a edição local
    if (realtimeFetchTimeoutRef.current) {
      clearTimeout(realtimeFetchTimeoutRef.current);
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Sincronização rápida (400ms) para salvar no banco quase instantaneamente
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
        // Cooldown de 4s após sync bem-sucedido
        blockRemoteFetchUntilRef.current = Date.now() + 4000;
        console.log('[CloudSync] Dados sincronizados com a nuvem com sucesso');
      } catch (err) {
        console.error('[CloudSync] Falha no auto-sync:', err);
      } finally {
        isSyncingToCloud.current = false;
        hasPendingLocalChangesRef.current = false;
      }
    }, 400);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, isInitialized, currentUser, accounts, creditCards, categories, tags, transactions, goals, openFinanceConnections]);
}
