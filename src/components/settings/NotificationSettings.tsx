'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/settings';
import { loadUserPreferencesFromSupabase, upsertUserPreferencesToSupabase } from '@/lib/supabase/syncService';
import { Check } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobills_notification_preferences');
      if (saved) {
        try {
          return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Carregar do Supabase se o usuário estiver logado
  useEffect(() => {
    if (!user?.id) return;
    loadUserPreferencesFromSupabase(user.id).then(cloudPrefs => {
      if (cloudPrefs) {
        setPrefs(prev => ({
          ...prev,
          receiveNotifications: cloudPrefs.receive_notifications ?? prev.receiveNotifications,
          financialAlerts: cloudPrefs.financial_alerts ?? prev.financialAlerts,
        }));
      }
    });
  }, [user?.id]);

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_notification_preferences', JSON.stringify(prefs));
    }
    if (user?.id) {
      upsertUserPreferencesToSupabase(user.id, {
        receive_notifications: prefs.receiveNotifications,
        financial_alerts: prefs.financialAlerts,
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
      <div>
        <h4 className="text-sm font-bold text-slate-200 mb-6">Email</h4>

        <div className="space-y-6">
          {/* Receber notificações */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-white block">Receber notificações</span>
              <span className="text-xs text-slate-400 mt-1 block">
                Receba resumos periódicos e atualizações do sistema por email.
              </span>
            </div>
            <button
              type="button"
              onClick={() => togglePref('receiveNotifications')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                prefs.receiveNotifications ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.receiveNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Alertas de Vencimento e Limites */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-white block">Alertas Financeiros</span>
              <span className="text-xs text-slate-400 mt-1 block">
                Notificações de contas a vencer, metas e limites de orçamento estourados.
              </span>
            </div>
            <button
              type="button"
              onClick={() => togglePref('financialAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                prefs.financialAlerts ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.financialAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800/60">
        {savedSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4" /> Configurações salvas no Supabase!
          </span>
        )}
        <button
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          Salvar Notificações
        </button>
      </div>
    </div>
  );
};
