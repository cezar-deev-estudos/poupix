# 🛡️ Relatório de Auditoria, Saúde do Projeto e Segurança da Informação

> **Data do Levantamento**: 24 de Outubro de 2026  
> **Objetivo**: Guia prático de melhorias de arquitetura, segurança e boas práticas para execução futura.

---

## 1. Diagnóstico Geral do Sistema

| Dimensão | Nota (0 a 10) | Situação | Destaque Principal |
| :--- | :---: | :---: | :--- |
| **Arquitetura & Clean Code** | **8.5** | 🟢 Saudável | Separação eficaz entre Hooks de negócio (`useTransactionsManager`, `useAccountStatement`, `useFinanceCloudSync`) e Camada de UI. |
| **Robustez & Tipagem** | **9.0** | 🟢 Excelente | TypeScript estrito, build do Next.js 100% limpo (`next build` sem erros) e 13/13 testes unitários aprovados. |
| **Segurança da Informação** | **6.5** | 🟡 Atenção | Vulnerabilidades conhecidas em dependências e ausência de assinatura de validação no Webhook Pluggy. |
| **Performance & PWA** | **8.5** | 🟢 Saudável | Compilação Turbopack ágil (3.7s), Service Worker ativo e suporte completo offline-first. |
| **Cobertura de Testes** | **6.0** | 🟡 Regular | Testes cobrem cálculos essenciais e parsers, mas faltam testes de integração ponta a ponta (E2E) e validação de RLS. |

---

## 2. Itens de Segurança da Informação (Ações Futuras)

### 🔴 Alta Prioridade

1. **Validação de Assinatura no Webhook da Pluggy**:
   - **Arquivo**: `src/app/api/openfinance/webhook/route.ts`
   - **Problema**: O endpoint `POST` aceita eventos de qualquer origem sem verificar cabeçalhos criptográficos de autenticidade (`x-pluggy-signature` ou segredo de webhook). Além disso, contém um UUID fixo de fallback na linha 46.
   - **Ação a fazer**: 
     - Adicionar variável `PLUGGY_WEBHOOK_SECRET` no `.env.local` e Vercel.
     - Rejeitar com `401 Unauthorized` requisições sem assinatura válida.
     - Remover o UUID fixo de fallback.

2. **Auditoria de Políticas RLS no Supabase**:
   - **Contexto**: A chave pública (`anonKey`) está presente no cliente e no localStorage. A segurança do ecossistema depende 100% do isolamento de dados no banco.
   - **Ação a fazer**:
     - Garantir que todas as tabelas (`accounts`, `credit_cards`, `categories`, `tags`, `transactions`, `goals`) tenham `ROW LEVEL SECURITY` habilitado.
     - Validar que cada política `SELECT`, `INSERT`, `UPDATE` e `DELETE` esteja amarrada estritamente a `auth.uid() = user_id`.

3. **Monitoramento e Patch de Dependências (`npm audit`)**:
   - **Contexto**: O `npm audit` reportou avisos em versões de sub-dependências do `next` e ferramentas de dev (`tinypool`, `esbuild`, `sharp`).
   - **Ação a fazer**:
     - Conforme patches estáveis do Next.js 16 forem lançados pelo time do Vercel, atualizar o pacote (`npm update next`).
     - Manter o ecossistema React 19 estável sem quebrar compatibilidades com Tailwind CSS v4.

---

## 3. Arquitetura e Clean Code (Refatorações Futuras)

### 🟡 Média Prioridade

1. **Fatiamento de Componentes Extensos (Meta < 250 linhas)**:
   - **Arquivos-Alvo**:
     - `src/components/transactions/MobileTransactionsView.tsx` (~1500 linhas)
     - `src/components/transactions/TransactionsView.tsx` (~1000 linhas)
     - `src/context/FinanceContext.tsx` (~1000 linhas)
   - **Ação a fazer**:
     - Extrair a barra de filtros, agrupamentos por data e cabeçalhos em subcomponentes isolados (ex: `TransactionsToolbar.tsx`, `TransactionsDateGroup.tsx`).
     - No `FinanceContext`, avaliar a divisão por domínios (`TransactionsContext`, `AccountsContext`, `AuthContext`) para mitigar re-renderizações desnecessárias.

2. **Expansão da Suíte de Testes Automatizados**:
   - **Ação a fazer**:
     - Criar testes unitários para o hook `useAccountStatement.ts` (validando cálculo de saldo resultante do extrato).
     - Criar testes de integração para `useTransactionsManager.ts` simulando criação, edição de valores e exclusão com estorno de saldos em contas.

---

## 4. Checklist para Próximas Sessões

- [ ] Implementar middleware/validador de assinatura no Webhook Pluggy.
- [ ] Checar no dashboard do Supabase as regras de RLS para todas as tabelas.
- [ ] Criar testes unitários para `useAccountStatement`.
- [ ] Iniciar a modularização de `MobileTransactionsView.tsx` em submódulos menores.
