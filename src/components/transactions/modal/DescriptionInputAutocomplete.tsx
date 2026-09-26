'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { FileText, Heart, History } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';

export interface SuggestionItem {
  description: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  accountId?: string;
  creditCardId?: string;
  destinationAccountId?: string;
  accountName?: string;
}

interface DescriptionInputAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: SuggestionItem) => void;
  type?: 'expense' | 'income' | 'creditCard' | 'transfer';
  isFavorite: boolean;
  onToggleFavorite: () => void;
  variant?: DateVariant;
  placeholder?: string;
}

export const DescriptionInputAutocomplete: React.FC<DescriptionInputAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  type = 'expense',
  isFavorite,
  onToggleFavorite,
  variant = 'rose',
  placeholder = 'Descrição',
}) => {
  const { transactions, categories, accounts, creditCards } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obter sugestões de transações anteriores com base no texto digitado
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    const targetType = type === 'creditCard' ? 'expense' : type;

    // Filtrar por tipo e busca textual
    const matches = transactions.filter((tx) => {
      if (tx.type !== targetType) return false;
      if (type === 'creditCard' && !tx.creditCardId) return false;
      if (type === 'expense' && tx.creditCardId) return false;
      return tx.description.toLowerCase().includes(query);
    });

    // Ordenar pelas mais recentes
    const sorted = [...matches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const uniqueMap = new Map<string, SuggestionItem>();

    for (const tx of sorted) {
      const key = `${tx.description.toLowerCase()}-${tx.categoryId}-${tx.accountId || tx.creditCardId || ''}`;
      if (!uniqueMap.has(key)) {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const parentCat = cat?.parentId ? categories.find((c) => c.id === cat.parentId) : null;
        const catLabel = parentCat ? `${parentCat.name} / ${cat?.name}` : cat?.name || 'Geral';

        const acc = accounts.find((a) => a.id === tx.accountId);
        const card = creditCards.find((c) => c.id === tx.creditCardId);
        const accLabel = card ? card.name : acc?.name || 'Conta';

        uniqueMap.set(key, {
          description: tx.description,
          categoryId: tx.categoryId,
          categoryName: catLabel,
          categoryColor: cat?.color || '#10B981',
          accountId: tx.accountId,
          creditCardId: tx.creditCardId,
          destinationAccountId: tx.destinationAccountId,
          accountName: accLabel,
        });
      }

      if (uniqueMap.size >= 6) break;
    }

    return Array.from(uniqueMap.values());
  }, [value, transactions, type, categories, accounts, creditCards]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SuggestionItem) => {
    onChange(item.description);
    onSelectSuggestion(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const getFavoriteColor = () => {
    switch (variant) {
      case 'emerald':
        return 'text-emerald-500 fill-emerald-500';
      case 'cyan':
        return 'text-cyan-400 fill-cyan-400';
      case 'blue':
        return 'text-blue-500 fill-blue-500';
      case 'rose':
      default:
        return 'text-rose-500 fill-rose-500';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Campo de Input + Botão Favorito */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (value.trim().length > 0 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`p-1 transition-colors cursor-pointer ${
            isFavorite ? getFavoriteColor() : 'text-slate-600 hover:text-slate-400'
          }`}
          title="Marcar como favorita"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Dropdown de Sugestões de Autocomplete com Cor e Categoria */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1e2330] border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-scaleUp space-y-1">
          {suggestions.map((item, index) => {
            const isHighlighted = highlightedIndex === index;
            return (
              <button
                key={`${item.description}-${item.categoryId}-${index}`}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isHighlighted
                    ? 'bg-slate-700/70 text-white'
                    : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {/* Ícone de Círculo com a Cor da Categoria */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: item.categoryColor || '#10B981' }}
                />

                {/* Descrição e Subtítulo (Categoria | Conta) */}
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-xs text-white block truncate">
                    {item.description}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                    {item.categoryName} {item.accountName ? `| ${item.accountName}` : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
