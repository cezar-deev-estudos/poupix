'use client';

import React, { useState } from 'react';
import { Category, CreditCard, Account, Transaction } from '@/types/finance';
import { X, CreditCard as CardIcon, Landmark, Tag, Check, Calendar, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { calculateDefaultInvoiceDueDate } from '@/lib/invoiceHelpers';
import { CategorySelectorDropdown } from './modal/CategorySelectorDropdown';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  accounts: Account[];
  onApply: (updates: Partial<Transaction>) => void;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedTransactions,
  categories,
  creditCards,
  accounts,
  onApply,
}) => {
  if (!isOpen) return null;

  // Modificadores opcionais
  const [changeDestination, setChangeDestination] = useState(false);
  const [destinationType, setDestinationType] = useState<'card' | 'account'>('card');
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  const [changeCategory, setChangeCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [changeStatus, setChangeStatus] = useState(false);
  const [targetPaidStatus, setTargetPaidStatus] = useState<boolean>(false);

  const [changeDescription, setChangeDescription] = useState(false);
  const [newDescription, setNewDescription] = useState<string>('');

  const count = selectedTransactions.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<Transaction> = {};

    if (changeDestination) {
      if (destinationType === 'card') {
        const card = creditCards.find(c => c.id === selectedCardId);
        updates.type = 'expense';
        updates.creditCardId = selectedCardId;
        // Para cartão, calcula ou define invoiceDate baseando-se na data média ou da 1ª transação
        if (selectedTransactions.length > 0 && card) {
          const firstDate = selectedTransactions[0].date;
          const { invoiceDueDateStr } = calculateDefaultInvoiceDueDate(firstDate, card);
          updates.invoiceDate = invoiceDueDateStr;
        }
      } else {
        updates.type = 'expense';
        updates.accountId = selectedAccountId;
        updates.creditCardId = undefined;
        updates.invoiceDate = undefined;
      }
    }

    if (changeCategory && selectedCategoryId) {
      updates.categoryId = selectedCategoryId;
    }

    if (changeStatus) {
      updates.paid = targetPaidStatus;
    }

    if (changeDescription && newDescription.trim()) {
      updates.description = newDescription.trim();
    }

    onApply(updates);
    onClose();
  };

  const hasAnyChange = changeDestination || (changeCategory && !!selectedCategoryId) || changeStatus || (changeDescription && !!newDescription.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#181c24] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#14171f]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Editar em Lote</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {count} {count === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione quais campos deseja alterar em todas as transações marcadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Opções */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Opção 1: Mudar Destino / Tipo (Cartão ou Conta) */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={changeDestination}
                onChange={(e) => setChangeDestination(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Alterar Tipo e Destino (Cartão ou Conta Bancária)</span>
            </label>

            {changeDestination && (
              <div className="pt-2 pl-6 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationType('card')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      destinationType === 'card'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <CardIcon className="w-3.5 h-3.5" />
                    <span>Cartão de Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationType('account')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      destinationType === 'account'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Conta (Despesa Normal)</span>
                  </button>
                </div>

                {destinationType === 'card' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Selecione o Cartão:</label>
                    <select
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Selecione a Conta Bancária:</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opção 2: Mudar Categoria */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={changeCategory}
                onChange={(e) => setChangeCategory(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Alterar Categoria</span>
            </label>

            {changeCategory && (
              <div className="pt-2 pl-6 animate-fadeIn">
                <CategorySelectorDropdown
                  categories={categories.filter(c => c.type === 'expense')}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={(id) => setSelectedCategoryId(id)}
                  variant="blue"
                />
              </div>
            )}
          </div>

          {/* Opção 3: Mudar Situação (Paga / Pendente) */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={changeStatus}
                onChange={(e) => setChangeStatus(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Alterar Situação (Pago / Pendente)</span>
            </label>

            {changeStatus && (
              <div className="pt-2 pl-6 flex items-center gap-3 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setTargetPaidStatus(true)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    targetPaidStatus
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Marcar como Paga</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetPaidStatus(false)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    !targetPaidStatus
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="font-bold">!</span>
                  <span>Marcar como Pendente</span>
                </button>
              </div>
            )}
          </div>

          {/* Opção 4: Alterar Descrição */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={changeDescription}
                onChange={(e) => setChangeDescription(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Alterar Descrição</span>
            </label>

            {changeDescription && (
              <div className="pt-2 pl-6 animate-fadeIn">
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Nova descrição para todos os itens selecionados..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Rodapé com Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!hasAnyChange}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                hasAnyChange
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Aplicar em {count} {count === 1 ? 'item' : 'itens'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

