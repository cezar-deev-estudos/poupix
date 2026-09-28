'use client';

import React, { useState } from 'react';
import { PreferencesSettings } from './PreferencesSettings';
import { NotificationSettings } from './NotificationSettings';
import { DashboardCardsSettings } from './DashboardCardsSettings';
import { SecuritySettings } from './SecuritySettings';
import { DatabaseBackupCard } from './DatabaseBackupCard';
import { Database, Shield } from 'lucide-react';

export type SettingsTab = 'preferences' | 'notifications' | 'dashboard' | 'security' | 'backup';

interface SettingsViewProps {
  initialTab?: SettingsTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'preferences', label: 'Preferências' },
    { id: 'notifications', label: 'Alertas e notificações' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'security', label: 'Segurança' },
    { id: 'backup', label: 'Backup & Nuvem' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header com Abas em Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Configurações</h2>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1c202a] border border-slate-800/80 rounded-2xl overflow-x-auto max-w-full">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
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
