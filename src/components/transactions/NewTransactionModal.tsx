'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/types/finance';
import { X, Plus, Calendar, Tag, FileText, Repeat, Layers } from 'lucide-react';
import { CategoryIcon } from '../ui/CategoryIcon';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const { categories, accounts, creditCards, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'creditCard'>('account');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || '');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [paid, setPaid] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentTotal, setInstallmentTotal] = useState(2);
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');

  // Auto-selecionar primeira categoria compatível com o tipo
  React.useEffect(() => {
    const availableCats = categories.filter(c => c.type === (type === 'expense' ? 'expense' : 'income'));
    if (availableCats.length > 0) {
      setCategoryId(availableCats[0].id);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, informe um valor válido!');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, insira uma descrição!');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    addTransaction({
      description,
      amount: numAmount,
      date,
      type,
      categoryId: type === 'transfer' ? 'cat-other-exp' : categoryId,
      accountId: type === 'transfer' ? accountId : paymentMethod === 'account' ? accountId : undefined,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      creditCardId: type === 'expense' && paymentMethod === 'creditCard' ? creditCardId : undefined,
      paid: paymentMethod === 'creditCard' ? true : paid,
      tags: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
      isRecurring,
      recurringPeriod: isRecurring ? 'monthly' : undefined,
      installmentTotal: isInstallment && type === 'expense' ? Number(installmentTotal) : undefined,
    });

    // Resetar form
    setDescription('');
    setAmount('');
    setTagsInput('');
    setNotes('');
    setIsInstallment(false);
    setIsRecurring(false);
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === (type === 'expense' ? 'expense' : 'income'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header com Abas de Tipo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transferência
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Salário, Uber..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Data</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Categoria (se não for transferência) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                {filteredCategories.map(cat => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={14} />
                      </div>
                      <span className="text-xs truncate font-medium">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Origem / Destino */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Conta Origem (Sai de)</label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Conta Destino (Entra em)</label>
                <select
                  value={destinationAccountId}
                  onChange={e => setDestinationAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.filter(a => a.id !== accountId).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              {type === 'expense' && (
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      checked={paymentMethod === 'account'}
                      onChange={() => setPaymentMethod('account')}
                      className="accent-emerald-500"
                    />
                    Conta Bancária / Carteira
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      checked={paymentMethod === 'creditCard'}
                      onChange={() => setPaymentMethod('creditCard')}
                      className="accent-emerald-500"
                    />
                    Cartão de Crédito
                  </label>
                </div>
              )}

              {paymentMethod === 'account' || type === 'income' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Conta</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Cartão de Crédito</label>
                  <select
                    value={creditCardId}
                    onChange={e => setCreditCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Opções Avançadas: Parcelamento e Recorrência (apenas para despesas) */}
          {type === 'expense' && (
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <span>Compra Parcelada</span>
                </label>
                {isInstallment && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Total de Parcelas:</span>
                    <input
                      type="number"
                      min={2}
                      max={72}
                      value={installmentTotal}
                      onChange={e => setInstallmentTotal(parseInt(e.target.value) || 2)}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <span>Despesa Fixa / Recorrente Mensal</span>
                </label>
              </div>
            </div>
          )}

          {/* Tags e Observações */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
              <input
                type="text"
                placeholder="viagem, mercado, reforma..."
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
