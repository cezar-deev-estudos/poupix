'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Database,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Printer
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { summary, filteredTransactions, selectedMonth, selectedYear, categories, accounts, exportDatabaseBackup } = useFinance();
  const [reportType, setReportType] = useState<'monthly' | 'categories' | 'accounts'>('monthly');

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Gerar CSV das transações do mês
  const handleExportCSV = () => {
    const headers = ['Data', 'Descricao', 'Tipo', 'Categoria', 'Valor (R$)', 'Status', 'Tags'];
    const rows = filteredTransactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferencia',
        `"${cat?.name || 'Geral'}"`,
        t.amount.toFixed(2).replace('.', ','),
        t.paid ? 'Efetivado' : 'Pendente',
        `"${(t.tags || []).join(', ')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poupix_Relatorio_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar backup completo JSON
  const handleExportJSON = () => {
    const jsonString = exportDatabaseBackup();
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poupix_Backup_Geral_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Impressão / Salvar em PDF via janela nativa
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Relatórios */}
      <div className="bg-gradient-to-r from-teal-950/40 via-emerald-950/30 to-slate-900 border border-teal-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Central de Exportação & Auditoria</span>
          </div>
          <h2 className="text-2xl font-black text-white">Relatórios Financeiros Consolidados</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Exporte demonstrativos analíticos completos em formato Excel/CSV, gere PDFs para impressão ou faça backup total dos seus dados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>Backup JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Demonstrativo Resumido do Mês (DRE Pessoal) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Demonstrativo de Resultados — {monthNames[selectedMonth]} de {selectedYear}
            </h3>
            <p className="text-xs text-slate-400">Resumo analítico de fluxo de caixa</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {filteredTransactions.length} lançamentos contabilizados
          </span>
        </div>

        {/* Grade de Indicadores do Mês */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-medium">Receitas Efetivadas</span>
            <span className="text-base font-black text-emerald-400">
              R$ {summary.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-medium">Despesas & Contas</span>
            <span className="text-base font-black text-rose-400">
              R$ {summary.monthlyExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-medium">Faturas de Cartões</span>
            <span className="text-base font-black text-amber-400">
              R$ {summary.creditCardTotalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-slate-400 block font-medium">Economia Líquida</span>
            <span className={`text-base font-black ${summary.monthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {summary.monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tabela de Extrato do Relatório */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Conta / Cartão</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTransactions.map(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                const acc = accounts.find(a => a.id === tx.accountId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400">{tx.date.split('-').reverse().join('/')}</td>
                    <td className="p-3 font-semibold text-white">{tx.description}</td>
                    <td className="p-3 text-slate-300">{cat?.name || 'Geral'}</td>
                    <td className="p-3 text-slate-400">{acc?.name || 'Cartão'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        tx.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.paid ? 'Efetivado' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
