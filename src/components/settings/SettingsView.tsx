'use client';

import React, { useState, useEffect } from 'react';
import { PreferencesSettings } from './PreferencesSettings';
import { NotificationSettings } from './NotificationSettings';
import { DashboardCardsSettings } from './DashboardCardsSettings';
import { SecuritySettings } from './SecuritySettings';
import { DatabaseBackupCard } from './DatabaseBackupCard';
import { Database, Shield, Sliders, Bell, LayoutDashboard } from 'lucide-react';

export type SettingsTab = 'preferences' | 'notifications' | 'dashboard' | 'security' | 'backup';

interface SettingsViewProps {
  initialTab?: SettingsTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'preferences', label: 'Preferências', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'notifications', label: 'Alertas', icon: <Bell className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Segurança', icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'backup', label: 'Backup & Nuvem', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header com Abas em Pill Otimizado para Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Configurações</h2>

        {/* Tab Selector com Scroll Horizontal Touch Suave */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1c202a] border border-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar max-w-full scroll-smooth">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div>
        {activeTab === 'preferences' && <PreferencesSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'dashboard' && <DashboardCardsSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'backup' && <DatabaseBackupCard />}
      </div>
    </div>
  );
};
