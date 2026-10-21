import React, { useState } from 'react';
import { CreditCard } from '@/types/finance';
import { CardBrandLogo } from './CardBrandLogo';
import { X, ArchiveRestore, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useFinance } from '@/context/FinanceContext';

interface ArchivedCardsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  archivedCards: CreditCard[];
  onUnarchive: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}

export const ArchivedCardsDrawer: React.FC<ArchivedCardsDrawerProps> = ({
  isOpen,
  onClose,
  archivedCards,
  onUnarchive,
  onDelete,
}) => {
  const { transactions } = useFinance();
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [blockedModalCard, setBlockedModalCard] = useState<CreditCard | null>(null);

  if (!isOpen) return null;

  const handleRequestDelete = (card: CreditCard) => {
    const hasTransactions = transactions.some(t => t.creditCardId === card.id);
    if (hasTransactions) {
      setBlockedModalCard(card);
      return;
    }
    setCardToDelete(card);
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      onDelete(cardToDelete.id);
      setCardToDelete(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-[#242428] rounded-t-3xl border-t border-slate-700/80 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
          {/* Header */}
          <div className="p-4 pb-2 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Cartões arquivados</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Cartões Arquivados */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {archivedCards.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum cartão arquivado no momento.
              </div>
            ) : (
              archivedCards.map(card => (
                <div
                  key={card.id}
                  className="bg-[#1c1c20] border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CardBrandLogo brand={card.brand} name={card.name} size="sm" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">{card.name}</h4>
                      <span className="text-xs text-slate-400">Limite: {formatCurrency(card.limit)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUnarchive(card.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      title="Desarquivar Cartão"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Desarquivar</span>
                    </button>
                    <button
                      onClick={() => handleRequestDelete(card)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      title="Excluir Definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-700/60 flex justify-end">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de bloqueio de segurança caso tenha transações */}
      <ConfirmModal
        isOpen={Boolean(blockedModalCard)}
        title="Exclusão Bloqueada"
        message={`O cartão "${blockedModalCard?.name}" possui transações registradas no seu histórico. Para proteger a integridade dos seus dados e faturas, ele não pode ser excluído. Mantenha-o arquivado.`}
        confirmLabel="Entendido"
        variant="warning"
        onConfirm={() => setBlockedModalCard(null)}
        onCancel={() => setBlockedModalCard(null)}
      />

      {/* Modal customizado de confirmação de exclusão */}
      <ConfirmModal
        isOpen={Boolean(cardToDelete)}
        title="Excluir Cartão Definitivamente"
        message={`Deseja realmente excluir permanentemente o cartão "${cardToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCardToDelete(null)}
      />
    </>
  );
};
