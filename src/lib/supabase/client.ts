import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

let cachedClient: SupabaseClient<Database> | null = null
let cachedUrl = ''
let cachedKey = ''

// Configurações lidas de variáveis de ambiente com fallback para localStorage (configuração dinâmica no app)
const getSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    }
  }

  const storedUrl = localStorage.getItem('mobills_supabase_url')
  const storedKey = localStorage.getItem('mobills_supabase_anon_key')

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || storedUrl || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || storedKey || ''
  }
}

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  const { url, anonKey } = getSupabaseConfig()
  
  if (!url || !anonKey) {
    return null
  }

  // Se já existe uma instância com as mesmas credenciais, reutiliza o Singleton
  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient
  }

  try {
    cachedClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
    cachedUrl = url
    cachedKey = anonKey
    return cachedClient
  } catch (err) {
    console.warn('[Supabase] Falha ao instanciar cliente:', err)
    return null
  }
}

export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig()
  return Boolean(url && anonKey)
}

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mobills_supabase_url', url.trim())
    localStorage.setItem('mobills_supabase_anon_key', anonKey.trim())
    cachedClient = null // Forçar reinicialização na próxima chamada
  }
}

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mobills_supabase_url')
    localStorage.removeItem('mobills_supabase_anon_key')
    cachedClient = null
  }
}
