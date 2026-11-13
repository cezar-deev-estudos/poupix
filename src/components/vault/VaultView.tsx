'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Building2,
  CreditCard,
  Mail,
  Globe,
  MoreVertical,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { VaultEntry, VaultCategory, VaultEntryFormData } from '@/types/vault';
import {
  fetchVaultEntries,
  createVaultEntry,
  updateVaultEntry,
  deleteVaultEntry,
  revealPassword,
} from '@/lib/supabase/vaultService';
import { VaultUnlockModal } from './VaultUnlockModal';
import { VaultEntryModal } from './VaultEntryModal';

const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'all', label: 'Todos', icon: KeyRound },
  { id: 'bank', label: 'Bancos', icon: Building2 },
  { id: 'card', label: 'Cartões', icon: CreditCard },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'service', label: 'Serviços', icon: Globe },
  { id: 'other', label: 'Outros', icon: KeyRound },
];

export const VaultView: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Controle de Desbloqueio Global da Sessão
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Modais de Criação/Edição
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [decryptedEditPassword, setDecryptedEditPassword] = useState('');

  // Senhas reveladas individualmente na tela (armazenadas em memória)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchVaultEntries(user.id);
      setEntries(data);
    } catch (err) {
      console.error('Falha ao buscar cofres:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Exigir desbloqueio estrito antes de executar QUALQUER ação sensível (sem manter sessão aberta)
  const requireUnlock = (action: () => void) => {
    setPendingAction(() => action);
    setShowUnlockModal(true);
  };

  const handleUnlockSuccess = () => {
    setShowUnlockModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Revelar senha de um item (sempre exige PIN, e oculta após 30 segundos)
  const handleToggleReveal = async (entry: VaultEntry) => {
    if (revealedPasswords[entry.id]) {
      setRevealedPasswords(prev => {
        const copy = { ...prev };
        delete copy[entry.id];
        return copy;
      });
      return;
    }

    requireUnlock(async () => {
      const plain = await revealPassword(entry.password_encrypted);
      setRevealedPasswords(prev => ({ ...prev, [entry.id]: plain }));

      // Auto-ocultar após 30 segundos por segurança
      setTimeout(() => {
        setRevealedPasswords(prev => {
          const copy = { ...prev };
          delete copy[entry.id];
          return copy;
        });
      }, 30000);
    });
  };

  // Copiar senha com segurança (sempre exige PIN)
  const handleCopyPassword = async (entry: VaultEntry) => {
    requireUnlock(async () => {
      const plain = await revealPassword(entry.password_encrypted);
      await navigator.clipboard.writeText(plain);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Salvar novo ou editado
  const handleSaveEntry = async (data: VaultEntryFormData) => {
    if (!user?.id) return;
    if (editingEntry) {
      await updateVaultEntry(editingEntry.id, user.id, data);
    } else {
      await createVaultEntry(user.id, data);
    }
    await loadData();
    setShowEntryModal(false);
    setEditingEntry(null);
  };

  // Editar
  const handleEdit = (entry: VaultEntry) => {
    requireUnlock(async () => {
      const plain = await revealPassword(entry.password_encrypted);
      setEditingEntry(entry);
      setDecryptedEditPassword(plain);
      setShowEntryModal(true);
    });
  };

  // Excluir
  const handleDelete = (entry: VaultEntry) => {
    requireUnlock(async () => {
      if (confirm(`Deseja realmente remover o acesso "${entry.title}"?`)) {
        await deleteVaultEntry(entry.id, user!.id);
        await loadData();
      }
    });
  };

  // Filtragem
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.username && e.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' ? true : e.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

  const getCategoryIcon = (cat: VaultCategory) => {
    switch (cat) {
      case 'bank':
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-sky-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'service':
        return <Globe className="w-4 h-4 text-indigo-400" />;
      default:
        return <KeyRound className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Cofre de Senhas
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-3 h-3" /> Protegido por PIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Armazenamento criptografado de contas, cartões e credenciais importantes.
          </p>
        </div>

        {/* Botão Novo Acesso */}
        <div className="flex items-center gap-2">
          {Object.keys(revealedPasswords).length > 0 && (
            <button
              onClick={() => setRevealedPasswords({})}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-1.5"
              title="Ocultar todas as senhas"
            >
              <EyeOff className="w-3.5 h-3.5" /> Ocultar Abertas
            </button>
          )}
          <button
            onClick={() => {
              setEditingEntry(null);
              setDecryptedEditPassword('');
              setShowEntryModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Novo Acesso
          </button>
        </div>
      </div>

      {/* Barra de Busca & Filtros por Categoria */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário ou serviço..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Acessos Minimalista em Linhas Lineares */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Carregando acessos seguros...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6">
          <KeyRound className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
          <p className="text-sm text-slate-300 font-medium">Nenhum acesso encontrado</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchQuery
              ? 'Tente buscar com outro termo ou filtro de categoria.'
              : 'Clique no botão "+ Novo Acesso" acima para guardar seu primeiro acesso protegido.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60 shadow-lg">
          {filteredEntries.map(entry => {
            const isRevealed = !!revealedPasswords[entry.id];
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className="group px-3.5 py-2.5 sm:px-4 sm:py-3 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4"
              >
                {/* Lado Esquerdo: Ícone + Título + Usuário + Notas */}
                <div className="flex items-center gap-3 min-w-0 md:w-5/12 lg:w-4/12">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0">
                    {getCategoryIcon(entry.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-medium text-white truncate">
                        {entry.title}
                      </h3>
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Abrir site"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                      {entry.username && <span className="truncate">{entry.username}</span>}
                      {entry.username && entry.notes && <span>•</span>}
                      {entry.notes && (
                        <span className="text-slate-500 truncate" title={entry.notes}>
                          {entry.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meio: Campo de Senha Protegida com Ver e Copiar */}
                <div className="flex items-center justify-between md:justify-center gap-2 min-w-0 md:flex-1">
                  <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/60 rounded-lg px-2.5 py-1 max-w-[200px] sm:max-w-[240px] w-full">
                    <span className="font-mono text-xs text-slate-300 truncate select-all flex-1">
                      {isRevealed ? revealedPasswords[entry.id] : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => handleToggleReveal(entry)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title={isRevealed ? 'Ocultar' : 'Visualizar com PIN'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyPassword(entry)}
                      className={`p-1 transition-colors ${
                        isCopied ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Copiar senha"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* No Mobile: Ações ficam inline nessa mesma barra para economizar altura */}
                  <div className="flex items-center gap-1 md:hidden">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lado Direito no Desktop: Botões de Editar e Excluir */}
                <div className="hidden md:flex items-center justify-end gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Desbloqueio por PIN */}
      <VaultUnlockModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleUnlockSuccess}
      />

      {/* Modal de Adicionar / Editar */}
      <VaultEntryModal
        key={editingEntry ? `edit-${editingEntry.id}` : 'new-entry'}
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
          setDecryptedEditPassword('');
        }}
        onSave={handleSaveEntry}
        initialData={editingEntry}
        initialPasswordDecrypted={decryptedEditPassword}
      />
    </div>
  );
};
