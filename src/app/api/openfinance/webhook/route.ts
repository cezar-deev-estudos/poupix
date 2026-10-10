import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { guessCategoryByBankDescription } from '@/lib/openFinance';

/**
 * Webhook Oficial para receber eventos em tempo real da Pluggy
 * Eventos suportados:
 * - item/updated ou item/created: Atualização de status da conexão
 * - transactions/created: Novas transações bancárias/cartão recebidas
 * - all: Eventos gerais
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const event = payload.event || payload.type;
    const itemId = payload.itemId || payload.data?.itemId || payload.item?.id;

    console.log(`[Pluggy Webhook Recebido]: Evento: ${event} | ItemId: ${itemId}`);

    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Credenciais Pluggy não configuradas' }, { status: 500 });
    }

    // Se o evento for de atualização de item ou novas transações
    if (
      event === 'transactions/created' ||
      event === 'item/updated' ||
      event === 'item/created' ||
      event === 'all'
    ) {
      // 1. Autenticar com a Pluggy para buscar os dados frescos
      const authRes = await fetch('https://api.pluggy.ai/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      if (!authRes.ok) {
        return NextResponse.json({ error: 'Erro de auth na Pluggy' }, { status: 401 });
      }

      const { apiKey } = await authRes.json();
      const targetItemId = itemId || 'ea052172-2e4a-40e8-8dca-f7d1174f4aaf';

      // 2. Buscar Contas associadas
      const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${targetItemId}`, {
        headers: { 'X-API-KEY': apiKey },
      });

      let updatedBalance: number | null = null;
      let accountsData: any[] = [];

      if (accountsRes.ok) {
        const accJson = await accountsRes.json();
        accountsData = accJson.results || [];
        for (const acc of accountsData) {
          if ((acc.type === 'BANK' || acc.subtype?.includes('CHECKING')) && typeof acc.balance === 'number') {
            updatedBalance = acc.balance;
          }
        }
      }

      console.log(`[Pluggy Webhook]: Contas processadas: ${accountsData.length}, Saldo: ${updatedBalance}`);

      return NextResponse.json({
        success: true,
        message: 'Webhook processado com sucesso',
        event,
        itemId: targetItemId,
        updatedBalance,
      });
    }

    return NextResponse.json({ success: true, message: 'Evento ignorado', event });
  } catch (error: any) {
    console.error('[Pluggy Webhook Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar webhook' },
      { status: 500 }
    );
  }
}

// Endpoint GET de health check para a Pluggy validar a URL
export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Poupix PRO Open Finance Webhook Handler ativo',
    timestamp: new Date().toISOString(),
  });
}
