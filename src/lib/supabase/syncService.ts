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

  const userId = ensureValidUUID(data.currentUser.id)

  try {
    // 1. Sincronizar Perfil
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      email: data.currentUser.email,
      name: data.currentUser.name,
      avatar_url: data.currentUser.avatarUrl || null,
      role: data.currentUser.role,
      currency: data.currentUser.currency || 'BRL',
      monthly_income_target: data.currentUser.monthlyIncomeTarget || 0,
    } as any)
    if (profileErr) console.warn('[Supabase Sync] Erro no perfil:', profileErr.message)

    // 2. Sincronizar Categorias (Necessário antes das Transações por causa de FK)
    const validCategoryIds = new Set<string>()
    if (data.categories.length > 0) {
      const categoriesPayload = data.categories.map(cat => {
        const catUuid = ensureValidUUID(cat.id)
        validCategoryIds.add(catUuid)
        return {
          id: catUuid,
          user_id: userId,
          name: cat.name,
          type: cat.type,
          icon: cat.icon || 'Tag',
          color: cat.color || '#64748B',
          parent_id: cat.parentId ? ensureValidUUID(cat.parentId) : null,
          budget_limit: cat.budgetLimit || null,
          is_default: cat.isDefault ?? false,
        }
      })
      const { error: catErr } = await supabase.from('categories').upsert(categoriesPayload as any)
      if (catErr) console.warn('[Supabase Sync] Erro em categorias:', catErr.message)
    }

    // 3. Sincronizar Contas
    const validAccountIds = new Set<string>()
    if (data.accounts.length > 0) {
      const accountsPayload = data.accounts.map(acc => {
        const accUuid = ensureValidUUID(acc.id)
        validAccountIds.add(accUuid)
        return {
          id: accUuid,
          user_id: userId,
          name: acc.name,
          type: acc.type,
          balance: acc.balance || 0,
          initial_balance: acc.initialBalance || 0,
          color: acc.color || '#10B981',
          institution: acc.institution || null,
          include_in_total: acc.includeInTotal ?? true,
          created_at: acc.createdAt || new Date().toISOString(),
        }
      })
      const { error: accErr } = await supabase.from('accounts').upsert(accountsPayload as any)
      if (accErr) console.warn('[Supabase Sync] Erro em contas:', accErr.message)
    }

    // 4. Sincronizar Cartões
    const validCardIds = new Set<string>()
    if (data.creditCards.length > 0) {
      const cardsPayload = data.creditCards.map(c => {
        const cardUuid = ensureValidUUID(c.id)
        validCardIds.add(cardUuid)
        return {
          id: cardUuid,
          user_id: userId,
          name: c.name,
          limit_amount: c.limit || 0,
          closing_day: c.closingDay || 1,
          due_day: c.dueDay || 10,
          color: c.color || '#8B5CF6',
          brand: c.brand || 'mastercard',
          created_at: c.createdAt || new Date().toISOString(),
        }
      })
      const { error: cardErr } = await supabase.from('credit_cards').upsert(cardsPayload as any)
      if (cardErr) console.warn('[Supabase Sync] Erro em cartões:', cardErr.message)
    }

    // 5. Sincronizar Transações (Sanitizando FKs para evitar erro de violação)
    if (data.transactions.length > 0) {
      const txPayload = data.transactions.map(tx => {
        const accId = tx.accountId ? ensureValidUUID(tx.accountId) : null
        const destAccId = tx.destinationAccountId ? ensureValidUUID(tx.destinationAccountId) : null
        const cardId = tx.creditCardId ? ensureValidUUID(tx.creditCardId) : null
        const catId = tx.categoryId ? ensureValidUUID(tx.categoryId) : null

        return {
          id: ensureValidUUID(tx.id),
          user_id: userId,
          account_id: accId && validAccountIds.has(accId) ? accId : null,
          destination_account_id: destAccId && validAccountIds.has(destAccId) ? destAccId : null,
          credit_card_id: cardId && validCardIds.has(cardId) ? cardId : null,
          category_id: catId && validCategoryIds.has(catId) ? catId : null,
          type: tx.type,
          amount: Number(tx.amount) || 0,
          description: tx.description || 'Lançamento',
          date: tx.date || new Date().toISOString().split('T')[0],
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
        }
      })
      const { error: txErr } = await supabase.from('transactions').upsert(txPayload as any)
      if (txErr) console.error('[Supabase Sync] Erro em transações:', txErr.message)
    }

    // 6. Sincronizar Metas
    if (data.goals.length > 0) {
      const goalsPayload = data.goals.map(g => ({
        id: ensureValidUUID(g.id),
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount || 0,
        current_amount: g.currentAmount || 0,
        target_date: g.targetDate || new Date().toISOString().split('T')[0],
        category: g.category || null,
        account_id: g.accountId && validAccountIds.has(ensureValidUUID(g.accountId)) ? ensureValidUUID(g.accountId) : null,
        color: g.color || '#06B6D4',
        icon: g.icon || 'Target',
        completed: g.completed ?? false,
        created_at: g.createdAt || new Date().toISOString(),
      }))
      const { error: goalErr } = await supabase.from('goals').upsert(goalsPayload as any)
      if (goalErr) console.warn('[Supabase Sync] Erro em metas:', goalErr.message)
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
