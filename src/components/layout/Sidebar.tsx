'use client';

import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  PieChart,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Users,
  UserCheck
} from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { useFinance } from '@/context/FinanceContext';

export type ActiveTab = 'dashboard' | 'transactions' | 'cards' | 'accounts' | 'budgets' | 'goals' | 'projections' | 'openfinance' | 'reports' | 'users' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
  onOpenImporter?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenImporter,
}) => {
  const { resetToDefaults, isPrivacyMode, togglePrivacyMode, theme, toggleTheme, currentUser, users, switchUser } = useFinance();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transações', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'cards', label: 'Cartões', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'accounts', label: 'Contas', icon: <Wallet className="w-4 h-4" /> },
    { id: 'budgets', label: 'Orçamentos', icon: <PieChart className="w-4 h-4" /> },
    { id: 'goals', label: 'Metas & Sonhos', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'projections', label: 'Projeção Futura', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'openfinance', label: 'Open Finance', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { id: 'reports', label: 'Relatórios & PDF', icon: <ArrowLeftRight className="w-4 h-4 text-teal-400" /> },
    { id: 'users', label: 'Usuários & Perfis', icon: <Users className="w-4 h-4 text-cyan-400" /> },
  ];


  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-950/80 border-r border-slate-800/80 p-5 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto">
        <div>
          {/* Logo & Marca */}
          <div className="flex items-center justify-between px-2 py-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="font-black text-base text-white tracking-tight flex items-center gap-1">
                  Poupix<span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">PRO</span>
                </h1>
                <span className="text-[10px] text-slate-400">Controle Financeiro</span>
              </div>
            </div>

            {/* Controles Topo: Privacidade e Tema */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePrivacyMode}
                title={isPrivacyMode ? 'Desativar Modo Privacidade' : 'Ativar Modo Privacidade'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Botão Novo Lançamento Rápido */}
          <button
            onClick={onOpenNewTransaction}
            className="w-full mb-3 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>

          {/* Menus de Navegação */}
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-3 border-t border-slate-900 space-y-1 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'settings' ? 'text-emerald-400 bg-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚙️ Configurações & Backup</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de exemplo padrão?')) {
                resetToDefaults();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-900/50 transition-colors text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Demo</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation para Mobile / PWA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-2xl">
        {[
          navItems[0], // Dashboard
          navItems[1], // Transações
          navItems[7], // Open Finance
          navItems[8], // Relatórios
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}

        {/* Botão Flutuante Central de Lançamento */}
        <button
          onClick={onOpenNewTransaction}
          className="w-12 h-12 -mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-slate-950 cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </>
  );
};
