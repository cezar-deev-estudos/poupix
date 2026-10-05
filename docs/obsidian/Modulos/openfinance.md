# 🌐 Módulo: Open Finance & Sincronização Bancária

O Hub de **Open Finance** do Poupix PRO permite conectar instituições bancárias e fintechs homologadas para receber extratos, saldos e faturas de cartão de forma automatizada, mantendo integridade financeira sem digitação manual.

---

## 🏛️ 1. Arquitetura e Provedores Bancários

- **Regulação BACEN**: O compartilhamento de dados ocorre de forma padronizada via Open Finance Brasil (Resolução Conjunta nº 1/2020).
- **Modelo de Segurança**: Acesso **estritamente de leitura (Read-Only)**. Nenhuma credencial, senha, CVV de cartão ou chave de movimentação bancária é transitada ou armazenada.
- **Provedor Homologado**: Integração planejada via agregadores de API do mercado brasileiro (**Pluggy.ai**, Klavi ou Belvo), que oferecem ambiente Sandbox gratuito e SDKs prontos para web e mobile.
- **Gratuidade**: Pelo banco o serviço é 100% gratuito ao correntista por exigência do Banco Central.

---

## 📦 2. Dados Recebidos do Banco

1. **Saldos de Conta**: Saldo disponível em conta corrente e poupança atualizado em tempo real.
2. **Extrato de Movimentações (Débito e PIX)**:
   - Data e hora do lançamento.
   - Valor (positivo para entradas/PIX recebidos, negativo para saídas/pagamentos).
   - Descrição bancária oficial (ex: `PIX TRANSF Cezar Silva`, `PAG*SUPERMERCADO DIA`).
   - Identificador bancário único (`bankTransactionId`) para garantir idempotência e prevenir duplicidades.
3. **Cartões de Crédito**:
   - Limite total e limite utilizado.
   - Compras lançadas na fatura aberta e faturas anteriores.
   - Vencimento e data de fechamento.

---

## 🎛️ 3. Painel de Preferências de Sincronização (Por Instituição)

O usuário tem controle total sobre quais dados de cada banco entram no sistema:
- `syncBalance`: Habilita/desabilita a sincronização do saldo de contas.
- `syncTransactions`: Habilita/desabilita a captura de transações de extrato (débito/PIX).
- `syncCreditCard`: Habilita/desabilita a importação de faturas de cartão de crédito.
- `requireApproval`: Modo de segurança para exigir aprovação na fila de conciliação antes de efetivar no extrato.

---

## 📥 4. Fila de Conciliação e Aprovação (Inbox de Transações)

Para evitar lançamentos duplicados e garantir categorização precisa:
1. **Status**: Transações bancárias capturadas chegam inicialmente com status `pending_review`.
2. **Ações Disponíveis (1 Toque)**:
   - **Aprovar**: Converte o lançamento bancário em uma transação efetiva de despesa ou receita no Poupix com saldo atualizado.
   - **Vincular a Existente**: Se o usuário já cadastrou a transação manualmente, faz o merge mantendo a categoria original e marcando como conciliada.
   - **Ignorar/Descartar**: Ignora a transação sem adicioná-la aos relatórios.
   - **Aprovar Todas**: Atalho para efetivar todos os lançamentos pendentes de uma só vez.
3. **Sugestão Inteligente**: Mecanismo de palavras-chave que mapeia termos comuns (`mercado`, `uber`, `posto`, `farmacia`) para categorias do Poupix com badge de confiança.

---

## 📱 5. Experiência Mobile & Desktop

- **Mobile First**:
  - Drawer táctil de conciliação rápida (`BankReconciliationDrawer`).
  - Badge no topo do hub com quantidade de itens pendentes de aprovação.
  - Modal/Drawer de configurações de sincronização com toggles acessíveis.
- **Desktop**:
  - Grid consolidado com resumo de instituições ativas e histórico de sincronização.

---

## 🚀 6. Passo a Passo Técnico para Implementação Real (Produção)

Para conectar suas contas reais sem custos desnecessários via Open Finance oficial:

### Passo 1: Cadastro no Provedor Homologado (Pluggy)
1. Acessar [dashboard.pluggy.ai](https://dashboard.pluggy.ai) e criar uma conta gratuita de desenvolvedor.
2. No menu **API Keys**, obter:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`

### Passo 2: Configuração de Variáveis de Ambiente no Poupix
No arquivo `.env.local` do projeto:
```env
PLUGGY_CLIENT_ID=seu_client_id_aqui
PLUGGY_CLIENT_SECRET=seu_client_secret_aqui
```

### Passo 3: Criação da Rota de Token de Conexão (Next.js API Route)
Criar rota segura de backend `src/app/api/openfinance/connect-token/route.ts` que:
1. Faz autenticação com o servidor da Pluggy usando as credenciais do backend.
2. Retorna um `connectToken` temporário e seguro para abrir o Widget oficial sem expor segredos no navegador.

### Passo 4: Integração do Widget Oficial (Pluggy Connect SDK)
1. Instalar a biblioteca cliente oficial: `npm install react-pluggy-connect`.
2. No componente `OpenFinanceView.tsx`, substituir o modal simulado pelo componente `<PluggyConnect />`.
3. Ao clicar em "Conectar Nova Instituição", o widget Pluggy Connect oficial abre o fluxo seguro com QR Code / App bancário para autorização biométrica pelo correntista.

### Status de Implementação Concluída ✅
- **Credenciais Pluggy**: Configuradas no `.env.local` (`PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`).
- **Endpoint Connect-Token**: `src/app/api/openfinance/connect-token/route.ts` autentica e gera tokens de curta duração com segurança.
- **Endpoint Sync**: `src/app/api/openfinance/sync/route.ts` consulta contas e transações da Pluggy e mapeia para a fila de conciliação.
- **Widget Pluggy Connect v2**: `src/components/openfinance/PluggyConnectWidget.tsx` integrado no `OpenFinanceView.tsx`.
- **Painel de Preferências**: `BankSyncSettingsModal.tsx` permite ligar/desligar sincronização de saldo, extrato, cartão e exigir aprovação.
- **Fila de Conciliação / Inbox**: `BankReconciliationDrawer.tsx` e cards de alerta no Dashboard para aprovação manual com 1 toque.
- **Sincronização Ativa**: `FinanceContext.tsx` gerencia tanto conexões reais da Pluggy quanto conexões simuladas.
