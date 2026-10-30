'use client';

import React, { useState } from 'react';
import { Category, Transaction, Account, CreditCard, NanoCategory } from '@/types/finance';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { getTransactionInvoicePeriod } from '@/lib/invoiceHelpers';
import { ChevronDown, ChevronRight, CreditCard as CreditCardIcon, Check, Plus, Tag } from 'lucide-react';

interface SubcategoryNanoGroupListProps {
  sub: Category;
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  onSelectTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onManageNanos: () => void;
}

export const SubcategoryNanoGroupList: React.FC<SubcategoryNanoGroupListProps> = ({
  sub,
  transactions,
  accounts,
  creditCards,
  onSelectTransaction,
  onUpdateTransaction,
  onManageNanos,
}) => {
  // Nanos iniciam fechados por padrão; "Outros lançamentos" inicia sempre aberto
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    _others: true,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const current = key === '_others' ? prev[key] !== false : Boolean(prev[key]);
      return {
        ...prev,
        [key]: !current,
      };
    });
  };

  const isGroupExpanded = (key: string) => {
    if (key === '_others') {
      return expandedGroups[key] !== false;
    }
    return Boolean(expandedGroups[key]);
  };

  const renderTransactionRow = (tx: Transaction, isInsideNano: boolean = false) => {
    const acc = accounts.find(a => a.id === tx.accountId);
    const card = creditCards.find(c => c.id === tx.creditCardId);
    const invoicePeriod = card ? getTransactionInvoicePeriod(tx, card) : null;
    const isEffectivelyPaid =
      tx.paid ||
      (card && invoicePeriod
        ? card.manualInvoiceStatus?.[invoicePeriod.periodKey] === 'paid'
        : false);
    const accountLabel = card ? card.name : (acc?.name || 'Conta');

    // Quando for item de nano-categoria: se tiver observação (notes), exibe a observação; se não, exibe o nome original
    const displayName = isInsideNano && tx.notes && tx.notes.trim()
      ? tx.notes.trim()
      : tx.description;

    return (
      <div
        key={tx.id}
        onClick={() => onSelectTransaction(tx)}
        className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer group/tx text-[11px] ${
          isEffectivelyPaid
            ? 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-900/40 hover:border-emerald-700/60'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/60 hover:border-slate-700'
        }`}
        title="Clique para editar lançamento"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`font-medium truncate transition-colors ${
              isEffectivelyPaid
                ? 'text-emerald-400'
                : 'text-slate-200 group-hover/tx:text-emerald-400'
            }`}
          >
            {displayName}
          </span>
          <span
            className={`text-[10px] shrink-0 ${
              isEffectivelyPaid ? 'text-emerald-500/80' : 'text-slate-500'
            }`}
          >
            {formatDateBR(tx.date)}
          </span>
          {card && (
            <>
              <span
                className="sm:hidden inline-flex items-center text-cyan-400 shrink-0"
                title={`Cartão: ${accountLabel}`}
              >
                <CreditCardIcon className="w-3 h-3" />
              </span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[10px] shrink-0 ${
                  isEffectivelyPaid ? 'text-emerald-400/90' : 'text-cyan-400/80'
                }`}
              >
                <CreditCardIcon className="w-3 h-3" />
                <span className="truncate max-w-[90px]">{accountLabel}</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          <span
            className={`font-semibold text-xs ${
              isEffectivelyPaid ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(tx.amount)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateTransaction(tx.id, { paid: !isEffectivelyPaid });
            }}
            className={`w-4 h-4 rounded flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
              isEffectivelyPaid
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-rose-500 text-white hover:bg-rose-400'
            }`}
            title={
              isEffectivelyPaid
                ? 'Pago (Clique para marcar pendente)'
                : 'Pendente (Clique para pagar)'
            }
          >
            {isEffectivelyPaid ? (
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            ) : (
              <span className="text-[10px] font-black leading-none">!</span>
            )}
          </button>
        </div>
      </div>
    );
  };

  const nanos = sub.nanoCategories || [];

  // Se a subcategoria NÃO tiver nano-categorias cadastradas, exibe a listagem flat normal
  if (nanos.length === 0) {
    return (
      <div className="pt-2 border-t border-slate-800/80 pl-1.5 sm:pl-6 space-y-1.5">
        {transactions.map(tx => renderTransactionRow(tx, false))}
      </div>
    );
  }

  // Agrupamento por Nano-Categorias
  // Faz match por: exato, prefixo ("Pão - Padaria"), ou contém a palavra
  const matchesNano = (desc: string, nanoName: string) => {
    const d = desc.trim().toLowerCase();
    const n = nanoName.trim().toLowerCase();
    if (!d || !n) return false;
    return d === n || d.startsWith(n + ' ') || d.startsWith(n + '-') || d.startsWith(n + '/');
  };

  const assignedTxIds = new Set<string>();

  const nanoGroups = nanos.map(nano => {
    const matched = transactions.filter(tx => {
      if (assignedTxIds.has(tx.id)) return false;
      if (matchesNano(tx.description, nano.name)) {
        assignedTxIds.add(tx.id);
        return true;
      }
      return false;
    });

    const totalSpent = matched.reduce((sum, t) => sum + t.amount, 0);
    const budget = nano.budgetLimit || 0;
    const percent = budget > 0 ? (totalSpent / budget) * 100 : 0;
    const isOver = budget > 0 && totalSpent > budget;

    return {
      nano,
      transactions: matched,
      totalSpent,
      budget,
      percent,
      isOver,
    };
  });

  const otherTransactions = transactions.filter(tx => !assignedTxIds.has(tx.id));
  const otherTotalSpent = otherTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="pt-2 border-t border-slate-800/80 pl-1.5 sm:pl-6 space-y-2">
      {nanoGroups.map(group => {
        const isExpanded = isGroupExpanded(group.nano.id);
        const hasTxs = group.transactions.length > 0;

        return (
          <div
            key={group.nano.id}
            className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden"
          >
            {/* Header do Grupo de Nano-Categoria */}
            <div
              onClick={() => hasTxs && toggleGroup(group.nano.id)}
              className={`flex items-center justify-between p-2 text-xs transition-colors ${
                hasTxs ? 'cursor-pointer hover:bg-slate-900/60' : 'opacity-70'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {hasTxs ? (
                  <button
                    type="button"
                    className="p-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="w-3.5 h-3.5" />
                )}

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">{group.nano.name}</span>
                <span className="text-[10px] text-slate-400 font-normal shrink-0">
                  ({group.transactions.length}x)
                </span>

                {group.budget > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline shrink-0">
                    • Teto: {formatCurrency(group.budget)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {/* Mini Barra de Progresso no Desktop */}
                {group.budget > 0 && (
                  <div className="hidden md:block w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        group.percent > 100 ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, group.percent)}%` }}
                    />
                  </div>
                )}

                <span className={`font-semibold ${group.isOver ? 'text-rose-400' : 'text-white'}`}>
                  {formatCurrency(group.totalSpent)}
                </span>
              </div>
            </div>

            {/* Lista dos Lançamentos da Nano-Categoria */}
            {isExpanded && hasTxs && (
              <div className="p-2 pt-0 space-y-1.5 border-t border-slate-900">
                {group.transactions.map(tx => renderTransactionRow(tx, true))}
              </div>
            )}
          </div>
        );
      })}

      {/* Grupo Outros (Avulsos) */}
      {otherTransactions.length > 0 && (
        <div className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden">
          <div
            onClick={() => toggleGroup('_others')}
            className="flex items-center justify-between p-2 text-xs cursor-pointer hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                className="p-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {isGroupExpanded('_others') ? (
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              <Tag className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-300">Outros lançamentos</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({otherTransactions.length}x)
              </span>
            </div>
            <span className="font-semibold text-slate-300">
              {formatCurrency(otherTotalSpent)}
            </span>
          </div>

          {isGroupExpanded('_others') && (
            <div className="p-2 pt-0 space-y-1.5 border-t border-slate-900">
              {otherTransactions.map(tx => renderTransactionRow(tx, false))}
            </div>
          )}
        </div>
      )}

      {/* Atalho para gerenciar nano-categorias */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onManageNanos}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3 text-emerald-400" />
          <span>Gerenciar Nano-Categorias de {sub.name}</span>
        </button>
      </div>
    </div>
  );
};
