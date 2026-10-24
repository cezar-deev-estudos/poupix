'use client';

import React, { useState, useEffect } from 'react';
import { Account } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { X, Scale } from 'lucide-react';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onAdjustBalance: (accountId: string, newBalance: number, reason: string, createTransaction?: boolean) => void;
}

export const BalanceAdjustmentModal: React.FC<BalanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  account,
  onAdjustBalance,
}) => {
  const [newBalance, setNewBalance] = useState('');
  const [reason, setReason] = useState('Ajuste de saldo');
  const [createTransaction, setCreateTransaction] = useState(true);

  useEffect(() => {
    if (account) {
      setNewBalance(account.balance.toString());
      setReason('Ajuste de saldo');
      setCreateTransaction(true);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const currentVal = account.balance;
  const parsedNewVal = parseFloat(newBalance.replace(',', '.')) || 0;
  const difference = parsedNewVal - currentVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedNewVal)) return;

    onAdjustBalance(account.id, parsedNewVal, reason, createTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reajuste de Saldo</h3>
              <p className="text-xs text-slate-400">{account.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-400">Saldo atual registrado</span>
            <span className="text-sm font-bold text-white">{formatCurrency(currentVal)}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Novo Saldo Real (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newBalance}
              onChange={e => setNewBalance(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-base font-bold focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição do Ajuste</label>
            <input
              type="text"
              placeholder="Ex: Correção de saldo bancário"
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={!createTransaction}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
          </div>

          {/* Seletor Toggle: Gerar ou não o lançamento de ajuste no extrato */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white block">Criar lançamento no extrato</span>
              <span className="text-[11px] text-slate-400 block">
                {createTransaction
                  ? 'Gera uma transação com a diferença no extrato'
                  : 'Apenas altera o saldo cadastral sem criar transação'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCreateTransaction(prev => !prev)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                createTransaction ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {difference !== 0 && createTransaction && (
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
              difference > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              <span>Diferença a ser lançada:</span>
              <span className="font-bold">
                {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            >
              Confirmar Reajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
