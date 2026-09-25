'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';

interface MobileKeypadProps {
  isOpen: boolean;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  variant?: DateVariant;
}

export const MobileKeypad: React.FC<MobileKeypadProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  variant = 'rose',
}) => {
  const [expression, setExpression] = useState('');
  const [currentInput, setCurrentInput] = useState('0');

  useEffect(() => {
    if (isOpen) {
      const clean = value.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) {
        setCurrentInput(num.toString().replace('.', ','));
      } else {
        setCurrentInput('0');
      }
      setExpression('');
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const calculateResult = (expr: string): number => {
    try {
      const sanitized = expr
        .replace(/,/g, '.')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^\d.+\-*/]/g, '');

      if (!sanitized) return 0;
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
      onChange(num.toString());
    } else {
      onChange('0');
    }
    onClose();
  };

  const getConfirmButtonColor = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500 hover:bg-emerald-400 text-slate-950';
      case 'cyan':
        return 'bg-cyan-500 hover:bg-cyan-400 text-slate-950';
      case 'blue':
        return 'bg-blue-500 hover:bg-blue-400 text-white';
      case 'rose':
      default:
        return 'bg-[#ef4444] hover:bg-rose-500 text-white';
    }
  };

  return (
    <div className="block md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#373b45] text-white rounded-t-3xl shadow-2xl p-4 border-t border-slate-700/80 animate-slideUp">
      {/* Top Bar com Moeda e Valor */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-600/50">
        <span className="text-xs font-semibold text-slate-300">R$</span>
        
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-slate-100">
            {expression ? `${expression} ` : ''}{currentInput || '0,0'}
          </span>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-600/40 rounded-xl transition-colors cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid do Teclado (4x4) */}
      <div className="grid grid-cols-4 gap-2 pt-3">
        {/* Linha 1: 7, 8, 9, ÷ */}
        <button
          type="button"
          onClick={() => handleDigit('7')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit('8')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit('9')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleOperator('/')}
          className="h-13 rounded-2xl bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          ÷
        </button>

        {/* Linha 2: 4, 5, 6, × */}
        <button
          type="button"
          onClick={() => handleDigit('4')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit('5')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit('6')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleOperator('*')}
          className="h-13 rounded-2xl bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          ×
        </button>

        {/* Linha 3: 1, 2, 3, - */}
        <button
          type="button"
          onClick={() => handleDigit('1')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit('2')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit('3')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => handleOperator('-')}
          className="h-13 rounded-2xl bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          -
        </button>

        {/* Linha 4: 0, ,, =, + */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleDigit(',')}
          className="h-13 rounded-2xl bg-transparent hover:bg-slate-600/40 text-white font-medium text-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          ,
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-13 rounded-2xl bg-[#eb5757]/80 hover:bg-[#eb5757] text-white font-bold text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          =
        </button>
        <button
          type="button"
          onClick={() => handleOperator('+')}
          className="h-13 rounded-2xl bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Botões Inferiores: CANCELAR e CONCLUÍDO */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="py-3 rounded-full border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
        >
          CANCELAR
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          className={`py-3 rounded-full ${getConfirmButtonColor()} text-xs font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow-lg`}
        >
          CONCLUÍDO
        </button>
      </div>
    </div>
  );
};
