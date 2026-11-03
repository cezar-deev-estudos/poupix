'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  DashboardCardId,
  DashboardLayoutPreferences,
  DEFAULT_DASHBOARD_LAYOUT,
  ALL_DASHBOARD_CARDS,
  mergeDashboardLayout,
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
import { Check, ChevronUp, ChevronDown, ArrowLeftRight, GripVertical } from 'lucide-react';

interface DashboardCardsSettingsProps {
  onSave?: (layout: DashboardLayoutPreferences) => void;
}

export const DashboardCardsSettings: React.FC<DashboardCardsSettingsProps> = ({ onSave }) => {
  const { user } = useAuth();

  const [layout, setLayout] = useState<DashboardLayoutPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mobills_dashboard_layout');
        if (saved) return mergeDashboardLayout(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_DASHBOARD_LAYOUT;
  });

  const [mobileLayout, setMobileLayout] = useState<MobileDashboardLayoutPreferences>(() => {
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

  const [draggedItem, setDraggedItem] = useState<{ id: DashboardCardId; sourceCol: 'left' | 'right' } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedMobileSuccess, setSavedMobileSuccess] = useState(false);

  // Carregar configurações reais do Supabase (user_preferences)
  useEffect(() => {
    if (!user?.id) return;
    loadUserPreferencesFromSupabase(user.id).then(cloudPrefs => {
      if (cloudPrefs?.dashboard_layout_desktop) {
        try {
          const raw = typeof cloudPrefs.dashboard_layout_desktop === 'string'
            ? cloudPrefs.dashboard_layout_desktop
            : JSON.stringify(cloudPrefs.dashboard_layout_desktop);
          setLayout(mergeDashboardLayout(raw));
        } catch {}
      }
      if (cloudPrefs?.dashboard_layout_mobile) {
        try {
          const raw = typeof cloudPrefs.dashboard_layout_mobile === 'string'
            ? cloudPrefs.dashboard_layout_mobile
            : JSON.stringify(cloudPrefs.dashboard_layout_mobile);
          setMobileLayout(mergeMobileDashboardLayout(raw));
        } catch {}
      }
    });
  }, [user?.id]);

  const toggleCard = (id: DashboardCardId) => {
    setLayout(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [id]: !prev.enabled[id],
      },
    }));
    setSavedSuccess(false);
  };

  const moveUp = (column: 'left' | 'right', index: number) => {
    if (index === 0) return;
    setLayout(prev => {
      const list = column === 'left' ? [...prev.leftColumn] : [...prev.rightColumn];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return {
        ...prev,
        [column === 'left' ? 'leftColumn' : 'rightColumn']: list,
      };
    });
    setSavedSuccess(false);
  };

  const moveDown = (column: 'left' | 'right', index: number) => {
    const maxIndex = (column === 'left' ? layout.leftColumn.length : layout.rightColumn.length) - 1;
    if (index === maxIndex) return;
    setLayout(prev => {
      const list = column === 'left' ? [...prev.leftColumn] : [...prev.rightColumn];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return {
        ...prev,
        [column === 'left' ? 'leftColumn' : 'rightColumn']: list,
      };
    });
    setSavedSuccess(false);
  };

  const moveToOtherColumn = (currentCol: 'left' | 'right', id: DashboardCardId) => {
    setLayout(prev => {
      const sourceList = currentCol === 'left' ? [...prev.leftColumn] : [...prev.rightColumn];
      const targetList = currentCol === 'left' ? [...prev.rightColumn] : [...prev.leftColumn];

      const filteredSource = sourceList.filter(item => item !== id);
      targetList.push(id);

      return {
        ...prev,
        [currentCol === 'left' ? 'leftColumn' : 'rightColumn']: filteredSource,
        [currentCol === 'left' ? 'rightColumn' : 'leftColumn']: targetList,
      };
    });
    setSavedSuccess(false);
  };

  const handleDragStart = (id: DashboardCardId, sourceCol: 'left' | 'right') => {
    setDraggedItem({ id, sourceCol });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCol: 'left' | 'right', targetIndex?: number) => {
    if (!draggedItem) return;

    setLayout(prev => {
      let newLeft = [...prev.leftColumn];
      let newRight = [...prev.rightColumn];

      if (draggedItem.sourceCol === 'left') {
        newLeft = newLeft.filter(id => id !== draggedItem.id);
      } else {
        newRight = newRight.filter(id => id !== draggedItem.id);
      }

      if (targetCol === 'left') {
        if (typeof targetIndex === 'number') {
          newLeft.splice(targetIndex, 0, draggedItem.id);
        } else {
          newLeft.push(draggedItem.id);
        }
      } else {
        if (typeof targetIndex === 'number') {
          newRight.splice(targetIndex, 0, draggedItem.id);
        } else {
          newRight.push(draggedItem.id);
        }
      }

      return {
        ...prev,
        leftColumn: newLeft,
        rightColumn: newRight,
      };
    });

    setDraggedItem(null);
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_dashboard_layout', JSON.stringify(layout));
    }
    if (user?.id) {
      upsertUserPreferencesToSupabase(user.id, {
        dashboard_layout_desktop: layout,
      });
    }
    onSave?.(layout);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const renderCardItem = (id: DashboardCardId, column: 'left' | 'right', index: number) => {
    const cardDef = ALL_DASHBOARD_CARDS[id];
    if (!cardDef) return null;
    const isChecked = Boolean(layout.enabled[id]);
    const maxIndex = (column === 'left' ? layout.leftColumn.length : layout.rightColumn.length) - 1;

    return (
      <div
        key={id}
        draggable
        onDragStart={() => handleDragStart(id, column)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(column, index)}
        className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#2a2d36] hover:bg-[#323642] border border-slate-700/40 transition-all cursor-grab active:cursor-grabbing select-none"
      >
        <div
          onClick={() => toggleCard(id)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
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

        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Mover para cima"
            disabled={index === 0}
            onClick={() => moveUp(column, index)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Mover para baixo"
            disabled={index === maxIndex}
            onClick={() => moveDown(column, index)}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={column === 'left' ? 'Mover para cards da direita' : 'Mover para cards da esquerda'}
            onClick={() => moveToOtherColumn(column, id)}
            className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const toggleMobileCard = (id: MobileDashboardCardId) => {
    setMobileLayout(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [id]: !prev.enabled[id],
      },
    }));
    setSavedMobileSuccess(false);
  };

  const moveMobileUp = (index: number) => {
    if (index === 0) return;
    setMobileLayout(prev => {
      const list = [...prev.order];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return { ...prev, order: list };
    });
    setSavedMobileSuccess(false);
  };

  const moveMobileDown = (index: number) => {
    if (index >= mobileLayout.order.length - 1) return;
    setMobileLayout(prev => {
      const list = [...prev.order];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return { ...prev, order: list };
    });
    setSavedMobileSuccess(false);
  };

  const handleSaveMobile = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_mobile_dashboard_layout', JSON.stringify(mobileLayout));
    }
    if (user?.id) {
      upsertUserPreferencesToSupabase(user.id, {
        dashboard_layout_mobile: mobileLayout,
      });
    }
    setSavedMobileSuccess(true);
    setTimeout(() => setSavedMobileSuccess(false), 3000);
  };

  return (
    <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Quais cards você deseja que apareça no dashboard?
        </h3>
        <span className="text-[11px] text-purple-400 font-semibold bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
          💡 Dica: Arraste os cards ou use as setas para reorganizar
        </span>
      </div>

      {/* --- VISÃO MOBILE: Lista única de cards reordenável --- */}
      <div className="block md:hidden space-y-3">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300 font-medium">
          Ordem de exibição dos cards no celular: use as setas para subir ou descer e marque os que deseja exibir.
        </div>

        <div className="space-y-2">
          {mobileLayout.order.map((id, index) => {
            const cardDef = ALL_MOBILE_DASHBOARD_CARDS[id];
            if (!cardDef) return null;
            const isChecked = Boolean(mobileLayout.enabled[id]);
            const isFirst = index === 0;
            const isLast = index === mobileLayout.order.length - 1;

            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#2a2d36] border border-slate-700/40"
              >
                <div
                  onClick={() => toggleMobileCard(id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
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
                    onClick={() => moveMobileUp(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Mover para baixo"
                    disabled={isLast}
                    onClick={() => moveMobileDown(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
          {savedMobileSuccess && (
            <span className="text-xs text-purple-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Salvo no Supabase!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveMobile}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all active:scale-95"
          >
            Salvar Layout Mobile no Supabase
          </button>
        </div>
      </div>

      {/* --- VISÃO DESKTOP: Duas Colunas (Esquerda / Direita) --- */}
      <div className="hidden md:grid grid-cols-2 gap-6">
        {/* Coluna Esquerda */}
        <div
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('left')}
          className="space-y-3 p-4 rounded-3xl bg-[#18191d]/60 border border-slate-800/80 min-h-[340px]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cards da Esquerda
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {layout.leftColumn.length} cards
            </span>
          </div>

          <div className="space-y-2">
            {layout.leftColumn.map((id, index) => renderCardItem(id, 'left', index))}
            {layout.leftColumn.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Arraste cards para cá
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita */}
        <div
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('right')}
          className="space-y-3 p-4 rounded-3xl bg-[#18191d]/60 border border-slate-800/80 min-h-[340px]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cards da Direita
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {layout.rightColumn.length} cards
            </span>
          </div>

          <div className="space-y-2">
            {layout.rightColumn.map((id, index) => renderCardItem(id, 'right', index))}
            {layout.rightColumn.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Arraste cards para cá
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-end gap-4 pt-4 border-t border-slate-800/60">
        {savedSuccess && (
          <span className="text-xs text-purple-400 flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4" /> Layout salvo no Supabase com sucesso!
          </span>
        )}
        <button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          Salvar Layout no Supabase
        </button>
      </div>
    </div>
  );
};
