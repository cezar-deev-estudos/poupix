import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Supabase Live Connection Test', () => {
  const url = 'https://wxdhugbfpvdutcamuijv.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGh1Z2JmcHZkdXRjYW11aWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTkzNzQsImV4cCI6MjEwNTgzNTM3NH0.1rp81nOppgr7UQQ0RNIgBG4AJb81zb4sj8vHaW_amO8';

  it('deve conectar ao banco Supabase e consultar a tabela profiles sem erros', async () => {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
