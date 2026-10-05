'use client';

import React from 'react';
import { OpenFinanceConnection, OpenFinanceSyncSettings } from '@/types/finance';
import { DEFAULT_SYNC_SETTINGS } from '@/lib/openFinance';
import { X, ShieldCheck, Wallet, ArrowLeftRight, CreditCard, CheckCircle2 } from 'lucide-react';

interface BankSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: OpenFinanceConnection | null;
  onSaveSettings: (connectionId: string, settings: OpenFinanceSyncSettings) => void;
}

export const BankSyncSettingsModal: React.FC<BankSyncSettingsModalProps> = ({
  isOpen,
  onClose,
  connection,
  onSaveSettings,
}) => {
  if (!isOpen || !connection) return null;

  const currentSettings: OpenFinanceSyncSettings = connection.settings || DEFAULT_SYNC_SETTINGS;
  const [settings, setSettings] = React.useState<OpenFinanceSyncSettings>(currentSettings);

  React.useEffect(() => {
    if (connection) {
      setSettings(connection.settings || DEFAULT_SYNC_SETTINGS);
    }
  }, [connection]);

  const handleToggle = (key: keyof OpenFinanceSyncSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSaveSettings(connection.id, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1c202a] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-6 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">Preferências de Sincronização</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                {connection.institutionName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina quais dados bancários serão importados para o Poupix PRO.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {/* Sincronizar Saldo */}
          <div
            onClick={() => handleToggle('syncBalance')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242937] border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Sincronizar Saldo da Conta</span>
                <span className="text-[11px] text-slate-400 block">
                  Atualiza o saldo disponível em contas para bater com o banco.
                </span>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.syncBalance ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.syncBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Sincronizar Extrato / Transações */}
          <div
            onClick={() => handleToggle('syncTransactions')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242937] border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Sincronizar Extrato (Débito & PIX)</span>
                <span className="text-[11px] text-slate-400 block">
                  Recebe transações de entrada e saída da conta corrente.
                </span>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.syncTransactions ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.syncTransactions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Sincronizar Faturas de Cartão */}
          <div
            onClick={() => handleToggle('syncCreditCard')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242937] border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Sincronizar Cartão de Crédito</span>
                <span className="text-[11px] text-slate-400 block">
                  Traz compras lançadas na fatura aberta e limite utilizado.
                </span>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.syncCreditCard ? 'bg-violet-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.syncCreditCard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Exigir Aprovação Prévia (Inbox de Conciliação) */}
          <div
            onClick={() => handleToggle('requireApproval')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242937] border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Exigir Aprovação Prévia (Recomendado)</span>
                <span className="text-[11px] text-slate-400 block">
                  Envia para a Fila de Conciliação para você dar OK antes de efetivar.
                </span>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.requireApproval ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.requireApproval ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Preferências</span>
          </button>
        </div>
      </div>
    </div>
  );
};
