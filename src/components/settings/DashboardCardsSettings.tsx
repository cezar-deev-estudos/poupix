'use client';

import React, { useState } from 'react';
import {
  DashboardCardId,
  DashboardLayoutPreferences,
  DEFAULT_DASHBOARD_LAYOUT,
  ALL_DASHBOARD_CARDS,
  mergeDashboardLayout,
} from '@/types/settings';
import { Check, ChevronUp, ChevronDown, ArrowLeftRight, GripVertical } from 'lucide-react';

interface DashboardCardsSettingsProps {
  onSave?: (layout: DashboardLayoutPreferences) => void;
}

export const DashboardCardsSettings: React.FC<DashboardCardsSettingsProps> = ({ onSave }) => {
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

  const [draggedItem, setDraggedItem] = useState<{ id: DashboardCardId; sourceCol: 'left' | 'right' } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  // Mover para cima
  const moveUp = (column: 'left' | 'right', index: number) => {
    if (index === 0) return;
    setLayout(prev => {
      const list = column === 'left' ? [...prev.leftColumn] : [...prev.rightColumn];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return column === 'left' ? { ...prev, leftColumn: list } : { ...prev, rightColumn: list };
    });
    setSavedSuccess(false);
  };

  // Mover para baixo
  const moveDown = (column: 'left' | 'right', index: number) => {
    const listLen = column === 'left' ? layout.leftColumn.length : layout.rightColumn.length;
    if (index >= listLen - 1) return;
    setLayout(prev => {
      const list = column === 'left' ? [...prev.leftColumn] : [...prev.rightColumn];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return column === 'left' ? { ...prev, leftColumn: list } : { ...prev, rightColumn: list };
    });
    setSavedSuccess(false);
  };

  // Mover de um lado para o outro
  const moveToOtherColumn = (sourceCol: 'left' | 'right', id: DashboardCardId) => {
    setLayout(prev => {
      if (sourceCol === 'left') {
        return {
          ...prev,
          leftColumn: prev.leftColumn.filter(cardId => cardId !== id),
          rightColumn: [...prev.rightColumn, id],
        };
      } else {
        return {
          ...prev,
          rightColumn: prev.rightColumn.filter(cardId => cardId !== id),
          leftColumn: [...prev.leftColumn, id],
        };
      }
    });
    setSavedSuccess(false);
  };

  // Drag & Drop
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

  return (
    <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Quais cards você deseja que apareça no dashboard?
        </h3>
        <span className="text-[11px] text-purple-400 font-semibold bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
          💡 Dica: Arraste os cards ou use as setas para reorganizar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna Esquerda */}
        <div
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('left')}
          className="space-y-3 min-h-[220px] p-2 rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/20"
        >
          <div className="text-center mb-2">
            <h4 className="text-xs font-semibold text-slate-300">Coluna Esquerda (Desktop)</h4>
            <span className="text-[10px] text-slate-500">Exibidos no topo da coluna</span>
          </div>
          {layout.leftColumn.map((id, index) => renderCardItem(id, 'left', index))}
          {layout.leftColumn.length === 0 && (
            <div className="h-28 flex items-center justify-center text-xs text-slate-500">
              Nenhum card nesta coluna
            </div>
          )}
        </div>

        {/* Coluna Direita */}
        <div
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('right')}
          className="space-y-3 min-h-[220px] p-2 rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/20"
        >
          <div className="text-center mb-2">
            <h4 className="text-xs font-semibold text-slate-300">Coluna Direita (Desktop)</h4>
            <span className="text-[10px] text-slate-500">Exibidos na segunda coluna</span>
          </div>
          {layout.rightColumn.map((id, index) => renderCardItem(id, 'right', index))}
          {layout.rightColumn.length === 0 && (
            <div className="h-28 flex items-center justify-center text-xs text-slate-500">
              Nenhum card nesta coluna
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-800/60">
        <div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4" /> Layout e ordem dos cards salvos com sucesso!
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          SALVAR
        </button>
      </div>
    </div>
  );
};
