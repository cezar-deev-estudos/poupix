'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CategoryIcon } from '../ui/CategoryIcon';

export const CategoryIncomeChart: React.FC = () => {
  const { filteredTransactions, categories } = useFinance();

  const incomeData = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const effectiveCatId = cat?.parentId || t.categoryId;
        categoryTotals[effectiveCatId] = (categoryTotals[effectiveCatId] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Outros',
          value: amount,
          color: cat?.color || '#10B981',
          icon: cat?.icon || 'Tag',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-base">Receitas por Categoria</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">{incomeData.length} categorias com receitas</span>
      </div>

      {incomeData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
          <p>Nenhuma receita registrada neste mês.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = ((data.value / (totalIncome || 1)) * 100).toFixed(1);
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-emerald-400 font-semibold mt-0.5">
                            {formatCurrency(data.value)} ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total</span>
              <span className="text-sm font-bold text-white">{formatCurrency(totalIncome)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {incomeData.map(item => {
              const percentage = ((item.value / (totalIncome || 1)) * 100).toFixed(1);
              return (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} size={11} />
                    </div>
                    <span className="text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-semibold text-slate-200 block">{formatCurrency(item.value)}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
