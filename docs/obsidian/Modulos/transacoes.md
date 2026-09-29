# 💸 Módulo: Transações & Parcelamentos

O módulo de Transações é responsável pela criação, edição, exclusão e gerenciamento de escopo de receitas, despesas (à vista e cartão) e transferências.

---

## 🚀 Regras de Negócio & Funcionamento

### 1. Tipos de Transação
- **Despesa (`expense`)**: Lançamento padrão com débito em conta corrente ou carteira.
- **Despesa no Cartão (`creditCard`)**: Despesa atrelada a um `creditCardId` com controle de `invoiceDate` (fatura de vencimento).
- **Receita (`income`)**: Crédito em conta com status de recebido ou previsto.
- **Transferência (`transfer`)**: Movimentação entre duas contas cadastradas (`accountId` e `destinationAccountId`).

### 2. Parcelamento & Despesas Recorrentes
- **Parcelamento Inteligente (`installmentTotal`)**:
  - Ao criar uma despesa parcelada em $N$ vezes, o sistema gera $N$ registros vinculados por um `installmentGroupId`.
  - Cada parcela avança um mês tanto na data da transação (`date`) quanto na fatura de vencimento (`invoiceDate`), mantendo a descrição formatada como `Exemplo (1/12)`, `Exemplo (2/12)`.
- **Despesas Recorrentes (`isRecurring`)**:
  - Marcadas com `recurringGroupId` e periodicidade (mensal, anual, etc.).

### 3. Escopos de Edição e Exclusão
Ao editar ou excluir uma transação que faça parte de um grupo recorrente ou parcelado, o sistema abre o modal de escopo:
1. **Apenas este lançamento (`single`)**: Altera/exclui somente a ocorrência atual.
2. **Este e os próximos (`following`)**: Altera/exclui a partir do mês atual em diante, preservando o histórico passado.
3. **Todos os lançamentos (`all`)**: Aplica a modificação em todas as parcelas/ocorrências da série.
