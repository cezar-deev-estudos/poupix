'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { calculateDefaultInvoiceDueDate } from '@/lib/invoiceHelpers';
import { MoneyInput } from './MoneyInput';
import { QuickDateSelector } from './QuickDateSelector';
import { TagsChipSelector } from './TagsChipSelector';
import { DescriptionInputAutocomplete, SuggestionItem } from './DescriptionInputAutocomplete';
import { CategorySelectorDropdown } from './CategorySelectorDropdown';
import { CreditCardSelectorDropdown } from './CreditCardSelectorDropdown';
import { FileText, Heart, Receipt, ChevronDown, Pin, RefreshCw, Trash2 } from 'lucide-react';

interface CreditCardExpenseFormProps {
  initialData?: Transaction | null;
  defaultCreditCardId?: string | null;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother?: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onToggleDetails?: (isExpanded: boolean) => void;
}

export const CreditCardExpenseForm: React.FC<CreditCardExpenseFormProps> = ({
  initialData,
  defaultCreditCardId,
  onSave,
  onCancel,
  onDelete,
  onToggleDetails,
}) => {
  const { categories, creditCards } = useFinance();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const defaultCatId = expenseCategories[0]?.id || '';
  const initialSelectedCardId = initialData?.creditCardId || defaultCreditCardId || creditCards[0]?.id || '';

  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite ?? false);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || defaultCatId);
  const [creditCardId, setCreditCardId] = useState(initialSelectedCardId);
  const [ignoreInTotals, setIgnoreInTotals] = useState(initialData?.ignoreInTotals ?? false);

  // Coluna "Mais detalhes"
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [isInstallment, setIsInstallment] = useState(!!initialData?.installmentTotal);
  const [installmentTotal, setInstallmentTotal] = useState(initialData?.installmentTotal || 2);

  const [showValidation, setShowValidation] = useState(false);

  const selectedCard = creditCards.find(c => c.id === creditCardId) || creditCards[0];

  const defaultInvoice = useMemo(() => {
    return calculateDefaultInvoiceDueDate(date, selectedCard);
  }, [date, selectedCard]);

  const invoiceOptions = useMemo(() => {
    if (!selectedCard) return [];
    const options: { label: string; value: string }[] = [];
    const dueDay = selectedCard.dueDay || 10;
    const closingDay = selectedCard.closingDay || 3;

    // Data base da compra
    const [baseYear, baseMonth] = date.split('-').map(Number);
    const seenValues = new Set<string>();

    for (let offset = -2; offset <= 4; offset++) {
      const invDate = new Date(baseYear, (baseMonth - 1) + offset, dueDay);
      const isoValue = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
      const periodKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
      
      const manualStatus = selectedCard.manualInvoiceStatus?.[periodKey];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const closingDate = new Date(invDate.getFullYear(), invDate.getMonth(), closingDay);
      closingDate.setHours(0, 0, 0, 0);
      
      const isReopened = manualStatus === 'open';
      const isFutureOrCurrentOpen = today <= closingDate || offset >= 0;
      
      if (isReopened || isFutureOrCurrentOpen) {
        if (!seenValues.has(isoValue)) {
          seenValues.add(isoValue);
          const formatted = invDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
          options.push({ label: formatted, value: isoValue });
        }
      }
    }

    // Se o defaultInvoice não estiver na lista (por exemplo, compra recente em fatura aberta), inclui no topo
    if (!seenValues.has(defaultInvoice.invoiceDueDateStr)) {
      const [dY, dM, dD] = defaultInvoice.invoiceDueDateStr.split('-').map(Number);
      const dDate = new Date(dY, dM - 1, dD);
      const formatted = dDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      options.unshift({ label: formatted, value: defaultInvoice.invoiceDueDateStr });
    }

    return options;
  }, [selectedCard, date, defaultInvoice]);

  const [invoiceDate, setInvoiceDate] = useState(initialData?.invoiceDate || defaultInvoice.invoiceDueDateStr || '');

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
        creditCardId: selectedCard?.id,
        paid: false,
        ignoreInTotals,
        isFavorite,
        invoiceDate: invoiceDate || invoiceOptions[0]?.value,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringPeriod: isRecurring ? 'monthly' : undefined,
        installmentTotal: isInstallment ? Number(installmentTotal) : undefined,
      },
      createAnother
    );

    if (createAnother) {
      // Mantém os dados preenchidos na tela conforme solicitado pelo usuário
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
            variant="cyan"
            showError={showValidation}
            autoOpenKeypadOnMobile={!initialData}
          />

          {/* Seletor Rápido de Data */}
          <QuickDateSelector value={date} onChange={setDate} variant="cyan" />

          {/* Descrição com Autocomplete Inteligente (Preenche Categoria e Cartão) */}
          <DescriptionInputAutocomplete
            value={description}
            onChange={setDescription}
            onSelectSuggestion={(suggestion: SuggestionItem) => {
              if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
              if (suggestion.creditCardId) setCreditCardId(suggestion.creditCardId);
            }}
            type="creditCard"
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            variant="cyan"
          />

          {/* Categoria com Dropdown Customizado */}
          <CategorySelectorDropdown
            categories={expenseCategories}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            variant="cyan"
          />

          {/* Cartão de Crédito com Dropdown Customizado */}
          <CreditCardSelectorDropdown
            creditCards={creditCards}
            selectedCardId={creditCardId}
            onSelectCard={setCreditCardId}
          />

          {/* Seletor de Fatura / Vencimento */}
          <div className="space-y-1 border-b border-slate-800/80 pb-2">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-cyan-400" />
              Fatura de Vencimento
            </label>
            <div className="relative">
              <select
                value={invoiceDate || invoiceOptions[0]?.value}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {invoiceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    Fatura: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

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
                ignoreInTotals ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform ${
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
                placeholder="Adicione anotações sobre esta compra no cartão..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
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
                  isRecurring ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    isRecurring ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Parcelado */}
            <div className="space-y-2 border-t border-slate-800/80 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Parcelado
                </span>
                <button
                  type="button"
                  onClick={() => setIsInstallment(!isInstallment)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isInstallment ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      isInstallment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isInstallment && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={2}
                    max={72}
                    value={installmentTotal}
                    onChange={e => setInstallmentTotal(parseInt(e.target.value) || 2)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-xs text-white"
                  />
                  <span className="text-xs text-slate-400">vezes nas faturas</span>
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
            disabled={!isFormValid}
            onClick={() => handleSubmit(true)}
            className={`text-xs font-bold px-3 py-2 transition-colors rounded-xl ${
              isFormValid
                ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            SALVAR E CRIAR NOVA
          </button>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isFormValid
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 cursor-pointer font-bold'
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
