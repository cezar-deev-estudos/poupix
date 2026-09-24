'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { UserProfile } from '@/types/finance';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Check,
  X,
  Mail,
  DollarSign,
  Crown,
  Sparkles
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const { users, currentUser, switchUser, addUser, updateUser, deleteUser } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [monthlyTarget, setMonthlyTarget] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('member');
    setMonthlyTarget('8000');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setMonthlyTarget(user.monthlyIncomeTarget ? user.monthlyIncomeTarget.toString() : '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(monthlyTarget.replace(',', '.'));

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        email,
        role,
        monthlyIncomeTarget: !isNaN(targetVal) ? targetVal : undefined,
      });
    } else {
      addUser({
        name,
        email,
        role,
        currency: 'BRL (R$)',
        monthlyIncomeTarget: !isNaN(targetVal) ? targetVal : undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-slate-900 border border-cyan-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Multi-usuário & Gestão Familiar</span>
          </div>
          <h2 className="text-2xl font-black text-white">Controle de Perfis & Acessos</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Gerencie múltiplos perfis financeiros (pessoal, conjunto, membros da família). Alterne facilmente o perfil ativo para organizar lançamentos de forma independente ou consolidada.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer hover:scale-105 shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          <span>Novo Perfil de Usuário</span>
        </button>
      </div>

      {/* Perfil Atual em Uso */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
          Perfil Ativo no Momento
        </span>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-950/60 border border-cyan-500/30 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                  <UserCheck className="w-3 h-3" />
                  Sessão Ativa
                </span>
                {currentUser.role === 'admin' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block">Meta Mensal de Receitas</span>
            <span className="text-sm font-black text-emerald-400">
              R$ {(currentUser.monthlyIncomeTarget || 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Todos os Perfis */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Todos os Perfis Cadastrados ({users.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(user => {
            const isSelected = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={`bg-slate-900/40 border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                  isSelected ? 'border-cyan-500/40 bg-slate-900/80 ring-1 ring-cyan-500/20' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-lg border border-slate-700">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{user.name}</h4>
                      <p className="text-xs text-slate-400">{user.email}</p>
                      <span className="text-[10px] text-slate-500 capitalize block mt-0.5">
                        Função: {user.role === 'admin' ? 'Administrador' : user.role === 'member' ? 'Membro' : 'Convidado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Editar Perfil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {users.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remover perfil "${user.name}"?`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                        title="Excluir Perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Moeda: {user.currency || 'BRL (R$)'}
                  </span>

                  {isSelected ? (
                    <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Ativo
                    </span>
                  ) : (
                    <button
                      onClick={() => switchUser(user.id)}
                      className="px-4 py-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Alternar para este perfil
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">
              {editingUser ? 'Editar Perfil de Usuário' : 'Novo Perfil de Usuário'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="maria@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Nível de Permissão</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="admin">👑 Administrador</option>
                    <option value="member">👤 Membro</option>
                    <option value="guest">👁️ Convidado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Meta de Renda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={monthlyTarget}
                    onChange={e => setMonthlyTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
