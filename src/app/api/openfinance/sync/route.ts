import { NextResponse } from 'next/server';
import { guessCategoryByBankDescription } from '@/lib/openFinance';
import { PendingBankTransaction } from '@/types/finance';

export async function POST(req: Request) {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Credenciais da Pluggy não configuradas.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { itemId, connectionId, institutionName, targetAccountId, targetCardId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId é obrigatório para sincronização.' },
        { status: 400 }
      );
    }

    // 1. Obter API Key da Pluggy
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: 'Erro de autenticação na Pluggy.' }, { status: 401 });
    }

    const { apiKey } = await authRes.json();

    // 2. Buscar Contas associadas a este Item
    const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: { 'X-API-KEY': apiKey },
    });

    let accountsData = [];
    if (accountsRes.ok) {
      const accJson = await accountsRes.json();
      accountsData = accJson.results || [];
    }

    // 3. Buscar Transações recentes das contas
    const pendingTransactions: PendingBankTransaction[] = [];
    let updatedBalance: number | null = null;

    for (const acc of accountsData) {
      // Atualiza saldo caso seja conta corrente/poupança
      if (acc.type === 'BANK' && acc.balance !== undefined) {
        updatedBalance = acc.balance;
      }

      const txRes = await fetch(`https://api.pluggy.ai/transactions?accountId=${acc.id}&pageSize=20`, {
        headers: { 'X-API-KEY': apiKey },
      });

      if (txRes.ok) {
        const txJson = await txRes.json();
        const txResults = txJson.results || [];

        for (const t of txResults) {
          const isExpense = t.amount < 0 || t.type === 'DEBIT';
          const positiveAmount = Math.abs(t.amount);
          const txDate = t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0];

          const categoryGuess = guessCategoryByBankDescription(t.description || '');

          pendingTransactions.push({
            id: `pluggy-tx-${t.id}`,
            connectionId: connectionId || `conn-${itemId}`,
            institutionId: `inst-${acc.id}`,
            institutionName: institutionName || 'Banco Conectado',
            bankTransactionId: String(t.id),
            date: txDate,
            description: t.description || 'Lançamento bancário',
            amount: positiveAmount,
            type: isExpense ? 'expense' : 'income',
            suggestedCategoryId: categoryGuess.categoryId,
            categoryConfidence: categoryGuess.confidence,
            accountId: targetAccountId,
            creditCardId: acc.type === 'CREDIT' ? targetCardId : undefined,
            status: 'pending_review',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      pendingTransactions,
      updatedBalance,
      accountsFound: accountsData.length,
    });
  } catch (error: any) {
    console.error('[Pluggy Sync Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao sincronizar transações da Pluggy.' },
      { status: 500 }
    );
  }
}
