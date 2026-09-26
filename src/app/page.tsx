'use client';

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CategoryExpenseChart } from '@/components/dashboard/CategoryExpenseChart';
import { CashflowHistoryChart } from '@/components/dashboard/CashflowHistoryChart';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionsView } from '@/components/transactions/TransactionsView';
import { MobileTransactionsView } from '@/components/transactions/MobileTransactionsView';
import { NewTransactionModal } from '@/components/transactions/NewTransactionModal';
import { CardsView } from '@/components/cards/CardsView';
import { AccountsView } from '@/components/accounts/AccountsView';
import { MobileAccountsView } from '@/components/accounts/MobileAccountsView';
import { BudgetsView } from '@/components/budgets/BudgetsView';
import { GoalsView } from '@/components/goals/GoalsView';
import { TagsView } from '@/components/tags/TagsView';
import { CashFlowProjectionView } from '@/components/projections/CashFlowProjectionView';
import { OpenFinanceView } from '@/components/openfinance/OpenFinanceView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { UsersManagementView } from '@/components/users/UsersManagementView';
import { TransactionModal, TransactionFlowType } from '@/components/transactions/modal/TransactionModal';
import { BankStatementImporterModal } from '@/components/importer/BankStatementImporterModal';
import { AlertsDrawer } from '@/components/alerts/AlertsDrawer';
import { MobillsMobileHome } from '@/components/dashboard/MobillsMobileHome';
import { Plus, ArrowRight, UploadCloud, Bell } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTxFilter, setSelectedTxFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [txModalFlow, setTxModalFlow] = useState<TransactionFlowType>('expense');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  const { unreadAlertsCount } = useFinance();

  const handleOpenNewTransaction = (flow: TransactionFlowType = 'expense') => {
    setTxModalFlow(flow);
    setIsNewTxModalOpen(true);
  };

  const handleNavigateTab = (tab: ActiveTab, filterType?: 'all' | 'income' | 'expense' | 'transfer') => {
    if (filterType) {
      setSelectedTxFilter(filterType);
    } else if (tab === 'transactions') {
      setSelectedTxFilter('all');
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950 pb-20 md:pb-6">
      {/* Sidebar de Navegação */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenImporter={() => setIsImporterOpen(true)}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header com Seletor de Período & Ações Globais */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="hidden md:block">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'transactions' && 'Extrato de Transações'}
              {activeTab === 'cards' && 'Cartões de Crédito'}
              {activeTab === 'accounts' && 'Contas & Carteiras'}
              {activeTab === 'budgets' && 'Orçamentos & Categorias'}
              {activeTab === 'goals' && 'Metas & Sonhos'}
              {activeTab === 'tags' && 'Tags & Etiquetas'}
              {activeTab === 'projections' && 'Projeção de Fluxo de Caixa'}
              {activeTab === 'openfinance' && 'Hub Open Finance'}
              {activeTab === 'reports' && 'Relatórios & Exportação'}
              {activeTab === 'users' && 'Usuários & Perfis'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h2>
            <p className="text-xs text-slate-400">Gerenciamento financeiro pessoal em tempo real</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Botão Importar Extrato */}
            <button
              onClick={() => setIsImporterOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Importar OFX/CSV</span>
            </button>

            {/* Sininho de Notificações / Alertas */}
            <button
              onClick={() => setIsAlertsDrawerOpen(true)}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Seletor de Mês/Ano */}
            <MonthSelector />
          </div>
        </header>

        {/* Visualização Condicional por Aba */}
        {activeTab === 'dashboard' && (
          <>
            {/* Versão Mobile / Tablet (Mobills Standard) */}
            <div className="block md:hidden">
              <MobillsMobileHome
                onNavigateTab={handleNavigateTab}
                onOpenNewTransaction={handleOpenNewTransaction}
              />
            </div>

            {/* Versão Desktop (Inalterada) */}
            <div className="hidden md:block space-y-6">
              {/* Cards de Métricas Principais com Navegação Rápida */}
              <SummaryCards onNavigateTab={handleNavigateTab} />

              {/* Gráficos em Duas Colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryExpenseChart />
                <CashflowHistoryChart />
              </div>

              {/* Últimos Lançamentos com Atalho */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">Últimas Transações do Mês</h3>
                    <p className="text-xs text-slate-400">Atividades recentes registradas</p>
                  </div>
                  <button
                    onClick={() => handleNavigateTab('transactions', 'all')}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                  >
                    Ver todas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <TransactionList limit={5} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <>
            <div className="block md:hidden">
              <MobileTransactionsView initialTypeFilter={selectedTxFilter} />
            </div>
            <div className="hidden md:block">
              <TransactionsView initialTypeFilter={selectedTxFilter} />
            </div>
          </>
        )}

        {activeTab === 'cards' && <CardsView />}
        {activeTab === 'accounts' && (
          <>
            <div className="block md:hidden">
              <MobileAccountsView onNavigateToTransactions={accId => handleNavigateTab('transactions', 'all')} />
            </div>
            <div className="hidden md:block">
              <AccountsView onNavigateToTransactions={accId => handleNavigateTab('transactions', 'all')} />
            </div>
          </>
        )}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'tags' && <TagsView />}
        {activeTab === 'projections' && <CashFlowProjectionView />}
        {activeTab === 'openfinance' && <OpenFinanceView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'users' && <UsersManagementView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Modais e Drawers Globais */}
      <TransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        flowType={txModalFlow}
      />

      <BankStatementImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />

      <AlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsAlertsDrawerOpen(false);
        }}
      />
    </div>
  );
}

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthView } from '@/components/auth/AuthView';

function AppGate() {
  const { user, isDemoMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Iniciando Poupix PRO...</span>
      </div>
    );
  }

  // Se não estiver autenticado e não estiver em Modo Demonstração, renderizar tela de Login/Cadastro
  if (!user && !isDemoMode) {
    return <AuthView />;
  }

  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}


