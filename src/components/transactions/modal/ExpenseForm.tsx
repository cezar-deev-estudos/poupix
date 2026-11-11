'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { getLocalDateString, formatCurrency } from '@/lib/utils';
import { getTransactionBudgetPeriod, getMatchingNanoName, normalizeKey } from '@/lib/decreasingExpenses';
import { MoneyInput } from './MoneyInput';
import { QuickDateSelector } from './QuickDateSelector';
import { TagsChipSelector } from './TagsChipSelector';
import { DescriptionInputAutocomplete, SuggestionItem } from './DescriptionInputAutocomplete';
import { CategorySelectorDropdown } from './CategorySelectorDropdown';
import { AccountSelectorDropdown } from './AccountSelectorDropdown';
import { FileText, Heart, ChevronDown, Pin, RefreshCw, Check, Trash2 } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Transaction | null;
  defaultAccountId?: string | null;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother?: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onToggleDetails?: (isExpanded: boolean) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  defaultAccountId = null,
  onSave,
  onCancel,
  onDelete,
  onToggleDetails,
}) => {
  const { categories, accounts, transactions, creditCards } = useFinance();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const defaultCatId = expenseCategories[0]?.id || '';
  
  // Encontra prioritariamente a conta Itaú ou a primeira conta bancária válida
  const itauOrFirstAccount = accounts.find(a => a.name.toLowerCase().includes('itaú') || a.name.toLowerCase().includes('itau')) || accounts[0];
  const initialAccId = defaultAccountId || itauOrFirstAccount?.id || '';

  const getInitialAmountValue = () => {
    if (!initialData) return '';
    let initialVal = initialData.initialAmount;
    if (initialData.isDecreasing && (initialVal === undefined || initialVal === null)) {
      const txNano = getMatchingNanoName(initialData, categories);
      const sub = categories.find(c => c.id === initialData.categoryId);
      const matchedNano = sub?.nanoCategories?.find(n => normalizeKey(n.name) === txNano);
      if (matchedNano?.budgetLimit && matchedNano.budgetLimit > 0) {
        initialVal = matchedNano.budgetLimit;
      } else {
        const txPeriod = getTransactionBudgetPeriod(initialData, creditCards);
        const normalSum = transactions
          .filter(t => {
            if (t.type !== 'expense' || t.isDecreasing || t.id === initialData.id) return false;
            const tPeriod = getTransactionBudgetPeriod(t, creditCards);
            if (tPeriod !== txPeriod) return false;
            const tNano = getMatchingNanoName(t, categories);
            return tNano === txNano;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        initialVal = Number((initialData.amount + normalSum).toFixed(2));
      }
    }
    if (initialData.isDecreasing && initialVal !== undefined) {
      return initialVal.toString();
    }
    return initialData.amount ? initialData.amount.toString() : '';
  };

  const [amount, setAmount] = useState(getInitialAmountValue());
  const [date, setDate] = useState(initialData?.date || getLocalDateString());
  const [paid, setPaid] = useState(initialData?.paid ?? true);
  const [description, setDescription] = useState(initialData?.description || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite ?? false);
  const [categoryId, setCategoryId] = useState(initialData !== undefined && initialData !== null ? (initialData.categoryId ?? '') : defaultCatId);
  const [accountId, setAccountId] = useState(initialData?.accountId || initialAccId);
  const [ignoreInTotals, setIgnoreInTotals] = useState(initialData?.ignoreInTotals ?? false);
  const [isDecreasing, setIsDecreasing] = useState(initialData?.isDecreasing ?? false);
  const [isFixedCost, setIsFixedCost] = useState(initialData?.isFixedCost ?? false);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const currentNanoCategories = selectedCategory?.nanoCategories || [];

  // Coluna "Mais detalhes"
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [isRepeat, setIsRepeat] = useState(!!initialData?.installmentTotal);
  const [repeatCount, setRepeatCount] = useState(initialData?.installmentTotal || 2);
  const [repeatPeriod, setRepeatPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (initialData) {
      let initialVal = initialData.initialAmount;
      if (initialData.isDecreasing && (initialVal === undefined || initialVal === null)) {
        // Tenta buscar o teto da nano-categoria
        const txNano = getMatchingNanoName(initialData, categories);
        const sub = categories.find(c => c.id === initialData.categoryId);
        const matchedNano = sub?.nanoCategories?.find(n => normalizeKey(n.name) === txNano);
        if (matchedNano?.budgetLimit && matchedNano.budgetLimit > 0) {
          initialVal = matchedNano.budgetLimit;
        } else {
          // Reconstruir com base nas compras normais existentes
          const txPeriod = getTransactionBudgetPeriod(initialData, creditCards);
          const normalSum = transactions
            .filter(t => {
              if (t.type !== 'expense' || t.isDecreasing || t.id === initialData.id) return false;
              const tPeriod = getTransactionBudgetPeriod(t, creditCards);
              if (tPeriod !== txPeriod) return false;
              const tNano = getMatchingNanoName(t, categories);
              return tNano === txNano;
            })
            .reduce((sum, t) => sum + t.amount, 0);
          initialVal = Number((initialData.amount + normalSum).toFixed(2));
        }
      }

      const displayAmount = initialData.isDecreasing && initialVal !== undefined
        ? initialVal.toString()
        : (initialData.amount ? initialData.amount.toString() : '');
      setAmount(displayAmount);
      setDate(initialData.date || getLocalDateString());
      setPaid(initialData.paid ?? true);
      setDescription(initialData.description || '');
      setIsFavorite(Boolean(initialData.isFavorite));
      setCategoryId(initialData.categoryId ?? '');
      setAccountId(initialData.accountId || initialAccId);
      setIgnoreInTotals(Boolean(initialData.ignoreInTotals));
      setIsFixedCost(Boolean(initialData.isFixedCost));
      setIsDecreasing(Boolean(initialData.isDecreasing));
      setTags(initialData.tags || []);
      setNotes(initialData.notes || '');
      setIsRecurring(Boolean(initialData.isRecurring));
      setIsRepeat(Boolean(initialData.installmentTotal));
      setRepeatCount(initialData.installmentTotal || 2);
    }
  }, [initialData, defaultCatId, initialAccId, categories, creditCards, transactions]);

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

    // Blindagem: Garante que a conta bancária é SEMPRE preenchida (priorizando Itaú)
    const effectiveAccountId = accountId || initialAccId;
    if (!effectiveAccountId) {
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: numAmount,
        date,
        type: 'expense',
        categoryId,
        accountId: effectiveAccountId,
        paid,
        ignoreInTotals,
        isFixedCost,
        isDecreasing,
        initialAmount: isDecreasing ? numAmount : undefined,
        isFavorite,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringPeriod: isRecurring ? 'monthly' : undefined,
        installmentTotal: isRepeat ? Number(repeatCount) : undefined,
        creditCardId: undefined,
        invoiceDate: undefined,
      },
      createAnother
    );

    if (createAnother) {
      setAmount('');
      setDescription('');
      setIsDecreasing(false);
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
          {/* Valor com Calculadora e Switch Foi Paga ao lado */}
          <MoneyInput
            value={amount}
            onChange={setAmount}
            variant="rose"
            showError={showValidation}
            autoOpenKeypadOnMobile={!initialData}
            rightElement={
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  Foi paga
                </span>
                <button
                  type="button"
                  onClick={() => setPaid(!paid)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    paid ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      paid ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            }
          />

          {/* Seletor Rápido de Data + Toggle Despesa Fixa (DF) */}
          <div className="flex items-center justify-between gap-2">
            <QuickDateSelector value={date} onChange={setDate} variant="rose" />
            <button
              type="button"
              onClick={() => setIsFixedCost(!isFixedCost)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                isFixedCost
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title={isFixedCost ? 'Despesa Fixa (Essencial) Ativada' : 'Marcar como Despesa Fixa (DF)'}
            >
              DF {isFixedCost ? '✓' : ''}
            </button>
          </div>

          {/* Descrição com Autocomplete Inteligente (Preenche Categoria e Cor) */}
          <DescriptionInputAutocomplete
            value={description}
            onChange={setDescription}
            onSelectSuggestion={(suggestion: SuggestionItem) => {
              if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
              if (suggestion.accountId) setAccountId(suggestion.accountId);
            }}
            type="expense"
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            variant="rose"
            nanoCategories={currentNanoCategories.length > 0 ? currentNanoCategories : undefined}
          />

          {/* Opção Despesa Decrescente (Meta/Previsão do Mês para Nano Categoria) */}
          {description.trim().length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="text-rose-400">📉</span>
                    Despesa Decrescente (Previsão)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    O valor acima é a reserva inicial. Ele diminui automaticamente conforme novos lançamentos de "{description.trim()}" no mês.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDecreasing(!isDecreasing)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ml-3 ${
                    isDecreasing ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      isDecreasing ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {isDecreasing && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-medium">Saldo Restante Atual:</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {(() => {
                      const inputNum = parseFloat(amount.replace(',', '.')) || 0;
                      // Calcular a soma das despesas normais já efetuadas no mês com mesmo nanoName
                      const txPeriod = date ? date.substring(0, 7) : '';
                      const tempTx: Partial<Transaction> = {
                        categoryId,
                        description: description.trim(),
                        date,
                      };
                      const nanoName = getMatchingNanoName(tempTx as Transaction, categories);
                      const normalExpensesSum = transactions
                        .filter(t => {
                          if (t.type !== 'expense' || t.isDecreasing) return false;
                          if (initialData && t.id === initialData.id) return false;
                          const tPeriod = getTransactionBudgetPeriod(t, creditCards);
                          if (tPeriod !== txPeriod) return false;
                          const tNano = getMatchingNanoName(t, categories);
                          return tNano === nanoName;
                        })
                        .reduce((sum, t) => sum + t.amount, 0);

                      const calculatedRemaining = Math.max(0, Number((inputNum - normalExpensesSum).toFixed(2)));
                      return formatCurrency(calculatedRemaining);
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}

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

          {/* Observação (Altura de 1 linha) */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Observação..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
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
      <div className="w-full flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-800">
        <div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Excluir este lançamento"
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer flex items-center justify-center group"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    </form>
  );
};
