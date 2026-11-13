'use client';

import React, { useState } from 'react';
import { Lock, Fingerprint, X, Delete } from 'lucide-react';
import { useAppLock } from '@/context/AppLockContext';
import { hashPin } from '@/lib/biometrics';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Desbloquear Cofre',
  description = 'Digite seu PIN de 4 dígitos para visualizar ou copiar a senha',
}) => {
  const { settings, isBiometricsSupported, unlockWithBiometrics } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setIsVerifying(true);
      // Se houver PIN configurado no sistema, valida contra ele
      if (settings.pinHash) {
        const hashed = await hashPin(newPin);
        if (hashed === settings.pinHash) {
          setIsVerifying(false);
          setPin('');
          onSuccess();
          return;
        } else {
          setIsVerifying(false);
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
          return;
        }
      } else {
        // Se ainda não configurou PIN de 4 dígitos no AppLock, qualquer 4 dígitos ou salva como PIN
        setIsVerifying(false);
        setPin('');
        onSuccess();
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometrics = async () => {
    if (!settings.biometricsEnabled || !isBiometricsSupported) return;
    const ok = await unlockWithBiometrics();
    if (ok) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Cadeado */}
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>

        <h3 className="text-base font-semibold text-white text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-400 text-center mb-6">{description}</p>

        {/* Indicadores de Dígitos (4 pontos) */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3].map(i => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-bounce'
                    : isFilled
                    ? 'bg-emerald-400 scale-105'
                    : 'bg-slate-700/60'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-400 mb-4 animate-in fade-in">
            PIN incorreto. Tente novamente.
          </p>
        )}

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-lg font-medium text-white transition-all border border-slate-700/40 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Biometria (se disponível) */}
          <button
            onClick={handleBiometrics}
            disabled={!settings.biometricsEnabled || !isBiometricsSupported}
            className={`h-12 rounded-xl flex items-center justify-center transition-all ${
              settings.biometricsEnabled && isBiometricsSupported
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-95'
                : 'opacity-0 pointer-events-none'
            }`}
            title="Desbloquear com biometria"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          {/* 0 */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-lg font-medium text-white transition-all border border-slate-700/40 flex items-center justify-center"
          >
            0
          </button>

          {/* Apagar */}
          <button
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
            title="Apagar"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
