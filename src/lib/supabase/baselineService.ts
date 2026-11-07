import { getSupabaseClient } from './client';
import { AnnualBudgetBaseline } from '@/types/finance';

/**
 * Mapeia o registro bruto do PostgreSQL / Supabase para o modelo tipado TypeScript
 */
function mapBaselineFromDb(row: any): AnnualBudgetBaseline {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    type: row.type,
    revisionNumber: row.revision_number,
    title: row.title,
    notes: row.notes,
    matrixSnapshot: row.matrix_snapshot,
    summaryTotals: row.summary_totals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Busca todas as baselines e revisões salvas para um ano específico do usuário
 */
export async function fetchBaselinesByYear(
  userId: string,
  year: number
): Promise<AnnualBudgetBaseline[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('annual_budget_baselines')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('type', { ascending: false }) // 'original' antes de 'revision'
      .order('revision_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[baselineService] Erro ao buscar baselines:', error);
      return [];
    }

    return (data || []).map(mapBaselineFromDb);
  } catch (err) {
    console.error('[baselineService] Falha inesperada ao buscar baselines:', err);
    return [];
  }
}

/**
 * Salva ou atualiza um snapshot (Base Original ou Revisão) no Supabase.
 * Garante a regra de negócio de no máximo 2 revisões ativas por ano.
 */
export async function saveBudgetBaseline(
  userId: string,
  baselineData: Omit<AnnualBudgetBaseline, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AnnualBudgetBaseline | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // Se for uma nova revisão, verificar se já existem 2 revisões
    if (baselineData.type === 'revision') {
      const existing = await fetchBaselinesByYear(userId, baselineData.year);
      const existingRevisions = existing.filter(b => b.type === 'revision');

      // Se já existirem 2 revisões, remove a mais antiga (rotação automática)
      if (existingRevisions.length >= 2) {
        // Ordena pela data de criação mais antiga
        const sortedOldest = [...existingRevisions].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const oldestToRemove = sortedOldest[0];
        if (oldestToRemove) {
          await supabase
            .from('annual_budget_baselines')
            .delete()
            .eq('id', oldestToRemove.id);
        }
      }
    }

    const payload = {
      user_id: userId,
      year: baselineData.year,
      type: baselineData.type,
      revision_number: baselineData.revisionNumber || null,
      title: baselineData.title,
      notes: baselineData.notes || null,
      matrix_snapshot: baselineData.matrixSnapshot,
      summary_totals: baselineData.summaryTotals,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
      .from('annual_budget_baselines') as any)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[baselineService] Erro ao inserir baseline:', error);
      return null;
    }

    return mapBaselineFromDb(data);
  } catch (err) {
    console.error('[baselineService] Falha inesperada ao salvar baseline:', err);
    return null;
  }
}

/**
 * Atualiza o snapshot de uma versão existente (substituição / recriação)
 */
export async function updateBudgetBaseline(
  id: string,
  baselineData: Partial<Pick<AnnualBudgetBaseline, 'title' | 'notes' | 'matrixSnapshot' | 'summaryTotals'>>
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (baselineData.title !== undefined) payload.title = baselineData.title;
    if (baselineData.notes !== undefined) payload.notes = baselineData.notes;
    if (baselineData.matrixSnapshot !== undefined) payload.matrix_snapshot = baselineData.matrixSnapshot;
    if (baselineData.summaryTotals !== undefined) payload.summary_totals = baselineData.summaryTotals;

    const { error } = await (supabase
      .from('annual_budget_baselines') as any)
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[baselineService] Erro ao atualizar baseline:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[baselineService] Falha inesperada ao atualizar baseline:', err);
    return false;
  }
}

/**
 * Exclui uma baseline ou revisão do Supabase
 */
export async function deleteBudgetBaseline(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('annual_budget_baselines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[baselineService] Erro ao excluir baseline:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[baselineService] Falha inesperada ao excluir baseline:', err);
    return false;
  }
}
