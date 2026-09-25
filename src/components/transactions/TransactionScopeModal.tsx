'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types/finance';

export type ScopeMode = 'single' | 'following' | 'all';

interface TransactionScopeModalProps {
  isOpen: boolean;
  actionType: 'edit' | 'delete';
  transaction: Transaction | null;
  selectedMode: ScopeMode;
  onSelectMode: (mode: ScopeMode) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TransactionScopeModal: React.FC<TransactionScopeModalProps> = ({
  isOpen,
  actionType,
  transaction,
  selectedMode,
  onSelectMode,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !transaction) return null;

  const isInstallment = !!(
    transaction.installmentGroupId ||
    (transaction.installmentTotal && transaction.installmentTotal > 1)
  );

  const getItemLabel = () => {
    if (isInstallment) return 'Parcela';
    if (transaction.type === 'income') return 'Receita Fixa';
    if (transaction.type === 'transfer') return 'Transferência Fixa';
    if (transaction.creditCardId) return 'Despesa Cartão Fixa';
    return 'Despesa Fixa';
  };

  const isEdit = actionType === 'edit';
  const itemTypeLabel = getItemLabel();
  const title = isEdit ? `Editar ${itemTypeLabel}` : `Excluir ${itemTypeLabel}`;
  const question = isEdit
    ? 'Como você deseja aplicar esta alteração?'
    : 'Como você deseja aplicar esta exclusão?';

  const singleTitle = isInstallment
    ? 'Apenas esta parcela'
    : 'Apenas este lançamento';

  const singleDesc = isEdit
    ? 'Altera somente as informações do mês selecionado.'
    : 'Remove somente o lançamento do mês selecionado.';

  const followingTitle = isInstallment
    ? isEdit ? 'Esta e as próximas parcelas' : 'Esta e as próximas pendentes'
    : isEdit ? 'Esta e as futuras da série' : 'Esta e as futuras pendentes';

  const followingDesc = isEdit
    ? 'Aplica as novas alterações neste lançamento e nos próximos.'
    : 'Cancela os lançamentos futuros não pagos desta série.';

  const allTitle = isInstallment
    ? 'Todas as parcelas'
    : isEdit ? 'Todos os lançamentos da série' : 'Todas as despesas da série';

  const allDesc = isEdit
    ? 'Atualiza todo o histórico e parcelas vinculadas a este grupo.'
    : 'Remove todo o histórico e pendências vinculadas.';

  const confirmButtonLabel = isEdit ? 'Confirmar Alteração' : 'Confirmar Exclusão';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isEdit
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            {isEdit ? <Pencil className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-white">{title}</h4>
            <p className="text-xs text-slate-400 truncate">
              {transaction.description} ({formatCurrency(transaction.amount)})
            </p>
          </div>
        </div>

        {/* Opções de Escopo */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-300 font-medium">{question}</p>

          {/* Opção 1: Single */}
          <button
            type="button"
            onClick={() => onSelectMode('single')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMode === 'single'
                ? isEdit
                  ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                  : 'bg-rose-500/10 border-rose-500/60 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white">{singleTitle}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{singleDesc}</div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedMode === 'single'
                  ? isEdit
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-rose-500 bg-rose-500'
                  : 'border-slate-700'
              }`}
            >
              {selectedMode === 'single' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>

          {/* Opção 2: Following */}
          <button
            type="button"
            onClick={() => onSelectMode('following')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMode === 'following'
                ? isEdit
                  ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                  : 'bg-rose-500/10 border-rose-500/60 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white">{followingTitle}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{followingDesc}</div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedMode === 'following'
                  ? isEdit
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-rose-500 bg-rose-500'
                  : 'border-slate-700'
              }`}
            >
              {selectedMode === 'following' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>

          {/* Opção 3: All */}
          <button
            type="button"
            onClick={() => onSelectMode('all')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMode === 'all'
                ? isEdit
                  ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                  : 'bg-rose-500/10 border-rose-500/60 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white">{allTitle}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{allDesc}</div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedMode === 'all'
                  ? isEdit
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-rose-500 bg-rose-500'
                  : 'border-slate-700'
              }`}
            >
              {selectedMode === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
              isEdit
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
