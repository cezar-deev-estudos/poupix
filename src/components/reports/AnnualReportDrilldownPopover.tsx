'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getEffectiveTransactionDate } from '@/lib/invoiceHelpers';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, CreditCard as CardIcon, Wallet, CheckCircle2, Clock, FileText, GripHorizontal } from 'lucide-react';

export interface PopoverAnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface DrilldownPopoverTarget {
  parentCategoryName?: string;
  subcategoryName?: string;
  nanoName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  monthName?: string;
  transactions: Transaction[];
  totalAmount: number;
  anchorRect?: PopoverAnchorRect;
}

interface AnnualReportDrilldownPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  target: DrilldownPopoverTarget | null;
  onEditTransaction?: (tx: Transaction) => void;
}

export const AnnualReportDrilldownPopover: React.FC<AnnualReportDrilldownPopoverProps> = ({
  isOpen,
  onClose,
  target,
  onEditTransaction,
}) => {
  const { accounts, creditCards } = useFinance();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Estado para suporte a arrastar (drag and drop)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialOffsetX: number; initialOffsetY: number }>({
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  // Reseta o offset sempre que o popover abre para uma nova célula ou fecha
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [isOpen, target?.anchorRect?.top, target?.anchorRect?.left]);

  // Listeners globais de movimentação do mouse para arrasto contínuo
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setDragOffset({
        x: dragStartRef.current.initialOffsetX + dx,
        y: dragStartRef.current.initialOffsetY + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    // Apenas botão esquerdo
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: dragOffset.x,
      initialOffsetY: dragOffset.y,
    };
  };

  // Fechar com tecla Escape ou clique fora
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Transações ordenadas por data
  const sortedTransactions = useMemo(() => {
    if (!target) return [];
    return [...target.transactions].sort((a, b) => {
      const cardA = creditCards.find(c => c.id === a.creditCardId);
      const cardB = creditCards.find(c => c.id === b.creditCardId);
      const dateA = getEffectiveTransactionDate(a, cardA);
      const dateB = getEffectiveTransactionDate(b, cardB);
      return dateB.localeCompare(dateA);
    });
  }, [target, creditCards]);

  // Cálculo da posição flutuante com ancoragem e clamping anti-corte na viewport
  const popoverStyle = useMemo(() => {
    const popoverWidth = 380;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const padding = 16;

    if (!target?.anchorRect) {
      return {
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`,
      };
    }

    const { top, bottom, left, right } = target.anchorRect;
    const itemCount = target.transactions.length;
    // Com itens compactados em ~50px cada + header/resumo/footer (~105px)
    // 10 itens ocupam cerca de 600px.
    const isScrollable = itemCount > 10;
    const itemsToShow = Math.min(itemCount, 10);
    const estimatedHeight = Math.min(
      Math.max(160, 105 + itemsToShow * 50),
      Math.max(260, viewportHeight - padding * 2)
    );

    // Posição horizontal padrão centrada na célula
    let baseLeft = left + (right - left) / 2 - popoverWidth / 2;

    // Posição vertical inicial:
    // Se a célula está na metade inferior da tela, abre preferencialmente para cima
    const spaceBelow = viewportHeight - bottom - padding;
    const spaceAbove = top - padding;

    let baseTop: number;
    if (spaceBelow >= estimatedHeight + 8) {
      baseTop = bottom + 8;
    } else if (spaceAbove >= estimatedHeight + 8) {
      baseTop = top - estimatedHeight - 8;
    } else {
      // Se não couber inteiro nem acima nem abaixo, posiciona de modo a ficar visível
      baseTop = Math.max(padding, (viewportHeight - estimatedHeight) / 2);
    }

    // Aplica o deslocamento do arrasto manual (dragOffset)
    let finalLeft = baseLeft + dragOffset.x;
    let finalTop = baseTop + dragOffset.y;

    // Blindagem de viewport: nunca permite que o popover vaze para fora da tela
    if (finalLeft + popoverWidth > viewportWidth - padding) {
      finalLeft = viewportWidth - popoverWidth - padding;
    }
    if (finalLeft < padding) {
      finalLeft = padding;
    }

    if (finalTop + estimatedHeight > viewportHeight - padding) {
      finalTop = Math.max(padding, viewportHeight - estimatedHeight - padding);
    }
    if (finalTop < padding) {
      finalTop = padding;
    }

    return {
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
    };
  }, [target?.anchorRect, target?.transactions.length, dragOffset]);

  if (!isOpen || !target) return null;

  const title = target.nanoName || target.subcategoryName || target.parentCategoryName || 'Lançamentos';
  const subtitleHierarchy = [
    target.parentCategoryName,
    target.subcategoryName && target.subcategoryName !== target.parentCategoryName ? target.subcategoryName : null,
    target.nanoName ? target.nanoName : null,
  ].filter(Boolean).join(' › ');

  return (
    <div className="fixed inset-0 z-50 pointer-events-none animate-fadeIn">
      {/* Popover Card Flutuante (sem escurecer a tela) */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        className="fixed pointer-events-auto w-[370px] max-w-[92vw] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-left ring-1 ring-white/10"
      >
        {/* Cabeçalho Compacto e Arrastável */}
        <div
          onMouseDown={handleDragStart}
          className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-slate-950"
          title="Clique e arraste para mover a caixa"
        >
          <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: `${target.categoryColor || '#14b8a6'}25`, color: target.categoryColor || '#14b8a6' }}
            >
              <CategoryIcon name={target.categoryIcon || 'tag'} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium truncate" title={subtitleHierarchy}>
                {subtitleHierarchy}
              </div>
              <h4 className="text-sm font-bold text-white truncate" title={title}>
                {title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="p-1 text-slate-500 hover:text-slate-300" title="Arrastar">
              <GripHorizontal className="w-4 h-4" />
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha Resumo: Período e Valor Total */}
        <div className="px-3.5 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full text-[10.5px]">
            {target.monthName || 'Período'}
          </span>
          <div className="text-right">
            <span className="font-bold text-white tabular-nums text-sm">
              {formatCurrency(target.totalAmount)}
            </span>
            <span className="text-[10px] text-slate-400 ml-1.5">
              ({target.transactions.length} {target.transactions.length === 1 ? 'item' : 'itens'})
            </span>
          </div>
        </div>

        {/* Lista de Transações: Rolagem ativada APENAS se houver mais de 10 itens */}
        <div
          className={`p-2.5 space-y-1.5 custom-scrollbar ${
            sortedTransactions.length > 10
              ? 'max-h-[515px] overflow-y-auto'
              : 'overflow-y-visible'
          }`}
        >
          {sortedTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 px-3">
              <FileText className="w-6 h-6 stroke-[1.5] text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-400">Sem lançamentos individuais</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Valor originado de projeção ou baseline congelada.
              </p>
            </div>
          ) : (
            sortedTransactions.map(tx => {
              const card = tx.creditCardId ? creditCards.find(c => c.id === tx.creditCardId) : null;
              const acc = tx.accountId ? accounts.find(a => a.id === tx.accountId) : null;
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction && onEditTransaction(tx)}
                  className={`py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex items-center justify-between gap-2.5 ${
                    onEditTransaction ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                        {formatDateBR(tx.date)}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-medium text-white truncate" title={tx.description}>
                        {tx.description || 'Sem descrição'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-slate-400">
                      {card ? (
                        <span className="flex items-center gap-0.5 text-purple-300">
                          <CardIcon className="w-2.5 h-2.5 text-purple-400" />
                          <span className="truncate max-w-[100px]">{card.name}</span>
                        </span>
                      ) : acc ? (
                        <span className="flex items-center gap-0.5 text-sky-300">
                          <Wallet className="w-2.5 h-2.5 text-sky-400" />
                          <span className="truncate max-w-[100px]">{acc.name}</span>
                        </span>
                      ) : null}

                      {tx.paid ? (
                        <span className="flex items-center gap-0.5 text-emerald-400 ml-auto">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Pago</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-amber-400 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Sutil */}
        <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/60 text-center">
          <span className="text-[9.5px] text-slate-500">
            Clique fora ou aperte Esc para fechar
          </span>
        </div>
      </div>
    </div>
  );
};
