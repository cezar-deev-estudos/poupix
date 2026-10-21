'use client';

import React, { useState, useEffect } from 'react';
import {
  MobileDashboardCardId,
  MobileDashboardLayoutPreferences,
  DEFAULT_MOBILE_DASHBOARD_LAYOUT,
  ALL_MOBILE_DASHBOARD_CARDS,
  mergeMobileDashboardLayout,
} from '@/types/settings';
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
    if (isOpen && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mobills_mobile_dashboard_layout');
        if (saved) setLayout(mergeMobileDashboardLayout(saved));
      } catch {
        // fallback
      }
    }
  }, [isOpen]);

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
    onSave?.(layout);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
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
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#242937] border border-slate-700/50 hover:border-slate-600 transition-colors select-none"
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
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {cardDef.label}
                    </span>
                  </div>

                  {/* Botões Mover para Cima e para Baixo */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Mover para cima"
                      disabled={isFirst}
                      onClick={() => moveUp(index)}
                      className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Mover para baixo"
                      disabled={isLast}
                      onClick={() => moveDown(index)}
                      className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Botão Salvar */}
        <div className="p-4 border-t border-slate-800 bg-[#1c202a] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvo!</span>
              </>
            ) : (
              <span>Salvar Ordem</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
