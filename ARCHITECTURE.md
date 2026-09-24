# Diretrizes de Arquitetura & Engenharia — Poupix PRO

## 1. Regra de Ouro: Arquivos Enxutos e Coesos (Clean Architecture)
- **Tamanho Máximo por Arquivo**: Nenhum componente ou utilitário deve ultrapassar **250 linhas**.
- Se um componente crescer, extraia subcomponentes menores em subpastas dedicadas:
  - `src/components/{modulo}/components/SubComponent.tsx`
- **Lógica de Negócios Fora dos Componentes**: Cálculos financeiros, parsers e projeções devem sempre residir em `src/lib/` ou hooks customizados em `src/hooks/`.

---

## 2. Testes Unitários Obrigatórios (TDD First)
- Qualquer novo cálculo financeiro, motor de projeção, validador ou parser deve conter seu teste unitário correspondente em `tests/unit/*.test.ts`.
- Rodar `npm run test` antes de qualquer entrega ou build de produção.

---

## 3. Base de Conhecimento e Histórico (Obsidian)
- Toda nova funcionalidade, alteração de regras de negócio ou estrutura técnica deve ser documentada em `docs/obsidian/` e espelhada no cofre `knowledge_obsidian/poupix/`.
- Permite que qualquer agente ou desenvolvedor retome o contexto completo do projeto instantaneamente.

---

## 4. Estrutura de Diretórios Padronizada:
```
poupix/
├── docs/obsidian/        # Documentação e Segundo Cérebro (espelhado no Obsidian)
├── src/
│   ├── app/              # Rotas e layout Next.js App Router
│   ├── components/       # Componentes React modularizados por funcionalidade
│   │   ├── dashboard/    # Visão consolidada e métricas
│   │   ├── accounts/     # Contas bancárias e saldos
│   │   ├── cards/        # Cartões de crédito e faturas
│   │   ├── transactions/ # Lançamentos e parcelamentos
│   │   ├── budgets/      # Categorias e tetos de gastos
│   │   ├── projections/  # Projeções 12M e Fluxo de Caixa
│   │   ├── importer/     # Importador OFX/CSV inteligente
│   │   ├── goals/        # Metas financeiras e cofres
│   │   ├── alerts/       # Notificações e avisos
│   │   ├── openfinance/  # Conexões Open Finance
│   │   ├── reports/      # Relatórios, DRE e exportação
│   │   ├── users/        # Gestão multi-usuário
│   │   ├── settings/     # Configurações, Nuvem e Backups
│   │   ├── layout/       # Sidebar, Header e Navegação
│   │   └── ui/           # Componentes atômicos reutilizáveis
│   ├── context/          # Provedores de estado global (FinanceContext)
│   ├── lib/              # Lógica pura (parsers, alertas, cashflow, supabase)
│   ├── types/            # Definições TypeScript
│   └── data/             # Dados iniciais e mocks estruturados
├── supabase/             # Scripts SQL de migração e RLS
└── tests/unit/           # Suíte de testes unitários Vitest
```
