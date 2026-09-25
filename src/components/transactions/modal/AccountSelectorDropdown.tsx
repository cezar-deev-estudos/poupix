'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Account } from '@/types/finance';
import { Landmark, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';
import { formatCurrency } from '@/lib/utils';

interface AccountSelectorDropdownProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  variant?: DateVariant;
  label?: string;
}

export const AccountSelectorDropdown: React.FC<AccountSelectorDropdownProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  variant = 'rose',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBorderColor = () => {
    if (selectedAccount?.color) return selectedAccount.color;
    switch (variant) {
      case 'emerald':
        return '#10B981';
      case 'cyan':
        return '#06B6D4';
      case 'blue':
        return '#3B82F6';
      case 'rose':
      default:
        return '#F43F5E';
    }
  };

  const themeColor = getBorderColor();

  const renderBankBadge = (acc?: Account, size: 'sm' | 'md' = 'sm') => {
    const name = acc?.name?.toLowerCase() || '';
    const isItau = name.includes('itau') || name.includes('itaú');
    const isNubank = name.includes('nubank') || name.includes('nu ');
    const isBradesco = name.includes('bradesco');
    const isSantander = name.includes('santander');
    const isInter = name.includes('inter');
    const isBB = name.includes('banco do brasil') || name.includes('bb');
    const isCaixa = name.includes('caixa');
    const isC6 = name.includes('c6');

    const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';

    if (isItau) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#EC7000] flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[8px] font-black text-[#003399] bg-[#EC7000] tracking-tighter px-0.5 rounded">Itaú</span>
        </div>
      );
    }
    if (isNubank) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#820AD1] flex items-center justify-center text-white font-black shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[9px] font-bold">Nu</span>
        </div>
      );
    }
    if (isBradesco) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#CC092F] flex items-center justify-center text-white font-bold shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[8px]">Bra</span>
        </div>
      );
    }
    if (isSantander) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#EA1D25] flex items-center justify-center text-white font-bold shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[8px]">San</span>
        </div>
      );
    }
    if (isInter) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#FF7A00] flex items-center justify-center text-white font-bold shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[8px]">Int</span>
        </div>
      );
    }
    if (isBB) {
      return (
        <div className={`${sizeClasses} rounded-full bg-[#FFEF38] text-[#003882] flex items-center justify-center font-black shrink-0 shadow-sm ring-1 ring-white/10`}>
          <span className="text-[8px] font-black">BB</span>
        </div>
      );
    }

    const bg = acc?.color || themeColor;
    const initials = acc?.name ? acc.name.trim().slice(0, 2).toUpperCase() : <Wallet className="w-3 h-3" />;

    return (
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm ring-1 ring-white/10`}
        style={{ backgroundColor: bg }}
      >
        {initials}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      {label && <label className="text-[11px] text-slate-400 font-medium block">{label}</label>}

      {/* Botão Gatilho no Padrão Mobills */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
        <Landmark className="w-4 h-4 text-slate-500 shrink-0" />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between text-left cursor-pointer group min-w-0"
        >
          {/* Badge Pílula da Conta Selecionada */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all truncate"
            style={{
              borderColor: `${themeColor}90`,
              backgroundColor: `${themeColor}15`,
            }}
          >
            {renderBankBadge(selectedAccount, 'sm')}

            <span className="text-xs font-semibold text-white truncate max-w-[240px]">
              {selectedAccount?.name || 'Selecione uma conta'}
            </span>
          </div>

          <div className="text-slate-400 group-hover:text-white p-1 transition-colors flex items-center gap-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
      </div>

      {/* Menu Dropdown Suspenso de Contas */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#161a23] border border-slate-800/90 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-fadeIn space-y-1 backdrop-blur-md">
          {accounts.map(acc => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  onSelectAccount(acc.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderBankBadge(acc, 'md')}
                  <span className="truncate text-xs font-semibold">{acc.name}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium ml-2 shrink-0">
                  {formatCurrency(acc.balance)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
