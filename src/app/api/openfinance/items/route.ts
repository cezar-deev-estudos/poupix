import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Credenciais da Pluggy não configuradas no servidor.' },
      { status: 500 }
    );
  }

  try {
    // 1. Autenticar na API da Pluggy e obter API Key temporária
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error('[Pluggy Auth Error]:', errText);
      return NextResponse.json(
        { error: 'Falha na autenticação com a Pluggy.' },
        { status: authRes.status }
      );
    }

    const authData = await authRes.json();
    const apiKey = authData.apiKey;

    // 2. Buscar itens existentes conectados na conta Pluggy
    const itemsRes = await fetch('https://api.pluggy.ai/items', {
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!itemsRes.ok) {
      const errItems = await itemsRes.text();
      console.error('[Pluggy Items Error]:', errItems);
      return NextResponse.json(
        { error: 'Falha ao buscar conexões existentes na Pluggy.', details: errItems },
        { status: itemsRes.status }
      );
    }

    const itemsData = await itemsRes.json();
    const items = itemsData.results || [];

    // Formatar itens para retorno amigável
    const formatted = items.map((item: any) => ({
      id: item.id,
      connectorId: item.connectorId,
      institutionName: item.connector?.name || 'Banco Conectado',
      status: item.status,
      executionStatus: item.executionStatus,
      lastUpdatedAt: item.lastUpdatedAt || item.createdAt,
      connector: {
        name: item.connector?.name,
        imageUrl: item.connector?.imageUrl,
        primaryColor: item.connector?.primaryColor,
      },
    }));

    return NextResponse.json({
      success: true,
      items: formatted,
    });
  } catch (error: any) {
    console.error('[Pluggy Get Items Exception]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro inesperado ao buscar conexões da Pluggy.' },
      { status: 500 }
    );
  }
}
