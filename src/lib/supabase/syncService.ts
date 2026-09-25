import { getSupabaseClient } from './client'
import { Account, CreditCard, Category, Transaction, Goal, OpenFinanceConnection, UserProfile, Tag } from '@/types/finance'

export interface CloudSyncResult {
  success: boolean
  message: string
  error?: string
}

// Helper para validar ou gerar UUID compatível com PostgreSQL
export const ensureValidUUID = (id?: string | null): string => {
  if (!id) return crypto.randomUUID()
  // Se já for um UUID válido no padrão standard
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (uuidRegex.test(id)) return id

  // Gerar um UUID determinístico simples baseado na string para manter referências entre contas/categorias/transações
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `00000000-0000-4000-8000-${hex.repeat(2).substring(0, 12)}`
}

// 1. Sincronização Geral para Nuvem (Supabase)
export const syncAllToSupabase = async (data: {
  currentUser: UserProfile
  accounts: Account[]
  creditCards: CreditCard[]
  categories: Category[]
  tags?: Tag[]
  transactions: Transaction[]
  goals: Goal[]
  openFinanceConnections: OpenFinanceConnection[]
}): Promise<CloudSyncResult> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado.' }
  }

  try {
    const userId = ensureValidUUID(data.currentUser.id)

    // Sincronizar Perfil
    await supabase.from('profiles').upsert({
      id: userId,
      email: data.currentUser.email,
      name: data.currentUser.name,
      avatar_url: data.currentUser.avatarUrl || null,
      role: data.currentUser.role,
      currency: data.currentUser.currency || 'BRL',
      monthly_income_target: data.currentUser.monthlyIncomeTarget || 0,
    } as any)

    // Sincronizar Contas
    if (data.accounts.length > 0) {
      const accountsPayload = data.accounts.map(acc => ({
        id: ensureValidUUID(acc.id),
        user_id: userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        initial_balance: acc.initialBalance || 0,
        color: acc.color,
        institution: acc.institution || null,
        include_in_total: acc.includeInTotal ?? true,
        created_at: acc.createdAt || new Date().toISOString(),
      }))
      await supabase.from('accounts').upsert(accountsPayload as any)
    }

    // Sincronizar Cartões
    if (data.creditCards.length > 0) {
      const cardsPayload = data.creditCards.map(c => ({
        id: ensureValidUUID(c.id),
        user_id: userId,
        name: c.name,
        limit_amount: c.limit,
        closing_day: c.closingDay,
        due_day: c.dueDay,
        color: c.color,
        brand: c.brand,
        created_at: c.createdAt || new Date().toISOString(),
      }))
      await supabase.from('credit_cards').upsert(cardsPayload as any)
    }

    // Sincronizar Categorias
    if (data.categories.length > 0) {
      const categoriesPayload = data.categories.map(cat => ({
        id: ensureValidUUID(cat.id),
        user_id: userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        parent_id: cat.parentId ? ensureValidUUID(cat.parentId) : null,
        budget_limit: cat.budgetLimit || null,
        is_default: cat.isDefault ?? false,
      }))
      await supabase.from('categories').upsert(categoriesPayload as any)
    }

    // Sincronizar Transações
    if (data.transactions.length > 0) {
      const txPayload = data.transactions.map(tx => ({
        id: ensureValidUUID(tx.id),
        user_id: userId,
        account_id: tx.accountId ? ensureValidUUID(tx.accountId) : null,
        destination_account_id: tx.destinationAccountId ? ensureValidUUID(tx.destinationAccountId) : null,
        credit_card_id: tx.creditCardId ? ensureValidUUID(tx.creditCardId) : null,
        category_id: tx.categoryId ? ensureValidUUID(tx.categoryId) : null,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        paid: tx.paid ?? true,
        is_recurring: tx.isRecurring ?? false,
        recurring_period: tx.recurringPeriod || null,
        recurring_group_id: tx.recurringGroupId || null,
        installment_current: tx.installmentCurrent || null,
        installment_total: tx.installmentTotal || null,
        installment_group_id: tx.installmentGroupId || null,
        ignore_in_totals: tx.ignoreInTotals ?? false,
        invoice_date: tx.invoiceDate || null,
        is_favorite: tx.isFavorite ?? false,
        tags: tx.tags || [],
        notes: tx.notes || null,
        created_at: tx.createdAt || new Date().toISOString(),
      }))
      await supabase.from('transactions').upsert(txPayload as any)
    }

    // Sincronizar Metas
    if (data.goals.length > 0) {
      const goalsPayload = data.goals.map(g => ({
        id: ensureValidUUID(g.id),
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate,
        category: g.category || null,
        account_id: g.accountId ? ensureValidUUID(g.accountId) : null,
        color: g.color,
        icon: g.icon,
        completed: g.completed ?? false,
        created_at: g.createdAt || new Date().toISOString(),
      }))
      await supabase.from('goals').upsert(goalsPayload as any)
    }

    return {
      success: true,
      message: 'Dados sincronizados com sucesso!',
    }
  } catch (error: any) {
    console.error('[Supabase Sync Error]', error)
    return {
      success: false,
      message: 'Erro ao sincronizar com o Supabase',
      error: error?.message || String(error),
    }
  }
}

