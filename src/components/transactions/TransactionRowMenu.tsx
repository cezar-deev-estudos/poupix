'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Paperclip, Trash2, ArrowRightLeft } from 'lucide-react';
import { Transaction } from '@/types/finance';

interface TransactionRowMenuProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onAttach: (tx: Transaction) => void;
  onConvertTransfer: (tx: Transaction) => void;
  triggerRect?: DOMRect | null;
}

export const TransactionRowMenu: React.FC<TransactionRowMenuProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAttach,
  onConvertTransfer,
  triggerRect,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Dimensões do menu
  const menuWidth = 192; // w-48 (12rem = 192px)
  const menuHeight = 168; // altura estimada com 4 botões

  // Cálculo da posição no viewport
  let top = 0;
  let left = 0;

  if (triggerRect) {
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openUpward = spaceBelow < menuHeight + 10 && triggerRect.top > menuHeight;

    if (openUpward) {
      top = triggerRect.top - menuHeight - 6;
    } else {
      top = triggerRect.bottom + 6;
    }

    // Alinhar a borda direita do menu com a borda direita do botão trigger
    left = triggerRect.right - menuWidth;

    // Garantir que não saia dos limites da tela
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }
  }

  const menuContent = (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Backdrop transparente para capturar clique fora */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} />

      {/* Caixa do Menu */}
      <div
        style={{
          top: `${Math.max(10, top)}px`,
          left: `${Math.max(10, left)}px`,
        }}
        className="fixed w-48 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-50 py-1.5 animate-scaleUp overflow-hidden text-xs text-slate-200"
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit(transaction);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-700/50 transition-colors text-left cursor-pointer"
        >
          <Pencil className="w-4 h-4 text-slate-400" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onAttach(transaction);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-700/50 transition-colors text-left cursor-pointer"
        >
          <Paperclip className="w-4 h-4 text-slate-400" />
          <span>Anexar arquivo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete(transaction);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors text-left cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Deletar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onConvertTransfer(transaction);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-700/50 transition-colors text-left cursor-pointer border-t border-slate-700/60"
        >
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          <span>Converter transferência</span>
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};
