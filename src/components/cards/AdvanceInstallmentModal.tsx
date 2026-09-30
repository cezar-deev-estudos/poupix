'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreditCard, Transaction } from '@/types/finance';

interface AdvanceInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  card: CreditCard;
  currentYear: number;
  currentMonth: number; // 0-indexed
  onConfirmAdvance: (targetPeriodKey: string) => void;
}

const MONTH_NAMES_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

export const AdvanceInstallmentModal: React.FC<AdvanceInstallmentModalProps> = ({
  isOpen,
  onClose,
  transaction,
  card,
  currentYear,
  currentMonth,
  onConfirmAdvance,
}) => {
  // Gerar opções de faturas disponíveis (a partir da fatura atual e próximas faturas)
  const invoiceOptions = React.useMemo(() => {
    const options: { periodKey: string; label: string; dateStr: string }[] = [];
    const dueDay = card.dueDay || 10;

    for (let i = 0; i < 6; i++) {
      let m = currentMonth + i;
      let y = currentYear;
      if (m > 11) {
        y += Math.floor(m / 12);
        m = m % 12;
      }
      const periodKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${dueDay} de ${MONTH_NAMES_SHORT[m]} de ${y}`;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
      options.push({ periodKey, label, dateStr });
    }
    return options;
  }, [card.dueDay, currentMonth, currentYear]);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(() => {
    return invoiceOptions[0]?.periodKey || '';
  });

  React.useEffect(() => {
    if (invoiceOptions.length > 0 && !selectedPeriodKey) {
      setSelectedPeriodKey(invoiceOptions[0].periodKey);
    }
  }, [invoiceOptions, selectedPeriodKey]);

  if (!isOpen || !transaction) return null;

  const handleContinue = () => {
    if (selectedPeriodKey) {
      onConfirmAdvance(selectedPeriodKey);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#242428] border border-slate-700/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-left relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Antecipar parcelas
          </h3>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {transaction.description}
          </p>
        </div>

        {/* Pergunta */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-200 leading-snug">
            Para qual fatura gostaria de enviar suas parcelas antecipadas?
          </p>

          {/* Lista de Opções de Faturas */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {invoiceOptions.map(opt => {
              const isSelected = selectedPeriodKey === opt.periodKey;
              return (
                <button
                  key={opt.periodKey}
                  type="button"
                  onClick={() => setSelectedPeriodKey(opt.periodKey)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500/10 border-teal-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-teal-400 bg-teal-500' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <span className="text-xs font-medium text-slate-200">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl border border-teal-500/30 hover:bg-teal-500/10 text-teal-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer text-center"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
