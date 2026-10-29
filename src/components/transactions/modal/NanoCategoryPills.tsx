'use client';

import React from 'react';
import { NanoCategory } from '@/types/finance';

interface NanoCategoryPillsProps {
  nanoCategories?: NanoCategory[];
  currentDescription: string;
  onSelectNano: (name: string) => void;
  variant?: 'rose' | 'cyan' | 'emerald';
}

export const NanoCategoryPills: React.FC<NanoCategoryPillsProps> = ({
  nanoCategories,
  currentDescription,
  onSelectNano,
  variant = 'rose',
}) => {
  if (!nanoCategories || nanoCategories.length === 0) return null;

  const activeStyles = {
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-medium',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-medium',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium',
  }[variant];

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
      <span className="text-[10px] text-slate-500 font-medium">Nano:</span>
      {nanoCategories.map(nano => {
        const isSelected =
          currentDescription.trim().toLowerCase() === nano.name.trim().toLowerCase();

        return (
          <button
            key={nano.id}
            type="button"
            onClick={() => onSelectNano(nano.name)}
            className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer border ${
              isSelected
                ? activeStyles
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title={`Preencher descrição com "${nano.name}"`}
          >
            {nano.name}
          </button>
        );
      })}
    </div>
  );
};

