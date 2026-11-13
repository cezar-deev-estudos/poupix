'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { loadUserPreferencesFromSupabase, upsertUserPreferencesToSupabase } from '@/lib/supabase/syncService';
import { hashPin, isBiometricsAvailable, authenticateWithBiometrics } from '@/lib/biometrics';

export interface AppLockSettings {
  enabled: boolean;
  pinHash: string | null;
  biometricsEnabled: boolean;
  timeoutMinutes: number; // 0 = imediato ao sair
}

interface AppLockContextType {
  isLocked: boolean;
  settings: AppLockSettings;
  isBiometricsSupported: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  updateLockSettings: (newSettings: Partial<AppLockSettings>) => Promise<void>;
  setupNewPin: (pin: string, enableBiometrics?: boolean) => Promise<void>;
  lockNow: () => void;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

const DEFAULT_SETTINGS: AppLockSettings = {
  enabled: false,
  pinHash: null,
  biometricsEnabled: false,
  timeoutMinutes: 0,
};

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppLockSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poupix_app_lock_settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poupix_app_lock_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.enabled && parsed.pinHash) {
            return true;
          }
        } catch {}
      }
    }
    return false;
  });

  const [isBiometricsSupported, setIsBiometricsSupported] = useState(false);
  const lastActiveTimestampRef = useRef<number>(Date.now());

  // Checar suporte biométrico do hardware
  useEffect(() => {
    isBiometricsAvailable().then(setIsBiometricsSupported);
  }, []);

  // Sincronizar preferências de bloqueio com o Supabase
  useEffect(() => {
    if (!user?.id) return;
    loadUserPreferencesFromSupabase(user.id).then(cloudPrefs => {
      if (cloudPrefs) {
        const cloudSettings: AppLockSettings = {
          enabled: cloudPrefs.app_lock_enabled ?? false,
          pinHash: cloudPrefs.app_lock_pin_hash ?? null,
          biometricsEnabled: cloudPrefs.app_lock_biometrics_enabled ?? false,
          timeoutMinutes: cloudPrefs.app_lock_timeout_minutes ?? 0,
        };
        setSettings(cloudSettings);
        if (typeof window !== 'undefined') {
          localStorage.setItem('poupix_app_lock_settings', JSON.stringify(cloudSettings));
        }
        if (cloudSettings.enabled && cloudSettings.pinHash) {
          setIsLocked(true);
        }
      }
    });
  }, [user?.id]);

  // Atualizar settings e salvar na nuvem
  const updateLockSettings = useCallback(async (newSettings: Partial<AppLockSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('poupix_app_lock_settings', JSON.stringify(updated));
    }
    if (user?.id) {
      await upsertUserPreferencesToSupabase(user.id, {
        app_lock_enabled: updated.enabled,
        app_lock_pin_hash: updated.pinHash,
        app_lock_biometrics_enabled: updated.biometricsEnabled,
        app_lock_timeout_minutes: updated.timeoutMinutes,
      });
    }
  }, [settings, user?.id]);

  // Cadastro de novo PIN
  const setupNewPin = useCallback(async (pin: string, enableBiometrics: boolean = false) => {
    const hashed = await hashPin(pin);
    await updateLockSettings({
      enabled: true,
      pinHash: hashed,
      biometricsEnabled: enableBiometrics,
    });
    setIsLocked(false);
  }, [updateLockSettings]);

  // Desbloqueio via PIN
  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!settings.pinHash) return true;
    const hashed = await hashPin(pin);
    if (hashed === settings.pinHash) {
      setIsLocked(false);
      lastActiveTimestampRef.current = Date.now();
      return true;
    }
    return false;
  }, [settings.pinHash]);

  // Desbloqueio via Biometria
  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!settings.biometricsEnabled || !isBiometricsSupported) return false;
    const success = await authenticateWithBiometrics();
    if (success) {
      setIsLocked(false);
      lastActiveTimestampRef.current = Date.now();
      return true;
    }
    return false;
  }, [settings.biometricsEnabled, isBiometricsSupported]);

  const lockNow = useCallback(() => {
    if (settings.enabled && settings.pinHash) {
      setIsLocked(true);
    }
  }, [settings.enabled, settings.pinHash]);

  // Auto-bloqueio ao alternar abas ou minimizar o app no celular
  useEffect(() => {
    if (!settings.enabled || !settings.pinHash) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActiveTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const elapsedMinutes = (Date.now() - lastActiveTimestampRef.current) / (1000 * 60);
        if (settings.timeoutMinutes === 0 || elapsedMinutes >= settings.timeoutMinutes) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.enabled, settings.pinHash, settings.timeoutMinutes]);

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        settings,
        isBiometricsSupported,
        unlockWithPin,
        unlockWithBiometrics,
        updateLockSettings,
        setupNewPin,
        lockNow,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock deve ser usado dentro de um AppLockProvider');
  }
  return context;
};
