'use client';

import React from 'react';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDateBR, getLocalDateString } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Calendar, Wallet, CreditCard, X } from 'lucide-react';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  /** Se for fatura de cartão agrupada */
  invoiceInfo?: {
    cardName: string;
    amount: number;
    dueDate: string;
  } | null;
  onConfirm: (paymentDate?: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  currentPaid?: boolean;
  isGroupedCard?: boolean;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  isOpen,
  transaction,
  invoiceInfo,
  onConfirm,
  onCancel,
  onClose,
  currentPaid,
}) => {
  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };
  const [paymentDate, setPaymentDate] = React.useState<string>(() => getLocalDateString(new Date()));

  React.useEffect(() => {
    if (isOpen) {
      setPaymentDate(getLocalDateString(new Date()));
    }
  }, [isOpen, transaction]);

  if (!isOpen || (!transaction && !invoiceInfo)) return null;

  const isUnpaying = Boolean(transaction?.paid);
  const isInvoice = Boolean(invoiceInfo);

  const title = isUnpaying
    ? 'Desmarcar Efetivação'
    : isInvoice
    ? 'Confirmar Pagamento de Fatura'
    : transaction?.type === 'income'
    ? 'Confirmar Recebimento'
    : 'Confirmar Pagamento';

  const description = isInvoice
    ? invoiceInfo?.cardName
    : transaction?.description || 'Transação';

  const amount = isInvoice
    ? invoiceInfo?.amount || 0
    : transaction?.amount || 0;

  const type = transaction?.type || 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1c202a] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-left relative">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isUnpaying
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isUnpaying ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">
              {isUnpaying ? 'Deseja voltar o status para pendente?' : 'Confirme os dados antes de efetivar:'}
            </p>
          </div>
        </div>

        {/* Caixa Box Resumida */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Lançamento</span>
            <span className="text-xs font-semibold text-white truncate max-w-[170px]" title={description}>
              {description}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Valor</span>
            <span
              className={`text-sm font-bold ${
                type === 'income'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(amount)}
            </span>
          </div>

          {!isUnpaying && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Data da efetivação
              </span>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(paymentDate)}
            className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg ${
              isUnpaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isUnpaying ? 'Desmarcar' : 'Efetivar'}
          </button>
        </div>
      </div>
    </div>
  );
};
