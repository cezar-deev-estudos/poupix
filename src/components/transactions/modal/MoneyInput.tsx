'use client';

import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { DateVariant } from './QuickDateSelector';
import { CalculatorModal } from './CalculatorModal';
import { MobileKeypad } from './MobileKeypad';

interface MoneyInputProps {
  value: string;
  onChange: (val: string) => void;
  variant?: DateVariant;
  currency?: string;
  onCurrencyChange?: (c: string) => void;
  showError?: boolean;
  autoOpenKeypadOnMobile?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  variant = 'rose',
  currency = 'BRL',
  onCurrencyChange,
  showError = false,
  autoOpenKeypadOnMobile = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isMobileKeypadOpen, setIsMobileKeypadOpen] = useState(false);

  // Abre automaticamente o teclado numérico no mobile quando o componente é montado
  useEffect(() => {
    if (autoOpenKeypadOnMobile && typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileKeypadOpen(true);
    }
  }, [autoOpenKeypadOnMobile]);

  useEffect(() => {
    if (!isFocused) {
      if (value) {
        const num = parseFloat(value.replace(',', '.'));
        if (!isNaN(num)) {
          setDisplayValue(
            num.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          );
          return;
        }
      }
      setDisplayValue(value || '');
    }
  }, [value, isFocused]);

  const getColorClasses = () => {
    switch (variant) {
      case 'emerald':
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/60',
          focus: 'focus-within:border-emerald-400',
        };
      case 'cyan':
        return {
          text: 'text-cyan-400',
          border: 'border-cyan-500/60',
          focus: 'focus-within:border-cyan-400',
        };
      case 'blue':
        return {
          text: 'text-blue-400',
          border: 'border-blue-500/60',
          focus: 'focus-within:border-blue-400',
        };
      case 'rose':
      default:
        return {
          text: 'text-rose-400',
          border: 'border-rose-500/60',
          focus: 'focus-within:border-rose-400',
        };
    }
  };

  const colors = getColorClasses();
  const numValue = parseFloat((displayValue || '').replace(/\./g, '').replace(',', '.'));
  const isInvalid = showError && (isNaN(numValue) || numValue <= 0);

  // Sanitização estrita: bloqueia letras e permite apenas números e vírgula/ponto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Remove qualquer caractere que não seja dígito, vírgula ou ponto
    raw = raw.replace(/[^\d,.]/g, '');

    // Permite no máximo um separador decimal
    const parts = raw.split(/[,.]/);
    if (parts.length > 2) {
      raw = parts[0] + ',' + parts.slice(1).join('');
    }

    setDisplayValue(raw);
    const cleanNum = raw.replace(/\./g, '').replace(',', '.');
    onChange(cleanNum);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleanNum = displayValue.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) {
      const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDisplayValue(formatted);
      onChange(num.toString());
    } else {
      setDisplayValue('');
      onChange('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (displayValue) {
      const cleanNum = displayValue.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleanNum);
      if (!isNaN(num)) {
        setDisplayValue(num.toString().replace('.', ','));
      }
    }
  };

  const handleCalculatorConfirm = (calcValue: string) => {
    const num = parseFloat(calcValue.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDisplayValue(formatted);
      onChange(num.toString());
    } else {
      setDisplayValue('');
      onChange('');
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between pb-2 border-b-2 transition-colors overflow-hidden ${
          isInvalid ? 'border-amber-500/80' : colors.border
        } ${colors.focus}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (isMobile) {
                setIsMobileKeypadOpen(true);
              } else {
                setIsCalcOpen(true);
              }
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Abrir Calculadora"
          >
            <Calculator className="w-5 h-5" />
          </button>

          <span className={`text-xl font-bold ${colors.text} shrink-0`}>R$</span>

          <input
            type="text"
            inputMode={isMobile ? 'none' : 'decimal'}
            readOnly={isMobile}
            autoComplete="off"
            name="poupix_transaction_amount"
            placeholder="0,00"
            value={displayValue}
            onChange={handleInputChange}
            onClick={() => {
              if (isMobile) {
                setIsMobileKeypadOpen(true);
              }
            }}
            onFocus={(e) => {
              if (isMobile) {
                e.target.blur();
                setIsMobileKeypadOpen(true);
              } else {
                handleFocus();
              }
            }}
            onBlur={handleBlur}
            className={`w-full bg-transparent text-2xl font-black ${colors.text} placeholder:text-slate-600 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 cursor-pointer md:cursor-text`}
            autoFocus={!isMobile}
          />
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800 shrink-0">
          <span>{currency}</span>
          <span className="text-[10px]">▾</span>
        </div>
      </div>

      {isInvalid && (
        <p className="text-[11px] font-medium text-amber-400/90 pt-0.5 animate-fadeIn">
          Deve ter um valor diferente de 0
        </p>
      )}

      {/* Modal da Calculadora para Desktop */}
      <CalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        initialValue={displayValue || value || '0'}
        onConfirm={handleCalculatorConfirm}
        variant={variant}
      />

      {/* Teclado Numérico Bottom Sheet para Mobile */}
      <MobileKeypad
        isOpen={isMobileKeypadOpen}
        onClose={() => setIsMobileKeypadOpen(false)}
        value={displayValue || value || '0'}
        onChange={handleCalculatorConfirm}
        variant={variant}
      />
    </div>
  );
};
