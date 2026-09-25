'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  onConfirm: (calculatedValue: string) => void;
  variant?: DateVariant;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  initialValue = '0',
  onConfirm,
  variant = 'rose',
}) => {
  const [expression, setExpression] = useState('');
  const [currentInput, setCurrentInput] = useState('0');

  useEffect(() => {
    if (isOpen) {
      const clean = initialValue.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) {
        setCurrentInput(num.toString().replace('.', ','));
      } else {
        setCurrentInput('0');
      }
      setExpression('');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const getAccentColor = () => {
    switch (variant) {
      case 'emerald':
        return 'text-emerald-400 hover:text-emerald-300';
      case 'cyan':
        return 'text-cyan-400 hover:text-cyan-300';
      case 'blue':
        return 'text-blue-400 hover:text-blue-300';
      case 'rose':
      default:
        return 'text-rose-400 hover:text-rose-300';
    }
  };

  const calculateResult = (expr: string): number => {
    try {
      // Sanitizar para conter apenas números e operadores válidos
      const sanitized = expr
        .replace(/,/g, '.')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^\d.+\-*/]/g, '');

      if (!sanitized) return 0;
      // Avaliação segura de expressão matemática básica
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  };

  const handleDigit = (digit: string) => {
    if (currentInput === '0' && digit !== ',') {
      setCurrentInput(digit);
    } else {
      if (digit === ',' && currentInput.includes(',')) return;
      setCurrentInput(prev => prev + digit);
    }
  };

  const handleOperator = (op: '+' | '-' | '*' | '/') => {
    const symbol = op === '*' ? '×' : op === '/' ? '÷' : op;
    const formattedInput = currentInput || '0';
    setExpression(prev => (prev ? `${prev} ${formattedInput} ${symbol}` : `${formattedInput} ${symbol}`));
    setCurrentInput('0');
  };

  const handleEquals = () => {
    if (!expression) return;
    const fullExpr = `${expression} ${currentInput}`;
    const result = calculateResult(fullExpr);
    const formattedResult = Number(result.toFixed(2)).toString().replace('.', ',');
    setCurrentInput(formattedResult);
    setExpression('');
  };

  const handleBackspace = () => {
    if (currentInput.length > 1) {
      setCurrentInput(prev => prev.slice(0, -1));
    } else {
      setCurrentInput('0');
    }
  };

  const handleConfirm = () => {
    let finalValue = currentInput;
    if (expression) {
      const fullExpr = `${expression} ${currentInput}`;
      const result = calculateResult(fullExpr);
      finalValue = Number(result.toFixed(2)).toString().replace('.', ',');
    }
    const cleanNum = finalValue.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) {
      onConfirm(num.toString());
    } else {
      onConfirm('0');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181d28] border border-slate-800 rounded-3xl w-full max-w-[320px] p-5 shadow-2xl space-y-4 animate-scaleUp">
        {/* Header com Moeda e Fechar */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-base font-bold text-slate-300">R$</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display da Calculadora */}
        <div className="space-y-1 pb-3 border-b border-slate-800 text-right">
          {expression && (
            <div className="text-xs text-slate-400 font-mono tracking-wider truncate">
              {expression}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBackspace}
              className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Apagar"
            >
              <Delete className="w-5 h-5" />
            </button>

            <span className="text-3xl font-black text-white font-mono tracking-tight truncate flex-1 text-right">
              {currentInput || '0'}
            </span>
          </div>
        </div>

        {/* Teclado Numérico da Calculadora (4x4) */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Linha 1 */}
          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            +
          </button>

          {/* Linha 2 */}
          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            -
          </button>

          {/* Linha 3 */}
          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('*')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            *
          </button>

          {/* Linha 4 */}
          <button
            type="button"
            onClick={() => handleDigit(',')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            ,
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            =
          </button>
          <button
            type="button"
            onClick={() => handleOperator('/')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            /
          </button>
        </div>

        {/* Botão de Ação Concluído */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${getAccentColor()} hover:bg-slate-800/80`}
          >
            CONCLUÍDO
          </button>
        </div>
      </div>
    </div>
  );
};
