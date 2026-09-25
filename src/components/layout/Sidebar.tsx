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
  UserCheck,
  LogOut,
  Tag as TagIcon,
  MoreHorizontal
} from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { MobileMoreDrawer } from './MobileMoreDrawer';
import { MobileSpeedDial } from './MobileSpeedDial';

export type ActiveTab = 'dashboard' | 'transactions' | 'cards' | 'accounts' | 'budgets' | 'goals' | 'tags' | 'projections' | 'openfinance' | 'reports' | 'users' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: (flowType?: import('../transactions/modal/TransactionModal').TransactionFlowType) => void;
  onOpenImporter?: () => void;
}

import { NewTransactionPopover } from './NewTransactionPopover';
import { ConfirmModal } from '../ui/ConfirmModal';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenImporter,
}) => {
  const { isPrivacyMode, togglePrivacyMode, theme, toggleTheme } = useFinance();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = React.useState(false);
  const [isMobileSpeedDialOpen, setIsMobileSpeedDialOpen] = React.useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transações', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'cards', label: 'Cartões', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'accounts', label: 'Contas', icon: <Wallet className="w-4 h-4" /> },
    { id: 'budgets', label: 'Orçamentos', icon: <PieChart className="w-4 h-4" /> },
    { id: 'goals', label: 'Metas & Sonhos', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'tags', label: 'Tags & Etiquetas', icon: <TagIcon className="w-4 h-4 text-amber-400" /> },
    { id: 'projections', label: 'Projeção Futura', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'openfinance', label: 'Open Finance', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { id: 'reports', label: 'Relatórios & PDF', icon: <ArrowLeftRight className="w-4 h-4 text-teal-400" /> },
    { id: 'users', label: 'Usuários & Perfis', icon: <Users className="w-4 h-4 text-cyan-400" /> },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-950/80 border-r border-slate-800/80 p-5 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto">
        <div className="relative">
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

          {/* Botão Novo com Popover Dropdown */}
          <div className="relative mb-3">
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo</span>
            </button>

            <NewTransactionPopover
              isOpen={isPopoverOpen}
              onClose={() => setIsPopoverOpen(false)}
              onSelectFlow={onOpenNewTransaction}
            />
          </div>

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

        {/* Rodapé da Sidebar: Usuário Logado & Configurações */}
        <div className="pt-3 border-t border-slate-900 space-y-2 text-xs">
          <SidebarUserBadge />

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'settings' ? 'text-emerald-400 bg-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚙️ Configurações & Backup</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation para Mobile / PWA no Padrão Mobills */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161a23]/95 border-t border-slate-800/90 backdrop-blur-xl px-3 py-1.5 flex items-center justify-around shadow-2xl">
        {/* 1. Principal */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Principal</span>
        </button>

        {/* 2. Transações */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[10px]">Transações</span>
        </button>

        {/* 3. Botão Central Flutuante (+) */}
        <button
          type="button"
          onClick={() => setIsMobileSpeedDialOpen(true)}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center -mt-5 shadow-lg shadow-purple-600/40 border-2 border-[#161a23] transition-transform active:scale-95 cursor-pointer shrink-0"
          title="Novo Lançamento"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* 4. Planejamento (Orçamentos) */}
        <button
          type="button"
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'budgets' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Planejamento</span>
        </button>

        {/* 5. Mais (...) */}
        <button
          type="button"
          onClick={() => setIsMoreDrawerOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            !['dashboard', 'transactions', 'budgets'].includes(activeTab)
              ? 'text-purple-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </div>

      {/* Speed Dial Flutuante ao Clicar no (+) Central no Mobile */}
      <MobileSpeedDial
        isOpen={isMobileSpeedDialOpen}
        onClose={() => setIsMobileSpeedDialOpen(false)}
        onSelectFlow={onOpenNewTransaction}
      />

      {/* Drawer Mais Opções no Mobile */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenImporter={onOpenImporter || (() => {})}
      />
    </>
  );
};

const SidebarUserBadge: React.FC = () => {
  const { user, isDemoMode, signOut, exitDemoMode } = useAuth();
  const { currentUser } = useFinance();
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = React.useState(false);

  const handleConfirmLogout = async () => {
    setIsConfirmLogoutOpen(false);
    if (isDemoMode) {
      exitDemoMode();
    } else {
      await signOut();
    }
  };

  return (
    <>
      <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0">
              {isDemoMode ? '🎭' : (user?.email?.[0] || currentUser.name[0]).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-bold text-white block truncate">
                {isDemoMode ? 'Modo Demonstração' : (user?.user_metadata?.full_name || currentUser.name)}
              </span>
              <span className="text-[9px] text-slate-400 block truncate">
                {isDemoMode ? 'Dados de exemplo' : (user?.email || currentUser.email)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsConfirmLogoutOpen(true)}
            title="Sair / Trocar de Usuário"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmLogoutOpen}
        title="Sair da Conta"
        message="Deseja realmente sair da conta atual?"
        confirmLabel="Sim, Sair"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsConfirmLogoutOpen(false)}
      />
    </>
  );
};

