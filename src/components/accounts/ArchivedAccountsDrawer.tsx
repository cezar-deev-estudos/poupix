'use client';

import React from 'react';
import { Account } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { BankBadge } from './BankBadge';
import { X, ArchiveRestore, Trash2, Archive } from 'lucide-react';

interface ArchivedAccountsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  archivedAccounts: Account[];
  onUnarchive: (accountId: string) => void;
  onDelete: (accountId: string) => void;
}

export const ArchivedAccountsDrawer: React.FC<ArchivedAccountsDrawerProps> = ({
  isOpen,
  onClose,
  archivedAccounts,
  onUnarchive,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#242428] rounded-t-3xl border-t border-slate-700/80 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        {/* Handle / Header */}
        <div className="p-4 pb-2 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-300" />
            <h3 className="text-base font-bold text-white">Contas arquivadas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Contas Arquivadas */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {archivedAccounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhuma conta arquivada no momento.
            </div>
          ) : (
            archivedAccounts.map(acc => (
              <div
                key={acc.id}
                className="bg-[#1c1c20] border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BankBadge institution={acc.institution} name={acc.name} color={acc.color} size="md" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{acc.name}</h4>
                    <span className="text-xs text-slate-400">{formatCurrency(acc.balance)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onUnarchive(acc.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title="Desarquivar Conta"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Desarquivar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir permanentemente a conta "${acc.name}"?`)) {
                        onDelete(acc.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
