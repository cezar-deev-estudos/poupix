'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppLock } from '@/context/AppLockContext';
import { Shield, Delete, Fingerprint, Lock, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '@/lib/biometrics';

export const AppLockOverlay: React.FC = () => {
  const { isLocked, settings, isBiometricsSupported, unlockWithPin, unlockWithBiometrics } = useAppLock();
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tentar biometria automaticamente se estiver habilitada e o app estiver bloqueado
  useEffect(() => {
    if (isLocked && settings.biometricsEnabled && isBiometricsSupported) {
      const timer = setTimeout(() => {
        unlockWithBiometrics().catch(() => {});
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLocked, settings.biometricsEnabled, isBiometricsSupported, unlockWithBiometrics]);

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= 6) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);
    setIsError(false);
    setErrorMessage('');

    // Verifica automaticamente ao atingir 4 ou 6 dígitos
    if (newPin.length >= 4) {
      const unlocked = await unlockWithPin(newPin);
      if (unlocked) {
        triggerHaptic('success');
        setPin('');
      } else if (newPin.length >= 6) {
        // Se com 6 dígitos falhou, reseta e aciona erro
        triggerHaptic('error');
        setIsError(true);
        setErrorMessage('PIN incorreto. Tente novamente.');
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 800);
      }
    }
  }, [pin, unlockWithPin]);

  const handleDelete = () => {
    triggerHaptic('light');
    setPin(prev => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const handleManualBiometrics = async () => {
    triggerHaptic('light');
    const unlocked = await unlockWithBiometrics();
    if (unlocked) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0c0f17] flex flex-col items-center justify-between p-6 select-none animate-fadeIn">
      {/* Top Header / Branding */}
      <div className="pt-10 flex flex-col items-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <Lock className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white tracking-wide">Poupix PRO</h1>
          <p className="text-xs text-slate-400 mt-1">Digite seu PIN ou use a biometria para acessar</p>
        </div>
      </div>

      {/* Indicadores dos Dígitos */}
      <div className="flex flex-col items-center space-y-4">
        <div className={`flex items-center gap-3 transition-transform ${isError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map(idx => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? isError
                      ? 'bg-rose-500 scale-110 shadow-md shadow-rose-500/40'
                      : 'bg-emerald-400 scale-110 shadow-md shadow-emerald-400/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
          </p>
        )}
      </div>

      {/* Teclado Numérico */}
      <div className="w-full max-w-xs pb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-16 rounded-2xl bg-[#161a23] hover:bg-slate-800/80 active:scale-95 text-xl font-semibold text-white border border-slate-800 shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Botão de Biometria (se habilitada) ou espaço vazio */}
          {settings.biometricsEnabled && isBiometricsSupported ? (
            <button
              type="button"
              onClick={handleManualBiometrics}
              className="h-16 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Desbloquear com Biometria"
            >
              <Fingerprint className="w-7 h-7" />
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* Dígito 0 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-[#161a23] hover:bg-slate-800/80 active:scale-95 text-xl font-semibold text-white border border-slate-800 shadow-sm transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Botão Apagar */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-[#161a23] hover:bg-slate-800/80 active:scale-95 text-slate-400 hover:text-white border border-slate-800 shadow-sm transition-all flex items-center justify-center cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
