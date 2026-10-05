import { NextResponse } from 'next/server';

export async function POST() {
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

    // 2. Gerar Connect Token seguro para o Widget do usuário
    const tokenRes = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!tokenRes.ok) {
      const errToken = await tokenRes.text();
      console.error('[Pluggy Connect Token Error]:', errToken);
      return NextResponse.json(
        { error: 'Falha ao gerar Connect Token na Pluggy.' },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json();

    return NextResponse.json({
      accessToken: tokenData.accessToken,
    });
  } catch (error: any) {
    console.error('[Pluggy Connect Token Exception]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao conectar à Pluggy.' },
      { status: 500 }
    );
  }
}
