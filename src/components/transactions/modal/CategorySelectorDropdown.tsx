'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Category } from '@/types/finance';
import { CategoryIcon } from '../../ui/CategoryIcon';
import { Bookmark, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';

interface CategorySelectorDropdownProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  variant?: DateVariant;
}

export const CategorySelectorDropdown: React.FC<CategorySelectorDropdownProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  variant = 'rose',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const parentCategory = selectedCategory?.parentId ? categories.find(c => c.id === selectedCategory.parentId) : null;
  const isSubcategory = !!selectedCategory?.parentId;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parentCategories = categories.filter(c => !c.parentId);

  const getBorderColor = () => {
    if (selectedCategory?.color) return selectedCategory.color;
    switch (variant) {
      case 'emerald':
        return '#10B981';
      case 'cyan':
        return '#06B6D4';
      case 'blue':
        return '#3B82F6';
      case 'rose':
      default:
        return '#F43F5E';
    }
  };

  const themeColor = getBorderColor();

  return (
    <div ref={containerRef} className="relative space-y-1">
      {/* Botão Gatilho no Padrão Mobills */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
        <Bookmark className="w-4 h-4 text-slate-500 shrink-0" />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between text-left cursor-pointer group"
        >
          {/* Badge Pílula da Categoria Selecionada */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
            style={{
              borderColor: `${themeColor}90`,
              backgroundColor: `${themeColor}15`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: selectedCategory?.color || themeColor }}
            >
              <CategoryIcon name={selectedCategory?.icon || 'Tag'} size={11} />
            </div>

            <span className="text-xs font-semibold text-white truncate max-w-[240px]">
              {parentCategory ? `${parentCategory.name} / ${selectedCategory?.name}` : selectedCategory?.name || 'Selecione uma categoria'}
            </span>
          </div>

          <div className="text-slate-400 group-hover:text-white p-1 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
      </div>

      {/* Menu Dropdown Suspenso com Hierarquia */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-fadeIn space-y-1">
          {parentCategories.map(parent => {
            const subcategories = categories.filter(c => c.parentId === parent.id);
            const isParentSelected = selectedCategoryId === parent.id;

            return (
              <div key={parent.id} className="space-y-0.5">
                {/* Categoria Pai */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(parent.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    isParentSelected
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: parent.color }}
                  >
                    <CategoryIcon name={parent.icon} size={12} />
                  </div>
                  <span className="truncate">{parent.name}</span>
                </button>

                {/* Subcategorias Aninhadas */}
                {subcategories.map(sub => {
                  const isSubSelected = selectedCategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(sub.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 pl-7 pr-3 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        isSubSelected
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="truncate">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
