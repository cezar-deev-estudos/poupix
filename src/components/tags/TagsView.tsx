'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Tag } from '@/types/finance';
import { Tag as TagIcon, Plus, Pencil, Trash2, Search, Sparkles, Hash } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

const COLOR_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
];

export const TagsView: React.FC = () => {
  const { tags, transactions, addTag, updateTag, deleteTag } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form State
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(COLOR_PALETTE[0]);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  // Map tag usage counts from transactions
  const tagUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      if (Array.isArray(tx.tags)) {
        tx.tags.forEach(t => {
          map[t] = (map[t] || 0) + 1;
        });
      }
    });
    return map;
  }, [transactions]);

  const filteredTags = useMemo(() => {
    return tags.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [tags, searchQuery]);

  const handleOpenCreate = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color || COLOR_PALETTE[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagName.trim().replace(/^#/, '');
    if (!trimmed) {
      setFormError('O nome da tag é obrigatório.');
      return;
    }

    const duplicate = tags.find(
      t => t.name.toLowerCase() === trimmed.toLowerCase() && t.id !== editingTag?.id
    );
    if (duplicate) {
      setFormError('Já existe uma tag com este nome.');
      return;
    }

    if (editingTag) {
      updateTag(editingTag.id, {
        name: trimmed,
        color: tagColor,
      });
    } else {
      addTag({
        name: trimmed,
        color: tagColor,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingTag) {
      deleteTag(deletingTag.id);
      setDeletingTag(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Métricas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-amber-400" />
            Gerenciamento de Tags
          </h3>
          <p className="text-xs text-slate-400">
            Crie, edite e organize marcadores para filtrar seus lançamentos e despesas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Tag
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2.5">
        <Search className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Buscar tag por nome..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-white mr-2 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Grid de Tags */}
      {filteredTags.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center text-slate-500 space-y-2">
          <Hash className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Nenhuma tag encontrada</p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? 'Tente ajustar sua busca ou limpar o filtro.'
              : 'Clique em "Nova Tag" para criar seu primeiro marcador.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredTags.map(tag => {
            const usageCount = tagUsageMap[tag.name] || 0;
            const themeColor = tag.color || '#F59E0B';

            return (
              <div
                key={tag.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between">
                  {/* Badge da Tag */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
                    style={{
                      borderColor: `${themeColor}60`,
                      backgroundColor: `${themeColor}15`,
                      color: themeColor,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: themeColor }}
                    />
                    <span>#{tag.name}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tag)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar tag"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTag(tag)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Excluir tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Lançamentos vinculados:</span>
                  <span className="font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded-md">
                    {usageCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Tag */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {editingTag ? 'Editar Tag' : 'Nova Tag'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome da Tag */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Nome da Tag</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    #
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Viagem, Reforma, Trabalho..."
                    value={tagName}
                    onChange={e => {
                      setTagName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
              </div>

              {/* Seletor de Cor */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Cor de Identificação</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTagColor(color)}
                      className={`h-8 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                        tagColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {tagColor === color && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pré-visualização */}
              <div className="pt-2 pb-1">
                <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Prévia do Marcador:
                </label>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
                  style={{
                    borderColor: `${tagColor}60`,
                    backgroundColor: `${tagColor}15`,
                    color: tagColor,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tagColor }} />
                  <span>#{tagName.trim() || 'Exemplo'}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  {editingTag ? 'Salvar Alterações' : 'Criar Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!deletingTag}
        title="Excluir Tag"
        message={`Deseja realmente excluir a tag "#${deletingTag?.name}"? Ela será removida de todos os lançamentos vinculados.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTag(null)}
      />
    </div>
  );
};
