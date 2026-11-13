export type VaultCategory = 'bank' | 'card' | 'email' | 'service' | 'other';

export interface VaultEntry {
  id: string;
  user_id: string;
  title: string;
  category: VaultCategory;
  username: string;
  password_encrypted: string;
  url?: string;
  notes?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface VaultEntryFormData {
  title: string;
  category: VaultCategory;
  username: string;
  password: string; // Plaintext digitada pelo usuário antes da encriptação
  url?: string;
  notes?: string;
  icon?: string;
  color?: string;
}
