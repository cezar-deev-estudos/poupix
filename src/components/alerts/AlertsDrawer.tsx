'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AlertNotification } from '@/types/finance';
import {
  Bell,
  X,
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { alerts, unreadAlertsCount, markAlertAsRead, markAllAlertsAsRead } = useFinance();

  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'card_due':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'budget_exceeded':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'budget_warning':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'goal_reached':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Central de Notificações
                {unreadAlertsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadAlertsCount} novas
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Vencimentos, faturas e limites</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadAlertsCount > 0 && (
              <button
                onClick={markAllAlertsAsRead}
                title="Marcar todas como lidas"
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500/40" />
              <p className="text-sm font-semibold text-slate-400">Tudo em dia!</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Você não possui nenhuma fatura vencendo ou orçamento ultrapassado no momento.
              </p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => markAlertAsRead(alert.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  getSeverityBg(alert.severity)
                } ${alert.isRead ? 'opacity-60 bg-slate-950/40 border-slate-800/60' : 'shadow-lg'}`}
              >
                {!alert.isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-slate-900" />
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 shrink-0">
                    {renderIcon(alert.type)}
                  </div>
                  <div className="space-y-1 pr-3">
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-500 block pt-1">
                      {new Date(alert.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Alertas gerados automaticamente pelo assistente financeiro Poupix.
          </p>
        </div>
      </div>
    </div>
  );
};
