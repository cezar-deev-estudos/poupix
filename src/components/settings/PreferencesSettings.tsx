'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AppPreferences, DEFAULT_APP_PREFERENCES } from '@/types/settings';
import { Check, ChevronDown } from 'lucide-react';

export const PreferencesSettings: React.FC = () => {
  const { theme, toggleTheme } = useFinance();

  const [prefs, setPrefs] = useState<AppPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobills_app_preferences');
      if (saved) {
        try {
          return { ...DEFAULT_APP_PREFERENCES, ...JSON.parse(saved) };
        } catch {
          // fallback
        }
      }
    }
    return { ...DEFAULT_APP_PREFERENCES, theme };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_app_preferences', JSON.stringify(prefs));
    }
    if (prefs.theme !== theme) {
      toggleTheme();
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Idioma */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">Idioma</label>
          <div className="relative">
            <select
              value={prefs.language}
              onChange={e => {
                setPrefs(prev => ({ ...prev, language: e.target.value }));
                setSavedSuccess(false);
              }}
              className="w-full bg-transparent border-b border-slate-700 py-2.5 pr-8 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="pt-BR" className="bg-[#1f2128] text-white">Português Brasil</option>
              <option value="en-US" className="bg-[#1f2128] text-white">English (US)</option>
              <option value="es-ES" className="bg-[#1f2128] text-white">Español</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Moeda */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">Moeda</label>
          <div className="relative">
            <select
              value={prefs.currency}
              onChange={e => {
                setPrefs(prev => ({ ...prev, currency: e.target.value }));
                setSavedSuccess(false);
              }}
              className="w-full bg-transparent border-b border-slate-700 py-2.5 pr-8 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="BRL" className="bg-[#1f2128] text-white">Brazil (R$)</option>
              <option value="USD" className="bg-[#1f2128] text-white">United States ($)</option>
              <option value="EUR" className="bg-[#1f2128] text-white">Euro (€)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Aparência */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">Aparência</label>
          <div className="relative">
            <select
              value={prefs.theme}
              onChange={e => {
                const newTheme = e.target.value as 'dark' | 'light';
                setPrefs(prev => ({ ...prev, theme: newTheme }));
                setSavedSuccess(false);
              }}
              className="w-full bg-transparent border-b border-slate-700 py-2.5 pr-8 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              <option value="dark" className="bg-[#1f2128] text-white">Modo escuro</option>
              <option value="light" className="bg-[#1f2128] text-white">Modo claro</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="pt-6 flex items-center justify-between border-t border-slate-800/60">
        <div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Alterações salvas com sucesso!
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          SALVAR ALTERAÇÕES
        </button>
      </div>
    </div>
  );
};
