'use client';

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { MonthSelector } from '@/components/layout/MonthSelector';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CategoryExpenseChart } from '@/components/dashboard/CategoryExpenseChart';
import { CashflowHistoryChart } from '@/components/dashboard/CashflowHistoryChart';
import { TransactionList } from '@/components/transactions/TransactionList';
import { NewTransactionModal } from '@/components/transactions/NewTransactionModal';
import { CardsView } from '@/components/cards/CardsView';
import { AccountsView } from '@/components/accounts/AccountsView';
import { BudgetsView } from '@/components/budgets/BudgetsView';
import { GoalsView } from '@/components/goals/GoalsView';
import { CashFlowProjectionView } from '@/components/projections/CashFlowProjectionView';
import { OpenFinanceView } from '@/components/openfinance/OpenFinanceView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { UsersManagementView } from '@/components/users/UsersManagementView';
import { BankStatementImporterModal } from '@/components/importer/BankStatementImporterModal';
import { AlertsDrawer } from '@/components/alerts/AlertsDrawer';
import { Plus, ArrowRight, UploadCloud, Bell } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  const { unreadAlertsCount } = useFinance();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950 pb-20 md:pb-6">
      {/* Sidebar de Navegação */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        onOpenImporter={() => setIsImporterOpen(true)}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header com Seletor de Período & Ações Globais */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'transactions' && 'Extrato de Transações'}
              {activeTab === 'cards' && 'Cartões de Crédito'}
              {activeTab === 'accounts' && 'Contas & Carteiras'}
              {activeTab === 'budgets' && 'Orçamentos & Categorias'}
              {activeTab === 'goals' && 'Metas & Sonhos'}
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
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Importar OFX/CSV</span>
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
          <div className="space-y-6">
            {/* Cards de Métricas Principais */}
            <SummaryCards />

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
                  onClick={() => setActiveTab('transactions')}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                >
                  Ver todas
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <TransactionList limit={5} />
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Todas as Transações do Período</h3>
                <p className="text-xs text-slate-400">Clique para marcar como efetivado ou excluir.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImporterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  Importar Extrato
                </button>
                <button
                  onClick={() => setIsNewTxModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova Transação
                </button>
              </div>
            </div>

            <TransactionList showAll />
          </div>
        )}

        {activeTab === 'cards' && <CardsView />}
        {activeTab === 'accounts' && <AccountsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'projections' && <CashFlowProjectionView />}
        {activeTab === 'openfinance' && <OpenFinanceView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'users' && <UsersManagementView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Modais e Drawers Globais */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
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

export default function Home() {
  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  );
}


