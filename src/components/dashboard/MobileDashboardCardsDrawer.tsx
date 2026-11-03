'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  MobileDashboardCardId,
  MobileDashboardLayoutPreferences,
  DEFAULT_MOBILE_DASHBOARD_LAYOUT,
  ALL_MOBILE_DASHBOARD_CARDS,
  mergeMobileDashboardLayout,
} from '@/types/settings';
import {
  loadUserPreferencesFromSupabase,
  upsertUserPreferencesToSupabase,
} from '@/lib/supabase/syncService';
import { X, Check, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface MobileDashboardCardsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (layout: MobileDashboardLayoutPreferences) => void;
}

export const MobileDashboardCardsDrawer: React.FC<MobileDashboardCardsDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();

  const [layout, setLayout] = useState<MobileDashboardLayoutPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mobills_mobile_dashboard_layout');
        if (saved) return mergeMobileDashboardLayout(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_MOBILE_DASHBOARD_LAYOUT;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (user?.id) {
      loadUserPreferencesFromSupabase(user.id).then(cloudPrefs => {
        if (cloudPrefs?.dashboard_layout_mobile) {
          try {
            const raw = typeof cloudPrefs.dashboard_layout_mobile === 'string'
              ? cloudPrefs.dashboard_layout_mobile
              : JSON.stringify(cloudPrefs.dashboard_layout_mobile);
            setLayout(mergeMobileDashboardLayout(raw));
            return;
          } catch {}
        }
      });
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mobills_mobile_dashboard_layout');
        if (saved) setLayout(mergeMobileDashboardLayout(saved));
      } catch {
        // fallback
      }
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const toggleCard = (id: MobileDashboardCardId) => {
    setLayout(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [id]: !prev.enabled[id],
      },
    }));
    setSavedSuccess(false);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setLayout(prev => {
      const newOrder = [...prev.order];
      const temp = newOrder[index - 1];
      newOrder[index - 1] = newOrder[index];
      newOrder[index] = temp;
      return { ...prev, order: newOrder };
    });
    setSavedSuccess(false);
  };

  const moveDown = (index: number) => {
    if (index >= layout.order.length - 1) return;
    setLayout(prev => {
      const newOrder = [...prev.order];
      const temp = newOrder[index + 1];
      newOrder[index + 1] = newOrder[index];
      newOrder[index] = temp;
      return { ...prev, order: newOrder };
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_mobile_dashboard_layout', JSON.stringify(layout));
    }
    if (user?.id) {
      upsertUserPreferencesToSupabase(user.id, {
        dashboard_layout_mobile: layout,
      });
    }
    onSave?.(layout);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false),
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#1c202a] rounded-t-3xl border-t border-slate-700/80 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        {/* Header do Drawer */}
        <div className="p-4 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Gerenciar tela inicial</h3>
            <p className="text-xs text-slate-400">Reorganize ou oculte cards no celular</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Cards com Scroll */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300 font-medium">
            💡 Dica: Use as setas para alterar a ordem dos cards na tela do celular e marque os que deseja exibir.
          </div>

          <div className="space-y-2 pt-1">
            {layout.order.map((id, index) => {
              const cardDef = ALL_MOBILE_DASHBOARD_CARDS[id];
              if (!cardDef) return null;
              const isChecked = Boolean(layout.enabled[id]);
              const isFirst = index === 0;
              const isLast = index === layout.order.length - 1;

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#2a2d36] border border-slate-700/40"
                >
                  <div
                    onClick={() => toggleCard(id)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                        isChecked
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-slate-500 bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium text-slate-200 truncate">{cardDef.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Mover para cima"
                      disabled={isFirst}
                      onClick={() => moveUp(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Mover para baixo"
                      disabled={isLast}
                      onClick={() => moveDown(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer com Botão de Salvar */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-[#18191d]/90 flex items-center justify-between gap-3">
          {savedSuccess && (
            <span className="text-xs text-purple-400 font-medium flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> Salvo no Supabase!
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-full text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all active:scale-95"
          >
            Salvar Layout no Supabase
          </button>
        </div>
      </div>
    </div>
  );
};
