# 🧪 Técnico: Testes Unitários & TDD

Este documento detalha a estratégia de testes automatizados do Poupix PRO utilizando **Vitest** e **Testing Library**.

---

## 🎯 Estratégia de Testes

### 1. Suíte de Testes com Vitest
- **Execução Rápida**: `npm run test -- --run` executa toda a suíte de testes unitários.
- **Cobertura Principal**:
  - `tests/unit/transactions.test.ts`: Criação, parcelamento, grupos e cálculos de valores.
  - `tests/unit/categories.test.ts`: Hierarquia de categorias pai/filho e validação de cores.
  - `tests/unit/cashflow.test.ts`: Projeções de fluxo de caixa futuro.
  - `tests/unit/parsers.test.ts`: Parsers e extratores de OFX/CSV.
  - `tests/unit/auth.test.ts`: Fluxos de autenticação e sessão.
  - `tests/unit/supabase.test.ts`: Conectividade e integridade de tipos.

### 2. Padrões de Qualidade
- Antes de qualquer deploy ou commit, é mandatória a execução de `npm run test` e `npm run build` para garantir regressão zero.
