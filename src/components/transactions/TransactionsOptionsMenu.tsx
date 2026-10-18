import React from 'react';
import { SavedTransactionFilter } from '@/types/finance';
import { Bookmark, BookmarkPlus, Trash2, Check } from 'lucide-react';

interface TransactionsOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  groupByCard: boolean;
  onToggleGroupByCard: () => void;
  alertPending: boolean;
  onToggleAlertPending: () => void;
  onOpenReceipts?: () => void;
  savedFilters?: SavedTransactionFilter[];
  activeFilterId?: string | null;
  onApplySavedFilter?: (filter: SavedTransactionFilter) => void;
  onOpenSaveFilterModal?: () => void;
  onDeleteSavedFilter?: (id: string) => void;
  onClearActiveSavedFilter?: () => void;
}

export const TransactionsOptionsMenu: React.FC<TransactionsOptionsMenuProps> = ({
  isOpen,
  onClose,
  groupByCard,
  onToggleGroupByCard,
  alertPending,
  onToggleAlertPending,
  onOpenReceipts,
  savedFilters = [],
  activeFilterId,
  onApplySavedFilter,
  onOpenSaveFilterModal,
  onDeleteSavedFilter,
  onClearActiveSavedFilter,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-72 bg-[#232733] border border-slate-700/80 rounded-2xl shadow-2xl z-40 p-3 animate-scaleUp text-xs text-slate-200 space-y-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenReceipts?.();
          }}
          className="w-full text-left py-1 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
        >
          Recibos
        </button>

        {/* SEÇÃO: FILTROS SALVOS */}
        <div className="pt-2 border-t border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              Filtros Salvos
            </span>
            {onOpenSaveFilterModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSaveFilterModal();
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Salvar o filtro e busca atuais com um nome"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                + Salvar atual
              </button>
            )}
          </div>

          {activeFilterId && onClearActiveSavedFilter && (
            <button
              type="button"
              onClick={() => {
                onClearActiveSavedFilter();
                onClose();
              }}
              className="w-full text-left py-1 px-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 text-[11px] transition-all cursor-pointer flex items-center justify-between"
            >
              <span>✕ Limpar filtro ativo</span>
            </button>
          )}

          {savedFilters.length === 0 ? (
            <p className="text-[11px] text-slate-500 py-0.5">
              Nenhum filtro salvo. Clique em "+ Salvar atual" para guardar sua busca.
            </p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {savedFilters.map((sf) => {
                const isActive = activeFilterId === sf.id;
                return (
                  <div
                    key={sf.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-xl transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-indigo-600/30 border border-indigo-500/50 text-white font-semibold'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 border border-transparent text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onApplySavedFilter?.(sf);
                        onClose();
                      }}
                      className="flex-1 text-left truncate flex items-center gap-1.5 mr-1"
                    >
                      {isActive && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                      <span className="truncate text-xs">{sf.name}</span>
                      {sf.scope === 'year' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 shrink-0">
                          Ano todo
                        </span>
                      )}
                    </button>

                    {onDeleteSavedFilter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedFilter(sf.id);
                        }}
                        className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 transition-all rounded"
                        title="Excluir filtro salvo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-700/50">
          Opções de visualização
        </div>

        {/* Toggle: Agrupar por Cartão */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-300">Agrupar por Cartão</span>
          <button
            type="button"
            onClick={onToggleGroupByCard}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              groupByCard ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                groupByCard ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle: Alerta de transações pendentes */}
        <div className="flex items-center justify-between py-1 border-t border-slate-700/50 pt-2">
          <span className="text-xs text-slate-300">Alerta de transações pendentes</span>
          <button
            type="button"
            onClick={onToggleAlertPending}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              alertPending ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                alertPending ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </>
  );
};

