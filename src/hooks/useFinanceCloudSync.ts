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

  // Armazena um fingerprint dos últimos dados enviados com sucesso para nunca reenviar dados idênticos
  const lastSyncedFingerprintRef = useRef<string>('');

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
    // Bloqueia se ainda estamos dentro do cooldown pós-sync (10 segundos)
    if (Date.now() < blockRemoteFetchUntilRef.current) return false;
    // Throttle mínimo de 30 segundos entre buscas bem-sucedidas para economizar cota do Supabase
    if (Date.now() - lastSyncTimestampRef.current < 30000) return false;
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

  // 1. Carregamento inicial + Realtime sob demanda + Revalidação prudente por visibilidade
  useEffect(() => {
    if (!user) {
      isFirstSyncDone.current = false;
      return;
    }

    // Carregamento inicial forçado apenas ao autenticar
    loadCloudDataRef.current(true);

    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      // Inscrição no Realtime por tabela de transações com debounce de 3s
      channel = supabase
        .channel(`finance-sync-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => {
            // Se houver alteração local em fila ou sincronização ativa/recente, ignora o Realtime
            if (canFetchRef.current(false)) {
              if (realtimeFetchTimeoutRef.current) clearTimeout(realtimeFetchTimeoutRef.current);
              realtimeFetchTimeoutRef.current = setTimeout(() => {
                if (canFetchRef.current(false)) {
                  loadCloudDataRef.current();
                }
              }, 3000);
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CloudSync] Realtime conectado');
          }
        });
    }

    // Revalidação com a nuvem quando o app voltar ao primeiro plano (ex: alternar abas ou desbloquear celular)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastSync = Date.now() - lastSyncTimestampRef.current;
        if (timeSinceLastSync > 10000 && canFetchRef.current(false)) {
          loadCloudDataRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (realtimeFetchTimeoutRef.current) clearTimeout(realtimeFetchTimeoutRef.current);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  // 2. Debounced Auto-Sync ao alterar dados locais com verificação de fingerprint (1500ms)
  useEffect(() => {
    if (!user || !isInitialized || !isFirstSyncDone.current) return;
    // Não dispara sync se estamos aplicando dados vindos da nuvem
    if (isApplyingRemoteData.current) return;

    // Gera um resumo leve (fingerprint) dos dados locais para saber se realmente mudou algo
    const categoriesBudgetSummary = categories
      .map(c => `${c.id}:${c.budgetLimit || 0}:${JSON.stringify(c.monthlyBudgets || {})}`)
      .join(';');
    const currentFingerprint = `${accounts.length}-${creditCards.length}-${categories.length}-${tags.length}-${transactions.length}-${goals.length}-${openFinanceConnections.length}-${categoriesBudgetSummary}-${transactions.slice(0, 10).map(t => `${t.id}:${t.amount}:${t.paid}`).join('|')}`;

    // Se o fingerprint for idêntico ao último sincronizado com sucesso, não faz nada
    if (lastSyncedFingerprintRef.current === currentFingerprint) {
      return;
    }

    hasPendingLocalChangesRef.current = true;
    if (realtimeFetchTimeoutRef.current) {
      clearTimeout(realtimeFetchTimeoutRef.current);
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce de 1500ms para acumular edições e não bombardear o banco
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
        lastSyncedFingerprintRef.current = currentFingerprint;
        // Cooldown de 10s após envio para impedir qualquer re-fetch de eco imediato
        blockRemoteFetchUntilRef.current = Date.now() + 10000;
        console.log('[CloudSync] Dados sincronizados com a nuvem com sucesso');
      } catch (err) {
        console.error('[CloudSync] Falha no auto-sync:', err);
      } finally {
        isSyncingToCloud.current = false;
        hasPendingLocalChangesRef.current = false;
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, isInitialized, currentUser, accounts, creditCards, categories, tags, transactions, goals, openFinanceConnections]);
}
