'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff, Check, Shield } from 'lucide-react';
import { VaultCategory, VaultEntry, VaultEntryFormData } from '@/types/vault';

interface VaultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VaultEntryFormData) => Promise<void>;
  initialData?: VaultEntry | null;
  initialPasswordDecrypted?: string;
}

const CATEGORIES: { label: string; value: VaultCategory }[] = [
  { label: 'Bancos', value: 'bank' },
  { label: 'Cartões', value: 'card' },
  { label: 'E-mail', value: 'email' },
  { label: 'Serviços & Apps', value: 'service' },
  { label: 'Outros', value: 'other' },
];

export const VaultEntryModal: React.FC<VaultEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialPasswordDecrypted = '',
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<VaultCategory>(initialData?.category || 'bank');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialPasswordDecrypted);
  const [url, setUrl] = useState(initialData?.url || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sempre sincronizar campos quando o modal abre ou quando initialData / initialPasswordDecrypted mudam
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setCategory(initialData?.category || 'bank');
      setUsername(initialData?.username || '');
      setPassword(initialPasswordDecrypted || '');
      setUrl(initialData?.url || '');
      setNotes(initialData?.notes || '');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen, initialData, initialPasswordDecrypted]);

  if (!isOpen) return null;

  // Gerador de senhas aleatórias fortes
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let generated = '';
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    if (!password) {
      setError('A senha é obrigatória.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        title: title.trim(),
        category,
        username: username.trim(),
        password,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {initialData ? 'Editar Acesso' : 'Novo Acesso Seguro'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título & Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Acesso *
              </label>
              <input
                type="text"
                placeholder="Ex: Nubank, Gmail, Netflix"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as VaultCategory)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Usuário / E-mail */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Usuário, CPF ou E-mail
            </label>
            <input
              type="text"
              placeholder="Ex: usuario@email.com ou 123.456.789-00"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Senha com botão de visualização e gerador */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Senha / Código Seguro *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Gerar Forte
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a senha a ser guardada"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* URL / Link */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Site / Link (Opcional)
            </label>
            <input
              type="url"
              placeholder="Ex: https://nubank.com.br"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações / Dicas de Segurança (Opcional)
            </label>
            <textarea
              placeholder="Ex: Palavra-chave secreta, agência e conta, validade do cartão..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Guardar Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
