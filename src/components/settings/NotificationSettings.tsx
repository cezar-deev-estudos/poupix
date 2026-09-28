'use client';

import React, { useState } from 'react';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/settings';
import { Check } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
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
            </div>
            <button
              type="button"
              onClick={() => togglePref('receiveNotifications')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                prefs.receiveNotifications ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  prefs.receiveNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Alertas financeiros */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold text-white block">Alertas financeiros</span>
              <p className="text-[11px] text-slate-400 max-w-xl">
                Lembretes sobre datas de vencimento, gastos, transferências, pagamentos, desempenho, planejamento mensal e objetivos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => togglePref('financialAlerts')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                prefs.financialAlerts ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  prefs.financialAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-6 flex items-center justify-between border-t border-slate-800/60">
        <div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Notificações salvas com sucesso!
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
