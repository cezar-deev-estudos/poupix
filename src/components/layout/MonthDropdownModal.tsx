'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface MonthDropdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthDropdownModal: React.FC<MonthDropdownModalProps> = ({ isOpen, onClose }) => {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useFinance();

  if (!isOpen) return null;

  const handleSelectMonth = (index: number) => {
    setSelectedMonth(index);
    onClose();
  };

  const handlePrevYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const handleGoCurrent = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    onClose();
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#1c202a] border border-slate-800 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Selecionar Período</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Ano */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-2">
          <button
            onClick={handlePrevYear}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Ano anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-white text-base tracking-wide">{selectedYear}</span>
          <button
            onClick={handleNextYear}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Próximo ano"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Grade de 12 Meses */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((month, idx) => {
            const isSelected = selectedMonth === idx;
            const isCurrent = currentYear === selectedYear && currentMonth === idx;

            return (
              <button
                key={month}
                onClick={() => handleSelectMonth(idx)}
                className={`py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : isCurrent
                    ? 'bg-slate-900 border border-purple-500/50 text-purple-300 hover:bg-slate-800'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{month.slice(0, 3)}</span>
                {isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Botão Ir para Mês Atual */}
        <button
          onClick={handleGoCurrent}
          className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-purple-400 font-bold text-xs uppercase tracking-wider transition-all border border-purple-500/20 cursor-pointer"
        >
          Ir para Mês Atual
        </button>
      </div>
    </div>
  );
};
