'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { SUPPORTED_INSTITUTIONS } from '@/lib/openFinance';
import { BankInstitution } from '@/types/finance';
import {
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Trash2,
  ArrowRight,
  Zap,
  Lock
} from 'lucide-react';

export const OpenFinanceView: React.FC = () => {
  const { openFinanceConnections, connectBank, syncBankConnection, disconnectBank } = useFinance();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<BankInstitution | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleOpenConnect = (inst: BankInstitution) => {
    setSelectedInstitution(inst);
    setIsConnectModalOpen(true);
  };

  const handleConfirmConnection = () => {
    if (!selectedInstitution) return;
    setIsConnecting(true);

    setTimeout(() => {
      connectBank(selectedInstitution.id, selectedInstitution.name);
      setIsConnecting(false);
      setIsConnectModalOpen(false);
      setSelectedInstitution(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Open Finance */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Open Finance Brasil Regulamentado</span>
          </div>
          <h2 className="text-2xl font-black text-white">Sincronização Bancária Automática</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Conecte suas contas e cartões com segurança criptografada ponta a ponta. Seus saldos e transações são sincronizados em tempo real sem precisar de digitação manual.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 text-center">
            <span className="text-[10px] text-slate-400 block">Conexões Ativas</span>
            <span className="text-lg font-black text-purple-400">{openFinanceConnections.length}</span>
          </div>
          <button
            onClick={() => {
              setSelectedInstitution(SUPPORTED_INSTITUTIONS[0]);
              setIsConnectModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer hover:scale-105 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Conectar Nova Instituição</span>
          </button>
        </div>
      </div>

      {/* Lista de Conexões Ativas */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Instituições Conectadas
        </h3>

        {openFinanceConnections.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-white">Nenhum banco conectado ainda</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Escolha uma instituição abaixo para sincronizar seus extratos e cartões automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openFinanceConnections.map(conn => {
              const inst = SUPPORTED_INSTITUTIONS.find(i => i.id === conn.institutionId);

              return (
                <div
                  key={conn.id}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-slate-700/50"
                      style={{ backgroundColor: `${inst?.primaryColor || '#8B5CF6'}25` }}
                    >
                      {inst?.logo || '🏦'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{conn.institutionName}</h4>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Última sincronização: {new Date(conn.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncBankConnection(conn.id)}
                      disabled={conn.status === 'syncing'}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Sincronizar agora"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${conn.status === 'syncing' ? 'animate-spin text-purple-400' : ''}`} />
                      <span className="hidden sm:inline">
                        {conn.status === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Revogar consentimento e desconectar ${conn.institutionName}?`)) {
                          disconnectBank(conn.id);
                        }
                      }}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="Desconectar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catálogo de Instituições Disponíveis para Conexão */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-white">Instituições Homologadas</h3>
        <p className="text-xs text-slate-400">Selecione para conectar via Open Finance oficial</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUPPORTED_INSTITUTIONS.map(inst => {
            const isConnected = openFinanceConnections.some(c => c.institutionId === inst.id);

            return (
              <div
                key={inst.id}
                onClick={() => !isConnected && handleOpenConnect(inst)}
                className={`p-4 rounded-2xl border transition-all ${
                  isConnected
                    ? 'bg-slate-900/20 border-slate-800/50 opacity-60'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 cursor-pointer shadow-lg hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{inst.logo}</span>
                  {isConnected ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Conectado
                    </span>
                  ) : (
                    <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full">
                      Conectar
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-xs">{inst.name}</h4>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Cód: {inst.code} • {inst.type === 'fintech' ? 'Fintech' : 'Banco'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Conexão Open Finance */}
      {isConnectModalOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                {selectedInstitution.logo}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Conectar ao {selectedInstitution.name}</h3>
                <span className="text-xs text-purple-400 font-medium">Protocolo Seguro Open Finance</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>Dados Protegidos por Criptografia SSL 256-bit</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ao autorizar a conexão, o Poupix receberá permissão de <b>apenas leitura</b> para sincronizar seu saldo, extrato e lançamentos do cartão. Nenhuma movimentação ou transferência pode ser feita.
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Validade do Consentimento:</span>
                  <span className="font-semibold text-white">12 Meses (Renovável)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Instituição Regulada:</span>
                  <span className="font-semibold text-white">Banco Central do Brasil</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                disabled={isConnecting}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmConnection}
                disabled={isConnecting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Autorizar Compartilhamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
