'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Forçar verificação de novas atualizações imediatamente no carregamento
        registration.update().catch(() => {});

        // Verificar atualização quando o app volta ao primeiro plano (desbloqueio do celular ou troca de aba)
        const checkUpdate = () => {
          registration.update().catch(() => {});
        };

        window.addEventListener('focus', checkUpdate);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkUpdate();
          }
        });

        // Checagem periódica a cada 2 minutos
        intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 120000);

        // Quando o novo Service Worker assumir o controle, recarrega a página automaticamente
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        // Se houver um novo worker esperando, ativar imediatamente
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
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

