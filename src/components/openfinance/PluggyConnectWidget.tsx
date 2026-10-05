'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

interface PluggyConnectWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (itemData: { itemId: string; institutionName: string }) => void;
}

declare global {
  interface Window {
    PluggyConnect?: any;
  }
}

export const PluggyConnectWidget: React.FC<PluggyConnectWidgetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pluggyInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (pluggyInstanceRef.current && typeof pluggyInstanceRef.current.destroy === 'function') {
        pluggyInstanceRef.current.destroy();
        pluggyInstanceRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initPluggy() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Obter Connect Token seguro do nosso backend
        const res = await fetch('/api/openfinance/connect-token', { method: 'POST' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Não foi possível gerar o token de conexão.');
        }

        const { accessToken } = await res.json();

        // 2. Carregar o script do SDK oficial da Pluggy via CDN se ainda não estiver presente
        if (!window.PluggyConnect) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Erro ao carregar o widget do Open Finance. Verifique sua conexão.'));
            document.body.appendChild(script);
          });
        }

        if (!isMounted) return;

        // 3. Inicializar o widget Pluggy Connect
        if (window.PluggyConnect) {
          const pluggy = new window.PluggyConnect({
            connectToken: accessToken,
            includeSandbox: true, // Permite tanto testes simulados como bancos reais
            onSuccess: (itemData: any) => {
              const institutionName = itemData?.item?.connector?.name || 'Banco Conectado';
              const itemId = itemData?.item?.id;
              onSuccess({ itemId, institutionName });
              onClose();
            },
            onError: (error: any) => {
              console.error('[Pluggy Widget Error]:', error);
              setErrorMessage('Ocorreu um erro durante a conexão com o banco.');
            },
            onClose: () => {
              onClose();
            },
          });

          pluggyInstanceRef.current = pluggy;
          pluggy.init();
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[Pluggy Init Exception]:', err);
          setErrorMessage(err.message || 'Erro ao inicializar conexão.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initPluggy();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1c202a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Conexão Bancária Oficial</h3>
            <p className="text-xs text-purple-400 font-medium">Pluggy Open Finance Brasil</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm font-semibold text-white">Carregando ambiente seguro...</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Conectando aos servidores do Open Finance para abrir o catálogo bancário.
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} id="pluggy-connect-container" />
      </div>
    </div>
  );
};
