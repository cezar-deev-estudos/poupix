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
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  KeyRound,
} from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { MobileMoreDrawer } from './MobileMoreDrawer';
import { MobileSpeedDial } from './MobileSpeedDial';

export type ActiveTab = 'dashboard' | 'transactions' | 'cards' | 'accounts' | 'budgets' | 'goals' | 'tags' | 'projections' | 'openfinance' | 'reports' | 'vault' | 'users' | 'settings' | 'monthly-balance' | 'pending-alerts';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: (flowType?: import('../transactions/modal/TransactionModal').TransactionFlowType) => void;
  onOpenImporter?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

import { NewTransactionPopover } from './NewTransactionPopover';
import { ConfirmModal } from '../ui/ConfirmModal';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenImporter,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { isPrivacyMode, togglePrivacyMode, theme, toggleTheme } = useFinance();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = React.useState(false);
  const [isMobileSpeedDialOpen, setIsMobileSpeedDialOpen] = React.useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transações', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'cards', label: 'Cartões de Crédito', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'accounts', label: 'Contas', icon: <Wallet className="w-4 h-4" /> },
    { id: 'budgets', label: 'Planejamento', icon: <PieChart className="w-4 h-4" /> },
    { id: 'goals', label: 'Metas & Sonhos', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'tags', label: 'Tags & Etiquetas', icon: <TagIcon className="w-4 h-4 text-amber-400" /> },
    { id: 'projections', label: 'Projeção Futura', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'openfinance', label: 'Open Finance', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { id: 'reports', label: 'Relatórios', icon: <ArrowLeftRight className="w-4 h-4 text-teal-400" /> },
    { id: 'vault', label: 'Cofre de Senhas', icon: <KeyRound className="w-4 h-4 text-emerald-400" /> },
    { id: 'users', label: 'Usuários & Perfis', icon: <Users className="w-4 h-4 text-cyan-400" /> },
  ];

  return (
    <>
      {/* Sidebar Desktop com suporte a Recolher/Expandir */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-5'
          }`}
      >
        <div className="relative w-full">
          {/* Logo & Marca & Botão de Recolher */}
          <div className={`flex items-center justify-between py-2 mb-4 ${isCollapsed ? 'flex-col gap-3 px-0' : 'px-2'}`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-black text-base text-white tracking-tight flex items-center gap-1">
                    Poupix<span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">PRO</span>
                  </h1>
                  <span className="text-[10px] text-slate-400">Controle Financeiro</span>
                </div>
              )}
            </div>

            {/* Controle Topo: Toggle Sidebar (Recolher/Expandir) */}
            <div className="flex items-center gap-1.5">
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={isCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-emerald-400" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Botão Novo com Popover Dropdown */}
          <div className="relative mb-3">
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              title={isCollapsed ? 'Nova Transação' : undefined}
              className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] text-xs ${isCollapsed ? 'p-2.5 h-10 w-10 mx-auto' : 'py-2.5 px-4'
                }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>+ Novo</span>}
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
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${isCollapsed ? 'justify-center p-2.5 h-10' : 'gap-3 px-3.5 py-2'
                    } ${isActive
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Usuário Logado & Configurações */}
        <div className="pt-3 border-t border-slate-900 space-y-2 text-xs w-full">
          {!isCollapsed ? (
            <>
              <SidebarUserBadge />
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-emerald-400 bg-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <span>⚙️ Configurações & Backup</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('settings')}
              title="Configurações & Backup"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-emerald-400 bg-slate-900' : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>⚙️</span>
            </button>
          )}
        </div>
      </aside>

      {/* Bottom Navigation para Mobile / PWA no Padrão Mobills */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161a23]/95 border-t border-slate-800/90 backdrop-blur-xl px-3 py-1.5 flex items-center justify-around shadow-2xl">
        {/* 1. Principal */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Principal</span>
        </button>

        {/* 2. Transações */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${activeTab === 'transactions' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[10px]">Transações</span>
        </button>

        {/* 3. Botão Central Flutuante (+) */}
        <button
          type="button"
          onClick={() => setIsMobileSpeedDialOpen(true)}
          className="w-14 h-14 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white flex items-center justify-center -mt-6 shadow-xl shadow-purple-600/50 border-4 border-[#161a23] transition-transform active:scale-95 cursor-pointer shrink-0"
          title="Novo Lançamento"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>

        {/* 4. Planejamento (Orçamentos) */}
        <button
          type="button"
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${activeTab === 'budgets' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Planejamento</span>
        </button>

        {/* 5. Mais (...) */}
        <button
          type="button"
          onClick={() => setIsMoreDrawerOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${!['dashboard', 'transactions', 'budgets'].includes(activeTab)
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
        onOpenImporter={onOpenImporter || (() => { })}
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

