'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

interface PluggyConnectWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (itemData: { itemId: string; institutionName: string }) => void;
}

export const PluggyConnectWidget: React.FC<PluggyConnectWidgetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIframeUrl(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;

    async function fetchConnectToken() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Obter Connect Token do backend
        const res = await fetch('/api/openfinance/connect-token', { method: 'POST' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Não foi possível gerar o token de conexão com a Pluggy.');
        }

        const { accessToken } = await res.json();

        if (!accessToken) {
          throw new Error('Token de acesso não retornado pelo servidor.');
        }

        if (isMounted) {
          // O widget oficial da Pluggy é hospedado em https://connect.pluggy.ai/?connect_token=...
          setIframeUrl(`https://connect.pluggy.ai/?connect_token=${encodeURIComponent(accessToken)}&include_sandbox=true`);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[Pluggy Init Exception]:', err);
          setErrorMessage(err.message || 'Erro ao inicializar conexão com o Open Finance.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchConnectToken();

    // 2. Escutar eventos do iframe Pluggy Connect via postMessage
    const handleMessage = (event: MessageEvent) => {
      // Verifica se a mensagem veio da Pluggy
      if (typeof event.origin === 'string' && event.origin.includes('pluggy.ai')) {
        const data = event.data;
        if (!data) return;

        // Sucesso na conexão bancária
        if (data.event === 'connector/success' || data.event === 'item/created' || data.type === 'SUCCESS') {
          const itemId = data?.item?.id || data?.itemId || 'pluggy-item-' + Date.now();
          const institutionName = data?.item?.connector?.name || data?.connector?.name || 'Banco Conectado';
          onSuccess({ itemId, institutionName });
          onClose();
        }

        // Fechamento / Cancelamento pelo usuário dentro do widget
        if (data.event === 'close' || data.type === 'CLOSE') {
          onClose();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151922] border border-slate-800 rounded-3xl max-w-lg w-full h-[90vh] max-h-[720px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Conexão Bancária Oficial</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                Open Finance
              </span>
            </h3>
            <p className="text-[11px] text-purple-400 font-medium">Pluggy Brasil • Criptografia Bancária SSL</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <RefreshCw className="w-9 h-9 text-purple-400 animate-spin" />
            <p className="text-sm font-semibold text-white">Carregando ambiente seguro...</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Conectando aos servidores do Open Finance para abrir o catálogo bancário.
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs max-w-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Iframe oficial Pluggy Connect */}
        {iframeUrl && !isLoading && !errorMessage && (
          <iframe
            src={iframeUrl}
            title="Pluggy Connect Widget"
            className="w-full flex-1 border-0 bg-white rounded-b-3xl"
            allow="camera; microphone; clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        )}
      </div>
    </div>
  );
};