// 2. Busca Todos os Dados da Nuvem e Converte para Tipos do App
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
      supabase.from('open_finance_connections').select('*').eq('user_id', userId),
    ])

    const accounts: Account[] = (accRes.data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance) || 0,
      initialBalance: Number(a.initial_balance) || 0,
      color: a.color,
      institution: a.institution || undefined,
      includeInTotal: a.include_in_total ?? true,
      createdAt: a.created_at,
    }))

    const creditCards: CreditCard[] = (cardRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      limit: Number(c.limit_amount) || 0,
      closingDay: c.closing_day,
      dueDay: c.due_day,
      color: c.color,
      brand: c.brand,
      createdAt: c.created_at,
    }))

    const categories: Category[] = (catRes.data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      parentId: cat.parent_id || undefined,
      budgetLimit: cat.budget_limit ? Number(cat.budget_limit) : undefined,
      isDefault: cat.is_default ?? false,
    }))

    const transactions: Transaction[] = (txRes.data || []).map((t: any) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount) || 0,
      date: t.date,
      type: t.type,
      categoryId: t.category_id || '',
      accountId: t.account_id || undefined,
      destinationAccountId: t.destination_account_id || undefined,
      creditCardId: t.credit_card_id || undefined,
      paid: t.paid ?? true,
      isRecurring: t.is_recurring ?? false,
      recurringPeriod: t.recurring_period || undefined,
      recurringGroupId: t.recurring_group_id || undefined,
      installmentCurrent: t.installment_current || undefined,
      installmentTotal: t.installment_total || undefined,
      installmentGroupId: t.installment_group_id || undefined,
      ignoreInTotals: t.ignore_in_totals ?? false,
      invoiceDate: t.invoice_date || undefined,
      isFavorite: t.is_favorite ?? false,
      tags: t.tags || [],
      notes: t.notes || undefined,
      createdAt: t.created_at,
    }))

    const goals: Goal[] = (goalRes.data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount) || 0,
      currentAmount: Number(g.current_amount) || 0,
      targetDate: g.target_date,
      category: g.category || undefined,
      accountId: g.account_id || undefined,
      color: g.color,
      icon: g.icon,
      completed: g.completed ?? false,
      createdAt: g.created_at,
    }))

    const openFinanceConnections: OpenFinanceConnection[] = (ofRes.data || []).map((o: any) => ({
      id: o.id,
      institutionId: o.institution_id,
      institutionName: o.institution_name,
      status: o.status,
      lastSyncAt: o.last_sync_at,
      consentExpiresAt: o.consent_expires_at,
      syncedAccountsCount: o.synced_accounts_count || 1,
      syncedCardsCount: o.synced_cards_count || 1,
      autoSync: o.auto_sync ?? true,
      createdAt: o.created_at,
    }))

    return {
      accounts,
      creditCards,
      categories,
      transactions,
      goals,
      openFinanceConnections,
    }
  } catch (err) {
    console.error('[Supabase Fetch Error]', err)
    return null
  }
}
