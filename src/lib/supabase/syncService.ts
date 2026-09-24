import { getSupabaseClient } from './client'
import { Account, CreditCard, Category, Transaction, Goal, OpenFinanceConnection, UserProfile } from '@/types/finance'

export interface CloudSyncResult {
  success: boolean
  message: string
  error?: string
}

export const syncAllToSupabase = async (data: {
  currentUser: UserProfile
  accounts: Account[]
  creditCards: CreditCard[]
  categories: Category[]
  transactions: Transaction[]
  goals: Goal[]
  openFinanceConnections: OpenFinanceConnection[]
}): Promise<CloudSyncResult> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado. Adicione a URL e Anon Key nas configurações.' }
  }

  try {
    const userId = data.currentUser.id

    // 1. Sincronizar Perfil
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: data.currentUser.email,
      name: data.currentUser.name,
      avatar_url: data.currentUser.avatarUrl || null,
      role: data.currentUser.role,
      currency: data.currentUser.currency || 'BRL',
      monthly_income_target: data.currentUser.monthlyIncomeTarget || 0,
    } as any)

    if (profileError) throw profileError

    // 2. Sincronizar Contas
    if (data.accounts.length > 0) {
      const accountsPayload = data.accounts.map(acc => ({
        id: acc.id,
        user_id: userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        initial_balance: acc.initialBalance || 0,
        color: acc.color,
        institution: acc.institution || null,
        include_in_total: acc.includeInTotal ?? true,
        created_at: acc.createdAt || new Date().toISOString()
      }))
      const { error: accError } = await supabase.from('accounts').upsert(accountsPayload as any)
      if (accError) throw accError
    }

    // 3. Sincronizar Cartões
    if (data.creditCards.length > 0) {
      const cardsPayload = data.creditCards.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        limit_amount: c.limit,
        closing_day: c.closingDay,
        due_day: c.dueDay,
        color: c.color,
        brand: c.brand,
        created_at: c.createdAt || new Date().toISOString()
      }))
      const { error: cardError } = await supabase.from('credit_cards').upsert(cardsPayload as any)
      if (cardError) throw cardError
    }

    // 4. Sincronizar Categorias
    if (data.categories.length > 0) {
      const categoriesPayload = data.categories.map(cat => ({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit || null,
        is_default: cat.isDefault ?? false
      }))
      const { error: catError } = await supabase.from('categories').upsert(categoriesPayload as any)
      if (catError) throw catError
    }

    // 5. Sincronizar Transações
    if (data.transactions.length > 0) {
      const txPayload = data.transactions.map(tx => ({
        id: tx.id,
        user_id: userId,
        account_id: tx.accountId || null,
        destination_account_id: tx.destinationAccountId || null,
        credit_card_id: tx.creditCardId || null,
        category_id: tx.categoryId || null,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        paid: tx.paid ?? true,
        is_recurring: tx.isRecurring ?? false,
        recurring_period: tx.recurringPeriod || null,
        installment_current: tx.installmentCurrent || null,
        installment_total: tx.installmentTotal || null,
        installment_group_id: tx.installmentGroupId || null,
        tags: tx.tags || [],
        notes: tx.notes || null,
        created_at: tx.createdAt || new Date().toISOString()
      }))
      const { error: txError } = await supabase.from('transactions').upsert(txPayload as any)
      if (txError) throw txError
    }

    // 6. Sincronizar Metas
    if (data.goals.length > 0) {
      const goalsPayload = data.goals.map(g => ({
        id: g.id,
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate,
        category: g.category || null,
        account_id: g.accountId || null,
        color: g.color,
        icon: g.icon,
        completed: g.completed ?? false,
        created_at: g.createdAt || new Date().toISOString()
      }))
      const { error: goalError } = await supabase.from('goals').upsert(goalsPayload as any)
      if (goalError) throw goalError
    }

    // 7. Sincronizar Open Finance
    if (data.openFinanceConnections.length > 0) {
      const ofPayload = data.openFinanceConnections.map(c => ({
        id: c.id,
        user_id: userId,
        institution_id: c.institutionId,
        institution_name: c.institutionName,
        status: c.status,
        last_sync_at: c.lastSyncAt,
        consent_expires_at: c.consentExpiresAt,
        synced_accounts_count: c.syncedAccountsCount || 1,
        synced_cards_count: c.syncedCardsCount || 1,
        auto_sync: c.autoSync ?? true,
        created_at: c.createdAt || new Date().toISOString()
      }))
      const { error: ofError } = await supabase.from('open_finance_connections').upsert(ofPayload as any)
      if (ofError) throw ofError
    }

    return {
      success: true,
      message: 'Todos os dados foram sincronizados com a nuvem no Supabase com sucesso!'
    }
  } catch (error: any) {
    console.error('[Supabase Sync Error]', error)
    return {
      success: false,
      message: 'Erro ao sincronizar com o Supabase',
      error: error?.message || String(error)
    }
  }
}

export const fetchAllFromSupabase = async (userId: string) => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const [accRes, cardRes, catRes, txRes, goalRes, ofRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('credit_cards').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('open_finance_connections').select('*').eq('user_id', userId)
    ])

    return {
      accounts: accRes.data || [],
      creditCards: cardRes.data || [],
      categories: catRes.data || [],
      transactions: txRes.data || [],
      goals: goalRes.data || [],
      openFinanceConnections: ofRes.data || []
    }
  } catch (err) {
    console.error('[Supabase Fetch Error]', err)
    return null
  }
}
