# 🗄️ Técnico: Banco de Dados & Supabase

Este documento descreve a arquitetura de persistência, modelo relacional, políticas de segurança e motor de sincronização do Poupix PRO.

---

## 🛠️ Arquitetura de Nuvem (Supabase PostgreSQL)

### 1. Políticas de Segurança (Row Level Security - RLS)
- **Isolamento por Usuário**: Todas as tabelas possuem a coluna `user_id` vinculada a `auth.uid()`.
- Nenhuma operação de `SELECT`, `INSERT`, `UPDATE` ou `DELETE` pode acessar dados de outros usuários.
- **Scripts Locais**: É expressamente proibido usar scripts de terminal com conexão direta ao Supabase em produção; todas as operações ocorrem via cliente oficial `@supabase/supabase-js` tipado.

### 2. Estrutura das Tabelas Principais
- `accounts`: Contas bancárias, carteiras e saldos iniciais.
- `credit_cards`: Cartões de crédito, limites, `due_day`, `closing_day` e overrides em JSON (`manual_invoice_status`).
- `categories`: Categorias com hierarquia pai/filho (`parent_id`), cores e ícones.
- `transactions`: Lançamentos financeiros com suporte a parcelas (`installment_group_id`), tags, notas e `invoice_date`.
- `goals`: Metas financeiras e cofres de economia.

### 3. Motor de Sincronização (Cloud Sync)
- **Offline First & Debounce**: Alterações locais no estado React são salvas imediatamente no LocalStorage e enviadas ao Supabase de forma assíncrona com debounce (evitando requisições em excesso).
- **Auto-Fetch**: Ao iniciar o app e autenticar, o sistema recupera os dados mais recentes da nuvem e normaliza as faturas sem sobrescrever seleções manuais.
