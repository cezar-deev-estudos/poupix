'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Goal } from '@/types/finance';
import { Target, Plus, TrendingUp, Calendar, CheckCircle2, Shield, Plane, Car, Home, Laptop, Heart, DollarSign } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal, accounts } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');

  // Form State para Nova/Editar Meta
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('Shield');
  const [category, setCategory] = useState('Segurança');

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const openNewGoalModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setColor('#10B981');
    setIcon('Shield');
    setCategory('Reserva');
    setIsModalOpen(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setColor(goal.color);
    setIcon(goal.icon);
    setCategory(goal.category || 'Objetivos');
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount.replace(',', '.'));
    const cAmt = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (!name || isNaN(tAmt) || tAmt <= 0) return;

    if (selectedGoal) {
      updateGoal(selectedGoal.id, {
        name,
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate,
        color,
        icon,
        category,
        completed: cAmt >= tAmt,
      });
    } else {
      addGoal({
        name,
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate,
        color,
        icon,
        category,
        completed: cAmt >= tAmt,
      });
    }

    setIsModalOpen(false);
  };

  const handleMakeContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoal) return;
    const amount = parseFloat(contributionAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    contributeToGoal(contributionGoal.id, amount, sourceAccountId || undefined);
    setContributionGoal(null);
    setContributionAmount('');
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plane': return <Plane className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Laptop': return <Laptop className="w-5 h-5" />;
      case 'Heart': return <Heart className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Resumo de Metas */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Poupix Goals & Sonhos</span>
          </div>
          <h2 className="text-2xl font-black text-white">Objetivos & Poupança Inteligente</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Planeje metas de curto, médio e longo prazo. Acompanhe a evolução de cada conquista com aportes conectados ao seu saldo.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex-1 md:w-48">
            <span className="text-[11px] text-slate-400 block">Total Acumulado</span>
            <span className="text-lg font-black text-emerald-400">
              R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={openNewGoalModal}
            className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-105 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Grid de Metas Cadastradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

          return (
            <div
              key={goal.id}
              className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition-all group"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                  >
                    {renderIcon(goal.icon)}
                  </div>

                  {goal.completed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluída
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                      {progress.toFixed(0)}% Atingido
                    </span>
                  )}
                </div>

                {/* Título e Categoria */}
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {goal.category || 'Objetivo'}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {goal.name}
                  </h3>
                </div>

                {/* Valores */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Guardado</span>
                    <span className="text-lg font-black text-white">
                      R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Objetivo</span>
                    <span className="text-sm font-semibold text-slate-300">
                      R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-slate-950/80 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: goal.color || '#10B981',
                    }}
                  />
                </div>

                {/* Data e Restante */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span>Falta: R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    setContributionGoal(goal);
                    setContributionAmount('');
                  }}
                  className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Guardar Dinheiro
                </button>
                <button
                  onClick={() => openEditGoalModal(goal)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir a meta "${goal.name}"?`)) {
                      deleteGoal(goal.id);
                    }
                  }}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Adicionar / Editar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">
              {selectedGoal ? 'Editar Meta' : 'Criar Nova Meta'}
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nome do Sonho / Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem Japão, Reserva de Emergência..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10000"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Já Guardado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Data Limite Desejada</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Ícone</label>
                  <select
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Shield">🛡️ Reserva / Segurança</option>
                    <option value="Plane">✈️ Viagem / Férias</option>
                    <option value="Car">🚗 Carro / Veículo</option>
                    <option value="Home">🏠 Imóvel / Reforma</option>
                    <option value="Laptop">💻 Tecnologia / Equipamento</option>
                    <option value="Heart">❤️ Saúde / Casamento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Cor Temática</label>
                <div className="flex gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {selectedGoal ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aporte / Guardar Dinheiro */}
      {contributionGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Guardar para {contributionGoal.name}
            </h3>
            <p className="text-xs text-slate-400">
              O valor guardado será somado à sua meta e abatido da conta bancária de origem.
            </p>

            <form onSubmit={handleMakeContribution} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Valor do Aporte (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="Ex: 500.00"
                  value={contributionAmount}
                  onChange={e => setContributionAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Debitar de qual conta?</label>
                <select
                  value={sourceAccountId}
                  onChange={e => setSourceAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Apenas atualizar valor (sem debitar conta)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContributionGoal(null)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
