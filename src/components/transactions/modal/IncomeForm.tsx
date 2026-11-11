'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { getLocalDateString } from '@/lib/utils';
import { MoneyInput } from './MoneyInput';
import { QuickDateSelector } from './QuickDateSelector';
import { TagsChipSelector } from './TagsChipSelector';
import { DescriptionInputAutocomplete, SuggestionItem } from './DescriptionInputAutocomplete';
import { CategorySelectorDropdown } from './CategorySelectorDropdown';
import { AccountSelectorDropdown } from './AccountSelectorDropdown';
import { FileText, Heart, ChevronDown, Pin, RefreshCw, Check, Trash2, Paperclip, Image as ImageIcon, X } from 'lucide-react';

interface IncomeFormProps {
  initialData?: Transaction | null;
  defaultAccountId?: string | null;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>, createAnother?: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onToggleDetails?: (isExpanded: boolean) => void;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  initialData,
  defaultAccountId = null,
  onSave,
  onCancel,
  onDelete,
  onToggleDetails,
}) => {
  const { categories, accounts } = useFinance();

  const incomeCategories = categories.filter(c => c.type === 'income');
  const defaultCatId = incomeCategories[0]?.id || '';
  
  // Encontra prioritariamente a conta Itaú ou a primeira conta bancária válida
  const itauOrFirstAccount = accounts.find(a => a.name.toLowerCase().includes('itaú') || a.name.toLowerCase().includes('itau')) || accounts[0];
  const initialAccId = defaultAccountId || itauOrFirstAccount?.id || '';

  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [date, setDate] = useState(initialData?.date || getLocalDateString());
  const [paid, setPaid] = useState(initialData?.paid ?? true);
  const [description, setDescription] = useState(initialData?.description || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite ?? false);
  const [categoryId, setCategoryId] = useState(initialData !== undefined && initialData !== null ? (initialData.categoryId ?? '') : defaultCatId);
  const [accountId, setAccountId] = useState(initialData?.accountId || initialAccId);
  const [ignoreInTotals, setIgnoreInTotals] = useState(initialData?.ignoreInTotals ?? false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(initialData?.attachmentUrl || null);
  const [previewAttachmentModalOpen, setPreviewAttachmentModalOpen] = useState(false);

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
      setAmount(initialData.amount ? initialData.amount.toString() : '');
      setDate(initialData.date || getLocalDateString());
      setPaid(initialData.paid ?? true);
      setDescription(initialData.description || '');
      setIsFavorite(Boolean(initialData.isFavorite));
      setCategoryId(initialData.categoryId ?? '');
      setAccountId(initialData.accountId || initialAccId);
      setIgnoreInTotals(Boolean(initialData.ignoreInTotals));
      setAttachmentUrl(initialData.attachmentUrl || null);
      setTags(initialData.tags || []);
      setNotes(initialData.notes || '');
      setIsRecurring(Boolean(initialData.isRecurring));
      setIsRepeat(Boolean(initialData.installmentTotal));
      setRepeatCount(initialData.installmentTotal || 2);
    }
  }, [initialData, defaultCatId, initialAccId]);

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
        type: 'income',
        categoryId,
        accountId: effectiveAccountId,
        paid,
        ignoreInTotals,
        isFavorite,
        attachmentUrl: attachmentUrl || undefined,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar e comprimir no cliente para manter leve no Supabase
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAttachmentUrl(compressedDataUrl);
        } else {
          setAttachmentUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachmentUrl(null);
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
          {/* Valor com Calculadora e Switch Foi Recebida ao lado */}
          <MoneyInput
            value={amount}
            onChange={setAmount}
            variant="emerald"
            showError={showValidation}
            autoOpenKeypadOnMobile={!initialData}
            rightElement={
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  Foi recebida
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

          {/* Seletor Rápido de Data */}
          <QuickDateSelector value={date} onChange={setDate} variant="emerald" />

          {/* Descrição com Autocomplete Inteligente (Preenche Categoria e Cor) */}
          <DescriptionInputAutocomplete
            value={description}
            onChange={setDescription}
            onSelectSuggestion={(suggestion: SuggestionItem) => {
              if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
              if (suggestion.accountId) setAccountId(suggestion.accountId);
            }}
            type="income"
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            variant="emerald"
          />

          {/* Categoria com Dropdown Customizado */}
          <CategorySelectorDropdown
            categories={incomeCategories}
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            variant="emerald"
          />

          {/* Conta de Entrada com Dropdown Customizado */}
          <AccountSelectorDropdown
            accounts={accounts}
            selectedAccountId={accountId}
            onSelectAccount={setAccountId}
            variant="emerald"
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

          {/* Anexo de Imagem / Comprovante */}
          <div className="pt-1">
            {attachmentUrl ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                <div
                  className="flex items-center gap-2.5 cursor-pointer group/thumb flex-1 min-w-0"
                  onClick={() => setPreviewAttachmentModalOpen(true)}
                  title="Clique para visualizar o comprovante em tamanho maior"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative flex items-center justify-center">
                    <img
                      src={attachmentUrl}
                      alt="Comprovante"
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-emerald-400 block truncate group-hover/thumb:underline">
                      Comprovante anexado
                    </span>
                    <span className="text-[10px] text-slate-400 block">Clique para ampliar</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Trocar imagem"
                  >
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-700/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-xs text-slate-400 hover:text-emerald-300 transition-all cursor-pointer group"
              >
                <Paperclip className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                <span className="font-medium">Anexar comprovante / imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
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
                  ignoreInTotals ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    ignoreInTotals ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Receita Fixa */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-slate-500" />
                Receita fixa
              </span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isRecurring ? 'bg-emerald-500' : 'bg-slate-800'
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
                    isRepeat ? 'bg-emerald-500' : 'bg-slate-800'
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
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            SALVAR
          </button>
        </div>
      </div>
      {/* Modal Lightbox para Visualização Expandida do Comprovante */}
      {previewAttachmentModalOpen && attachmentUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewAttachmentModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Comprovante da Receita
              </span>
              <button
                type="button"
                onClick={() => setPreviewAttachmentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/50 min-h-[250px]">
              <img
                src={attachmentUrl}
                alt="Comprovante da Receita"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewAttachmentModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
