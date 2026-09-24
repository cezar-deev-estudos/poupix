import { Account, Category, CreditCard, Goal, Transaction, AlertNotification } from '@/types/finance';

/**
 * Gera alertas inteligentes em tempo real baseados nas informações financeiras:
 * 1. Faturas de cartão com vencimento nos próximos 5 dias
 * 2. Despesas a pagar vencendo hoje ou nos próximos dias
 * 3. Categorias que atingiram ou ultrapassaram 80% e 100% do orçamento
 * 4. Metas que atingiram 100% ou estão próximas
 */
export function generateSmartAlerts(
  creditCards: CreditCard[],
  transactions: Transaction[],
  categories: Category[],
  goals: Goal[],
  currentMonth: number,
  currentYear: number
): AlertNotification[] {
  const alerts: AlertNotification[] = [];
  const today = new Date();
  const todayDay = today.getDate();

  // 1. Alertas de Vencimento de Cartão de Crédito
  creditCards.forEach(card => {
    // Calcular total gasto na fatura deste mês
    const cardMonthExpenses = transactions
      .filter(t => {
        if (!t.date || t.creditCardId !== card.id) return false;
        const [y, m] = t.date.split('-').map(Number);
        return y === currentYear && (m - 1) === currentMonth && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (cardMonthExpenses > 0) {
      const daysUntilDue = card.dueDay - todayDay;
      if (daysUntilDue >= 0 && daysUntilDue <= 5) {
        alerts.push({
          id: `alert-card-${card.id}-${currentYear}-${currentMonth}`,
          type: 'card_due',
          title: `Fatura ${card.name} a Vencer`,
          message: daysUntilDue === 0 
            ? `Sua fatura de R$ ${cardMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence hoje!` 
            : `Sua fatura de R$ ${cardMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${daysUntilDue} dia(s) (Dia ${card.dueDay}).`,
          severity: daysUntilDue <= 2 ? 'danger' : 'warning',
          date: today.toISOString(),
          isRead: false,
          relatedId: card.id,
        });
      }
    }
  });

  // 2. Alertas de Despesas Pendentes a Vencer
  const pendingExpenses = transactions.filter(t => {
    if (!t.date || t.paid || t.type !== 'expense' || t.creditCardId) return false;
    const [y, m, d] = t.date.split('-').map(Number);
    return y === currentYear && (m - 1) === currentMonth;
  });

  pendingExpenses.forEach(tx => {
    const [, , d] = tx.date.split('-').map(Number);
    const diff = d - todayDay;
    if (diff >= 0 && diff <= 3) {
      alerts.push({
        id: `alert-tx-${tx.id}`,
        type: 'expense_due',
        title: `Conta a Pagar: ${tx.description}`,
        message: diff === 0
          ? `O pagamento de R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence hoje!`
          : `Vence em ${diff} dia(s) - R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        severity: diff === 0 ? 'danger' : 'warning',
        date: tx.date,
        isRead: false,
        relatedId: tx.id,
      });
    } else if (diff < 0) {
      alerts.push({
        id: `alert-tx-late-${tx.id}`,
        type: 'expense_due',
        title: `Conta em Atraso: ${tx.description}`,
        message: `Venceu há ${Math.abs(diff)} dia(s) - R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        severity: 'danger',
        date: tx.date,
        isRead: false,
        relatedId: tx.id,
      });
    }
  });

  // 3. Alertas de Teto de Orçamento de Categorias
  categories.forEach(cat => {
    if (cat.type === 'expense' && cat.budgetLimit && cat.budgetLimit > 0) {
      const spent = transactions
        .filter(t => {
          if (!t.date || t.categoryId !== cat.id || t.type !== 'expense') return false;
          const [y, m] = t.date.split('-').map(Number);
          return y === currentYear && (m - 1) === currentMonth;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = (spent / cat.budgetLimit) * 100;

      if (percent >= 100) {
        alerts.push({
          id: `alert-budget-exceeded-${cat.id}-${currentYear}-${currentMonth}`,
          type: 'budget_exceeded',
          title: `Orçamento Estourado: ${cat.name}`,
          message: `Você ultrapassou o teto definido (${percent.toFixed(0)}% gasto de R$ ${cat.budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
          severity: 'danger',
          date: today.toISOString(),
          isRead: false,
          relatedId: cat.id,
        });
      } else if (percent >= 80) {
        alerts.push({
          id: `alert-budget-warn-${cat.id}-${currentYear}-${currentMonth}`,
          type: 'budget_warning',
          title: `Atenção ao Orçamento: ${cat.name}`,
          message: `Você já utilizou ${percent.toFixed(0)}% do orçamento estipulado para este mês.`,
          severity: 'warning',
          date: today.toISOString(),
          isRead: false,
          relatedId: cat.id,
        });
      }
    }
  });

  // 4. Alertas de Metas Concluídas ou Próximas
  goals.forEach(goal => {
    const percent = (goal.currentAmount / goal.targetAmount) * 100;
    if (percent >= 100 && !goal.completed) {
      alerts.push({
        id: `alert-goal-reached-${goal.id}`,
        type: 'goal_reached',
        title: `Meta Alcançada: ${goal.name}! 🎉`,
        message: `Parabéns! Você atingiu 100% da meta de R$ ${goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!`,
        severity: 'success',
        date: today.toISOString(),
        isRead: false,
        relatedId: goal.id,
      });
    }
  });

  return alerts;
}
