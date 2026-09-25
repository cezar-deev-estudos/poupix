'use client';

import React from 'react';
import {
  X,
  CreditCard,
  Wallet,
  Tag as TagIcon,
  RefreshCw,
  ShieldCheck,
  ArrowLeftRight,
  Users,
  Settings,
  UploadCloud,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenImporter: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenImporter,
}) => {
  const { isPrivacyMode, togglePrivacyMode, theme, toggleTheme, currentUser } = useFinance();
  const { user, isDemoMode, signOut, exitDemoMode } = useAuth();

  if (!isOpen) return null;

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    if (isDemoMode) {
      exitDemoMode();
    } else {
      await signOut();
    }
  };

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      id: 'cards',
      label: 'Cartões de Crédito',
      icon: <CreditCard className="w-5 h-5 text-cyan-400" />,
      color: 'bg-cyan-500/10 border-cyan-500/20',
      desc: 'Faturas, limites e vencimentos',
    },
    {
      id: 'accounts',
      label: 'Contas & Carteiras',
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20',
      desc: 'Bancos, saldos e transferências',
    },
    {
      id: 'tags',
      label: 'Tags & Etiquetas',
      icon: <TagIcon className="w-5 h-5 text-amber-400" />,
      color: 'bg-amber-500/10 border-amber-500/20',
      desc: 'Gerenciar marcadores de lançamentos',
    },
    {
      id: 'projections',
      label: 'Projeção Futura',
      icon: <RefreshCw className="w-5 h-5 text-indigo-400" />,
      color: 'bg-indigo-500/10 border-indigo-500/20',
      desc: 'Fluxo de caixa projetado nos próximos meses',
    },
    {
      id: 'openfinance',
      label: 'Hub Open Finance',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      color: 'bg-purple-500/10 border-purple-500/20',
      desc: 'Conexões bancárias automáticas',
    },
    {
      id: 'reports',
      label: 'Relatórios & PDF',
      icon: <ArrowLeftRight className="w-5 h-5 text-teal-400" />,
      color: 'bg-teal-500/10 border-teal-500/20',
      desc: 'Exportação completa de dados e relatórios',
    },
    {
      id: 'users',
      label: 'Usuários & Perfis',
      icon: <Users className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-500/10 border-blue-500/20',
      desc: 'Gerenciar membros da família e acessos',
    },
    {
      id: 'settings',
      label: 'Configurações & Backup',
      icon: <Settings className="w-5 h-5 text-slate-400" />,
      color: 'bg-slate-800/40 border-slate-700/40',
      desc: 'Supabase, exportação JSON e preferências',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-fadeIn md:hidden">
      <div
        className="bg-[#181d28] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 animate-slideUp"
      >
        {/* Barra Superior / Puxador e Botão Fechar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mais Opções</h3>
              <p className="text-[11px] text-slate-400">Acesse todos os recursos do Poupix PRO</p>
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

        {/* Atalhos Rápidos (Importar, Privacidade, Tema) */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenImporter();
            }}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center gap-1.5 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-center">Importar OFX/CSV</span>
          </button>

          <button
            type="button"
            onClick={togglePrivacyMode}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center gap-1.5 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            {isPrivacyMode ? (
              <EyeOff className="w-5 h-5 text-emerald-400" />
            ) : (
              <Eye className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-[10px] font-semibold text-center">
              {isPrivacyMode ? 'Privacidade: ON' : 'Privacidade: OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center gap-1.5 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <span className="text-[10px] font-semibold text-center">
              {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          </button>
        </div>

        {/* Lista Completa de Módulos */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 block">
            Módulos do Sistema
          </span>

          <div className="grid grid-cols-1 gap-2">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-500/15 border-purple-500/50 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
                    </div>
                  </div>

                  <span className="text-slate-500 text-xs font-bold pr-1">➔</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Perfil & Logout no Rodapé do Drawer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-400 shrink-0">
              {isDemoMode ? '🎭' : (user?.email?.[0] || currentUser.name[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {isDemoMode ? 'Modo Demonstração' : (user?.user_metadata?.full_name || currentUser.name)}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {isDemoMode ? 'Dados de exemplo' : (user?.email || currentUser.email)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
