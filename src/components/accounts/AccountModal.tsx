'use client';

import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '@/types/finance';
import { X, Check } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acc: Omit<Account, 'id' | 'createdAt'>, editId?: string) => void;
  accountToEdit?: Account | null;
}

const PRESET_COLORS = [
  '#820AD1', // Nubank Roxo
  '#EC7000', // Itaú Laranja
  '#FF7A00', // Inter Laranja Claro
  '#CC092F', // Bradesco Vermelho
  '#EA1D2C', // Santander Vermelho
  '#0066B3', // Caixa Azul
  '#FDF001', // BB Amarelo
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#6366F1', // Índigo
  '#EC4899', // Rosa
  '#64748B', // Slate
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#EC7000');
  const [includeInTotal, setIncludeInTotal] = useState(true);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setBalance(accountToEdit.balance.toString());
      setInstitution(accountToEdit.institution || '');
      setColor(accountToEdit.color || '#EC7000');
      setIncludeInTotal(accountToEdit.includeInTotal ?? true);
    } else {
      setName('');
      setType('checking');
      setBalance('0');
      setInstitution('');
      setColor('#EC7000');
      setIncludeInTotal(true);
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance.replace(',', '.'));
    if (isNaN(numBalance)) return;

    onSave(
      {
        name: name.trim(),
        type,
        balance: numBalance,
        initialBalance: accountToEdit ? accountToEdit.initialBalance : numBalance,
        color,
        institution: institution.trim() || undefined,
        includeInTotal,
      },
      accountToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {accountToEdit ? 'Editar Conta' : 'Nova Conta'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da Conta</label>
            <input
              type="text"
              placeholder="Ex: 01 - Itaú, Nubank Principal..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de Conta</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança / Reserva</option>
                <option value="wallet">Carteira Física</option>
                <option value="investment">Investimentos</option>
                <option value="other">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {accountToEdit ? 'Saldo Atual (R$)' : 'Saldo Inicial (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Instituição Bancária</label>
            <input
              type="text"
              placeholder="Ex: Itaú, Nubank, Bradesco, Santander..."
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Cor de Destaque</label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeInTotal}
                onChange={e => setIncludeInTotal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300">Incluir esta conta na soma dos saldos gerais</span>
            </label>
          </div>

          <div className="flex gap-3 pt-3">
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
              {accountToEdit ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
