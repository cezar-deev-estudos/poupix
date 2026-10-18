'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedTransactionFilter } from '@/types/finance';
import { useAuth } from '@/context/AuthContext';

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
      const data = localStorage.getItem(storageKey);
      if (data) {
        setSavedFilters(JSON.parse(data));
      } else {
        setSavedFilters([]);
      }
    } catch (e) {
      console.error('[useSavedFilters] Erro ao carregar filtros salvos:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

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
          console.error('[useSavedFilters] Erro ao salvar filtro:', e);
        }
        return updated;
      });

      return newFilter;
    },
    [storageKey]
  );

  const deleteFilter = useCallback(
    (id: string) => {
      setSavedFilters((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.error('[useSavedFilters] Erro ao excluir filtro:', e);
        }
        return updated;
      });
    },
    [storageKey]
  );

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    isLoaded,
  };
}
