'use client';

import React from 'react';
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
}

export const TransactionRowMenu: React.FC<TransactionRowMenuProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAttach,
  onConvertTransfer,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-40 py-1.5 animate-scaleUp overflow-hidden text-xs text-slate-200">
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
    </>
  );
};
