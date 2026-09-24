'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { AccountType } from '@/types/finance';
import { Wallet, Landmark, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { accounts, addAccount, deleteAccount } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#820AD1');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance.replace(',', '.'));
    if (isNaN(numBalance)) return;

    addAccount({
      name,
      type,
      balance: numBalance,
      initialBalance: numBalance,
      color,
      institution: institution.trim() || undefined,
      includeInTotal: true,
    });

    setName('');
    setBalance('');
    setInstitution('');
    setIsModalOpen(false);
  };

  const totalAccountsBalance = accounts
    .filter(a => a.includeInTotal)
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Minhas Contas e Carteiras</h2>
          <p className="text-xs text-slate-400">Total acumulado: <strong className="text-emerald-400 font-bold">{formatCurrency(totalAccountsBalance)}</strong></p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          return (
            <div
              key={acc.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.type === 'wallet' ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{acc.name}</h3>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {acc.type === 'checking'
                        ? 'Conta Corrente'
                        : acc.type === 'savings'
                        ? 'Poupança / Reserva'
                        : acc.type === 'wallet'
                        ? 'Carteira Física'
                        : 'Investimento'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Excluir a conta ${acc.name}?`)) {
                      deleteAccount(acc.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                  title="Excluir Conta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Saldo Atual</span>
                <div
                  className={`text-xl font-black ${
                    acc.balance >= 0 ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(acc.balance)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Incluído no total
                </span>
                {acc.institution && <span className="bg-slate-800 px-2 py-0.5 rounded-md">{acc.institution}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Nova Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Nova Conta</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: Santander, Banco do Brasil, Cofre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança / Reserva</option>
                    <option value="wallet">Carteira Física</option>
                    <option value="investment">Investimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Instituição / Banco (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Itaú, Bradesco..."
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
                <div className="flex gap-2">
                  {['#820AD1', '#FF7A00', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#6366F1'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
