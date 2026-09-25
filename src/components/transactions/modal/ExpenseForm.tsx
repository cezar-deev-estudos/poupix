'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { MoneyInput } from './MoneyInput';
import { QuickDateSelector } from './QuickDateSelector';
import { TagsChipSelector } from './TagsChipSelector';
import { CategorySelectorDropdown } from './CategorySelectorDropdown';
import { AccountSelectorDropdown } from './AccountSelectorDropdown';
import { FileText, Heart, ChevronDown, Pin, RefreshCw, Check } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Transaction | null;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother?: boolean) => void;
  onCancel: () => void;
  onToggleDetails?: (isExpanded: boolean) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSave,
  onCancel,
  onToggleDetails,
}) => {
  const { categories, accounts } = useFinance();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const defaultCatId = expenseCategories[0]?.id || '';
  const defaultAccId = accounts[0]?.id || '';

  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paid, setPaid] = useState(initialData?.paid ?? true);
  const [description, setDescription] = useState(initialData?.description || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite ?? false);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || defaultCatId);
  const [accountId, setAccountId] = useState(initialData?.accountId || defaultAccId);
  const [ignoreInTotals, setIgnoreInTotals] = useState(initialData?.ignoreInTotals ?? false);

  // Coluna "Mais detalhes"
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [isRepeat, setIsRepeat] = useState(!!initialData?.installmentTotal);
  const [repeatCount, setRepeatCount] = useState(initialData?.installmentTotal || 2);
  const [repeatPeriod, setRepeatPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const [showValidation, setShowValidation] = useState(false);

  const toggleDetails = () => {
    const nextState = !showMoreDetails;
    setShowMoreDetails(nextState);
    if (onToggleDetails) {
      onToggleDetails(nextState);
    }
  };

  const handleSubmit = (createAnother: boolean = false) => {
    setShowValidation(true);
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0 || !description.trim()) {
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: numAmount,
        date,
        type: 'expense',
        categoryId,
        accountId,
        paid,
        ignoreInTotals,
        isFavorite,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringPeriod: isRecurring ? 'monthly' : undefined,
        installmentTotal: isRepeat ? Number(repeatCount) : undefined,
      },
      createAnother
    );

    if (createAnother) {
      setAmount('');
      setDescription('');
      setShowValidation(false);
    }
  };

  const isFormValid = parseFloat(amount.replace(',', '.')) > 0 && description.trim().length > 0;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(false);
      }}
      className="p-6 flex flex-col justify-between min-h-[420px]"
    >
      {/* Container de Campos (1 ou 2 Colunas) */}
      <div className={`grid grid-cols-1 ${showMoreDetails ? 'md:grid-cols-2 gap-8' : 'gap-4'} transition-all`}>
        {/* Coluna Principal */}
        <div className="space-y-4">
          {/* Valor com Calculadora */}
          <MoneyInput
            value={amount}
            onChange={setAmount}
            variant="rose"
            showError={showValidation}
          />

          {/* Switch Foi Paga */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-slate-500" />
              Foi paga
            </span>
            <button
              type="button"
              onClick={() => setPaid(!paid)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                paid ? 'bg-rose-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  paid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Seletor Rápido de Data */}
          <QuickDateSelector value={date} onChange={setDate} variant="rose" />

          {/* Descrição + Favorito */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Descrição"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1 transition-colors cursor-pointer ${
                isFavorite ? 'text-rose-500' : 'text-slate-600 hover:text-slate-400'
              }`}
              title="Marcar como favorita"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Categoria com Dropdown Customizado */}
          <CategorySelectorDropdown
            categories={expenseCategories}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            variant="rose"
          />

          {/* Conta Bancária com Dropdown Customizado */}
          <AccountSelectorDropdown
            accounts={accounts}
            selectedAccountId={accountId}
            onSelectAccount={setAccountId}
            variant="rose"
          />

          {/* Switch Ignorar Transação */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">ℹ️</span>
              Ignorar transação
            </span>
            <button
              type="button"
              onClick={() => setIgnoreInTotals(!ignoreInTotals)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                ignoreInTotals ? 'bg-rose-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  ignoreInTotals ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Botão de Alternância Mais Detalhes */}
          <div className="pt-2">
            <button
              type="button"
              onClick={toggleDetails}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              {showMoreDetails ? 'Menos detalhes <' : 'Mais detalhes >'}
            </button>
          </div>
        </div>

        {/* Coluna Expandida ("Mais Detalhes") */}
        {showMoreDetails && (
          <div className="space-y-4 md:border-l md:border-slate-800 md:pl-8 pt-4 md:pt-0 animate-fadeIn">
            {/* Tags em Chips */}
            <TagsChipSelector tags={tags} onChange={setTags} />

            {/* Observação */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Observação</label>
              <textarea
                rows={3}
                placeholder="Adicione anotações ou detalhes sobre este gasto..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Despesa Fixa */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-slate-500" />
                Despesa fixa
              </span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isRecurring ? 'bg-rose-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    isRecurring ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Repetir */}
            <div className="space-y-2 border-t border-slate-800/80 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Repetir
                </span>
                <button
                  type="button"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isRepeat ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isRepeat ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isRepeat && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={2}
                    max={72}
                    value={repeatCount}
                    onChange={e => setRepeatCount(parseInt(e.target.value) || 2)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-xs text-white"
                  />
                  <span className="text-xs text-slate-400">vezes</span>
                  <select
                    value={repeatPeriod}
                    onChange={e => setRepeatPeriod(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white"
                  >
                    <option value="monthly">Meses</option>
                    <option value="weekly">Semanas</option>
                    <option value="yearly">Anos</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ações do Rodapé na Base */}
      <div className="w-full flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 transition-colors cursor-pointer"
        >
          SALVAR E CRIAR NOVA
        </button>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isFormValid
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          SALVAR
        </button>
      </div>
    </form>
  );
};
