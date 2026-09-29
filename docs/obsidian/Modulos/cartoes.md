# 💳 Módulo: Cartões de Crédito & Faturas

O módulo de Cartões de Crédito gerencia cartões, limites, ciclos de faturas, parcelamentos, pagamentos antecipados e status de faturas no Poupix PRO.

---

## 🚀 Regras de Negócio & Funcionamento

### 1. Ciclo de Fatura e Alocação de Despesas
- **Dia de Fechamento (`closingDay`) vs Dia de Vencimento (`dueDay`)**:
  - Toda compra realizada **até o dia de fechamento** é alocada na fatura que vence no **mês corrente**.
  - Toda compra realizada **após o dia de fechamento** tem seu vencimento calculado automaticamente para o **mês seguinte**.
- **Fatura Manual (`invoiceDate`)**:
  - O usuário pode escolher explicitamente no modal de lançamento qual a fatura de vencimento desejada.
  - O sistema prioriza sempre o campo `invoiceDate` salvo na transação sobre qualquer cálculo automático, preservando a decisão manual do usuário.
- **Normalização de Dados**:
  - Durante o sync com Supabase / LocalStorage, o sistema preserva o `invoiceDate` já existente, preenchendo apenas transações legadas sem esse campo.

### 2. Status da Fatura & Cores Padronizadas
Os status são calculados dinamicamente com base nas datas e suportam override manual (`manualInvoiceStatus`):

| Status | Cor / Classes | Descrição |
| :--- | :--- | :--- |
| **Aberta** | **Amarelo** (`text-amber-400`, `bg-amber-500/15`, `border-amber-500/30`) | Fatura do ciclo corrente ainda não fechada. |
| **Vencida** | **Vermelho** (`text-rose-400` / `text-rose-500`, `bg-rose-500/20`, `border-rose-500/40`) | A data atual ultrapassou o `dueDate` e a fatura não foi paga. |
| **Fechada** | **Cinza Suave** (`text-slate-300`, `bg-slate-500/20`, `border-slate-500/30`) | A data atual ultrapassou o `closingDate`, mas ainda está antes do vencimento. |
| **Paga** | **Verde Ciano / Teal** (`text-teal-300`, `bg-teal-500/15`, `border-teal-500/30`) | Fatura marcada como paga manualmente pelo usuário. |

### 3. Proteção & Bloqueio de Edição em Faturas Fechadas/Pagas
- Quando uma fatura está **Fechada** ou **Paga**:
  - **Desktop (`CardInvoiceDetailView.tsx`)**: A coluna *"Ações"* e os botões de edição e exclusão de itens ficam completamente ocultos.
  - **Mobile (`MobileCardInvoiceDetail.tsx`)**: O clique sobre o item para abrir o modal de edição é desabilitado.
  - O botão `(+)` no topo muda para um botão de destaque *"Reabrir e Lançar"*.
- **Reabertura**: Ao clicar em *"Reabrir fatura"*, o status volta para `open`, restaurando imediatamente os botões de edição e exclusão tanto no Mobile quanto no Desktop.

### 4. Menu de Opções ⋮ da Fatura
- **Pagar Fatura vs Pagar Adiantado**:
  - Se a fatura estiver **Vencida** ou **Fechada** (e não paga): O menu exibe a opção **"Pagar fatura"** em destaque com ícone de confirmação ciano.
  - Se a fatura estiver **Aberta** e dentro do prazo: O menu exibe **"Pagar adiantado"**, abrindo o modal de antecipação.
  - Se a fatura já estiver **Paga**: As opções de pagamento são ocultadas.

### 5. Navegação & Abas no Dashboard
- Nos cards de resumo do Dashboard (Mobile e Desktop), há o seletor em pílula:
  - **Fatura Mês Atual**: Exibe o total e limite utilizado referente ao mês selecionado no filtro global.
  - **Fatura Próximo Mês**: Avança a projeção para o mês seguinte (`selectedMonth + 1`).
- Ao clicar em qualquer cartão no Dashboard, o usuário é redirecionado para a aba de Cartões com o cartão específico e o período correto pré-selecionados.
