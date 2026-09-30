# 🏠 Módulo: Dashboard & Tela Inicial

O Dashboard é o ponto focal do Poupix PRO, oferecendo uma experiência moderna e rica em dados com suporte a visões Desktop e Mobile (estilo Mobills).

---

## 🚀 Funcionalidades Principais

### 1. Hero Card & Resumo Mensal (Mobile)
- **Top Header**: Avatar do usuário com badge VIP/Perfil, seletor de mês centralizado (`selectedMonth`) e botão de notificações/alertas (`#9333EA`).
- **Saldo Central**: Exibe o saldo total consolidado das contas marcadas como `includeInTotal`.
- **Receitas vs Despesas**: Indicadores de receitas (verde) e despesas (vermelho) do mês com suporte ao **Modo de Privacidade** (`isPrivacyMode` -> `R$ ••••••`).

### 2. Card de Cartões de Crédito (Desktop & Mobile)
- **Alternador de Abas de Fatura**:
  - `Fatura Mês Atual`: Calcula despesas cujo vencimento é no mês selecionado.
  - `Fatura Próximo Mês`: Calcula despesas cujo vencimento é no mês seguinte.
- **Lista de Cartões com Badges de Status**:
  - Exibe bandeira (Visa, Mastercard, etc.), nome do cartão, badge de status colorido (`Aberta` em amarelo, `Vencida` em vermelho, `Fechada` em cinza, `Paga` em teal), data de fechamento e barra percentual de limite utilizado.
  - Botão de atalho rápido `(+)` para lançar despesa pré-selecionando o cartão em questão.
  - O clique no cartão navega diretamente para o detalhe daquele cartão no mês correspondente.

### 3. Reordenação e Gerenciamento da Tela Inicial
- Na tela de configurações / personalização da Home, o usuário pode reordenar e ativar/desativar cards conforme suas preferências.
- As preferências são persistidas no LocalStorage e sincronizadas via Supabase.

### 4. Card de Balanço Mensal (Desktop & Mobile)
- **Gráfico de Barras Proporcionais**: Exibe barras verticais estilizadas com cantos arredondados (Verde para Receitas, Vermelho para Despesas) com altura calculada proporcionalmente aos valores do mês.
- **Valores Detalhados**: Discriminação de Receitas, Despesas e Balanço Líquido do mês com formatação de cores e privacidade.
- **Ação Rápida**: Botão "VER MAIS" que conduz para a tela de Projeções/Transações.

### 5. Gráficos & Categorias
- **Despesas por Categoria**: Gráfico donut em SVG com chips das categorias mais expressivas do período.
- **Evolução Mensal (Anual)**: Gráfico de barras com histórico de fluxo de caixa ao longo dos 12 meses do ano.
- **Transações Recentes**: Atalho para visualização rápida das últimas movimentações com badge de categoria e conta/cartão.
