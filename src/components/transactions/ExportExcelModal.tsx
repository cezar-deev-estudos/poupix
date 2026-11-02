'use client';

import React, { useState } from 'react';
import { Transaction, Category, CreditCard, Account } from '@/types/finance';
import { exportTransactionsToExcel } from '@/lib/exportExcel';
import { X, FileSpreadsheet, Download, CheckCircle2, Calendar, Filter, Database, Layers } from 'lucide-react';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredTransactions: Transaction[];
  monthTransactions: Transaction[];
  yearTransactions: Transaction[];
  allTransactions: Transaction[];
  selectedMonthName: string;
  selectedYear: number;
  categories: Category[];
  creditCards: CreditCard[];
  accounts: Account[];
}

export type ExportScope = 'filtered' | 'month' | 'year' | 'all';

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  isOpen,
  onClose,
  filteredTransactions,
  monthTransactions,
  yearTransactions,
  allTransactions,
  selectedMonthName,
  selectedYear,
  categories,
  creditCards,
  accounts,
}) => {
  const [selectedScope, setSelectedScope] = useState<ExportScope>('filtered');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getScopeData = () => {
    switch (selectedScope) {
      case 'filtered':
        return {
          data: filteredTransactions,
          name: `poupix_transacoes_filtradas_${new Date().toISOString().slice(0, 10)}.xlsx`,
          label: 'Transações Filtradas na Tela',
        };
      case 'month':
        return {
          data: monthTransactions,
          name: `poupix_transacoes_${selectedMonthName.toLowerCase()}_${selectedYear}.xlsx`,
          label: `Mês Completo (${selectedMonthName} / ${selectedYear})`,
        };
      case 'year':
        return {
          data: yearTransactions,
          name: `poupix_transacoes_ano_${selectedYear}.xlsx`,
          label: `Ano Completo (${selectedYear})`,
        };
      case 'all':
      default:
        return {
          data: allTransactions,
          name: `poupix_transacoes_completo_${new Date().toISOString().slice(0, 10)}.xlsx`,
          label: 'Todo o Histórico (Todas as Transações)',
        };
    }
  };

  const handleExecuteExport = () => {
    setIsExporting(true);
    const { data, name } = getScopeData();

    try {
      exportTransactionsToExcel({
        fileName: name,
        transactions: data,
        categories,
        creditCards,
        accounts,
      });
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Erro ao exportar transações:', err);
      setIsExporting(false);
    }
  };

  const options = [
    {
      id: 'filtered' as ExportScope,
      title: 'Tela exibida com os filtros atuais',
      desc: 'Exporta exatamente os lançamentos visíveis na tabela com base na busca e filtros ativos.',
      count: filteredTransactions.length,
      icon: Filter,
      color: 'text-indigo-400',
    },
    {
      id: 'month' as ExportScope,
      title: `Mês completo (${selectedMonthName} de ${selectedYear})`,
      desc: 'Todas as receitas, despesas e cartões deste mês, sem filtros aplicados.',
      count: monthTransactions.length,
      icon: Calendar,
      color: 'text-emerald-400',
    },
    {
      id: 'year' as ExportScope,
      title: `Ano completo (${selectedYear})`,
      desc: `Todas as transações registradas no ano de ${selectedYear}.`,
      count: yearTransactions.length,
      icon: Layers,
      color: 'text-cyan-400',
    },
    {
      id: 'all' as ExportScope,
      title: 'Todas as transações do sistema',
      desc: 'Exportação completa de todo o histórico da sua conta.',
      count: allTransactions.length,
      icon: Database,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#181c24] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#14171f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar para Excel</h3>
              <p className="text-[11px] text-slate-400">Gera um arquivo compatível (.xlsx) formatado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opções de Escopo */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-300 font-medium pb-1">
            Escolha qual período ou conjunto de dados deseja exportar:
          </p>

          <div className="space-y-2.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedScope === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedScope(opt.id)}
                  className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{opt.title}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                          {opt.count} {opt.count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-700'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#14171f]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer font-sans"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'Baixar Planilha Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

