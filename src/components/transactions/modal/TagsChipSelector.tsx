'use client';

import React, { useState } from 'react';
import { Tag as TagIcon, X, Plus, Sparkles } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface TagsChipSelectorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const TagsChipSelector: React.FC<TagsChipSelectorProps> = ({ tags, onChange }) => {
  const { tags: availableTags, addTag } = useFinance();
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd || inputValue;
    const trimmed = raw.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
      // Se não existir no cadastro global de tags, cadastrar automaticamente
      if (!availableTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        addTag({
          name: trimmed,
          color: '#F59E0B',
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  // Sugestões de tags não selecionadas
  const suggestedTags = availableTags.filter(
    t => !tags.includes(t.name) && (inputValue ? t.name.toLowerCase().includes(inputValue.toLowerCase()) : true)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <TagIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Tags & Etiquetas</span>
        </div>
      </div>

      {/* Caixa de Entrada e Chips Selecionados */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-2xl min-h-[42px]">
        {tags.map(tag => {
          const registered = availableTags.find(t => t.name === tag);
          const color = registered?.color || '#F59E0B';
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}60`,
                color: color,
              }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="p-0.5 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="text"
            placeholder={tags.length === 0 ? "Adicionar tag (Enter)..." : "Adicionar..."}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none px-1"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => handleAddTag()}
              className="p-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sugestões Rápidas de Tags */}
      {suggestedTags.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] text-slate-500 block">Sugestões rápidas:</span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {suggestedTags.slice(0, 8).map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleAddTag(st.name)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: st.color || '#F59E0B' }}
                />
                #{st.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
