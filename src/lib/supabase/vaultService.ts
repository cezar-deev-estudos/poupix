import { getSupabaseClient } from './client';
import { VaultEntry, VaultEntryFormData } from '@/types/vault';
import { encryptVaultPassword, decryptVaultPassword } from '@/lib/vaultCrypto';

export async function fetchVaultEntries(userId: string): Promise<VaultEntry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('password_vault')
    .select('*')
    .eq('user_id', userId)
    .order('title', { ascending: true });

  if (error) {
    console.error('Erro ao buscar itens do cofre:', error);
    return [];
  }

  return (data || []) as VaultEntry[];
}

export async function createVaultEntry(
  userId: string,
  entry: VaultEntryFormData
): Promise<VaultEntry | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client não configurado');

  const passwordEncrypted = await encryptVaultPassword(entry.password);

  const { data, error } = await (supabase
    .from('password_vault') as any)
    .insert({
      user_id: userId,
      title: entry.title.trim(),
      category: entry.category,
      username: entry.username?.trim() || null,
      password_encrypted: passwordEncrypted,
      url: entry.url?.trim() || null,
      notes: entry.notes?.trim() || null,
      icon: entry.icon || 'KeyRound',
      color: entry.color || '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar item no cofre:', error);
    throw error;
  }

  return data as VaultEntry;
}

export async function updateVaultEntry(
  id: string,
  userId: string,
  entry: Partial<VaultEntryFormData>
): Promise<VaultEntry | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client não configurado');

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (entry.title !== undefined) updatePayload.title = entry.title.trim();
  if (entry.category !== undefined) updatePayload.category = entry.category;
  if (entry.username !== undefined) updatePayload.username = entry.username.trim() || null;
  if (entry.url !== undefined) updatePayload.url = entry.url?.trim() || null;
  if (entry.notes !== undefined) updatePayload.notes = entry.notes?.trim() || null;
  if (entry.icon !== undefined) updatePayload.icon = entry.icon;
  if (entry.color !== undefined) updatePayload.color = entry.color;

  if (entry.password) {
    updatePayload.password_encrypted = await encryptVaultPassword(entry.password);
  }

  const { data, error } = await (supabase
    .from('password_vault') as any)
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar item do cofre:', error);
    throw error;
  }

  return data as VaultEntry;
}

export async function deleteVaultEntry(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('password_vault')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao excluir item do cofre:', error);
    return false;
  }

  return true;
}

export async function revealPassword(encrypted: string): Promise<string> {
  return decryptVaultPassword(encrypted);
}
