'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, getShortMonthName } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

export const CashflowHistoryChart: React.FC = () => {
  const { transactions, selectedYear } = useFinance();

  const monthlyCashflow = React.useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: getShortMonthName(i),
      income: 0,
      expense: 0,
      monthIndex: i,
    }));

    transactions.forEach(t => {
      if (!t.date) return;
      const [tYear, tMonth] = t.date.split('-').map(Number);
      if (tYear === selectedYear && tMonth >= 1 && tMonth <= 12) {
        const idx = tMonth - 1;
        if (t.type === 'income') {
          data[idx].income += t.amount;
        } else if (t.type === 'expense') {
          data[idx].expense += t.amount;
        }
      }
    });

    return data;
  }, [transactions, selectedYear]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-base">Evolução Mensal ({selectedYear})</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">Receitas vs. Despesas</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-white mb-1.5">{label} / {selectedYear}</p>
                      <p className="text-teal-400 font-medium">
                        Receitas: {formatCurrency(Number(payload[0]?.value) || 0)}
                      </p>
                      <p className="text-rose-400 font-medium">
                        Despesas: {formatCurrency(Number(payload[1]?.value) || 0)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            <Bar name="Receitas" dataKey="income" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar name="Despesas" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
