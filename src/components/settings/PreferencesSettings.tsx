'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { AppPreferences, DEFAULT_APP_PREFERENCES } from '@/types/settings';
import { loadUserPreferencesFromSupabase, upsertUserPreferencesToSupabase } from '@/lib/supabase/syncService';
import { Check, ChevronDown } from 'lucide-react';

export const PreferencesSettings: React.FC = () => {
  const { theme, toggleTheme } = useFinance();
  const { user } = useAuth();

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

  // Carregar do Supabase se o usuário estiver logado
  useEffect(() => {
    if (!user?.id) return;
    loadUserPreferencesFromSupabase(user.id).then(cloudPrefs => {
      if (cloudPrefs) {
        setPrefs(prev => ({
          ...prev,
          theme: (cloudPrefs.theme as any) || prev.theme,
          language: cloudPrefs.language || prev.language,
          currency: cloudPrefs.currency || prev.currency,
        }));
      }
    });
  }, [user?.id]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_app_preferences', JSON.stringify(prefs));
    }
    if (user?.id) {
      upsertUserPreferencesToSupabase(user.id, {
        theme: prefs.theme,
        language: prefs.language,
        currency: prefs.currency,
      });
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
              className="w-full bg-[#18191d] border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (United States)</option>
              <option value="es-ES">Español</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Moeda */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">Moeda Principal</label>
          <div className="relative">
            <select
              value={prefs.currency}
              onChange={e => {
                setPrefs(prev => ({ ...prev, currency: e.target.value }));
                setSavedSuccess(false);
              }}
              className="w-full bg-[#18191d] border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Tema */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">Aparência do Sistema</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setPrefs(prev => ({ ...prev, theme: 'dark' }));
                setSavedSuccess(false);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl border text-sm font-medium transition-all ${
                prefs.theme === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18191d] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Dark Theme (Padrão)
            </button>
            <button
              type="button"
              onClick={() => {
                setPrefs(prev => ({ ...prev, theme: 'light' }));
                setSavedSuccess(false);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl border text-sm font-medium transition-all ${
                prefs.theme === 'light'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18191d] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Light Theme
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800/60">
        {savedSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4" /> Preferências salvas com sucesso no Supabase!
          </span>
        )}
        <button
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          Salvar Preferências
        </button>
      </div>
    </div>
  );
};
