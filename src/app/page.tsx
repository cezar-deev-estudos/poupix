'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
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
import { MobileCardsView } from '@/components/cards/MobileCardsView';
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
import { MobileMonthlyBalanceView } from '@/components/dashboard/MobileMonthlyBalanceView';
import { DesktopMonthlyBalanceView } from '@/components/dashboard/DesktopMonthlyBalanceView';
import { CreditCardsDashboardCard } from '@/components/dashboard/CreditCardsDashboardCard';
import { CategoryIncomeChart } from '@/components/dashboard/CategoryIncomeChart';
import { MonthlyBalanceCard } from '@/components/dashboard/MonthlyBalanceCard';
import {
  DashboardLayoutPreferences,
  DEFAULT_DASHBOARD_LAYOUT,
  DashboardCardId,
  mergeDashboardLayout,
} from '@/types/settings';
import { Plus, ArrowRight, UploadCloud, Bell } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTxFilter, setSelectedTxFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedDetailCardId, setSelectedDetailCardId] = useState<string | null>(null);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txModalFlow, setTxModalFlow] = useState<TransactionFlowType>('expense');
  const [txModalCreditCardId, setTxModalCreditCardId] = useState<string | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  const { unreadAlertsCount } = useFinance();

  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mobills_dashboard_layout');
        if (saved) return mergeDashboardLayout(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_DASHBOARD_LAYOUT;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mobills_dashboard_layout');
      if (saved) {
        setDashboardLayout(mergeDashboardLayout(saved));
      }
    } catch {
      // fallback
    }
  }, [activeTab]);

  // Pilha de histórico de abas navegadas
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(['dashboard']);
  const [exitToastVisible, setExitToastVisible] = useState(false);
  const lastBackPressTimeRef = useRef<number>(0);
  const exitToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mantém refs dos estados para o listener global de popstate sem recriá-lo
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const tabHistoryRef = useRef(tabHistory);
  tabHistoryRef.current = tabHistory;

  const modalsOpenRef = useRef({
    isNewTxModalOpen,
    isImporterOpen,
    isAlertsDrawerOpen,
    selectedDetailCardId,
  });
  modalsOpenRef.current = {
    isNewTxModalOpen,
    isImporterOpen,
    isAlertsDrawerOpen,
    selectedDetailCardId,
  };

  // Garante que o histórico do navegador tenha pelo menos uma entrada nossa para interceptar o popstate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Inicia com um estado Poupix se ainda não houver
      if (!window.history.state?.poupix) {
        window.history.replaceState({ poupix: true, tab: 'dashboard' }, '');
      }
    }
  }, []);

  // Interceptador global do botão "Voltar" nativo do celular (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 1. Se houver modal ou drawer aberto, fecha o modal primeiro
      const { isNewTxModalOpen, isImporterOpen, isAlertsDrawerOpen, selectedDetailCardId } = modalsOpenRef.current;
      if (isNewTxModalOpen || isImporterOpen || isAlertsDrawerOpen || selectedDetailCardId) {
        if (isNewTxModalOpen) {
          setIsNewTxModalOpen(false);
          setEditingTx(null);
          setTxModalCreditCardId(null);
        }
        if (isImporterOpen) setIsImporterOpen(false);
        if (isAlertsDrawerOpen) setIsAlertsDrawerOpen(false);
        if (selectedDetailCardId) setSelectedDetailCardId(null);

        // Reinsere estado para manter o app vivo caso o usuário queira voltar de novo
        window.history.pushState({ poupix: true, tab: activeTabRef.current }, '');
        return;
      }

      // 2. Se não estiver na tela inicial (dashboard), volta para a tela anterior
      const currentTab = activeTabRef.current;
      const historyList = tabHistoryRef.current;

      if (currentTab !== 'dashboard') {
        // Encontra a tela anterior na pilha de histórico
        const newHistory = [...historyList];
        newHistory.pop(); // remove a tela atual
        const prevTab = newHistory.length > 0 ? newHistory[newHistory.length - 1] : 'dashboard';

        setTabHistory(newHistory.length > 0 ? newHistory : ['dashboard']);
        setActiveTab(prevTab);

        // Mantém a trava de navegação no histórico para continuar interceptando
        window.history.pushState({ poupix: true, tab: prevTab }, '');
        return;
      }

      // 3. Se JÁ ESTÁ NA TELA INICIAL (dashboard):
      // Só fecha se clicar 2 vezes dentro de 2 segundos!
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // 2º clique dentro de 2s: permite sair (não reinsere no histórico e deixa o navegador/app fechar)
        if (exitToastTimeoutRef.current) clearTimeout(exitToastTimeoutRef.current);
        setExitToastVisible(false);
        window.history.back();
      } else {
        // 1º clique: impede o fechamento, reinsere no histórico e exibe toast de aviso
        lastBackPressTimeRef.current = now;
        window.history.pushState({ poupix: true, tab: 'dashboard' }, '');

        setExitToastVisible(true);
        if (exitToastTimeoutRef.current) clearTimeout(exitToastTimeoutRef.current);
        exitToastTimeoutRef.current = setTimeout(() => {
          setExitToastVisible(false);
        }, 2000);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimeoutRef.current) clearTimeout(exitToastTimeoutRef.current);
    };
  }, []);

  const handleOpenNewTransaction = (flow: TransactionFlowType = 'expense', defaultCardId?: string) => {
    setTxModalFlow(flow);
    setTxModalCreditCardId(defaultCardId || null);
    setIsNewTxModalOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ poupix: true, modal: 'new-tx' }, '');
    }
  };

  const handleNavigateTab = (
    tab: ActiveTab,
    filterType?: 'all' | 'income' | 'expense' | 'transfer',
    cardId?: string
  ) => {
    if (filterType) {
      setSelectedTxFilter(filterType);
    } else if (tab === 'transactions') {
      setSelectedTxFilter('all');
    }
    if (cardId) {
      setSelectedDetailCardId(cardId);
    } else if (tab !== 'cards') {
      setSelectedDetailCardId(null);
    }

    if (tab !== activeTab) {
      setTabHistory(prev => [...prev, tab]);
      setActiveTab(tab);
      if (typeof window !== 'undefined') {
        window.history.pushState({ poupix: true, tab }, '');
      }
    }
  };

  const handleGoBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

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
        {/* Top Header com Seletor de Período & Ações Globais (Apenas no Desktop) */}
        <header className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div>
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
                onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
              />
            </div>

            {/* Versão Desktop */}
            <div className="hidden md:block space-y-6">
              {/* Cards de Métricas Principais com Navegação Rápida */}
              <SummaryCards onNavigateTab={handleNavigateTab} />

              {/* Gráficos e Cards em Grid de 2 Colunas com Ordem Customizada */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Coluna Esquerda Customizada */}
                <div className="space-y-6">
                  {dashboardLayout.leftColumn
                    .filter(id => Boolean(dashboardLayout.enabled[id]))
                    .map(id => {
                      if (id === 'categoryExpenseChart') return <CategoryExpenseChart key={id} />;
                      if (id === 'categoryIncomeChart') return <CategoryIncomeChart key={id} />;
                      if (id === 'monthlyBalanceCard') return <MonthlyBalanceCard key={id} onNavigateTab={handleNavigateTab} />;
                      if (id === 'creditCardInfo') {
                        return (
                          <CreditCardsDashboardCard
                            key={id}
                            onNavigateTab={handleNavigateTab}
                            onOpenNewTransaction={handleOpenNewTransaction}
                          />
                        );
                      }
                      if (id === 'monthlyBalanceChart') return <CashflowHistoryChart key={id} />;
                      if (id === 'recentTransactions') {
                        return (
                          <div key={id} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
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
                        );
                      }
                      return null;
                    })}
                </div>

                {/* Coluna Direita Customizada */}
                <div className="space-y-6">
                  {dashboardLayout.rightColumn
                    .filter(id => Boolean(dashboardLayout.enabled[id]))
                    .map(id => {
                      if (id === 'categoryExpenseChart') return <CategoryExpenseChart key={id} />;
                      if (id === 'categoryIncomeChart') return <CategoryIncomeChart key={id} />;
                      if (id === 'monthlyBalanceCard') return <MonthlyBalanceCard key={id} onNavigateTab={handleNavigateTab} />;
                      if (id === 'creditCardInfo') {
                        return (
                          <CreditCardsDashboardCard
                            key={id}
                            onNavigateTab={handleNavigateTab}
                            onOpenNewTransaction={handleOpenNewTransaction}
                          />
                        );
                      }
                      if (id === 'monthlyBalanceChart') return <CashflowHistoryChart key={id} />;
                      if (id === 'recentTransactions') {
                        return (
                          <div key={id} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
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
                        );
                      }
                      return null;
                    })}
                </div>
              </div>

              {/* Botão Gerenciar Tela Inicial */}
              <div className="pt-6 pb-2 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleNavigateTab('settings')}
                  className="flex flex-col items-center gap-2 group cursor-pointer text-slate-400 hover:text-white transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl border-2 border-slate-600 group-hover:border-purple-400 flex items-center justify-center transition-colors">
                    <div className="w-6 h-6 border-2 border-current rounded-md relative flex items-center justify-center">
                      <div className="w-1.5 h-3 bg-current rounded-sm absolute left-1" />
                      <div className="w-1.5 h-1.5 bg-current rounded-sm absolute right-1 top-1" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-purple-400 transition-colors">
                    GERENCIAR TELA INICIAL
                  </span>
                </button>
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

        {activeTab === 'cards' && (
          <>
            <div className="block md:hidden">
              <MobileCardsView
                initialCardId={selectedDetailCardId}
                onBack={handleGoBack}
                onNavigateToTransactions={() => handleNavigateTab('transactions', 'all')}
              />
            </div>
            <div className="hidden md:block">
              <CardsView
                initialCardId={selectedDetailCardId}
                onNavigateToTransactions={() => handleNavigateTab('transactions', 'all')}
              />
            </div>
          </>
        )}
        {activeTab === 'accounts' && (
          <>
            <div className="block md:hidden">
              <MobileAccountsView
                onBack={handleGoBack}
                onNavigateToTransactions={accId => handleNavigateTab('transactions', 'all')}
              />
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
        {activeTab === 'monthly-balance' && (
          <>
            <div className="block md:hidden">
              <MobileMonthlyBalanceView
                onBack={handleGoBack}
                onEditTransaction={tx => {
                  setEditingTx(tx);
                  setTxModalFlow(tx.type === 'transfer' ? 'transfer' : tx.creditCardId ? 'creditCard' : tx.type);
                  setIsNewTxModalOpen(true);
                }}
              />
            </div>
            <div className="hidden md:block">
              <DesktopMonthlyBalanceView
                onBack={handleGoBack}
                onEditTransaction={tx => {
                  setEditingTx(tx);
                  setTxModalFlow(tx.type === 'transfer' ? 'transfer' : tx.creditCardId ? 'creditCard' : tx.type);
                  setIsNewTxModalOpen(true);
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Modais e Drawers Globais */}
      <TransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setEditingTx(null);
          setTxModalCreditCardId(null);
        }}
        flowType={txModalFlow}
        transactionToEdit={editingTx}
        defaultCreditCardId={txModalCreditCardId}
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

      {/* Toast Informativo para saída em 2 cliques na Home (Mobile) */}
      {exitToastVisible && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-slate-700/80 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Pressione voltar novamente para sair</span>
        </div>
      )}
    </div>
  );
}

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthView } from '@/components/auth/AuthView';

function AppGate() {
  const [isMounted, setIsMounted] = useState(false);
  const { user, isDemoMode, loading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loading) {
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


