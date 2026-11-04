'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { reconcileAllDecreasingExpenses } from '@/lib/decreasingExpenses';
import { getTransactionInvoicePeriod, isSameId } from '@/lib/invoiceHelpers';
import {
  Table,
  ChevronDown,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  HelpCircle,
  Layers3,
  ChevronLeft,
} from 'lucide-react';

const MONTH_SHORT_NAMES = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

interface AnnualMatrixReportViewProps {
  onBack?: () => void;
}

export const AnnualMatrixReportView: React.FC<AnnualMatrixReportViewProps> = () => {
  const { transactions, categories, creditCards, selectedYear: currentYear } = useFinance();
  const [reportYear, setReportYear] = useState<number>(currentYear || new Date().getFullYear());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');

  // Categorias ativas
  const activeCategories = useMemo(() => categories.filter(c => !c.isArchived), [categories]);
  const parentIncomeCategories = useMemo(() => activeCategories.filter(c => !c.parentId && c.type === 'income'), [activeCategories]);
  const parentExpenseCategories = useMemo(() => activeCategories.filter(c => !c.parentId && c.type === 'expense'), [activeCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    activeCategories.forEach(c => {
      if (!c.parentId) next[c.id] = true;
    });
    setExpandedCategories(next);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Mapa rápido de transações por Mês e por Categoria/Subcategoria
  // monthIndex (0..11) -> { [categoryId]: number }
  const matrixData = useMemo(() => {
    // Inicializa estrutura de 12 meses
    const monthlyIncomeTotals: number[] = Array(12).fill(0);
    const monthlyExpenseTotals: number[] = Array(12).fill(0);
    const catMonthTotals: Record<string, number[]> = {};

    activeCategories.forEach(c => {
      catMonthTotals[c.id] = Array(12).fill(0);
    });

    // Reconcilia despesas decrescentes com despesas do mesmo mês e mesma nanoTag
    const reconciled = reconcileAllDecreasingExpenses(transactions, creditCards, categories);

    reconciled.forEach(tx => {
      if (tx.ignoreInTotals) return;
      if (/^Pagamento de Fatura\s*-\s*/i.test(tx.description)) return;

      // Respeitar o período exato da fatura do cartão ou a data da transação
      let txYear = 0;
      let txMonth = -1; // 0..11

      if (tx.creditCardId) {
        const card = creditCards.find(c => isSameId(c.id, tx.creditCardId));
        const invoicePeriod = getTransactionInvoicePeriod(tx, card);
        txYear = invoicePeriod.year;
        txMonth = invoicePeriod.month;
      } else if (tx.date) {
        const [yStr, mStr] = tx.date.split('-');
        txYear = parseInt(yStr, 10);
        txMonth = parseInt(mStr, 10) - 1; // 0..11
      }

      if (txYear !== reportYear || txMonth < 0 || txMonth > 11) return;

      if (tx.type === 'income') {
        monthlyIncomeTotals[txMonth] += tx.amount;
      } else if (tx.type === 'expense') {
        monthlyExpenseTotals[txMonth] += tx.amount;
      }

      // Mapear com segurança a categoria/subcategoria usando isSameId
      const matchedCat = activeCategories.find(c => isSameId(c.id, tx.categoryId));
      if (matchedCat && catMonthTotals[matchedCat.id]) {
        catMonthTotals[matchedCat.id][txMonth] += tx.amount;
      } else if (catMonthTotals[tx.categoryId]) {
        catMonthTotals[tx.categoryId][txMonth] += tx.amount;
      }
    });

    // Calcular fluxo de caixa mensal e acumulado
    const monthlyCashFlow: number[] = Array(12).fill(0);
    const monthlyAccumulated: number[] = Array(12).fill(0);
    let runningAccumulated = 0;

    for (let m = 0; m < 12; m++) {
      monthlyCashFlow[m] = monthlyIncomeTotals[m] - monthlyExpenseTotals[m];
      runningAccumulated += monthlyCashFlow[m];
      monthlyAccumulated[m] = runningAccumulated;
    }

    return {
      monthlyIncomeTotals,
      monthlyExpenseTotals,
      catMonthTotals,
      monthlyCashFlow,
      monthlyAccumulated,
    };
  }, [transactions, creditCards, categories, activeCategories, reportYear]);

  // Obter valor somado de um mês para uma categoria pai (incluindo subcategorias filhas)
  const getParentCategoryMonthTotal = (parentCat: Category, monthIdx: number) => {
    const parentVal = matrixData.catMonthTotals[parentCat.id]?.[monthIdx] || 0;
    const subs = activeCategories.filter(c => isSameId(c.parentId, parentCat.id));
    const subsVal = subs.reduce((sum, s) => sum + (matrixData.catMonthTotals[s.id]?.[monthIdx] || 0), 0);
    return parentVal + subsVal;
  };

  // Obter total anual de uma categoria pai
  const getParentCategoryAnnualTotal = (parentCat: Category) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      total += getParentCategoryMonthTotal(parentCat, m);
    }
    return total;
  };

  // Obter total anual de uma subcategoria
  const getSubcategoryAnnualTotal = (subCat: Category) => {
    const monthly = matrixData.catMonthTotals[subCat.id] || [];
    return monthly.reduce((sum, v) => sum + v, 0);
  };

  // Exportar para CSV formatado em matriz horizontal
  const handleExportCSV = () => {
    const headers = ['Grupo / Categoria', ...MONTH_SHORT_NAMES, 'TOTAL ANUAL'];
    const rows: string[][] = [];

    // Receitas
    rows.push(['--- RECEITAS ---', ...Array(13).fill('')]);
    parentIncomeCategories.forEach(p => {
      const monthVals = MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(p, m).toFixed(2).replace('.', ','));
      rows.push([`"${p.name}"`, ...monthVals, getParentCategoryAnnualTotal(p).toFixed(2).replace('.', ',')]);
    });
    rows.push([
      '"TOTAL RECEITAS"',
      ...matrixData.monthlyIncomeTotals.map(v => v.toFixed(2).replace('.', ',')),
      matrixData.monthlyIncomeTotals.reduce((a, b) => a + b, 0).toFixed(2).replace('.', ',')
    ]);

    // Despesas
    rows.push(['--- DESPESAS ---', ...Array(13).fill('')]);
    parentExpenseCategories.forEach(p => {
      const monthVals = MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(p, m).toFixed(2).replace('.', ','));
      rows.push([`"${p.name}"`, ...monthVals, getParentCategoryAnnualTotal(p).toFixed(2).replace('.', ',')]);
      const subs = activeCategories.filter(c => isSameId(c.parentId, p.id));
      subs.forEach(s => {
        const subMonthVals = MONTH_SHORT_NAMES.map((_, m) => (matrixData.catMonthTotals[s.id]?.[m] || 0).toFixed(2).replace('.', ','));
        rows.push([`"   - ${s.name}"`, ...subMonthVals, getSubcategoryAnnualTotal(s).toFixed(2).replace('.', ',')]);
      });
    });
    rows.push([
      '"TOTAL DESPESAS"',
      ...matrixData.monthlyExpenseTotals.map(v => v.toFixed(2).replace('.', ',')),
      matrixData.monthlyExpenseTotals.reduce((a, b) => a + b, 0).toFixed(2).replace('.', ',')
    ]);

    // Fluxo de Caixa
    rows.push([
      '"FLUXO DE CAIXA LÍQUIDO"',
      ...matrixData.monthlyCashFlow.map(v => v.toFixed(2).replace('.', ',')),
      matrixData.monthlyCashFlow.reduce((a, b) => a + b, 0).toFixed(2).replace('.', ',')
    ]);
    rows.push([
      '"SALDO ACUMULADO"',
      ...matrixData.monthlyAccumulated.map(v => v.toFixed(2).replace('.', ',')),
      matrixData.monthlyAccumulated[11].toFixed(2).replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poupix_Matriz_Horizontal_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAnnualIncome = matrixData.monthlyIncomeTotals.reduce((a, b) => a + b, 0);
  const totalAnnualExpense = matrixData.monthlyExpenseTotals.reduce((a, b) => a + b, 0);
  const totalAnnualCashFlow = totalAnnualIncome - totalAnnualExpense;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Barra Superior de Controle do Relatório Horizontal */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Demonstrativo Consolidado Anual</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300">
                {reportYear}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Visão horizontal detalhada mês a mês de receitas, despesas e fluxo de caixa acumulado.
            </p>
          </div>
        </div>

        {/* Controles de Ano, Filtros e Ações */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Seletor de Ano */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={() => setReportYear(y => y - 1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-white tabular-nums">{reportYear}</span>
            <button
              type="button"
              onClick={() => setReportYear(y => y + 1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro de Visão */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Receitas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Despesas
            </button>
          </div>

          {/* Botões de Expandir / Recolher */}
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Expandir todas as subcategorias"
          >
            Expandir
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Recolher subcategorias"
          >
            Recolher
          </button>

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Exportar planilha completa em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo Anual no Topo da Planilha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Receitas Totais {reportYear}</span>
            <span className="text-base font-bold text-emerald-400">{formatCurrency(totalAnnualIncome)}</span>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-400/40" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Despesas Totais {reportYear}</span>
            <span className="text-base font-bold text-rose-400">{formatCurrency(totalAnnualExpense)}</span>
          </div>
          <TrendingDown className="w-6 h-6 text-rose-400/40" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Saldo do Ano (Fluxo Líquido)</span>
            <span className={`text-base font-bold ${totalAnnualCashFlow >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {formatCurrency(totalAnnualCashFlow)}
            </span>
          </div>
          <Layers3 className="w-6 h-6 text-teal-400/40" />
        </div>
      </div>

      {/* Grade Matricial Horizontal (Tabela com Colunas dos 12 Meses) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            {/* Cabeçalho da Matriz */}
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300">
                <th className="p-3 sticky left-0 z-20 bg-slate-950 font-bold uppercase tracking-wider text-[11px] w-64 min-w-[240px] border-r border-slate-800/80 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                  {reportYear} / Categorias
                </th>
                {MONTH_SHORT_NAMES.map(m => (
                  <th key={m} className="p-2.5 text-right font-bold text-[11px] min-w-[80px]">
                    {m}
                  </th>
                ))}
                <th className="p-2.5 text-right font-bold text-[11px] min-w-[105px] bg-slate-900/90 text-teal-300 border-l border-slate-800">
                  TOTAL
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 text-slate-200">
              {/* ================= SEÇÃO: RECEITAS ================= */}
              {(activeTab === 'all' || activeTab === 'income') && (
                <>
                  <tr className="bg-emerald-950/40 text-emerald-300 font-bold border-t border-b border-emerald-500/30">
                    <td className="p-2.5 pl-3 sticky left-0 z-10 bg-emerald-950/90 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RECEITAS</span>
                      </div>
                    </td>
                    {matrixData.monthlyIncomeTotals.map((tot, idx) => (
                      <td key={idx} className="p-2.5 text-right tabular-nums font-semibold">
                        {tot > 0 ? formatCurrency(tot) : '-'}
                      </td>
                    ))}
                    <td className="p-2.5 text-right tabular-nums font-black text-emerald-400 bg-emerald-950/60 border-l border-slate-800">
                      {formatCurrency(totalAnnualIncome)}
                    </td>
                  </tr>

                  {/* Categorias de Receita */}
                  {parentIncomeCategories.map(cat => {
                    const annualTot = getParentCategoryAnnualTotal(cat);
                    const subs = activeCategories.filter(c => isSameId(c.parentId, cat.id));
                    const isExpanded = Boolean(expandedCategories[cat.id]);

                    return (
                      <React.Fragment key={cat.id}>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-2.5 pl-5 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800 font-medium text-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2">
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(cat.id)}
                                  className="p-0.5 text-slate-400 hover:text-white transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}
                              <span className="truncate">{cat.name}</span>
                            </div>
                          </td>
                          {MONTH_SHORT_NAMES.map((_, m) => {
                            const val = getParentCategoryMonthTotal(cat, m);
                            return (
                              <td key={m} className="p-2 text-right tabular-nums text-slate-300">
                                {val > 0 ? formatCurrency(val) : <span className="text-slate-600">-</span>}
                              </td>
                            );
                          })}
                          <td className="p-2 text-right tabular-nums font-bold text-white bg-slate-900/50 border-l border-slate-800">
                            {annualTot > 0 ? formatCurrency(annualTot) : '-'}
                          </td>
                        </tr>

                        {/* Subcategorias de Receita */}
                        {isExpanded && subs.map(sub => {
                          const subAnnual = getSubcategoryAnnualTotal(sub);
                          return (
                            <tr key={sub.id} className="bg-slate-950/40 hover:bg-slate-800/20 text-xs">
                              <td className="p-2 pl-9 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 text-slate-400 font-normal shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                <span className="truncate">• {sub.name}</span>
                              </td>
                              {MONTH_SHORT_NAMES.map((_, m) => {
                                const val = matrixData.catMonthTotals[sub.id]?.[m] || 0;
                                return (
                                  <td key={m} className="p-2 text-right tabular-nums text-slate-400">
                                    {val > 0 ? formatCurrency(val) : <span className="text-slate-700">-</span>}
                                  </td>
                                );
                              })}
                              <td className="p-2 text-right tabular-nums text-slate-300 font-medium bg-slate-950/60 border-l border-slate-800">
                                {subAnnual > 0 ? formatCurrency(subAnnual) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              {/* ================= SEÇÃO: DESPESAS ================= */}
              {(activeTab === 'all' || activeTab === 'expense') && (
                <>
                  <tr className="bg-rose-950/40 text-rose-300 font-bold border-t border-b border-rose-500/30">
                    <td className="p-2.5 pl-3 sticky left-0 z-10 bg-rose-950/90 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>DESPESAS / CONTAS</span>
                      </div>
                    </td>
                    {matrixData.monthlyExpenseTotals.map((tot, idx) => (
                      <td key={idx} className="p-2.5 text-right tabular-nums font-semibold">
                        {tot > 0 ? formatCurrency(tot) : '-'}
                      </td>
                    ))}
                    <td className="p-2.5 text-right tabular-nums font-black text-rose-400 bg-rose-950/60 border-l border-slate-800">
                      {formatCurrency(totalAnnualExpense)}
                    </td>
                  </tr>

                  {/* Categorias de Despesas */}
                  {parentExpenseCategories.map(cat => {
                    const annualTot = getParentCategoryAnnualTotal(cat);
                    const subs = activeCategories.filter(c => isSameId(c.parentId, cat.id));
                    const isExpanded = Boolean(expandedCategories[cat.id]);

                    return (
                      <React.Fragment key={cat.id}>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-2.5 pl-5 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800 font-medium text-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2">
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(cat.id)}
                                  className="p-0.5 text-slate-400 hover:text-white transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}
                              <span className="truncate">{cat.name}</span>
                            </div>
                          </td>
                          {MONTH_SHORT_NAMES.map((_, m) => {
                            const val = getParentCategoryMonthTotal(cat, m);
                            return (
                              <td key={m} className="p-2 text-right tabular-nums text-slate-300">
                                {val > 0 ? formatCurrency(val) : <span className="text-slate-600">-</span>}
                              </td>
                            );
                          })}
                          <td className="p-2 text-right tabular-nums font-bold text-white bg-slate-900/50 border-l border-slate-800">
                            {annualTot > 0 ? formatCurrency(annualTot) : '-'}
                          </td>
                        </tr>

                        {/* Subcategorias de Despesa */}
                        {isExpanded && subs.map(sub => {
                          const subAnnual = getSubcategoryAnnualTotal(sub);
                          return (
                            <tr key={sub.id} className="bg-slate-950/40 hover:bg-slate-800/20 text-xs">
                              <td className="p-2 pl-9 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 text-slate-400 font-normal shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                <span className="truncate">• {sub.name}</span>
                              </td>
                              {MONTH_SHORT_NAMES.map((_, m) => {
                                const val = matrixData.catMonthTotals[sub.id]?.[m] || 0;
                                return (
                                  <td key={m} className="p-2 text-right tabular-nums text-slate-400">
                                    {val > 0 ? formatCurrency(val) : <span className="text-slate-700">-</span>}
                                  </td>
                                );
                              })}
                              <td className="p-2 text-right tabular-nums text-slate-300 font-medium bg-slate-950/60 border-l border-slate-800">
                                {subAnnual > 0 ? formatCurrency(subAnnual) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              {/* ================= SEÇÃO: RESULTADOS E FLUXO ================= */}
              {activeTab === 'all' && (
                <>
                  {/* Linha 1: Fluxo de Caixa Líquido do Mês */}
                  <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700">
                    <td className="p-3 pl-3 sticky left-0 z-10 bg-slate-950 border-r border-slate-800 text-white shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="w-3.5 h-3.5 text-teal-400" />
                        <span>FLUXO DE CAIXA (LÍQUIDO)</span>
                      </div>
                    </td>
                    {matrixData.monthlyCashFlow.map((cf, idx) => (
                      <td
                        key={idx}
                        className={`p-2.5 text-right tabular-nums font-bold ${
                          cf >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(cf)}
                      </td>
                    ))}
                    <td
                      className={`p-2.5 text-right tabular-nums font-black border-l border-slate-800 ${
                        totalAnnualCashFlow >= 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {formatCurrency(totalAnnualCashFlow)}
                    </td>
                  </tr>

                  {/* Linha 2: Saldo Acumulado */}
                  <tr className="bg-teal-950/30 font-bold border-t border-slate-800">
                    <td className="p-3 pl-3 sticky left-0 z-10 bg-teal-950/90 border-r border-slate-800 text-teal-300 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-teal-400" />
                        <span>FLUXO ACUMULADO</span>
                      </div>
                    </td>
                    {matrixData.monthlyAccumulated.map((acc, idx) => (
                      <td
                        key={idx}
                        className={`p-2.5 text-right tabular-nums font-bold ${
                          acc >= 0 ? 'text-teal-300' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(acc)}
                      </td>
                    ))}
                    <td
                      className={`p-2.5 text-right tabular-nums font-black border-l border-slate-800 ${
                        matrixData.monthlyAccumulated[11] >= 0 ? 'text-teal-300 bg-teal-950/60' : 'text-rose-400 bg-rose-950/60'
                      }`}
                    >
                      {formatCurrency(matrixData.monthlyAccumulated[11])}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

