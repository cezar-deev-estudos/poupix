'use client';

import React, { useState, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  Settings as SettingsIcon,
  Shield,
  Eye,
  EyeOff,
  Database,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Smartphone,
  Check,
  AlertCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    isPrivacyMode,
    togglePrivacyMode,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetToDefaults,
    accounts,
    transactions,
    creditCards,
    goals,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null);

  const handleDownloadBackup = () => {
    const dataStr = exportDatabaseBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poupix_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const ok = importDatabaseBackup(text);
        if (ok) {
          setImportStatus('success');
          alert('Backup restaurado com sucesso!');
        } else {
          setImportStatus('error');
          alert('Formato de arquivo inválido.');
        }
      } catch (err) {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <SettingsIcon className="w-4 h-4" />
          <span>Preferências do Sistema</span>
        </div>
        <h2 className="text-2xl font-black text-white">Configurações, Privacidade & Backup</h2>
        <p className="text-xs text-slate-400">
          Gerencie a segurança dos seus dados, modo de exibição de valores e faça backups completos.
        </p>
      </div>

      {/* Seção 1: Privacidade e Exibição */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Privacidade & Segurança Visual
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white block">Modo Privacidade (Ocultar Saldos)</span>
            <p className="text-[11px] text-slate-400">
              Oculta os valores monetários na tela principal com símbolos `***`, ideal para usar o app em locais públicos.
            </p>
          </div>

          <button
            onClick={togglePrivacyMode}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isPrivacyMode
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isPrivacyMode ? 'Privacidade Ativa' : 'Privacidade Desativada'}</span>
          </button>
        </div>
      </div>

      {/* Seção 2: Conexão em Nuvem (Supabase) */}
      <SupabaseSettingsCard />

      {/* Seção 3: Backup e Exportação */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Armazenamento & Backup Local
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Exportar */}
          <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white mb-1">Exportar Cópia de Segurança</h4>
              <p className="text-[11px] text-slate-400">
                Baixe um arquivo JSON contendo todas as suas contas ({accounts.length}), transações ({transactions.length}), cartões ({creditCards.length}) e metas ({goals.length}).
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar Backup JSON</span>
            </button>
          </div>

          {/* Card Importar */}
          <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white mb-1">Restaurar Cópia de Segurança</h4>
              <p className="text-[11px] text-slate-400">
                Suba um arquivo JSON de backup previamente exportado para restaurar todos os seus dados.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Restaurar de Arquivo JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção 4: Zona de Perigo */}
      <div className="bg-slate-900/40 border border-rose-500/20 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Redefinição dos Dados
        </h3>
        <p className="text-xs text-slate-400">
          Restaura o estado inicial do banco de dados local com as informações de demonstração.
        </p>

        <button
          onClick={() => {
            if (confirm('Tem certeza de que deseja restaurar todos os dados para os valores padrão de exemplo?')) {
              resetToDefaults();
              alert('Dados restaurados para o padrão de demonstração!');
            }
          }}
          className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restaurar Dados de Exemplo</span>
        </button>
      </div>
    </div>
  );
};

const SupabaseSettingsCard: React.FC = () => {
  const {
    currentUser,
    accounts,
    creditCards,
    categories,
    transactions,
    goals,
    openFinanceConnections
  } = useFinance();

  const [url, setUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mobills_supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    }
    return '';
  });

  const [key, setKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mobills_supabase_anon_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
    return '';
  });

  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const isConnected = Boolean(url && key);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobills_supabase_url', url.trim());
      localStorage.setItem('mobills_supabase_anon_key', key.trim());
      setSyncFeedback({ status: 'success', message: 'Configurações de conexão salvas!' });
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mobills_supabase_url');
      localStorage.removeItem('mobills_supabase_anon_key');
      setUrl('');
      setKey('');
      setSyncFeedback({ status: 'idle', message: 'Credenciais desconectadas.' });
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncFeedback({ status: 'idle', message: '' });

    try {
      const { syncAllToSupabase } = await import('@/lib/supabase/syncService');
      const res = await syncAllToSupabase({
        currentUser,
        accounts,
        creditCards,
        categories,
        transactions,
        goals,
        openFinanceConnections
      });

      if (res.success) {
        setSyncFeedback({ status: 'success', message: res.message });
      } else {
        setSyncFeedback({ status: 'error', message: res.error || res.message });
      }
    } catch (err: any) {
      setSyncFeedback({ status: 'error', message: err?.message || 'Falha ao sincronizar' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Banco de Dados em Nuvem (Supabase PostgreSQL)
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-bold text-slate-300">
            {isConnected ? 'Configurado' : 'Modo Local-First (Offline)'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Conecte seu banco de dados PostgreSQL no Supabase para sincronização em tempo real entre dispositivos e isolamento seguro de múltiplos usuários via RLS.
      </p>

      <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Supabase Project URL
          </label>
          <input
            type="text"
            placeholder="https://sua-instancia.supabase.co"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Supabase Anon Public API Key
          </label>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={key}
            onChange={e => setKey(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Salvar Credenciais
          </button>

          {isConnected && (
            <>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{syncing ? 'Sincronizando Nuvem...' : 'Sincronizar Agora com Supabase'}</span>
              </button>

              <button
                onClick={handleClear}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Desconectar
              </button>
            </>
          )}
        </div>

        {syncFeedback.message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              syncFeedback.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {syncFeedback.status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{syncFeedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
