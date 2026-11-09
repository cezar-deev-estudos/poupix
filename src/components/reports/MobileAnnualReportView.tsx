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
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Layers,
  Camera,
  Lock,
  Eye,
  Layers3,
  CalendarDays,
} from 'lucide-react';

const MONTH_SHORT_NAMES = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

interface MobileAnnualReportViewProps {
  onBack?: () => void;
}

export const MobileAnnualReportView: React.FC<MobileAnnualReportViewProps> = () => {
  const { transactions, categories, creditCards, selectedYear: currentYear, userId } = useFinance();
  const [reportYear, setReportYear] = useState<number>(currentYear || new Date().getFullYear());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [expandedMonthDetails, setExpandedMonthDetails] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all'); // 'all' ou 0..11

  // Estado das Baselines / Snapshots Congelados (Supabase)
  const [baselines, setBaselines] = useState<AnnualBudgetBaseline[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [baselineModalTab, setBaselineModalTab] = useState<'save' | 'manage'>('save');

  // Carregar snapshots do ano selecionado
  const loadYearBaselines = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchBaselinesByYear(userId, reportYear);
      setBaselines(data);
      setSelectedBaselineId(prev => {
        if (!prev) return null;
        return data.some(b => b.id === prev) ? prev : null;
      });
    } catch (err) {
      console.error(err);
    }
  }, [userId, reportYear]);

  useEffect(() => {
    loadYearBaselines();
  }, [loadYearBaselines]);

  const activeBaseline = useMemo(() => {
    if (!selectedBaselineId) return null;
    return baselines.find(b => b.id === selectedBaselineId) || null;
  }, [baselines, selectedBaselineId]);

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

  const toggleMonthDetails = (key: string) => {
    setExpandedMonthDetails(prev => ({ ...prev, [key]: !prev[key] }));
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
    setExpandedMonthDetails({});
  };

  // Cálculo da matriz dinâmica para o ano selecionado
  const matrixData = useMemo(() => {
    const monthlyIncomeTotals: number[] = Array(12).fill(0);
    const monthlyExpenseTotals: number[] = Array(12).fill(0);
    const catMonthTotals: Record<string, number[]> = {};
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

    const reconciled = reconcileAllDecreasingExpenses(transactions, creditCards, categories);

    reconciled.forEach(tx => {
      if (tx.ignoreInTotals) return;
      if (/^Pagamento de Fatura\s*-\s*/i.test(tx.description)) return;

      let txYear = 0;
      let txMonth = -1;

      if (tx.creditCardId) {
        const card = creditCards.find(c => isSameId(c.id, tx.creditCardId));
        const invoicePeriod = getTransactionInvoicePeriod(tx, card);
        txYear = invoicePeriod.year;
        txMonth = invoicePeriod.month;
      } else if (tx.date) {
        const [yStr, mStr] = tx.date.split('-');
        txYear = parseInt(yStr, 10);
        txMonth = parseInt(mStr, 10) - 1;
      }

      if (txYear !== reportYear || txMonth < 0 || txMonth > 11) return;

      if (tx.type === 'income') {
        monthlyIncomeTotals[txMonth] += tx.amount;
      } else if (tx.type === 'expense') {
        monthlyExpenseTotals[txMonth] += tx.amount;
      }

      const matchedCat = activeCategories.find(c => isSameId(c.id, tx.categoryId));
      const targetCatId = matchedCat?.id || tx.categoryId;
      if (catMonthTotals[targetCatId]) {
        catMonthTotals[targetCatId][txMonth] += tx.amount;
      }

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

  const getParentCategoryMonthTotal = (parentCat: Category, monthIdx: number) => {
    const parentVal = matrixData.catMonthTotals[parentCat.id]?.[monthIdx] || 0;
    const subs = activeCategories.filter(c => isSameId(c.parentId, parentCat.id));
    const subsVal = subs.reduce((sum, s) => sum + (matrixData.catMonthTotals[s.id]?.[monthIdx] || 0), 0);
    return parentVal + subsVal;
  };

  const getParentCategoryAnnualTotal = (parentCat: Category) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      total += getParentCategoryMonthTotal(parentCat, m);
    }
    return total;
  };

  const getSubcategoryAnnualTotal = (subCat: Category) => {
    const monthly = matrixData.catMonthTotals[subCat.id] || [];
    return monthly.reduce((sum, v) => sum + v, 0);
  };

  const getNanoCategoryAnnualTotal = (subId: string, nanoKey: string) => {
    const monthly = matrixData.nanoMonthTotals[subId]?.[nanoKey] || [];
    return monthly.reduce((sum, v) => sum + v, 0);
  };

  const getVisibleNanosForYear = (sub: Category) => {
    if (!sub.nanoCategories || sub.nanoCategories.length === 0) return [];
    return sub.nanoCategories.filter(nano => {
      if (nano.active === false) return false;
      if (nano.year !== undefined && nano.year !== null) {
        return nano.year === reportYear;
      }
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

  // Hierarquia formatada
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

  // Snapshot Actions
  const handleSaveSnapshot = async (type: 'original' | 'revision', notes?: string) => {
    if (!userId) return;
    const buildCategoryTree = (t: 'income' | 'expense') => {
      const parents = activeCategories.filter(c => !c.parentId && c.type === t);
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
            return {
              name: nano.name,
              monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0),
              total: getNanoCategoryAnnualTotal(s.id, nanoKey),
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

  const handleOverwriteSnapshot = async (id: string) => {
    if (!userId) return;
    const target = baselines.find(b => b.id === id);
    if (!target) return;

    const buildCategoryTree = (t: 'income' | 'expense') => {
      const parents = activeCategories.filter(c => !c.parentId && c.type === t);
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
            return {
              name: nano.name,
              monthlyValues: MONTH_SHORT_NAMES.map((_, m) => matrixData.nanoMonthTotals[s.id]?.[nanoKey]?.[m] || 0),
              total: getNanoCategoryAnnualTotal(s.id, nanoKey),
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

  const handleDeleteBaseline = async (id: string) => {
    await deleteBudgetBaseline(id);
    if (selectedBaselineId === id) {
      setSelectedBaselineId(null);
    }
    await loadYearBaselines();
  };

  // Helper para obter valor exibido (do mês filtrado ou anual)
  const getValueToDisplay = (monthlyValues: number[], totalAnnual: number) => {
    if (selectedMonthFilter === 'all') {
      return totalAnnual;
    }
    return monthlyValues[selectedMonthFilter] || 0;
  };

  // Renderizador do detalhe mês a mês de uma linha
  const renderMonthDetailsGrid = (monthlyValues: number[], totalAnnual: number) => {
    return (
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 mt-1.5 animate-fadeIn">
        {MONTH_SHORT_NAMES.map((mName, mIdx) => {
          const val = monthlyValues[mIdx] || 0;
          const isCurrentSelected = selectedMonthFilter === mIdx;
          return (
            <div
              key={mName}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMonthFilter(mIdx);
              }}
              className={`p-1 rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isCurrentSelected ? 'bg-teal-500/20 border border-teal-500/40' : 'hover:bg-slate-900'
              }`}
            >
              <span className="text-[9px] text-slate-400 font-semibold">{mName}</span>
              <span className={`text-[10px] tabular-nums font-bold ${val > 0 ? 'text-slate-200' : 'text-slate-600'}`}>
                {val > 0 ? formatCurrency(val) : '-'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* 1. Barra Superior Compacta Mobile */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Seletor de Ano */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1">
            <button
              type="button"
              onClick={() => setReportYear(y => y - 1)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-white tabular-nums">{reportYear}</span>
            <button
              type="button"
              onClick={() => setReportYear(y => y + 1)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botões Rápidos de Ação: Congelar e Visualizar */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setBaselineModalTab('save');
                setIsBaselineModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/40 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Congelar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBaselineModalTab('manage');
                setIsBaselineModalOpen(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer shadow-sm active:scale-95 transition-all ${
                activeBaseline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            >
              {activeBaseline ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{activeBaseline ? 'Congelado' : `Ver (${baselines.length})`}</span>
            </button>
          </div>
        </div>

        {/* Banner de Versão Congelada Ativa no Mobile */}
        {activeBaseline && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-white block truncate">{activeBaseline.title}</span>
                <span className="text-[10px] text-amber-300/80">Foto Congelada (Somente Leitura)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBaselineId(null)}
              className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer"
            >
              Tempo Real
            </button>
          </div>
        )}

        {/* 2. Filtros de Aba (Completo / Receitas / Despesas) + Expandir / Recolher */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'income' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Receitas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'expense' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Despesas
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-medium cursor-pointer"
            >
              Abrir
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-medium cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* 3. Carrossel Horizontal de Pílulas de Mês */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold">
              <CalendarDays className="w-3 h-3 text-teal-400" />
              Exibir por Mês:
            </span>
            <span className="text-teal-400 font-bold">
              {selectedMonthFilter === 'all' ? `Ano ${reportYear} Completo` : MONTH_SHORT_NAMES[selectedMonthFilter]}
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedMonthFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                selectedMonthFilter === 'all'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Ano Todo
            </button>
            {MONTH_SHORT_NAMES.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonthFilter(idx)}
                className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedMonthFilter === idx
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cards de Resumo Anual Mobile */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] block truncate">Receitas {reportYear}</span>
          <span className="text-xs font-bold text-emerald-400 tabular-nums truncate">
            {formatCurrency(totalAnnualIncome)}
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] block truncate">Despesas {reportYear}</span>
          <span className="text-xs font-bold text-rose-400 tabular-nums truncate">
            {formatCurrency(totalAnnualExpense)}
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] block truncate">Saldo do Ano</span>
          <span className={`text-xs font-bold tabular-nums truncate ${totalAnnualCashFlow >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(totalAnnualCashFlow)}
          </span>
        </div>
      </div>

      {/* 3. Seção Vertical: RECEITAS */}
      {(activeTab === 'all' || activeTab === 'income') && (
        <div className="space-y-2">
          {/* Header da Seção de Receitas */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>RECEITAS</span>
            </div>
            <span className="text-xs font-black tabular-nums text-emerald-400">
              {formatCurrency(
                selectedMonthFilter === 'all'
                  ? totalAnnualIncome
                  : displayIncomeTotals[selectedMonthFilter] || 0
              )}
            </span>
          </div>

          {/* Lista Vertical de Categorias de Receita */}
          <div className="space-y-1.5">
            {displayIncomeCategories.map(cat => {
              const catVal = getValueToDisplay(cat.monthlyValues, cat.total);
              const isExpanded = Boolean(expandedCategories[cat.id]);
              const subs = cat.subcategories;
              const isDetailOpen = Boolean(expandedMonthDetails[`cat-${cat.id}`]);

              return (
                <div
                  key={cat.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden"
                >
                  {/* Linha Categoria Pai */}
                  <div
                    onClick={() => toggleExpand(cat.id)}
                    className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {subs.length > 0 ? (
                        <span className="p-0.5 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </span>
                      ) : (
                        <span className="w-3.5 inline-block text-center text-slate-600">•</span>
                      )}
                      <span className="font-semibold text-slate-200 text-xs truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">
                        {catVal > 0 ? formatCurrency(catVal) : '-'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonthDetails(`cat-${cat.id}`);
                        }}
                        className="p-1 text-slate-500 hover:text-teal-400 rounded transition-colors"
                        title="Ver detalhe dos 12 meses"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de 12 Meses da Categoria Pai (quando ativado) */}
                  {isDetailOpen && renderMonthDetailsGrid(cat.monthlyValues, cat.total)}

                  {/* Subcategorias de Receita */}
                  {isExpanded && subs.length > 0 && (
                    <div className="pl-4 pr-2 pb-2 pt-1 border-t border-slate-800/40 space-y-1 bg-slate-950/40">
                      {subs.map(sub => {
                        const subVal = getValueToDisplay(sub.monthlyValues, sub.total);
                        const hasNanos = sub.nanos && sub.nanos.length > 0;
                        const isSubExpanded = Boolean(expandedSubcategories[sub.id]);
                        const isSubDetailOpen = Boolean(expandedMonthDetails[`sub-${sub.id}`]);

                        return (
                          <div key={sub.id} className="border border-slate-800/40 rounded-lg p-2 bg-slate-900/40">
                            <div
                              onClick={() => hasNanos && toggleExpandSubcategory(sub.id)}
                              className={`flex items-center justify-between gap-2 ${hasNanos ? 'cursor-pointer' : ''}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {hasNanos ? (
                                  <span className="p-0.5 text-slate-400">
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    )}
                                  </span>
                                ) : (
                                  <span className="w-3 inline-block text-center text-slate-600 text-xs">•</span>
                                )}
                                <span className="text-[11px] font-medium text-slate-300 truncate">{sub.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-200 tabular-nums">
                                  {subVal > 0 ? formatCurrency(subVal) : '-'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMonthDetails(`sub-${sub.id}`);
                                  }}
                                  className="p-1 text-slate-500 hover:text-teal-400 rounded transition-colors"
                                >
                                  <Calendar className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Grid 12 Meses da Subcategoria */}
                            {isSubDetailOpen && renderMonthDetailsGrid(sub.monthlyValues, sub.total)}

                            {/* Nano-Categorias de Receita */}
                            {isSubExpanded && hasNanos && (
                              <div className="mt-1 pl-4 space-y-1 border-l-2 border-emerald-500/20 pt-1">
                                {sub.nanos.map(nano => {
                                  const nanoVal = getValueToDisplay(nano.monthlyValues, nano.total);
                                  const isNanoDetailOpen = Boolean(expandedMonthDetails[`nano-${sub.id}-${nano.name}`]);

                                  return (
                                    <div key={nano.name} className="py-0.5">
                                      <div className="flex items-center justify-between gap-1 text-[10px]">
                                        <span className="text-slate-400 italic truncate">↳ {nano.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="tabular-nums text-slate-300">
                                            {nanoVal > 0 ? formatCurrency(nanoVal) : '-'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => toggleMonthDetails(`nano-${sub.id}-${nano.name}`)}
                                            className="p-0.5 text-slate-600 hover:text-teal-400 rounded"
                                          >
                                            <Calendar className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                      {isNanoDetailOpen && renderMonthDetailsGrid(nano.monthlyValues, nano.total)}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Seção Vertical: DESPESAS */}
      {(activeTab === 'all' || activeTab === 'expense') && (
        <div className="space-y-2">
          {/* Header da Seção de Despesas */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>DESPESAS / CONTAS</span>
            </div>
            <span className="text-xs font-black tabular-nums text-rose-400">
              {formatCurrency(
                selectedMonthFilter === 'all'
                  ? totalAnnualExpense
                  : displayExpenseTotals[selectedMonthFilter] || 0
              )}
            </span>
          </div>

          {/* Lista Vertical de Categorias de Despesa */}
          <div className="space-y-1.5">
            {displayExpenseCategories.map(cat => {
              const catVal = getValueToDisplay(cat.monthlyValues, cat.total);
              const isExpanded = Boolean(expandedCategories[cat.id]);
              const subs = cat.subcategories;
              const isDetailOpen = Boolean(expandedMonthDetails[`cat-${cat.id}`]);

              return (
                <div
                  key={cat.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden"
                >
                  {/* Linha Categoria Pai */}
                  <div
                    onClick={() => toggleExpand(cat.id)}
                    className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {subs.length > 0 ? (
                        <span className="p-0.5 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </span>
                      ) : (
                        <span className="w-3.5 inline-block text-center text-slate-600">•</span>
                      )}
                      <span className="font-semibold text-slate-200 text-xs truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-rose-400 tabular-nums">
                        {catVal > 0 ? formatCurrency(catVal) : '-'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonthDetails(`cat-${cat.id}`);
                        }}
                        className="p-1 text-slate-500 hover:text-teal-400 rounded transition-colors"
                        title="Ver detalhe dos 12 meses"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de 12 Meses da Categoria Pai (quando ativado) */}
                  {isDetailOpen && renderMonthDetailsGrid(cat.monthlyValues, cat.total)}

                  {/* Subcategorias de Despesa */}
                  {isExpanded && subs.length > 0 && (
                    <div className="pl-4 pr-2 pb-2 pt-1 border-t border-slate-800/40 space-y-1 bg-slate-950/40">
                      {subs.map(sub => {
                        const subVal = getValueToDisplay(sub.monthlyValues, sub.total);
                        const hasNanos = sub.nanos && sub.nanos.length > 0;
                        const isSubExpanded = Boolean(expandedSubcategories[sub.id]);
                        const isSubDetailOpen = Boolean(expandedMonthDetails[`sub-${sub.id}`]);

                        return (
                          <div key={sub.id} className="border border-slate-800/40 rounded-lg p-2 bg-slate-900/40">
                            <div
                              onClick={() => hasNanos && toggleExpandSubcategory(sub.id)}
                              className={`flex items-center justify-between gap-2 ${hasNanos ? 'cursor-pointer' : ''}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {hasNanos ? (
                                  <span className="p-0.5 text-slate-400">
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-teal-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    )}
                                  </span>
                                ) : (
                                  <span className="w-3 inline-block text-center text-slate-600 text-xs">•</span>
                                )}
                                <span className="text-[11px] font-medium text-slate-300 truncate">{sub.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-200 tabular-nums">
                                  {subVal > 0 ? formatCurrency(subVal) : '-'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMonthDetails(`sub-${sub.id}`);
                                  }}
                                  className="p-1 text-slate-500 hover:text-teal-400 rounded transition-colors"
                                >
                                  <Calendar className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Grid 12 Meses da Subcategoria */}
                            {isSubDetailOpen && renderMonthDetailsGrid(sub.monthlyValues, sub.total)}

                            {/* Nano-Categorias de Despesa */}
                            {isSubExpanded && hasNanos && (
                              <div className="mt-1 pl-4 space-y-1 border-l-2 border-teal-500/20 pt-1">
                                {sub.nanos.map(nano => {
                                  const nanoVal = getValueToDisplay(nano.monthlyValues, nano.total);
                                  const isNanoDetailOpen = Boolean(expandedMonthDetails[`nano-${sub.id}-${nano.name}`]);

                                  return (
                                    <div key={nano.name} className="py-0.5">
                                      <div className="flex items-center justify-between gap-1 text-[10px]">
                                        <span className="text-slate-400 italic truncate">↳ {nano.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="tabular-nums text-slate-300">
                                            {nanoVal > 0 ? formatCurrency(nanoVal) : '-'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => toggleMonthDetails(`nano-${sub.id}-${nano.name}`)}
                                            className="p-0.5 text-slate-600 hover:text-teal-400 rounded"
                                          >
                                            <Calendar className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                      {isNanoDetailOpen && renderMonthDetailsGrid(nano.monthlyValues, nano.total)}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Seção de FLUXO DE CAIXA E RESULTADO ANUAL */}
      {activeTab === 'all' && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          {/* Fluxo de Caixa Líquido */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-xs block">FLUXO DE CAIXA LÍQUIDO</span>
                <span className="text-[10px] text-slate-400">
                  {selectedMonthFilter === 'all' ? `Ano ${reportYear}` : MONTH_SHORT_NAMES[selectedMonthFilter]}
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black tabular-nums ${
                (selectedMonthFilter === 'all'
                  ? totalAnnualCashFlow
                  : displayNetTotals[selectedMonthFilter] || 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(
                selectedMonthFilter === 'all'
                  ? totalAnnualCashFlow
                  : displayNetTotals[selectedMonthFilter] || 0
              )}
            </span>
          </div>

          {/* Saldo Acumulado */}
          <div className="bg-teal-950/30 border border-teal-500/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="font-bold text-teal-300 text-xs block">FLUXO ACUMULADO</span>
                <span className="text-[10px] text-teal-400/80">
                  {selectedMonthFilter === 'all' ? `Até Dez/${reportYear}` : `Até ${MONTH_SHORT_NAMES[selectedMonthFilter]}/${reportYear}`}
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-black tabular-nums ${
                (selectedMonthFilter === 'all'
                  ? displayAccumulatedTotals[11] || 0
                  : displayAccumulatedTotals[selectedMonthFilter] || 0) >= 0
                  ? 'text-teal-300'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(
                selectedMonthFilter === 'all'
                  ? displayAccumulatedTotals[11] || 0
                  : displayAccumulatedTotals[selectedMonthFilter] || 0
              )}
            </span>
          </div>
        </div>
      )}

      {/* Modal de Baselines / Versões Congeladas */}
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

