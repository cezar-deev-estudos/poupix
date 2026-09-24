'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { CreditCard as CreditCardType } from '@/types/finance';
import { CreditCard as CardIcon, Plus, Calendar, Shield, Trash2 } from 'lucide-react';

export const CardsView: React.FC = () => {
  const { creditCards, filteredTransactions, addCreditCard, deleteCreditCard } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CreditCardType['brand']>('mastercard');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(20);
  const [dueDay, setDueDay] = useState(27);
  const [color, setColor] = useState('#820AD1');

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit.replace(',', '.'));
    if (isNaN(numLimit) || numLimit <= 0) return;

    addCreditCard({
      name,
      brand,
      limit: numLimit,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
    });

    setName('');
    setLimit('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Meus Cartões de Crédito</h2>
          <p className="text-xs text-slate-400">Controle limites, datas de fechamento e faturas mensais.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cartão
        </button>
      </div>

      {/* Grid de Cartões Estilo Físico 3D */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {creditCards.map(card => {
          // Calcular fatura atual baseada nas transações deste mês
          const cardExpenses = filteredTransactions
            .filter(t => t.creditCardId === card.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const availableLimit = Math.max(0, card.limit - cardExpenses);
          const limitUsedPercent = Math.min(100, ((cardExpenses / card.limit) * 100)).toFixed(0);

          return (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-56 text-white border border-white/10 group transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${card.color}dd 0%, #090d16 100%)`,
              }}
            >
              {/* Efeito Glass reflexivo */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Header do Cartão */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <CardIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block leading-tight">{card.name}</span>
                    <span className="text-[10px] text-white/70 uppercase tracking-widest">{card.brand}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Excluir cartão ${card.name}?`)) {
                      deleteCreditCard(card.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-500/80 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  title="Excluir Cartão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fatura Atual e Limite */}
              <div className="relative z-10 my-auto">
                <div className="text-[11px] text-white/70 font-medium">Fatura do Mês</div>
                <div className="text-2xl font-black tracking-tight">{formatCurrency(cardExpenses)}</div>
                
                {/* Barra de Progresso do Limite */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] text-white/80 mb-1">
                    <span>Disponível: {formatCurrency(availableLimit)}</span>
                    <span>{limitUsedPercent}% usado</span>
                  </div>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${limitUsedPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Footer do Cartão (Datas) */}
              <div className="flex items-center justify-between text-[11px] text-white/80 border-t border-white/10 pt-2 relative z-10">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white/60" />
                  <span>Fecha dia <strong>{card.closingDay}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-white/60" />
                  <span>Vence dia <strong>{card.dueDay}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Novo Cartão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Cartão</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank Ultravioleta, C6 Black"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bandeira</label>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">Amex</option>
                    <option value="other">Outra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={e => setClosingDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={e => setDueDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor do Cartão</label>
                <div className="flex gap-2">
                  {['#820AD1', '#111827', '#FF7A00', '#2563EB', '#059669', '#DC2626'].map(c => (
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
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl"
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
