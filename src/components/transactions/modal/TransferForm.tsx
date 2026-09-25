'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { MoneyInput } from './MoneyInput';
import { QuickDateSelector } from './QuickDateSelector';
import { TagsChipSelector } from './TagsChipSelector';
import { AccountSelectorDropdown } from './AccountSelectorDropdown';
import { Pin } from 'lucide-react';

interface TransferFormProps {
  initialData?: Transaction | null;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother?: boolean) => void;
  onCancel: () => void;
  onToggleDetails?: (isExpanded: boolean) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  initialData,
  onSave,
  onCancel,
  onToggleDetails,
}) => {
  const { accounts } = useFinance();

  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(
    initialData?.destinationAccountId || accounts.find(a => a.id !== accounts[0]?.id)?.id || accounts[1]?.id || ''
  );

  // Coluna "Mais detalhes"
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);

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
    if (isNaN(numAmount) || numAmount <= 0 || !accountId || !destinationAccountId || accountId === destinationAccountId) {
      return;
    }

    const fromAcc = accounts.find(a => a.id === accountId);
    const toAcc = accounts.find(a => a.id === destinationAccountId);
    const desc = `Transferência: ${fromAcc?.name || 'Conta'} ➔ ${toAcc?.name || 'Conta'}`;

    onSave(
      {
        description: desc,
        amount: numAmount,
        date,
        type: 'transfer',
        categoryId: 'cat-other-exp',
        accountId,
        destinationAccountId,
        paid: true,
        tags: tags.length > 0 ? tags : undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringPeriod: isRecurring ? 'monthly' : undefined,
      },
      createAnother
    );

    if (createAnother) {
      setAmount('');
      setShowValidation(false);
    }
  };

  const isFormValid =
    parseFloat(amount.replace(',', '.')) > 0 &&
    accountId &&
    destinationAccountId &&
    accountId !== destinationAccountId;

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
            variant="blue"
            showError={showValidation}
          />

          {/* Seletor Rápido de Data */}
          <QuickDateSelector value={date} onChange={setDate} variant="blue" />

          {/* Conta de Origem */}
          <AccountSelectorDropdown
            accounts={accounts}
            selectedAccountId={accountId}
            onSelectAccount={setAccountId}
            variant="blue"
            label="Conta de origem (Sai de)"
          />

          {/* Conta de Destino */}
          <AccountSelectorDropdown
            accounts={accounts.filter(a => a.id !== accountId)}
            selectedAccountId={destinationAccountId}
            onSelectAccount={setDestinationAccountId}
            variant="blue"
            label="Conta de destino (Entra em)"
          />

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
                placeholder="Adicione anotações sobre esta transferência..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Transferência Fixa */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-slate-500" />
                Transferência fixa
              </span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isRecurring ? 'bg-blue-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    isRecurring ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-bold'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          SALVAR
        </button>
      </div>
    </form>
  );
};
