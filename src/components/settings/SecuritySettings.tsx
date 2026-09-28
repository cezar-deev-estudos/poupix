'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Monitor, Smartphone, Check, AlertCircle } from 'lucide-react';

interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  lastActive: string;
  isCurrent: boolean;
}

export const SecuritySettings: React.FC = () => {
  const { user } = useAuth();

  // Estados de Email
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Estados de Senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Dispositivos Conectados
  const [devices, setDevices] = useState<DeviceInfo[]>([
    { id: 'dev-1', name: 'Chrome Windows', type: 'desktop', lastActive: 'Dispositivo atual', isCurrent: true },
    { id: 'dev-2', name: 'Chrome Windows', type: 'desktop', lastActive: 'há 4 meses', isCurrent: false },
    { id: 'dev-3', name: 'Samsung SM-A166M', type: 'mobile', lastActive: 'há 4 meses', isCurrent: false },
  ]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  const toggleSelectAllDevices = () => {
    if (selectedDeviceIds.length === devices.filter(d => !d.isCurrent).length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(devices.filter(d => !d.isCurrent).map(d => d.id));
    }
  };

  const toggleSelectDevice = (id: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  const handleDisconnectSelected = () => {
    setDevices(prev => prev.filter(d => !selectedDeviceIds.includes(d.id)));
    setSelectedDeviceIds([]);
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoadingEmail(true);
    setEmailStatus(null);

    try {
      const client = getSupabaseClient();
      if (client && user) {
        const { error } = await client.auth.updateUser({ email: newEmail.trim() });
        if (error) throw error;
        setEmailStatus({ type: 'success', message: 'E-mail de confirmação enviado para o novo endereço!' });
      } else {
        setEmailStatus({ type: 'success', message: 'E-mail alterado com sucesso no modo local!' });
      }
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setNewEmail('');
        setEmailStatus(null);
      }, 2000);
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err?.message || 'Erro ao alterar e-mail.' });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    setLoadingPassword(true);
    setPasswordStatus(null);

    try {
      const client = getSupabaseClient();
      if (client && user) {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPasswordStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
      } else {
        setPasswordStatus({ type: 'success', message: 'Senha atualizada com sucesso no modo local!' });
      }
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStatus(null);
      }, 2000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err?.message || 'Erro ao alterar senha.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Informações da conta */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-200">Informações da conta</h4>

        {/* Card Mudar meu e-mail */}
        <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
          <h5 className="text-xs sm:text-sm font-bold text-white">Mudar meu e-mail</h5>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Após solicitar a mudança, enviaremos uma confirmação para o novo e-mail cadastrado. Até a confirmação, sua conta continuará vinculada ao seu e-mail atual ({user?.email || 'usuário'}).
          </p>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            MUDAR E-MAIL
          </button>
        </div>

        {/* Card Mudar minha senha */}
        <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
          <h5 className="text-xs sm:text-sm font-bold text-white">Mudar minha senha</h5>
          <p className="text-[11px] text-slate-400">
            Dica: Se possível, use uma senha que contenha números, letras maiúsculas, minúsculas e caracteres especiais.
          </p>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            ALTERAR SENHA
          </button>
        </div>
      </div>

      {/* Dispositivos conectados */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-200">Dispositivos conectados</h4>

        <div className="bg-[#1f2128] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-white">Meus dispositivos</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              Você tem {devices.length} dispositivo(s) conectado(s).<br />
              Se achar que algum deles não é seu, você pode &ldquo;desconectar dispositivos&rdquo; para finalizar as sessões abertas.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <div
                onClick={toggleSelectAllDevices}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedDeviceIds.length > 0 && selectedDeviceIds.length === devices.filter(d => !d.isCurrent).length
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'border-slate-500 bg-transparent'
                }`}
              >
                {selectedDeviceIds.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Selecionar todos</span>
            </label>
          </div>

          {/* Grid de Dispositivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {devices.map(device => {
              const isSelected = selectedDeviceIds.includes(device.id);
              return (
                <div key={device.id} className="flex items-center gap-3">
                  {!device.isCurrent && (
                    <div
                      onClick={() => toggleSelectDevice(device.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-slate-500 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  )}

                  <div className="flex items-center gap-2 min-w-0">
                    {device.type === 'desktop' ? (
                      <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-white truncate">{device.name}</span>
                    <span
                      className={`text-[11px] truncate ${
                        device.isCurrent ? 'text-purple-400 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {device.lastActive}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3">
            <button
              type="button"
              disabled={selectedDeviceIds.length === 0}
              onClick={handleDisconnectSelected}
              className="px-5 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-rose-500/20 hover:enabled:text-rose-400 cursor-pointer"
            >
              Desconectar dispositivos
            </button>
          </div>
        </div>
      </div>

      {/* Modal Mudar Email */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1f2128] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white">Alterar E-mail da Conta</h4>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Novo E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="novoemail@exemplo.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {emailStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    emailStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {emailStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{emailStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEmail}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {loadingEmail ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mudar Senha */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1f2128] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white">Alterar Senha</h4>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {passwordStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {passwordStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {loadingPassword ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
