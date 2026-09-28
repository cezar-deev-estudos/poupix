'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard } from '@/types/finance';
import { X, Check } from 'lucide-react';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<CreditCard, 'id' | 'createdAt'>, editId?: string) => void;
  cardToEdit?: CreditCard | null;
}

const PRESET_COLORS = [
  '#0d9488', // Teal / Ciano
  '#820AD1', // Nubank Roxo
  '#111827', // Preto / Black
  '#EC7000', // Itaú Laranja
  '#CC092F', // Bradesco Vermelho
  '#EA1D2C', // Santander Vermelho
  '#2563EB', // Azul
  '#10B981', // Verde
  '#6366F1', // Indigo
  '#EC4899', // Rosa
];

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CreditCard['brand']>('mastercard');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(12);
  const [dueDay, setDueDay] = useState(22);
  const [color, setColor] = useState('#0d9488');

  useEffect(() => {
    if (cardToEdit) {
      setName(cardToEdit.name);
      setBrand(cardToEdit.brand);
      setLimit(cardToEdit.limit.toString());
      setClosingDay(cardToEdit.closingDay);
      setDueDay(cardToEdit.dueDay);
      setColor(cardToEdit.color || '#0d9488');
    } else {
      setName('');
      setBrand('mastercard');
      setLimit('');
      setClosingDay(12);
      setDueDay(22);
      setColor('#0d9488');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit.replace(',', '.'));
    if (isNaN(numLimit) || numLimit <= 0) return;

    onSave(
      {
        name: name.trim(),
        brand,
        limit: numLimit,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        color,
      },
      cardToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {cardToEdit ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do Cartão</label>
            <input
              type="text"
              placeholder="Ex: Cartão Personalite, XP Infinite..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Bandeira</label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value as CreditCard['brand'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">Amex</option>
                <option value="hipercard">Hipercard</option>
                <option value="other">Outra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Limite Total (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dia de Fechamento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={closingDay}
                onChange={e => setClosingDay(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dia de Vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={e => setDueDay(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Cor do Cartão</label>
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

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
            >
              {cardToEdit ? 'Salvar Alterações' : 'Criar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
