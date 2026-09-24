'use client';

import React, { useState, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { parseOFX, parseCSV } from '@/lib/parsers';
import { ImportedTransactionPreview, Transaction } from '@/types/finance';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

interface ImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankStatementImporterModal: React.FC<ImporterModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, importTransactions } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [importedTxs, setImportedTxs] = useState<ImportedTransactionPreview[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'ofx' | 'csv' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setIsProcessing(true);

    const isOFX = file.name.toLowerCase().endsWith('.ofx');
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (!isOFX && !isCSV) {
      setErrorMessage('Formato não suportado. Por favor envie um arquivo .OFX ou .CSV');
      setIsProcessing(false);
      return;
    }

    setFileType(isOFX ? 'ofx' : 'csv');

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        let parsed: ImportedTransactionPreview[] = [];

        if (isOFX) {
          parsed = parseOFX(text);
        } else {
          parsed = parseCSV(text);
        }

        if (parsed.length === 0) {
          setErrorMessage('Não encontramos transações válidas neste arquivo.');
        } else {
          setImportedTxs(parsed);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo bancário', err);
        setErrorMessage('Erro ao ler conteúdo do arquivo.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file, 'ISO-8859-1'); // Suporta caracteres acentuados comuns de bancos brasileiros
  };

  const toggleSelectAll = (select: boolean) => {
    setImportedTxs(prev => prev.map(t => ({ ...t, selected: select })));
  };

  const toggleSelectTx = (id: string) => {
    setImportedTxs(prev => prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const updateTxCategory = (id: string, categoryId: string) => {
    setImportedTxs(prev => prev.map(t => (t.id === id ? { ...t, suggestedCategoryId: categoryId } : t)));
  };

  const handleConfirmImport = () => {
    const selected = importedTxs.filter(t => t.selected);
    if (selected.length === 0) {
      alert('Selecione ao menos uma transação para importar.');
      return;
    }

    const txsToSave: Omit<Transaction, 'id' | 'createdAt'>[] = selected.map(item => ({
      description: item.description,
      amount: item.amount,
      date: item.date,
      type: item.type,
      categoryId: item.suggestedCategoryId,
      accountId: selectedAccountId || undefined,
      paid: true, // Extratos bancários já representam lançamentos efetivados
      tags: ['importado', fileType || 'extrato'],
    }));

    importTransactions(txsToSave);
    onClose();
    // Limpar estado
    setImportedTxs([]);
    setFileName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Importar Extrato Bancário</h3>
              <p className="text-xs text-slate-400">Importação automática com categorização inteligente (.OFX / .CSV)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo / Passos */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Seletor de Conta de Destino */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-white block">Vincular transações a qual Conta?</label>
              <span className="text-[11px] text-slate-400">Os saldos serão ajustados automaticamente nesta conta</span>
            </div>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>

          {/* Área de Upload (Drag & Drop / Botão) */}
          {importedTxs.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-3xl bg-slate-900 group-hover:bg-emerald-500/10 border border-slate-800 group-hover:border-emerald-500/30 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-all mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Clique para selecionar seu arquivo de extrato
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Compatível com arquivos <b className="text-emerald-400">.OFX</b> e <b className="text-emerald-400">.CSV</b> exportados de qualquer banco (Nubank, Inter, Itaú, Bradesco, etc.)
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> Planilhas .CSV</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Extrato Padrão .OFX</span>
              </div>
            </div>
          ) : (
            /* Lista de Transações Pré-Visualizadas */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Arquivo:</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
                    {fileName} ({importedTxs.length} registros encontrados)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Marcar Todos
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Tabela de Transações Detectadas */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Descrição Detectada</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Categoria Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {importedTxs.map(tx => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !tx.selected ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={tx.selected}
                            onChange={() => toggleSelectTx(tx.id)}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          {tx.date.split('-').reverse().join('/')}
                        </td>
                        <td className="p-3 font-semibold text-white truncate max-w-xs">
                          {tx.description}
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={`flex items-center gap-1 ${
                              tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                            R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={tx.suggestedCategoryId}
                            onChange={e => updateTxCategory(tx.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:border-emerald-500 focus:outline-none"
                          >
                            {categories
                              .filter(c => c.type === tx.type)
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setImportedTxs([]);
              setFileName('');
            }}
            disabled={importedTxs.length === 0}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            Trocar Arquivo
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importedTxs.filter(t => t.selected).length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Importar {importedTxs.filter(t => t.selected).length} Transações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
