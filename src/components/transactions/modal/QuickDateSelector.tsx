'use client';

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

export type DateVariant = 'rose' | 'emerald' | 'cyan' | 'blue';

interface QuickDateSelectorProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  variant?: DateVariant;
}

export const QuickDateSelector: React.FC<QuickDateSelectorProps> = ({
  value,
  onChange,
  variant = 'rose',
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isCustom = !isToday && !isYesterday;

  const getActiveStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20';
      case 'cyan':
        return 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20';
      case 'blue':
        return 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20';
      case 'rose':
      default:
        return 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20';
    }
  };

  const activeStyles = getActiveStyles();
  const inactiveStyles = 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800';

  const formatCustomLabel = (dateStr: string) => {
    if (!dateStr) return 'Outros...';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  };

  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="text-slate-500 p-1">
        <Calendar className="w-4 h-4" />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onChange(todayStr)}
          className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
            isToday ? activeStyles : inactiveStyles
          }`}
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={() => onChange(yesterdayStr)}
          className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
            isYesterday ? activeStyles : inactiveStyles
          }`}
        >
          Ontem
        </button>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
            className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
              isCustom ? activeStyles : inactiveStyles
            }`}
          >
            <span>{isCustom ? formatCustomLabel(value) : 'Outros...'}</span>
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={value}
            onChange={e => e.target.value && onChange(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
};
