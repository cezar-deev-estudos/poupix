'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedTransactionFilter } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import {
  loadSavedFiltersFromSupabase,
  upsertSavedFilterToSupabase,
  deleteSavedFilterFromSupabase,
} from '@/lib/supabase/syncService';

export function useSavedFilters() {
  const { user, isDemoMode } = useAuth();
  const [savedFilters, setSavedFilters] = useState<SavedTransactionFilter[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = user
    ? `mobills_user_${user.id}_saved_tx_filters`
    : isDemoMode
    ? 'mobills_demo_saved_tx_filters'
    : 'mobills_saved_tx_filters';

  useEffect(() => {
    let isCancelled = false;

    const loadFilters = async () => {
      try {
        // 1. Se usuário autenticado, carregar diretamente da tabela oficial saved_transaction_filters
        if (user?.id) {
          const cloudFilters = await loadSavedFiltersFromSupabase(user.id);
          if (!isCancelled && cloudFilters && cloudFilters.length > 0) {
            setSavedFilters(cloudFilters);
            localStorage.setItem(storageKey, JSON.stringify(cloudFilters));
            setIsLoaded(true);
            return;
          }
        }

        // 2. Fallback de cache local ou demo
        const data = localStorage.getItem(storageKey);
        if (data && !isCancelled) {
          setSavedFilters(JSON.parse(data));
        } else if (!isCancelled) {
          setSavedFilters([]);
        }
      } catch (e) {
        console.error('[useSavedFilters] Erro ao carregar filtros salvos:', e);
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    };

    loadFilters();

    return () => {
      isCancelled = true;
    };
  }, [storageKey, user]);

  const saveFilter = useCallback(
    (filter: Omit<SavedTransactionFilter, 'id' | 'createdAt'>): SavedTransactionFilter => {
      const newFilter: SavedTransactionFilter = {
        ...filter,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      setSavedFilters((prev) => {
        const updated = [newFilter, ...prev];
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.error('[useSavedFilters] Erro ao salvar filtro no storage local:', e);
        }

        // Persistir na tabela do Supabase
        if (user?.id) {
          upsertSavedFilterToSupabase(user.id, newFilter).catch((err) => {
            console.error('[useSavedFilters] Erro ao sincronizar filtro com Supabase:', err);
          });
        }

        return updated;
      });

      return newFilter;
    },
    [storageKey, user]
  );

  const deleteFilter = useCallback(
    (id: string) => {
      setSavedFilters((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.error('[useSavedFilters] Erro ao excluir filtro do storage local:', e);
        }

        // Excluir da tabela do Supabase
        if (user?.id) {
          deleteSavedFilterFromSupabase(user.id, id).catch((err) => {
            console.error('[useSavedFilters] Erro ao remover filtro no Supabase:', err);
          });
        }

        return updated;
      });
    },
    [storageKey, user]
  );

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    isLoaded,
  };
}
