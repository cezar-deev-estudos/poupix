'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedTransactionFilter } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

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
    try {
      // 1. Prioriza dados do Supabase se o usuário estiver autenticado
      if (user?.user_metadata?.saved_tx_filters && Array.isArray(user.user_metadata.saved_tx_filters)) {
        setSavedFilters(user.user_metadata.saved_tx_filters);
        // Atualiza cache local
        localStorage.setItem(storageKey, JSON.stringify(user.user_metadata.saved_tx_filters));
      } else {
        const data = localStorage.getItem(storageKey);
        if (data) {
          setSavedFilters(JSON.parse(data));
        } else {
          setSavedFilters([]);
        }
      }
    } catch (e) {
      console.error('[useSavedFilters] Erro ao carregar filtros salvos:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, user]);

  const saveFilter = useCallback(
    (filter: Omit<SavedTransactionFilter, 'id' | 'createdAt'>): SavedTransactionFilter => {
      const newFilter: SavedTransactionFilter = {
        ...filter,
        id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      setSavedFilters((prev) => {
        const updated = [newFilter, ...prev];
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.error('[useSavedFilters] Erro ao salvar filtro no storage local:', e);
        }

        // Persistir no Supabase de forma assíncrona
        if (user) {
          const supabase = getSupabaseClient();
          if (supabase) {
            supabase.auth.updateUser({
              data: { saved_tx_filters: updated },
            }).catch((err) => {
              console.error('[useSavedFilters] Erro ao sincronizar filtro com Supabase:', err);
            });
          }
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

        // Persistir no Supabase de forma assíncrona
        if (user) {
          const supabase = getSupabaseClient();
          if (supabase) {
            supabase.auth.updateUser({
              data: { saved_tx_filters: updated },
            }).catch((err) => {
              console.error('[useSavedFilters] Erro ao atualizar remoção de filtro no Supabase:', err);
            });
          }
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
