'use client';

import React, { useState } from 'react';
import { useAppLock } from '@/context/AppLockContext';
import { Shield, Fingerprint, Lock, X, Check, AlertCircle } from 'lucide-react';
import { registerBiometrics, triggerHaptic } from '@/lib/biometrics';

interface SetupPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupPinModal: React.FC<SetupPinModalProps> = ({ isOpen, onClose }) => {
  const { setupNewPin, isBiometricsSupported } = useAppLock();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    triggerHaptic('light');
    setError('');
    if (step === 'create') {
      if (pin.length < 6) {
        const next = pin + digit;
        setPin(next);
        if (next.length >= 4 && next.length === 6) {
          setTimeout(() => setStep('confirm'), 200);
        }
      }
    } else {
      if (confirmPin.length < pin.length) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === pin.length) {
          validateAndSave(pin, next);
        }
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    setError('');
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleNextStep = () => {
    if (pin.length < 4) {
      setError('O PIN deve ter no mínimo 4 dígitos.');
      return;
    }
    setStep('confirm');
  };

  const validateAndSave = async (originalPin: string, confirmation: string) => {
    if (originalPin !== confirmation) {
      triggerHaptic('error');
      setError('Os PINs digitados não conferem.');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      let registeredBio = false;
      if (enableBiometrics && isBiometricsSupported) {
        registeredBio = await registerBiometrics();
      }

      await setupNewPin(originalPin, registeredBio || (enableBiometrics && isBiometricsSupported));
      triggerHaptic('success');
      onClose();
    } catch (err) {
      setError('Erro ao salvar o PIN.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
    setError('');
    onClose();
  };

  const currentDisplayPin = step === 'create' ? pin : confirmPin;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#181c24] border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative">
        {/* Fechar */}
        <button
          type="button"
          onClick={resetAll}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {step === 'create' ? 'Criar PIN de Segurança' : 'Confirme seu PIN'}
          </h3>
          <p className="text-xs text-slate-400">
            {step === 'create'
              ? 'Digite um PIN numérico de 4 a 6 dígitos'
              : 'Digite novamente o PIN para confirmar'}
          </p>
        </div>

        {/* Indicadores */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, pin.length)).map(idx => {
              const isFilled = idx < currentDisplayPin.length;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    isFilled
                      ? 'bg-emerald-400 scale-110 shadow-md shadow-emerald-400/40'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium flex items-center gap-1 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        {/* Checkbox de Biometria no 1º passo */}
        {step === 'create' && isBiometricsSupported && (
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#1c2230] border border-slate-800 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={enableBiometrics}
              onChange={e => setEnableBiometrics(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
            <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Habilitar desbloqueio biométrico (Digital / Face ID)</span>
          </label>
        )}

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-[#1c2230] hover:bg-slate-800 active:scale-95 text-lg font-semibold text-white border border-slate-800/80 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          {step === 'create' && pin.length >= 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="h-14 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-all flex items-center justify-center cursor-pointer"
            >
              Avançar
            </button>
          ) : (
            <div className="h-14" />
          )}

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#1c2230] hover:bg-slate-800 active:scale-95 text-lg font-semibold text-white border border-slate-800/80 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#1c2230] hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white border border-slate-800/80 transition-all flex items-center justify-center cursor-pointer"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
