'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { getMonthName } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const MonthSelector: React.FC = () => {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useFinance();

  const handlePrev = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNext = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleCurrent = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-2xl p-1.5 shadow-lg">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
        title="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-3 py-1 cursor-pointer" onClick={handleCurrent} title="Ir para o mês atual">
        <Calendar className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-slate-100 min-w-[130px] text-center select-none text-sm md:text-base">
          {getMonthName(selectedMonth)} {selectedYear}
        </span>
      </div>

      <button
        onClick={handleNext}
        className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
        title="Próximo mês"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
