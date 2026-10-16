'use client';

import React, { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { Flame, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ExpenseHeatmapCalendarProps {
  transactions: Transaction[];
  year: number;
  month: number; // 0 a 11
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string) => void;
  compact?: boolean;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const ExpenseHeatmapCalendar: React.FC<ExpenseHeatmapCalendarProps> = ({
  transactions,
  year,
  month,
  selectedDate,
  onSelectDate,
  compact = false,
}) => {
  // 1. Agrupar despesas por dia (YYYY-MM-DD)
  const { dailyTotals, maxExpense, weekendRatio, activeDaysCount, totalMonthExpenses } = useMemo(() => {
    const totals: Record<string, number> = {};
    let max = 0;
    let weekendSum = 0;
    let weekendDays = 0;
    let weekdaySum = 0;
    let weekdayDays = 0;
    let totalAll = 0;

    transactions.forEach(t => {
      // Considerar apenas despesas (exceto ignoradas se houver flag)
      if (t.type !== 'expense' && !t.creditCardId) return;
      if (t.type === 'income') return;

      const dateStr = t.date ? t.date.split('T')[0] : '';
      if (!dateStr) return;

      const [y, m] = dateStr.split('-').map(Number);
      if (y === year && m === month + 1) {
        totals[dateStr] = (totals[dateStr] || 0) + t.amount;
        totalAll += t.amount;
      }
    });

    Object.entries(totals).forEach(([dateStr, amount]) => {
      if (amount > max) max = amount;
      const d = new Date(`${dateStr}T12:00:00`);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendSum += amount;
        weekendDays++;
      } else {
        weekdaySum += amount;
        weekdayDays++;
      }
    });

    const avgWeekend = weekendDays > 0 ? weekendSum / weekendDays : 0;
    const avgWeekday = weekdayDays > 0 ? weekdaySum / weekdayDays : 0;
    const ratio = avgWeekday > 0 ? avgWeekend / avgWeekday : 0;

    return {
      dailyTotals: totals,
      maxExpense: max,
      weekendRatio: ratio,
      activeDaysCount: Object.keys(totals).length,
      totalMonthExpenses: totalAll,
    };
  }, [transactions, year, month]);

  // 2. Construir matriz de dias do mês (com offset inicial)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      amount: number;
      isToday: boolean;
      level: 0 | 1 | 2 | 3 | 4;
    }> = [];

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateStr: null, amount: 0, isToday: false, level: 0 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const amount = dailyTotals[dateStr] || 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;

      if (amount > 0 && maxExpense > 0) {
        const ratio = amount / maxExpense;
        if (ratio < 0.15) level = 1;
        else if (ratio < 0.45) level = 2;
        else if (ratio < 0.75) level = 3;
        else level = 4;
      }

      days.push({
        dayNumber: d,
        dateStr,
        amount,
        isToday: dateStr === todayStr,
        level,
      });
    }

    return days;
  }, [year, month, dailyTotals, maxExpense]);

  // Cores idênticas ao design do app (laranja escuro -> laranja brilhante -> magenta/rosa choque)
  const getLevelStyle = (level: number, isSelected: boolean) => {
    switch (level) {
      case 1:
        return 'bg-[#7c3f1b] text-amber-200 border-transparent hover:brightness-110';
      case 2:
        return 'bg-[#d95d13] text-white border-transparent hover:brightness-110';
      case 3:
        return 'bg-[#ea580c] text-white shadow-md shadow-orange-950/40 border-transparent hover:brightness-110';
      case 4:
        return 'bg-[#e11d74] text-white shadow-md shadow-pink-950/50 border-transparent hover:brightness-110';
      default:
        return isSelected
          ? 'bg-slate-800 text-slate-200'
          : 'bg-slate-900/40 text-slate-600 hover:text-slate-400 border-transparent';
    }
  };

  const formatShortAmount = (val: number) => {
    if (val === 0) return '';
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return Math.round(val).toString();
  };

  return (
    <div className={`bg-[#181b24] border border-slate-800/90 rounded-3xl shadow-2xl text-slate-100 ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
      {/* Cabeçalho do Card */}
      <div className={`flex items-center justify-between ${compact ? 'mb-2.5' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`${compact ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-xl'} bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner`}>
            <Flame className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-orange-400/30 stroke-[2.5]`} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Mapa de calor
            </h4>
            <span className="text-[10px] sm:text-[11px] text-orange-400/90 font-medium block">
              gasto por dia
            </span>
          </div>
        </div>

        {totalMonthExpenses > 0 && (
          <div className="text-right">
            <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-medium">Total do mês</span>
            <span className="text-xs font-bold text-white">
              {formatCurrency(totalMonthExpenses)}
            </span>
          </div>
        )}
      </div>

      {/* Grade dos Dias da Semana */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-1 text-center mb-1' : 'gap-1.5 sm:gap-2 text-center mb-2'}`}>
        {WEEKDAYS.map((w, idx) => (
          <div key={idx} className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-500 py-0.5`}>
            {w}
          </div>
        ))}
      </div>

      {/* Grade de Células do Calendário */}
      <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-1.5 sm:gap-2'}`}>
        {calendarDays.map((cell, idx) => {
          if (!cell.dayNumber) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const isSelected = selectedDate === cell.dateStr;
          const levelClass = getLevelStyle(cell.level, isSelected);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => cell.dateStr && onSelectDate?.(cell.dateStr)}
              className={`group relative aspect-square rounded-xl sm:rounded-2xl flex flex-col justify-between ${compact ? 'p-1' : 'p-1 sm:p-1.5'} transition-all duration-150 cursor-pointer ${levelClass} ${
                isSelected
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#181b24] scale-105 z-10'
                  : cell.isToday
                  ? 'ring-1.5 ring-slate-400'
                  : ''
              }`}
            >
              {/* Número do dia */}
              <span
                className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-[11px]'} font-semibold leading-none text-left ${
                  cell.level > 0 ? 'text-white/90' : 'text-slate-500'
                }`}
              >
                {cell.dayNumber}
              </span>

              {/* Valor abreviado no fundo da célula */}
              {cell.amount > 0 ? (
                <span className={`${compact ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[9px] sm:text-[10px]'} font-bold text-right tracking-tight leading-none truncate`}>
                  {formatShortAmount(cell.amount)}
                </span>
              ) : (
                <span className="h-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Rodapé com Legenda e Insight Comportamental */}
      <div className={`${compact ? 'mt-2.5 pt-2' : 'mt-4 pt-3.5'} border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs`}>
        {/* Legenda de Intensidade */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
          <span>menos</span>
          <span className="w-2 h-2 rounded-full bg-[#7c3f1b]" />
          <span className="w-2 h-2 rounded-full bg-[#d95d13]" />
          <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
          <span className="w-2 h-2 rounded-full bg-[#e11d74]" />
          <span>mais</span>
        </div>

        {/* Insight Inteligente */}
        {weekendRatio > 1.2 ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-300 text-[10px] sm:text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span>fins de semana: {weekendRatio.toFixed(1)}x mais caros</span>
          </div>
        ) : activeDaysCount > 0 ? (
          <div className="text-[10px] sm:text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">{activeDaysCount}</span> dias com gastos no mês
          </div>
        ) : null}
      </div>
    </div>
  );
};
