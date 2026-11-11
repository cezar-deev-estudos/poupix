export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'member' | 'guest'
          currency: string
          monthly_income_target: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'guest'
          currency?: string
          monthly_income_target?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'guest'
          currency?: string
          monthly_income_target?: number
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          balance: number
          initial_balance: number
          color: string
          institution: string | null
          include_in_total: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          balance?: number
          initial_balance?: number
          color?: string
          institution?: string | null
          include_in_total?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          balance?: number
          initial_balance?: number
          color?: string
          institution?: string | null
          include_in_total?: boolean
          created_at?: string
        }
      }
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          limit_amount: number
          closing_day: number
          due_day: number
          color: string
          brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          limit_amount?: number
          closing_day: number
          due_day: number
          color?: string
          brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          limit_amount?: number
          closing_day?: number
          due_day?: number
          color?: string
          brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          budget_limit: number | null
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          budget_limit?: number | null
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          parent_id?: string | null
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          budget_limit?: number | null
          is_default?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          destination_account_id: string | null
          credit_card_id: string | null
          category_id: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          date: string
          paid: boolean
          is_recurring: boolean
          recurring_period: string | null
          installment_current: number | null
          installment_total: number | null
          installment_group_id: string | null
          ignore_in_totals: boolean
          invoice_date: string | null
          is_favorite: boolean
          is_fixed_cost?: boolean
          tags: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          destination_account_id?: string | null
          credit_card_id?: string | null
          category_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          date: string
          paid?: boolean
          is_recurring?: boolean
          recurring_period?: string | null
          installment_current?: number | null
          installment_total?: number | null
          installment_group_id?: string | null
          ignore_in_totals?: boolean
          invoice_date?: string | null
          is_favorite?: boolean
          is_fixed_cost?: boolean
          tags?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          destination_account_id?: string | null
          credit_card_id?: string | null
          category_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string
          date?: string
          paid?: boolean
          is_recurring?: boolean
          recurring_period?: string | null
          installment_current?: number | null
          installment_total?: number | null
          installment_group_id?: string | null
          ignore_in_totals?: boolean
          invoice_date?: string | null
          is_favorite?: boolean
          is_fixed_cost?: boolean
          tags?: string[]
          notes?: string | null
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string
          category: string | null
          account_id: string | null
          color: string
          icon: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date: string
          category?: string | null
          account_id?: string | null
          color?: string
          icon?: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string
          category?: string | null
          account_id?: string | null
          color?: string
          icon?: string
          completed?: boolean
          created_at?: string
        }
      }
      open_finance_connections: {
        Row: {
          id: string
          user_id: string
          institution_id: string
          institution_name: string
          status: 'connected' | 'disconnected' | 'syncing' | 'error'
          last_sync_at: string
          consent_expires_at: string
          synced_accounts_count: number
          synced_cards_count: number
          auto_sync: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          institution_id: string
          institution_name: string
          status?: 'connected' | 'disconnected' | 'syncing' | 'error'
          last_sync_at?: string
          consent_expires_at: string
          synced_accounts_count?: number
          synced_cards_count?: number
          auto_sync?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          institution_id?: string
          institution_name?: string
          status?: 'connected' | 'disconnected' | 'syncing' | 'error'
          last_sync_at?: string
          consent_expires_at?: string
          synced_accounts_count?: number
          synced_cards_count?: number
          auto_sync?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          theme: string
          language: string
          currency: string
          receive_notifications: boolean
          financial_alerts: boolean
          dashboard_layout_desktop: Json
          dashboard_layout_mobile: Json
          budgets_layout_columns: string
          group_by_card: boolean
          desktop_category_order: string[]
          mobile_category_order: string[]
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: string
          language?: string
          currency?: string
          receive_notifications?: boolean
          financial_alerts?: boolean
          dashboard_layout_desktop?: Json
          dashboard_layout_mobile?: Json
          budgets_layout_columns?: string
          group_by_card?: boolean
          desktop_category_order?: string[]
          mobile_category_order?: string[]
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: string
          language?: string
          currency?: string
          receive_notifications?: boolean
          financial_alerts?: boolean
          dashboard_layout_desktop?: Json
          dashboard_layout_mobile?: Json
          budgets_layout_columns?: string
          group_by_card?: boolean
          desktop_category_order?: string[]
          mobile_category_order?: string[]
          updated_at?: string
        }
      }
      saved_transaction_filters: {
        Row: {
          id: string
          user_id: string
          name: string
          scope: string | null
          year: number | null
          month: number | null
          type: string | null
          status: string | null
          category_id: string | null
          sub_category_id: string | null
          account_id: string | null
          credit_card_id: string | null
          tag: string | null
          search_query: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          scope?: string | null
          year?: number | null
          month?: number | null
          type?: string | null
          status?: string | null
          category_id?: string | null
          sub_category_id?: string | null
          account_id?: string | null
          credit_card_id?: string | null
          tag?: string | null
          search_query?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          scope?: string | null
          year?: number | null
          month?: number | null
          type?: string | null
          status?: string | null
          category_id?: string | null
          sub_category_id?: string | null
          account_id?: string | null
          credit_card_id?: string | null
          tag?: string | null
          search_query?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
      }
    }
  }
}
