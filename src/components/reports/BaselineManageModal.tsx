'use client';

import React, { useState } from 'react';
import { AnnualBudgetBaseline } from '@/types/finance';
import { Camera, RefreshCw, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface BaselineManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  baselines: AnnualBudgetBaseline[];
  activeBaselineId: string | null;
  initialTab?: 'save' | 'manage';
  onSelectBaseline: (id: string | null) => void;
  onSaveSnapshot: (type: 'original' | 'revision', notes?: string) => Promise<void>;
  onOverwriteSnapshot: (baselineId: string) => Promise<void>;
  onDeleteBaseline: (baselineId: string) => Promise<void>;
}

export const BaselineManageModal: React.FC<BaselineManageModalProps> = ({
  isOpen,
  onClose,
  year,
  baselines,
  activeBaselineId,
  initialTab = 'save',
  onSelectBaseline,
  onSaveSnapshot,
  onOverwriteSnapshot,
  onDeleteBaseline,
}) => {
  const [actionTab, setActionTab] = useState<'save' | 'manage'>(initialTab);
  const [snapshotType, setSnapshotType] = useState<'original' | 'revision'>('revision');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActionTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const originalBaseline = baselines.find(b => b.type === 'original');
  const revisionBaselines = baselines.filter(b => b.type === 'revision');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveSnapshot(snapshotType, notes.trim() || undefined);
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverwrite = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onOverwriteSnapshot(id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteBaseline(id);
      setDeletingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Congelamento Orçamentário
                <span className="text-xs px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-semibold">
                  {year}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Grave uma foto histórica de início de ano ou crie uma revisão para comparação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActionTab('save')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
              actionTab === 'save'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📸 Congelar Versão Atual
          </button>
          <button
            type="button"
            onClick={() => setActionTab('manage')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
              actionTab === 'manage'
                ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Versões Salvas ({baselines.length})
          </button>
        </div>

        {/* Aba 1: Congelar Versão Atual */}
        {actionTab === 'save' && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Escolha do Tipo de Snapshot */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-medium">Tipo de Foto / Congelamento:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSnapshotType('original')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    snapshotType === 'original'
                      ? 'border-teal-500/80 bg-teal-500/15 text-white ring-1 ring-teal-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Base Original</span>
                    {originalBaseline && (
                      <span className="text-[10px] text-amber-400 font-normal">Já existe</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Meta de início de ano (ponto de partida de referência).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapshotType('revision')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    snapshotType === 'revision'
                      ? 'border-teal-500/80 bg-teal-500/15 text-white ring-1 ring-teal-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Nova Revisão</span>
                    <span className="text-[10px] text-teal-300 font-normal">
                      {revisionBaselines.length}/2 ativas
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Revisão numerada para mudanças de cenário no ano.
                  </div>
                </button>
              </div>
            </div>

            {/* Aviso quando a base já existe */}
            {snapshotType === 'original' && originalBaseline && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Você já tem uma Base Original para {year}. Salvar como Base Original agora irá{' '}
                  <strong>substituir</strong> a foto inicial com os dados atuais da tela.
                </span>
              </div>
            )}

            {/* Aviso quando já existem 2 revisões */}
            {snapshotType === 'revision' && revisionBaselines.length >= 2 && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-teal-300 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
                <span>
                  Você já possui 2 revisões ativas. Ao criar uma nova, a revisão mais antiga será{' '}
                  <strong>automaticamente rotacionada</strong>, mantendo sempre as 2 mais recentes.
                </span>
              </div>
            )}

            {/* Observações Opcionais */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Motivo / Observação (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Planejamento inicial de Janeiro, Aumento salarial em Junho..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando na Nuvem...' : 'Congelar Agora'}
              </button>
            </div>
          </form>
        )}

        {/* Aba 2: Gerenciar / Selecionar Versões Salvas */}
        {actionTab === 'manage' && (
          <div className="space-y-3 text-xs">
            {baselines.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <Camera className="w-8 h-8 mx-auto text-slate-600" />
                <p>Nenhuma versão congelada ainda para o ano {year}.</p>
                <button
                  type="button"
                  onClick={() => setActionTab('save')}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Congelar Primeira Versão
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {baselines.map(b => {
                  const isActive = activeBaselineId === b.id;
                  const isOriginal = b.type === 'original';

                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isOriginal
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            }`}
                          >
                            {isOriginal ? 'Base Original' : `Revisão 0${b.revisionNumber || 1}`}
                          </span>
                          <span className="font-bold text-white truncate">{b.title}</span>
                          {isActive && (
                            <span className="text-[10px] text-teal-400 font-semibold">(Ativo na tela)</span>
                          )}
                        </div>

                        {b.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{b.notes}</p>
                        )}

                        <div className="text-[10px] text-slate-500 mt-1">
                          Congelado em: {new Date(b.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(b.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Botões de Ação para cada Versão */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBaseline(isActive ? null : b.id);
                            onClose();
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-slate-800 text-slate-300 hover:text-white'
                              : 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30'
                          }`}
                        >
                          {isActive ? 'Ver Tempo Real' : 'Visualizar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOverwrite(b.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Atualizar esta foto com os dados atuais da tela"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Excluir versão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

