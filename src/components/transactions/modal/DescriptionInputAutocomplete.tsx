'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { NanoCategory } from '@/types/finance';
import { FileText, Heart, ChevronDown } from 'lucide-react';
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

interface NanoSuggestion {
  nano: NanoCategory;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
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
  nanoCategories?: NanoCategory[];
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
  nanoCategories,
}) => {
  const { transactions, categories, accounts, creditCards } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [isNanoOpen, setIsNanoOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Todos os nanos de todas as categorias (para busca e listagem global)
  const allNanos = useMemo<NanoSuggestion[]>(() => {
    const result: NanoSuggestion[] = [];
    categories.forEach(cat => {
      if (!cat.nanoCategories?.length) return;
      const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
      const label = parent ? `${parent.name} / ${cat.name}` : cat.name;
      cat.nanoCategories.forEach(nano => {
        result.push({
          nano,
          categoryId: cat.id,
          categoryName: label,
          categoryColor: cat.color || '#10B981',
        });
      });
    });
    return result;
  }, [categories]);

  // Nanos filtrados pelo texto digitado
  const nanoSuggestions = useMemo<NanoSuggestion[]>(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return allNanos.filter(ns => ns.nano.name.toLowerCase().includes(query)).slice(0, 5);
  }, [value, allNanos]);

  // Nanos para exibição no dropdown da seta (subcategoria selecionada tem prioridade)
  const nanoListForDropdown = useMemo<NanoSuggestion[]>(() => {
    if (nanoCategories && nanoCategories.length > 0) {
      // Prioriza nanos da subcategoria selecionada no topo
      const selectedIds = new Set(nanoCategories.map(n => n.id));
      const selected = allNanos.filter(ns => selectedIds.has(ns.nano.id));
      const others = allNanos.filter(ns => !selectedIds.has(ns.nano.id));
      return [...selected, ...others];
    }
    return allNanos;
  }, [allNanos, nanoCategories]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsNanoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar nano dropdown quando o autocomplete de histórico abre
  useEffect(() => {
    if (isOpen) setIsNanoOpen(false);
  }, [isOpen]);

  // Sugestões de histórico de transações
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    const targetType = type === 'creditCard' ? 'expense' : type;

    const matches = transactions.filter((tx) => {
      if (tx.type !== targetType) return false;
      if (type === 'creditCard' && !tx.creditCardId) return false;
      if (type === 'expense' && tx.creditCardId) return false;
      return tx.description.toLowerCase().includes(query);
    });

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
      setIsNanoOpen(false);
    }
  };

  const handleSelect = (item: SuggestionItem) => {
    onChange(item.description);
    onSelectSuggestion(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSelectNano = (ns: NanoSuggestion) => {
    onChange(ns.nano.name);
    onSelectSuggestion({
      description: ns.nano.name,
      categoryId: ns.categoryId,
      categoryName: ns.categoryName,
      categoryColor: ns.categoryColor,
    });
    setIsNanoOpen(false);
    setIsOpen(false);
  };

  const getFavoriteColor = () => {
    switch (variant) {
      case 'emerald': return 'text-emerald-500 fill-emerald-500';
      case 'cyan': return 'text-cyan-400 fill-cyan-400';
      case 'blue': return 'text-blue-500 fill-blue-500';
      case 'rose':
      default: return 'text-rose-500 fill-rose-500';
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Verifica se o valor atual corresponde a uma nano-categoria
  const matchedNano = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;
    return allNanos.find(ns => ns.nano.name.trim().toLowerCase() === trimmed) || null;
  }, [value, allNanos]);

  // Dropdown unificado ao digitar: nanos primeiro (se houver), depois histórico
  const showUnifiedDropdown = isOpen && !isNanoOpen && (nanoSuggestions.length > 0 || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Campo de Input + Botões */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <FileText className="w-4 h-4 text-slate-500 shrink-0" />

        {/* Indicador visual de Nano-Categoria selecionada */}
        {matchedNano && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50 animate-scaleUp"
            title={`Nano-categoria: ${matchedNano.nano.name} (${matchedNano.categoryName})`}
          />
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setIsNanoOpen(false);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (value.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />

        {/* Botão Nano — SEMPRE visível */}
        <button
          type="button"
          onClick={() => {
            setIsNanoOpen(prev => !prev);
            setIsOpen(false);
          }}
          className={`p-1 transition-colors cursor-pointer ${
            isNanoOpen ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'
          }`}
          title="Ver despesas frequentes (nano-categorias)"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isNanoOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Botão Favorito */}
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

      {/* Dropdown ao clicar na seta — lista TODAS as nanos */}
      {isNanoOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1e2330] border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 max-h-52 overflow-y-auto animate-scaleUp">
          {nanoListForDropdown.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-3">
              Nenhuma nano-categoria cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-1">
              {nanoListForDropdown.map((ns, i) => {
                const isSelected = value.trim().toLowerCase() === ns.nano.name.trim().toLowerCase();
                const isFromSelected = nanoCategories?.some(n => n.id === ns.nano.id);
                return (
                  <button
                    key={`${ns.nano.id}-${i}`}
                    type="button"
                    onClick={() => handleSelectNano(ns)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isFromSelected ? '#34d399' : ns.categoryColor }}
                    />
                    <span className="flex-1 truncate">{ns.nano.name}</span>
                    <span className="text-[10px] text-slate-500 truncate shrink-0 max-w-[80px]">
                      {ns.categoryName}
                    </span>
                    {ns.nano.budgetLimit && ns.nano.budgetLimit > 0 && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatCurrency(ns.nano.budgetLimit)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dropdown unificado ao digitar: nanos + histórico em um único painel */}
      {showUnifiedDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1e2330] border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-scaleUp space-y-1">

          {/* Seção de Nano-Categorias (despesas frequentes) */}
          {nanoSuggestions.length > 0 && (
            <>
              <p className="text-[10px] text-emerald-500/70 px-3 pt-1 pb-0.5 font-medium uppercase tracking-wide">
                Despesas frequentes
              </p>
              {nanoSuggestions.map((ns, i) => (
                <button
                  key={`nano-${ns.nano.id}-${i}`}
                  type="button"
                  onClick={() => handleSelectNano(ns)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-emerald-500/10 transition-all cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="flex-1 truncate font-semibold text-white">{ns.nano.name}</span>
                  <span className="text-[10px] text-slate-500 truncate shrink-0 max-w-[90px]">
                    {ns.categoryName}
                  </span>
                  {ns.nano.budgetLimit && ns.nano.budgetLimit > 0 && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatCurrency(ns.nano.budgetLimit)}
                    </span>
                  )}
                </button>
              ))}
              {suggestions.length > 0 && (
                <div className="border-t border-slate-700/50 my-1" />
              )}
            </>
          )}

          {/* Seção de Histórico de Transações */}
          {suggestions.map((item, index) => {
            const isHighlighted = highlightedIndex === index;
            return (
              <button
                key={`${item.description}-${item.categoryId}-${index}`}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isHighlighted ? 'bg-slate-700/70 text-white' : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.categoryColor || '#10B981' }}
                />
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
