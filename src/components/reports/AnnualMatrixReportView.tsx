'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category, AnnualBudgetBaseline } from '@/types/finance';
import { formatCurrency } from '@/lib/utils';
import { reconcileAllDecreasingExpenses, getMatchingNanoName, normalizeKey } from '@/lib/decreasingExpenses';
import { getTransactionInvoicePeriod, isSameId } from '@/lib/invoiceHelpers';
import { fetchBaselinesByYear, saveBudgetBaseline, updateBudgetBaseline, deleteBudgetBaseline } from '@/lib/supabase/baselineService';
import { BaselineManageModal } from './BaselineManageModal';
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
  Camera,
  Lock,
  Eye,
} from 'lucide-react';

const MONTH_SHORT_NAMES = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

interface AnnualMatrixReportViewProps {
  onBack?: () => void;
}

export const AnnualMatrixReportView: React.FC<AnnualMatrixReportViewProps> = () => {
  const { transactions, categories, creditCards, selectedMonth, selectedYear: currentYear, userId } = useFinance();
  const [reportYear, setReportYear] = useState<number>(currentYear || new Date().getFullYear());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income' | 'compare'>('all');

  // Estado das Baselines / Snapshots Congelados (armazenados no Supabase)
  const [baselines, setBaselines] = useState<AnnualBudgetBaseline[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [compareBaselineId, setCompareBaselineId] = useState<string | null>(null);
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [baselineModalTab, setBaselineModalTab] = useState<'save' | 'manage'>('save');
  const [isLoadingBaselines, setIsLoadingBaselines] = useState(false);

  // Carregar snapshots do ano atual selecionado direto do Supabase
  const loadYearBaselines = useCallback(async () => {
    if (!userId) return;
    setIsLoadingBaselines(true);
    try {
      const data = await fetchBaselinesByYear(userId, reportYear);
      setBaselines(data);
      // Se a baseline selecionada anteriormente não pertencer a este ano, desmarca
      setSelectedBaselineId(prev => {
        if (!prev) return null;
        return data.some(b => b.id === prev) ? prev : null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBaselines(false);
    }
  }, [userId, reportYear]);

  useEffect(() => {
    loadYearBaselines();
  }, [loadYearBaselines]);

  // Baseline atualmente selecionada para visualização de foto congelada
  const activeBaseline = useMemo(() => {
    if (!selectedBaselineId) return null;
    return baselines.find(b => b.id === selectedBaselineId) || null;
  }, [baselines, selectedBaselineId]);

  // Identificação do Mês Atual para destaque na matriz horizontal
  const isCurrentYear = reportYear === (currentYear || new Date().getFullYear());
  const currentMonthIndex = typeof selectedMonth === 'number' && selectedMonth >= 0 && selectedMonth <= 11
    ? selectedMonth
    : new Date().getMonth();

  // Helper para estilizar a coluna do Mês Atual de forma consistente
  const getCurrentMonthColClass = (mIdx: number, extraClasses = '') => {
    if (!isCurrentYear || mIdx !== currentMonthIndex) {
      return extraClasses;
    }
    return `${extraClasses} bg-teal-500/10 border-x-2 border-teal-500/60 relative`;
  };

  const isCompareMode = activeTab === 'compare';

  // Baseline ativa para comparação (ou a selecionada explicitamente, ou a Base Original por padrão)
  const effectiveCompareBaseline = useMemo(() => {
    if (compareBaselineId) {
      const found = baselines.find(b => b.id === compareBaselineId);
      if (found) return found;
    }
    const original = baselines.find(b => b.type === 'original');
    return original || baselines[0] || null;
  }, [baselines, compareBaselineId]);

  // Mapa de busca rápida por categoria/sub/nano na baseline comparativa
  const compareLookup = useMemo(() => {
    if (!effectiveCompareBaseline) return null;
    const snap = effectiveCompareBaseline.matrixSnapshot;
    
    // catId -> { monthly: number[], total: number }
    const catMap: Record<string, { monthly: number[]; total: number }> = {};
    // subId -> { monthly: number[], total: number }
    const subMap: Record<string, { monthly: number[]; total: number }> = {};
    // subId_nanoKey -> { monthly: number[], total: number }
    const nanoMap: Record<string, { monthly: number[]; total: number }> = {};

    const processCategories = (catList: typeof snap.incomeCategories) => {
      catList.forEach(c => {
        catMap[c.id] = { monthly: c.monthlyValues, total: c.total };
        c.subcategories.forEach(s => {
          subMap[s.id] = { monthly: s.monthlyValues, total: s.total };
          s.nanos.forEach(n => {
            const key = `${s.id}_${normalizeKey(n.name)}`;
            nanoMap[key] = { monthly: n.monthlyValues, total: n.total };
          });
        });
      });
    };

    processCategories(snap.incomeCategories);
    processCategories(snap.expenseCategories);

    return {
      catMap,
      subMap,
      nanoMap,
      incomeTotals: snap.monthlyIncomeTotals,
      expenseTotals: snap.monthlyExpenseTotals,
      netTotals: snap.monthlyNetTotals,
      summary: effectiveCompareBaseline.summaryTotals,
    };
  }, [effectiveCompareBaseline]);

  // Categorias ativas
  const activeCategories = useMemo(() => categories.filter(c => !c.isArchived), [categories]);
  const parentIncomeCategories = useMemo(() => activeCategories.filter(c => !c.parentId && c.type === 'income'), [activeCategories]);
  const parentExpenseCategories = useMemo(() => activeCategories.filter(c => !c.parentId && c.type === 'expense'), [activeCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleExpandSubcategory = (subId: string) => {
    setExpandedSubcategories(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const expandAll = () => {
    const nextCats: Record<string, boolean> = {};
    const nextSubs: Record<string, boolean> = {};
    activeCategories.forEach(c => {
      if (!c.parentId) {
        nextCats[c.id] = true;
      } else if (c.nanoCategories && c.nanoCategories.length > 0) {
        nextSubs[c.id] = true;
      }
    });
    setExpandedCategories(nextCats);
    setExpandedSubcategories(nextSubs);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedSubcategories({});
  };

  // Mapa rápido de transações por Mês e por Categoria/Subcategoria
  // monthIndex (0..11) -> { [categoryId]: number }
  const matrixData = useMemo(() => {
    // Inicializa estrutura de 12 meses
    const monthlyIncomeTotals: number[] = Array(12).fill(0);
    const monthlyExpenseTotals: number[] = Array(12).fill(0);
    const catMonthTotals: Record<string, number[]> = {};
    // nanoMonthTotals[subcategoryId][nanoKey] = [m0, m1, ..., m11]
    const nanoMonthTotals: Record<string, Record<string, number[]>> = {};

    activeCategories.forEach(c => {
      catMonthTotals[c.id] = Array(12).fill(0);
      if (c.parentId && c.nanoCategories && c.nanoCategories.length > 0) {
        nanoMonthTotals[c.id] = {};
        c.nanoCategories.forEach(nano => {
          nanoMonthTotals[c.id][normalizeKey(nano.name)] = Array(12).fill(0);
        });
        nanoMonthTotals[c.id]['_others'] = Array(12).fill(0);
      }
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
      const targetCatId = matchedCat?.id || tx.categoryId;
      if (catMonthTotals[targetCatId]) {
        catMonthTotals[targetCatId][txMonth] += tx.amount;
      }

      // Se a categoria for subcategoria com nanos registradas, computar também na nano correspondente
      if (matchedCat && matchedCat.parentId && matchedCat.nanoCategories && matchedCat.nanoCategories.length > 0) {
        const subId = matchedCat.id;
        const subNanos = matchedCat.nanoCategories;
        const matchedNanoKey = getMatchingNanoName(tx, [matchedCat]);

        if (nanoMonthTotals[subId]) {
          const isKnownNano = matchedNanoKey && subNanos.some(n => normalizeKey(n.name) === matchedNanoKey);
          if (isKnownNano && matchedNanoKey && nanoMonthTotals[subId][matchedNanoKey]) {
            nanoMonthTotals[subId][matchedNanoKey][txMonth] += tx.amount;
          } else {
            nanoMonthTotals[subId]['_others'][txMonth] += tx.amount;
          }
        }
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
      nanoMonthTotals,
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

  // Obter total anual de uma nano-categoria
  const getNanoCategoryAnnualTotal = (subId: string, nanoKey: string) => {
    const monthly = matrixData.nanoMonthTotals[subId]?.[nanoKey] || [];
    return monthly.reduce((sum, v) => sum + v, 0);
  };

  // Filtrar nano-categorias que devem aparecer no relatório anual:
  // - A nano deve estar ativa (active !== false)
  // - Se tiver ano definido (nano.year), deve ser igual ao reportYear
  // - OU se o próprio nome contiver ano (ex: "2026"), só exibe se for o reportYear selecionado ou se tiver movimentação real
  const getVisibleNanosForYear = (sub: Category) => {
    if (!sub.nanoCategories || sub.nanoCategories.length === 0) return [];
    return sub.nanoCategories.filter(nano => {
      // Se estiver desativada explicitamente, não exibe
      if (nano.active === false) return false;

      // Se tiver ano fixado específico (ex: 2026), só exibe no relatório daquele ano
      if (nano.year !== undefined && nano.year !== null) {
        return nano.year === reportYear;
      }

      // Se o próprio nome contiver indicação de ano (ex: "2026", "2027"), respeitar caso não seja o reportYear e tiver total 0
      const nanoKey = normalizeKey(nano.name);
      const nanoAnnual = getNanoCategoryAnnualTotal(sub.id, nanoKey);
      
      const yearMatch = nano.name.match(/\b(20\d\d)\b/);
      if (yearMatch) {
        const foundYear = parseInt(yearMatch[1], 10);
        if (foundYear !== reportYear && nanoAnnual === 0) {
          return false;
        }
      }

      return true;
    });
  };

  // Exportar para CSV formatado em matriz horizontal
  const handleExportCSV = () => {
    const headers = ['Grupo / Categoria', ...MONTH_SHORT_NAMES, 'TOTAL ANUAL'];
    const rows: string[][] = [];

    // Receitas (Ordenadas do maior para o menor valor)
    rows.push(['--- RECEITAS ---', ...Array(13).fill('')]);
    [...parentIncomeCategories]
      .sort((a, b) => getParentCategoryAnnualTotal(b) - getParentCategoryAnnualTotal(a))
      .forEach(p => {
        const monthVals = MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(p, m).toFixed(2).replace('.', ','));
        rows.push([`"${p.name}"`, ...monthVals, getParentCategoryAnnualTotal(p).toFixed(2).replace('.', ',')]);
        const subs = activeCategories
          .filter(c => isSameId(c.parentId, p.id))
          .sort((a, b) => getSubcategoryAnnualTotal(b) - getSubcategoryAnnualTotal(a));
        subs.forEach(s => {
        const subMonthVals = MONTH_SHORT_NAMES.map((_, m) => (matrixData.catMonthTotals[s.id]?.[m] || 0).toFixed(2).replace('.', ','));
        rows.push([`"   - ${s.name}"`, ...subMonthVals, getSubcategoryAnnualTotal(s).toFixed(2).replace('.', ',')]);
        const visibleNanos = getVisibleNanosForYear(s);
        if (visibleNanos.length > 0) {
          visibleNanos.forEach(nano => {
            const nanoKey = normalizeKey(nano.name);
            const nanoVals = MONTH_SHORT_NAMES.map((_, m) => (matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0).toFixed(2).replace('.', ','));
            rows.push([`"      * ${nano.name}"`, ...nanoVals, getNanoCategoryAnnualTotal(s.id, nanoKey).toFixed(2).replace('.', ',')]);
          });
        }
      });
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
        const visibleNanos = getVisibleNanosForYear(s);
        if (visibleNanos.length > 0) {
          visibleNanos.forEach(nano => {
            const nanoKey = normalizeKey(nano.name);
            const nanoVals = MONTH_SHORT_NAMES.map((_, m) => (matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0).toFixed(2).replace('.', ','));
            rows.push([`"      * ${nano.name}"`, ...nanoVals, getNanoCategoryAnnualTotal(s.id, nanoKey).toFixed(2).replace('.', ',')]);
          });
        }
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

  // Totais Anuais para Cards de Resumo e Snapshot
  const currentAnnualIncome = matrixData.monthlyIncomeTotals.reduce((a, b) => a + b, 0);
  const currentAnnualExpense = matrixData.monthlyExpenseTotals.reduce((a, b) => a + b, 0);
  const currentAnnualCashFlow = currentAnnualIncome - currentAnnualExpense;

  const totalAnnualIncome = activeBaseline
    ? activeBaseline.summaryTotals.totalIncome
    : currentAnnualIncome;

  const totalAnnualExpense = activeBaseline
    ? activeBaseline.summaryTotals.totalExpense
    : currentAnnualExpense;

  const totalAnnualCashFlow = activeBaseline
    ? activeBaseline.summaryTotals.netBalance
    : currentAnnualCashFlow;

  // Helper para renderizar célula comparativa de desvio
  const renderCellWithDiff = (
    currentVal: number,
    baseVal: number | undefined,
    type: 'income' | 'expense' | 'net'
  ) => {
    // Formatação do valor principal
    const formatValue = (val: number) => {
      if (type === 'net') {
        // Fluxo de caixa líquido ou acumulado pode ser positivo, negativo ou zero
        if (Math.abs(val) > 0.001) {
          return formatCurrency(val);
        }
        return 'R$ 0,00';
      }
      return val > 0 ? formatCurrency(val) : '-';
    };

    if (!isCompareMode || baseVal === undefined) {
      const formatted = formatValue(currentVal);
      return (
        <span className="text-right tabular-nums">
          {formatted === '-' ? <span className="text-slate-600">-</span> : formatted}
        </span>
      );
    }

    const diff = currentVal - baseVal;
    const isZero = Math.abs(diff) < 0.01;

    let diffColor = 'text-slate-500';
    let indicator = '';

    if (!isZero) {
      if (type === 'expense') {
        // Gastou a mais que o plano = ruim (vermelho)
        // Gastou a menos que o plano = economia (verde)
        if (diff > 0) {
          diffColor = 'text-rose-400 font-bold';
          indicator = '▲';
        } else {
          diffColor = 'text-emerald-400 font-bold';
          indicator = '▼';
        }
      } else {
        // Receitas ou Resultado Líquido: maior = bom (verde), menor = ruim (vermelho)
        if (diff > 0) {
          diffColor = 'text-emerald-400 font-bold';
          indicator = '▲';
        } else {
          diffColor = 'text-rose-400 font-bold';
          indicator = '▼';
        }
      }
    }

    const mainValText = formatValue(currentVal);

    return (
      <div className="flex flex-col items-end leading-tight py-0.5">
        <span className={`tabular-nums font-semibold ${
          type === 'net'
            ? (currentVal >= 0 ? 'text-emerald-400' : 'text-rose-400')
            : 'text-slate-200'
        }`}>
          {mainValText}
        </span>
        <span className={`text-[9px] tabular-nums flex items-center gap-0.5 ${diffColor}`}>
          {isZero ? (
            <span className="text-slate-500">meta ok</span>
          ) : (
            <>
              <span>{diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}</span>
              <span className="text-[8px]">{indicator}</span>
            </>
          )}
        </span>
      </div>
    );
  };
  const displayIncomeTotals = activeBaseline
    ? activeBaseline.matrixSnapshot.monthlyIncomeTotals
    : matrixData.monthlyIncomeTotals;

  const displayExpenseTotals = activeBaseline
    ? activeBaseline.matrixSnapshot.monthlyExpenseTotals
    : matrixData.monthlyExpenseTotals;

  const displayNetTotals = activeBaseline
    ? activeBaseline.matrixSnapshot.monthlyNetTotals
    : matrixData.monthlyCashFlow;

  const displayAccumulatedTotals = useMemo(() => {
    if (activeBaseline) {
      let acc = 0;
      return displayNetTotals.map(v => {
        acc += v;
        return acc;
      });
    }
    return matrixData.monthlyAccumulated;
  }, [activeBaseline, displayNetTotals, matrixData.monthlyAccumulated]);

  // Lista de Categorias de Receita
  const displayIncomeCategories = useMemo(() => {
    if (activeBaseline) {
      return activeBaseline.matrixSnapshot.incomeCategories;
    }
    return [...parentIncomeCategories]
      .sort((a, b) => getParentCategoryAnnualTotal(b) - getParentCategoryAnnualTotal(a))
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        monthlyValues: MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(cat, m)),
        total: getParentCategoryAnnualTotal(cat),
        subcategories: activeCategories
          .filter(c => isSameId(c.parentId, cat.id))
          .sort((a, b) => getSubcategoryAnnualTotal(b) - getSubcategoryAnnualTotal(a))
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            color: sub.color,
            icon: sub.icon,
            monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.catMonthTotals[sub.id]?.[m] || 0),
            total: getSubcategoryAnnualTotal(sub),
            nanos: getVisibleNanosForYear(sub).map(nano => {
              const nanoKey = normalizeKey(nano.name);
              return {
                name: nano.name,
                monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[sub.id]?.[nanoKey]?.[m] || 0),
                total: getNanoCategoryAnnualTotal(sub.id, nanoKey),
              };
            }),
          })),
      }));
  }, [activeBaseline, parentIncomeCategories, activeCategories, matrixData, reportYear]);

  // Lista de Categorias de Despesa
  const displayExpenseCategories = useMemo(() => {
    if (activeBaseline) {
      return activeBaseline.matrixSnapshot.expenseCategories;
    }
    return [...parentExpenseCategories].map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      monthlyValues: MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(cat, m)),
      total: getParentCategoryAnnualTotal(cat),
      subcategories: activeCategories
        .filter(c => isSameId(c.parentId, cat.id))
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          color: sub.color,
          icon: sub.icon,
          monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.catMonthTotals[sub.id]?.[m] || 0),
          total: getSubcategoryAnnualTotal(sub),
          nanos: getVisibleNanosForYear(sub).map(nano => {
            const nanoKey = normalizeKey(nano.name);
            return {
              name: nano.name,
              monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[sub.id]?.[nanoKey]?.[m] || 0),
              total: getNanoCategoryAnnualTotal(sub.id, nanoKey),
            };
          }),
        })),
    }));
  }, [activeBaseline, parentExpenseCategories, activeCategories, matrixData, reportYear]);

  // Função para salvar snapshot da tela atual na nuvem
  const handleSaveSnapshot = async (type: 'original' | 'revision', notes?: string) => {
    if (!userId) return;

    // Constrói árvore estruturada com categorias, subcategorias e nanos
    const buildCategoryTree = (type: 'income' | 'expense') => {
      const parents = activeCategories.filter(c => !c.parentId && c.type === type);
      return parents.map(p => {
        const pMonthly = MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(p, m));
        const pTotal = getParentCategoryAnnualTotal(p);
        const subs = activeCategories.filter(c => isSameId(c.parentId, p.id));
        
        const subItems = subs.map(s => {
          const sMonthly = MONTH_SHORT_NAMES.map((_, m) => matrixData.catMonthTotals[s.id]?.[m] || 0);
          const sTotal = getSubcategoryAnnualTotal(s);
          const visibleNanos = getVisibleNanosForYear(s);
          
          const nanoItems = visibleNanos.map(nano => {
            const nanoKey = normalizeKey(nano.name);
            const nMonthly = MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0);
            const nTotal = getNanoCategoryAnnualTotal(s.id, nanoKey);
            return {
              name: nano.name,
              monthlyValues: nMonthly,
              total: nTotal,
            };
          });

          return {
            id: s.id,
            name: s.name,
            color: s.color,
            icon: s.icon,
            monthlyValues: sMonthly,
            total: sTotal,
            nanos: nanoItems,
          };
        });

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          color: p.color,
          icon: p.icon,
          monthlyValues: pMonthly,
          total: pTotal,
          subcategories: subItems,
        };
      });
    };

    const snapshotPayload = {
      incomeCategories: buildCategoryTree('income'),
      expenseCategories: buildCategoryTree('expense'),
      monthlyIncomeTotals: [...matrixData.monthlyIncomeTotals],
      monthlyExpenseTotals: [...matrixData.monthlyExpenseTotals],
      monthlyNetTotals: [...matrixData.monthlyCashFlow],
    };

    const existingRevisions = baselines.filter(b => b.type === 'revision');
    const revisionNumber = type === 'revision' ? (existingRevisions.length >= 2 ? 2 : existingRevisions.length + 1) : null;
    const title = type === 'original'
      ? `Plano Original ${reportYear}`
      : `Revisão 0${revisionNumber || 1} - ${new Date().toLocaleDateString('pt-BR')}`;

    // Se já existe uma base original e estamos salvando como original, sobrescreve a existente
    const existingOriginal = baselines.find(b => b.type === 'original');
    if (type === 'original' && existingOriginal) {
      await updateBudgetBaseline(existingOriginal.id, {
        title,
        notes,
        matrixSnapshot: snapshotPayload,
        summaryTotals: {
          totalIncome: currentAnnualIncome,
          totalExpense: currentAnnualExpense,
          netBalance: currentAnnualCashFlow,
        },
      });
    } else {
      await saveBudgetBaseline(userId, {
        userId,
        year: reportYear,
        type,
        revisionNumber,
        title,
        notes,
        matrixSnapshot: snapshotPayload,
        summaryTotals: {
          totalIncome: currentAnnualIncome,
          totalExpense: currentAnnualExpense,
          netBalance: currentAnnualCashFlow,
        },
      });
    }

    await loadYearBaselines();
  };

  // Atualizar snapshot existente com os dados atuais da tela
  const handleOverwriteSnapshot = async (id: string) => {
    if (!userId) return;
    const target = baselines.find(b => b.id === id);
    if (!target) return;

    // Reconstrói a árvore atual
    const buildCategoryTree = (type: 'income' | 'expense') => {
      const parents = activeCategories.filter(c => !c.parentId && c.type === type);
      return parents.map(p => {
        const pMonthly = MONTH_SHORT_NAMES.map((_, m) => getParentCategoryMonthTotal(p, m));
        const pTotal = getParentCategoryAnnualTotal(p);
        const subs = activeCategories.filter(c => isSameId(c.parentId, p.id));
        
        const subItems = subs.map(s => {
          const sMonthly = MONTH_SHORT_NAMES.map((_, m) => matrixData.catMonthTotals[s.id]?.[m] || 0);
          const sTotal = getSubcategoryAnnualTotal(s);
          const visibleNanos = getVisibleNanosForYear(s);
          
          const nanoItems = visibleNanos.map(nano => {
            const nanoKey = normalizeKey(nano.name);
            const nMonthly = MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0);
            const nTotal = getNanoCategoryAnnualTotal(s.id, nanoKey);
            return {
              name: nano.name,
              monthlyValues: nMonthly,
              total: nTotal,
            };
          });

          return {
            id: s.id,
            name: s.name,
            color: s.color,
            icon: s.icon,
            monthlyValues: sMonthly,
            total: sTotal,
            nanos: nanoItems,
          };
        });

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          color: p.color,
          icon: p.icon,
          monthlyValues: pMonthly,
          total: pTotal,
          subcategories: subItems,
        };
      });
    };

    const snapshotPayload = {
      incomeCategories: buildCategoryTree('income'),
      expenseCategories: buildCategoryTree('expense'),
      monthlyIncomeTotals: [...matrixData.monthlyIncomeTotals],
      monthlyExpenseTotals: [...matrixData.monthlyExpenseTotals],
      monthlyNetTotals: [...matrixData.monthlyCashFlow],
    };

    await updateBudgetBaseline(id, {
      matrixSnapshot: snapshotPayload,
      summaryTotals: {
        totalIncome: currentAnnualIncome,
        totalExpense: currentAnnualExpense,
        netBalance: currentAnnualCashFlow,
      },
    });

    await loadYearBaselines();
  };

  // Excluir snapshot do Supabase
  const handleDeleteBaseline = async (id: string) => {
    await deleteBudgetBaseline(id);
    if (selectedBaselineId === id) {
      setSelectedBaselineId(null);
    }
    await loadYearBaselines();
  };

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
            <button
              type="button"
              onClick={() => {
                setActiveTab('compare');
                // Se estava em modo foto congelada estática, remove para comparar Tempo Real com a Base
                if (selectedBaselineId) setSelectedBaselineId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 border border-amber-500/60 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Comparar valores realizados em tempo real contra a meta congelada da Base/Revisão"
            >
              <span>⚖️ Comparativo</span>
              {baselines.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
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

          {/* Botão 1: Congelar Plano Atual */}
          <button
            type="button"
            onClick={() => {
              setBaselineModalTab('save');
              setIsBaselineModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40"
            title="Tirar uma foto congelada do planejamento atual deste ano"
          >
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>Congelar</span>
          </button>

          {/* Botão 2: Visualizar Versões Salvas */}
          <button
            type="button"
            onClick={() => {
              setBaselineModalTab('manage');
              setIsBaselineModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer ${
              activeBaseline
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Visualizar versões congeladas e revisões salvas"
          >
            {activeBaseline ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {activeBaseline
                ? (activeBaseline.type === 'original' ? 'Base Original' : `Rev 0${activeBaseline.revisionNumber || 1}`)
                : `Visualizar (${baselines.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Banner Informativo no Modo Comparativo */}
      {isCompareMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 text-amber-200 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <span className="text-base">⚖️</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white text-sm">
                  Modo Comparativo de Desvios
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Tempo Real vs. Meta Congelada
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Valores em verde indicam economia em despesas ou superávit em receitas. Valores em vermelho indicam estouro orçamentário.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {baselines.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Comparar com:</span>
                <select
                  value={effectiveCompareBaseline?.id || ''}
                  onChange={(e) => setCompareBaselineId(e.target.value)}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {baselines.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[11px] text-amber-400 font-semibold px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30">
                Nenhuma foto congelada salva para comparar
              </span>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Banner Informativo quando uma versão congelada estiver ativa */}
      {activeBaseline && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {activeBaseline.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 border border-amber-500/50 uppercase">
                  Somente Leitura (Foto Congelada)
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                {activeBaseline.notes || 'Snapshot histórico congelado para comparação anual.'} • Gravado em{' '}
                {new Date(activeBaseline.createdAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(activeBaseline.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedBaselineId(null)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Voltar ao Tempo Real
            </button>
            <button
              type="button"
              onClick={() => setIsBaselineModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Trocar Versão
            </button>
          </div>
        </div>
      )}

      {/* Cards de Resumo Anual no Topo da Planilha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Receitas Totais {reportYear}</span>
            <span className="text-base font-bold text-emerald-400">{formatCurrency(totalAnnualIncome)}</span>
            {isCompareMode && compareLookup && (
              <span className={`text-[10px] block font-semibold ${totalAnnualIncome >= compareLookup.summary.totalIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalAnnualIncome >= compareLookup.summary.totalIncome ? '+' : ''}
                {formatCurrency(totalAnnualIncome - compareLookup.summary.totalIncome)} vs. meta
              </span>
            )}
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-400/40" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Despesas Totais {reportYear}</span>
            <span className="text-base font-bold text-rose-400">{formatCurrency(totalAnnualExpense)}</span>
            {isCompareMode && compareLookup && (
              <span className={`text-[10px] block font-semibold ${totalAnnualExpense <= compareLookup.summary.totalExpense ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalAnnualExpense > compareLookup.summary.totalExpense ? '+' : ''}
                {formatCurrency(totalAnnualExpense - compareLookup.summary.totalExpense)} vs. meta
              </span>
            )}
          </div>
          <TrendingDown className="w-6 h-6 text-rose-400/40" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[11px] block">Saldo do Ano (Fluxo Líquido)</span>
            <span className={`text-base font-bold ${totalAnnualCashFlow >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {formatCurrency(totalAnnualCashFlow)}
            </span>
            {isCompareMode && compareLookup && (
              <span className={`text-[10px] block font-semibold ${totalAnnualCashFlow >= compareLookup.summary.netBalance ? 'text-teal-400' : 'text-rose-400'}`}>
                {totalAnnualCashFlow >= compareLookup.summary.netBalance ? '+' : ''}
                {formatCurrency(totalAnnualCashFlow - compareLookup.summary.netBalance)} vs. meta
              </span>
            )}
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
                {MONTH_SHORT_NAMES.map((m, mIdx) => {
                  const isCurrent = isCurrentYear && mIdx === currentMonthIndex;
                  return (
                    <th
                      key={m}
                      className={`p-2.5 text-right font-bold text-[11px] min-w-[80px] transition-colors ${
                        isCurrent
                          ? 'bg-teal-500/20 text-teal-300 border-x-2 border-teal-500/80 ring-1 ring-teal-500/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{m}</span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" title="Mês Atual" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="p-2.5 text-right font-bold text-[11px] min-w-[105px] bg-slate-900/90 text-teal-300 border-l border-slate-800">
                  TOTAL
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 text-slate-200">
              {/* ================= SEÇÃO: RECEITAS ================= */}
              {(activeTab === 'all' || activeTab === 'income' || activeTab === 'compare') && (
                <>
                  <tr className="bg-emerald-950/40 text-emerald-300 font-bold border-t border-b border-emerald-500/30">
                    <td className="p-2.5 pl-3 sticky left-0 z-10 bg-emerald-950/90 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>RECEITAS</span>
                      </div>
                    </td>
                    {displayIncomeTotals.map((tot, idx) => (
                      <td key={idx} className={getCurrentMonthColClass(idx, 'p-2.5 text-right tabular-nums font-semibold')}>
                        {renderCellWithDiff(tot, compareLookup?.incomeTotals[idx], 'income')}
                      </td>
                    ))}
                    <td className="p-2.5 text-right tabular-nums font-black text-emerald-400 bg-emerald-950/60 border-l border-slate-800">
                      {renderCellWithDiff(totalAnnualIncome, compareLookup?.summary.totalIncome, 'income')}
                    </td>
                  </tr>

                  {/* Categorias de Receita */}
                  {displayIncomeCategories.map(cat => {
                    const annualTot = cat.total;
                    const subs = cat.subcategories;
                    const isExpanded = Boolean(expandedCategories[cat.id]);
                    const baseCat = compareLookup?.catMap[cat.id];

                    return (
                      <React.Fragment key={cat.id}>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-2.5 pl-5 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800 font-medium text-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2">
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(cat.id)}
                                  className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                            const val = cat.monthlyValues[m] || 0;
                            return (
                              <td key={m} className={getCurrentMonthColClass(m, 'p-2 text-right tabular-nums text-slate-300')}>
                                {renderCellWithDiff(val, baseCat?.monthly[m], 'income')}
                              </td>
                            );
                          })}
                          <td className="p-2 text-right tabular-nums font-bold text-white bg-slate-900/50 border-l border-slate-800">
                            {renderCellWithDiff(annualTot, baseCat?.total, 'income')}
                          </td>
                        </tr>

                        {/* Subcategorias de Receita */}
                        {isExpanded && subs.map(sub => {
                          const subAnnual = sub.total;
                          const hasNanos = sub.nanos && sub.nanos.length > 0;
                          const isSubExpanded = Boolean(expandedSubcategories[sub.id]);
                          const baseSub = compareLookup?.subMap[sub.id];

                          return (
                            <React.Fragment key={sub.id}>
                              <tr className="bg-slate-950/40 hover:bg-slate-800/20 text-xs">
                                <td className="p-2 pl-9 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 text-slate-400 font-normal shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                  <div className="flex items-center gap-1.5">
                                    {hasNanos ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandSubcategory(sub.id)}
                                        className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        title={isSubExpanded ? "Recolher divisões" : "Expandir divisões"}
                                      >
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 text-slate-400" />
                                        )}
                                      </button>
                                    ) : (
                                      <span className="w-3 inline-block text-center text-slate-600">•</span>
                                    )}
                                    <span className="truncate">{sub.name}</span>
                                  </div>
                                </td>
                                {MONTH_SHORT_NAMES.map((_, m) => {
                                  const val = sub.monthlyValues[m] || 0;
                                  return (
                                    <td key={m} className={getCurrentMonthColClass(m, 'p-2 text-right tabular-nums text-slate-400')}>
                                      {renderCellWithDiff(val, baseSub?.monthly[m], 'income')}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-right tabular-nums text-slate-300 font-medium bg-slate-950/60 border-l border-slate-800">
                                  {renderCellWithDiff(subAnnual, baseSub?.total, 'income')}
                                </td>
                              </tr>

                              {/* Linhas das Nano-Categorias de Receita */}
                              {isSubExpanded && sub.nanos.map(nano => {
                                const nanoAnnual = nano.total;
                                const nanoKey = normalizeKey(nano.name);
                                const baseNano = compareLookup?.nanoMap[`${sub.id}_${nanoKey}`];

                                return (
                                  <tr key={nano.name} className="bg-slate-950/70 hover:bg-slate-800/30 text-[11px] text-slate-500">
                                    <td className="p-1.5 pl-14 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 italic shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                      <span className="truncate">↳ {nano.name}</span>
                                    </td>
                                    {MONTH_SHORT_NAMES.map((_, m) => {
                                      const val = nano.monthlyValues[m] || 0;
                                      return (
                                        <td key={m} className={getCurrentMonthColClass(m, 'p-1.5 text-right tabular-nums')}>
                                          {renderCellWithDiff(val, baseNano?.monthly[m], 'income')}
                                        </td>
                                      );
                                    })}
                                    <td className="p-1.5 text-right tabular-nums font-normal text-slate-400 bg-slate-950/80 border-l border-slate-800">
                                      {renderCellWithDiff(nanoAnnual, baseNano?.total, 'income')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              {/* ================= SEÇÃO: DESPESAS ================= */}
              {(activeTab === 'all' || activeTab === 'expense' || activeTab === 'compare') && (
                <>
                  <tr className="bg-rose-950/40 text-rose-300 font-bold border-t border-b border-rose-500/30">
                    <td className="p-2.5 pl-3 sticky left-0 z-10 bg-rose-950/90 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>DESPESAS / CONTAS</span>
                      </div>
                    </td>
                    {displayExpenseTotals.map((tot, idx) => (
                      <td key={idx} className={getCurrentMonthColClass(idx, 'p-2.5 text-right tabular-nums font-semibold')}>
                        {renderCellWithDiff(tot, compareLookup?.expenseTotals[idx], 'expense')}
                      </td>
                    ))}
                    <td className="p-2.5 text-right tabular-nums font-black text-rose-400 bg-rose-950/60 border-l border-slate-800">
                      {renderCellWithDiff(totalAnnualExpense, compareLookup?.summary.totalExpense, 'expense')}
                    </td>
                  </tr>

                  {/* Categorias de Despesas */}
                  {displayExpenseCategories.map(cat => {
                    const annualTot = cat.total;
                    const subs = cat.subcategories;
                    const isExpanded = Boolean(expandedCategories[cat.id]);
                    const baseCat = compareLookup?.catMap[cat.id];

                    return (
                      <React.Fragment key={cat.id}>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-2.5 pl-5 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800 font-medium text-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2">
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(cat.id)}
                                  className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                            const val = cat.monthlyValues[m] || 0;
                            return (
                              <td key={m} className={getCurrentMonthColClass(m, 'p-2 text-right tabular-nums text-slate-300')}>
                                {renderCellWithDiff(val, baseCat?.monthly[m], 'expense')}
                              </td>
                            );
                          })}
                          <td className="p-2 text-right tabular-nums font-bold text-white bg-slate-900/50 border-l border-slate-800">
                            {renderCellWithDiff(annualTot, baseCat?.total, 'expense')}
                          </td>
                        </tr>

                        {/* Subcategorias de Despesa */}
                        {isExpanded && subs.map(sub => {
                          const subAnnual = sub.total;
                          const hasNanos = sub.nanos && sub.nanos.length > 0;
                          const isSubExpanded = Boolean(expandedSubcategories[sub.id]);
                          const baseSub = compareLookup?.subMap[sub.id];

                          return (
                            <React.Fragment key={sub.id}>
                              <tr className="bg-slate-950/40 hover:bg-slate-800/20 text-xs">
                                <td className="p-2 pl-9 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 text-slate-400 font-normal shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                  <div className="flex items-center gap-1.5">
                                    {hasNanos ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandSubcategory(sub.id)}
                                        className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        title={isSubExpanded ? "Recolher divisões" : "Expandir divisões"}
                                      >
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3 h-3 text-teal-400" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 text-slate-400" />
                                        )}
                                      </button>
                                    ) : (
                                      <span className="w-3 inline-block text-center text-slate-600">•</span>
                                    )}
                                    <span className="truncate">{sub.name}</span>
                                  </div>
                                </td>
                                {MONTH_SHORT_NAMES.map((_, m) => {
                                  const val = sub.monthlyValues[m] || 0;
                                  return (
                                    <td key={m} className={getCurrentMonthColClass(m, 'p-2 text-right tabular-nums text-slate-400')}>
                                      {renderCellWithDiff(val, baseSub?.monthly[m], 'expense')}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-right tabular-nums text-slate-300 font-medium bg-slate-950/60 border-l border-slate-800">
                                  {renderCellWithDiff(subAnnual, baseSub?.total, 'expense')}
                                </td>
                              </tr>

                              {/* Linhas das Nano-Categorias de Despesa */}
                              {isSubExpanded && sub.nanos.map(nano => {
                                const nanoAnnual = nano.total;
                                const nanoKey = normalizeKey(nano.name);
                                const baseNano = compareLookup?.nanoMap[`${sub.id}_${nanoKey}`];

                                return (
                                  <tr key={nano.name} className="bg-slate-950/70 hover:bg-slate-800/30 text-[11px] text-slate-500">
                                    <td className="p-1.5 pl-14 sticky left-0 z-10 bg-slate-950/95 border-r border-slate-800 italic shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                      <span className="truncate">↳ {nano.name}</span>
                                    </td>
                                    {MONTH_SHORT_NAMES.map((_, m) => {
                                      const val = nano.monthlyValues[m] || 0;
                                      return (
                                        <td key={m} className={getCurrentMonthColClass(m, 'p-1.5 text-right tabular-nums')}>
                                          {renderCellWithDiff(val, baseNano?.monthly[m], 'expense')}
                                        </td>
                                      );
                                    })}
                                    <td className="p-1.5 text-right tabular-nums font-normal text-slate-400 bg-slate-950/80 border-l border-slate-800">
                                      {renderCellWithDiff(nanoAnnual, baseNano?.total, 'expense')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              {/* ================= SEÇÃO: RESULTADOS E FLUXO ================= */}
              {(activeTab === 'all' || activeTab === 'compare') && (
                <>
                  {/* Linha 1: Fluxo de Caixa Líquido do Mês */}
                  <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700">
                    <td className="p-3 pl-3 sticky left-0 z-10 bg-slate-950 border-r border-slate-800 text-white shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="w-3.5 h-3.5 text-teal-400" />
                        <span>FLUXO DE CAIXA (LÍQUIDO)</span>
                      </div>
                    </td>
                    {displayNetTotals.map((cf, idx) => (
                      <td
                        key={idx}
                        className={getCurrentMonthColClass(
                          idx,
                          `p-2.5 text-right tabular-nums font-bold ${cf >= 0 ? 'text-emerald-400' : 'text-rose-400'}`
                        )}
                      >
                        {renderCellWithDiff(cf, compareLookup?.netTotals[idx], 'net')}
                      </td>
                    ))}
                    <td
                      className={`p-2.5 text-right tabular-nums font-black border-l border-slate-800 ${
                        totalAnnualCashFlow >= 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {renderCellWithDiff(totalAnnualCashFlow, compareLookup?.summary.netBalance, 'net')}
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
                    {displayAccumulatedTotals.map((acc, idx) => {
                      // Obter acumulado da baseline
                      let baseAcc: number | undefined = undefined;
                      if (compareLookup?.netTotals) {
                        baseAcc = compareLookup.netTotals.slice(0, idx + 1).reduce((a, b) => a + b, 0);
                      }
                      return (
                        <td
                          key={idx}
                          className={getCurrentMonthColClass(
                            idx,
                            `p-2.5 text-right tabular-nums font-bold ${acc >= 0 ? 'text-teal-300' : 'text-rose-400'}`
                          )}
                        >
                          {renderCellWithDiff(acc, baseAcc, 'net')}
                        </td>
                      );
                    })}
                    <td
                      className={`p-2.5 text-right tabular-nums font-black border-l border-slate-800 ${
                        displayAccumulatedTotals[11] >= 0 ? 'text-teal-300 bg-teal-950/60' : 'text-rose-400 bg-rose-950/60'
                      }`}
                    >
                      {renderCellWithDiff(
                        displayAccumulatedTotals[11] || 0,
                        compareLookup?.netTotals ? compareLookup.netTotals.reduce((a, b) => a + b, 0) : undefined,
                        'net'
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gerenciamento e Congelamento de Baselines */}
      <BaselineManageModal
        isOpen={isBaselineModalOpen}
        onClose={() => setIsBaselineModalOpen(false)}
        year={reportYear}
        baselines={baselines}
        activeBaselineId={selectedBaselineId}
        initialTab={baselineModalTab}
        onSelectBaseline={id => setSelectedBaselineId(id)}
        onSaveSnapshot={handleSaveSnapshot}
        onOverwriteSnapshot={handleOverwriteSnapshot}
        onDeleteBaseline={handleDeleteBaseline}
      />
    </div>
  );
};

