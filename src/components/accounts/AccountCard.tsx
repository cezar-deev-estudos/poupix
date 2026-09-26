'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Account } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { BankBadge } from './BankBadge';
import { MoreVertical, Edit2, Archive, ArrowRightLeft, Scale, Info } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  projectedBalance: number;
  onEdit: (account: Account) => void;
  onArchive: (account: Account) => void;
  onViewTransactions: (account: Account) => void;
  onAdjustBalance: (account: Account) => void;
  onAddExpense: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  projectedBalance,
  onEdit,
  onArchive,
  onViewTransactions,
  onAdjustBalance,
  onAddExpense,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const currentBalance = account.balance || 0;

  return (
    <div className="bg-[#18181b]/90 border border-slate-800/90 hover:border-slate-700/90 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all relative">
      {/* Top Header do Card: Badge + Nome + Menu ⋮ */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <BankBadge institution={account.institution} name={account.name} color={account.color} size="md" />
          <h3 className="font-bold text-white text-sm truncate tracking-tight" title={account.name}>
            {account.name}
          </h3>
        </div>

        {/* Dropdown Menu ⋮ */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mais opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#202024] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(account);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onArchive(account);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>Arquivar</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewTransactions(account);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Transações</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onAdjustBalance(account);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white text-left transition-colors cursor-pointer border-t border-slate-700/50 mt-1 pt-2"
              >
                <Scale className="w-3.5 h-3.5 text-violet-400" />
                <span>Reajuste de saldo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Saldos: Saldo Atual & Saldo Previsto */}
      <div className="space-y-2.5 py-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Saldo atual</span>
          <span
            className={`font-semibold tracking-tight ${
              currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(currentBalance)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span>Saldo previsto</span>
            <span
              className="cursor-help text-slate-500 hover:text-slate-300 transition-colors"
              title="Saldo considerando as despesas e receitas pendentes deste mês nesta conta"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
          <span
            className={`font-semibold tracking-tight ${
              projectedBalance >= 0 ? 'text-slate-200' : 'text-rose-400'
            }`}
          >
            {formatCurrency(projectedBalance)}
          </span>
        </div>
      </div>

      {/* Botão Inferior de Ação: ADICIONAR DESPESA */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex justify-center">
        <button
          onClick={() => onAddExpense(account)}
          className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider py-1 cursor-pointer flex items-center gap-1"
        >
          ADICIONAR DESPESA
        </button>
      </div>
    </div>
  );
};
