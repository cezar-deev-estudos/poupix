'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { PendingBankTransaction, Transaction } from '@/types/finance';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import {
  X,
  Check,
  Trash2,
  Link as LinkIcon,
  CheckCheck,
  Building2,
  Sparkles,
  CreditCard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface BankReconciliationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankReconciliationDrawer: React.FC<BankReconciliationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    pendingBankTransactions,
    approveBankTransaction,
    discardBankTransaction,
    linkBankTransaction,
    approveAllBankTransactions,
    categories,
    accounts,
    creditCards,
    transactions,
  } = useFinance();

  const [linkingPendingId, setLinkingPendingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1c202a] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Conciliação Bancária</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {pendingBankTransactions.length} pendentes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Revise e aprove as transações recebidas via Open Finance antes de adicioná-las.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar de Ações em Massa */}
        {pendingBankTransactions.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">
              Confira os itens abaixo ou aprove todos de uma vez:
            </span>
            <button
              onClick={approveAllBankTransactions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Aprovar Todas</span>
            </button>
          </div>
        )}

        {/* Lista de Transações Bancárias Pendentes */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {pendingBankTransactions.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Tudo em dia!</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Não há novas transações pendentes de conciliação. As próximas movimentações aparecerão aqui.
                </p>
              </div>
            </div>
          ) : (
            pendingBankTransactions.map((item) => {
              const cat = categories.find((c) => c.id === item.suggestedCategoryId);
              const acc = accounts.find((a) => a.id === item.accountId);
              const card = creditCards.find((c) => c.id === item.creditCardId);
              const isExpense = item.type === 'expense';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#242937] border border-slate-700/60 space-y-3 shadow-md transition-all"
                >
                  {/* Topo do Card: Origem bancária + Data + Valor */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block line-clamp-1">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-purple-400">
                            <Building2 className="w-3 h-3" />
                            {item.institutionName}
                          </span>
                          <span>•</span>
                          <span>{formatDateBR(item.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold block ${
                          isExpense ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isExpense ? '- ' : '+ '}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Sugestão de Categoria Inteligente & Destino */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Categoria sugerida:</span>
                      <span className="font-semibold text-white px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                        {cat?.name || 'Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      {card ? (
                        <>
                          <CreditCard className="w-3 h-3 text-cyan-400" />
                          <span>{card.name}</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          <span>{acc?.name || 'Conta Padrão'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Modo de Vinculação com Transação Existente */}
                  {linkingPendingId === item.id ? (
                    <div className="p-3 bg-slate-900 rounded-xl space-y-2 border border-slate-700/80 animate-fadeIn">
                      <span className="text-[11px] font-semibold text-slate-300 block">
                        Selecione a transação manual já lançada para vincular:
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 no-scrollbar">
                        {transactions
                          .filter((t) => t.type === item.type)
                          .slice(0, 5)
                          .map((existing) => (
                            <button
                              key={existing.id}
                              type="button"
                              onClick={() => {
                                linkBankTransaction(item.id, existing.id);
                                setLinkingPendingId(null);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left text-xs transition-colors"
                            >
                              <span className="text-slate-200 truncate pr-2">{existing.description}</span>
                              <span className="font-bold text-white shrink-0">
                                {formatCurrency(existing.amount)}
                              </span>
                            </button>
                          ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setLinkingPendingId(null)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Cancelar vinculação
                      </button>
                    </div>
                  ) : (
                    /* Botões de Ação Rápida */
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {/* Descartar */}
                      <button
                        type="button"
                        onClick={() => discardBankTransaction(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Descartar transação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Vincular */}
                      <button
                        type="button"
                        onClick={() => setLinkingPendingId(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                        title="Vincular a uma transação existente"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden sm:inline">Vincular</span>
                      </button>

                      {/* Aprovar (OK) */}
                      <button
                        type="button"
                        onClick={() => approveBankTransaction(item.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Aprovar</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
