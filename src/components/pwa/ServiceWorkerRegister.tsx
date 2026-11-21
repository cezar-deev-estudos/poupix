'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    // Não registrar Service Worker em ambiente de desenvolvimento local
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Checar atualização de forma silenciosa e não intrusiva a cada 15 minutos
        intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      } catch (error) {
        console.error('[PWA] Falha ao registrar ServiceWorker:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
};

