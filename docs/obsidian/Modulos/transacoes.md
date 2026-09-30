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

### 4. Competência Financeira do Cartão de Crédito
- **Filtragem por Período de Fatura**: Despesas no cartão de crédito pertencem ao mês/ano da respectiva fatura de vencimento (`invoiceDate`), e não à data da compra (`date`). Isso garante que compras pós-fechamento do cartão apareçam apenas no mês em que a fatura será efetivamente quitada.
- **Status Efetivado / Pendente**: A despesa de cartão de crédito é considerada efetivada (ícone verde de check) se o status individual `tx.paid` for verdadeiro ou se a fatura do cartão para aquele período estiver marcada como paga (`manualInvoiceStatus === 'paid'`).
- **Sincronização em Lote**: Ao pagar uma fatura na aba de Cartões, todas as despesas vinculadas àquela fatura são automaticamente atualizadas para efetivadas (`paid: true`). Caso a fatura seja reaberta, retornam para pendentes (`paid: false`).

### 5. Identificadores Visuais no Extrato (Desktop & Mobile)
- **Item Fixo (`isRecurring`)**: Exibe o badge roxo estilizado `[🔁 Fixo]` ao lado da descrição da transação.
- **Item Parcelado (`installmentTotal > 1`)**: Exibe o badge âmbar `[📚 X/Yx]` indicando a parcela atual e o total de parcelas.
- **Cartão de Crédito (`creditCardId`)**: Exibe o selo circular ciano com o ícone de cartão de crédito.
