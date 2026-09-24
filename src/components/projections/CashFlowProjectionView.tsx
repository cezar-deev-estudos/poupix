'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { calculateCashFlowProjections } from '@/lib/cashflow';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export const CashFlowProjectionView: React.FC = () => {
  const { summary, transactions } = useFinance();
  const [monthsAhead, setMonthsAhead] = useState<6 | 12>(12);

  // Calcular dados de projeção usando o algoritmo inteligente
  const projections = useMemo(() => {
    return calculateCashFlowProjections(summary.totalBalance, transactions, monthsAhead);
  }, [summary.totalBalance, transactions, monthsAhead]);

  // Formatar dados para os gráficos do Recharts
  const chartData = projections.map(p => ({
    name: p.label,
    Receitas: p.projectedIncome,
    Despesas: p.projectedExpense + p.projectedCardInvoice,
    SaldoAcumulado: p.accumulatedBalance,
    FaturasCartao: p.projectedCardInvoice,
  }));

  const endProjectedBalance = projections[projections.length - 1]?.accumulatedBalance || 0;
  const balanceGrowth = endProjectedBalance - summary.totalBalance;

  return (
    <div className="space-y-6">
      {/* Top Banner de Projeção */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Projeção Financeira Inteligente</span>
          </div>
          <h2 className="text-2xl font-black text-white">Previsão de Fluxo de Caixa</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Simulação calculada com base nos lançamentos futuros, compras parceladas no cartão de crédito e receitas recorrentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthsAhead(6)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              monthsAhead === 6
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Próximos 6 Meses
          </button>
          <button
            onClick={() => setMonthsAhead(12)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              monthsAhead === 12
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Próximos 12 Meses
          </button>
        </div>
      </div>

      {/* Cards de Métricas da Projeção */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Saldo Atual Disponível</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">
            R$ {summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 block">Consolidado em todas as contas</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Patrimônio Previsto ({monthsAhead} meses)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400">
            R$ {endProjectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold block">
            {balanceGrowth >= 0 ? '+' : ''} R$ {balanceGrowth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de crescimento
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Média de Economia Líquida</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white">
            R$ {(balanceGrowth / monthsAhead).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span className="text-xs text-slate-400 font-normal"> / mês</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Capacidade média de poupança</span>
        </div>
      </div>

      {/* Gráfico de Evolução do Saldo Acumulado */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Curva de Acúmulo de Saldo Previsto</h3>
            <p className="text-xs text-slate-400">Evolução do saldo projetado mês a mês</p>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-semibold">
            {monthsAhead} Meses
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 11 }}
                tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                }}
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo Projetado']}
              />
              <Area
                type="monotone"
                dataKey="SaldoAcumulado"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Comparativo: Receitas vs Despesas Previstas */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Entradas vs. Saídas Projetadas</h3>
          <p className="text-xs text-slate-400">Projeção mensal de receitas, custos fixos e faturas futuras</p>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 11 }}
                tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '16px',
                }}
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Detalhada Mês a Mês */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Detalhamento Mensal da Projeção</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Mês/Ano</th>
                <th className="pb-3 font-semibold">Receitas Previstas</th>
                <th className="pb-3 font-semibold">Despesas & Contas</th>
                <th className="pb-3 font-semibold">Faturas de Cartão</th>
                <th className="pb-3 font-semibold">Fluxo Líquido</th>
                <th className="pb-3 font-semibold text-right">Saldo Final Projetado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projections.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {p.label}
                  </td>
                  <td className="py-3 text-emerald-400 font-semibold">
                    + R$ {p.projectedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-slate-300">
                    - R$ {p.projectedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-amber-400">
                    - R$ {p.projectedCardInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 font-bold ${p.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.netFlow >= 0 ? '+' : ''} R$ {p.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 font-black text-right text-white">
                    R$ {p.accumulatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
