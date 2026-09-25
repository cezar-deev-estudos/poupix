---
trigger: always_on
---

# PROJECT_STANDARDS.md - Poupix PRO Custom Rules

> Estas regras definem o comportamento estrito do assistente neste projeto e estão sempre ativas.

---

## 🛠️ Tech Stack & Architecture (Fixed)

- **Frontend**: Next.js 16 (App Router + React 19).
- **Styling**: Tailwind CSS v4 (Moderno, clean, alto contraste).
- **Backend/DB**: Supabase (PostgreSQL, Auth, RLS).
- **Deployment**: Vercel (CI/CD contínuo).
- **Testes**: Vitest + Testing Library.

---

## 💡 Mindset & Regras de Comportamento e Commit

1. **Protocolo de Validação de Escopo & Autorização Prévia (CRÍTICO/MANDATÓRIO)**:
   - **NUNCA FAZER ALÉM DO QUE FOI SOLICITADO**.
   - O agente deve listar todos os arquivos que pretende modificar ANTES de iniciar e aguardar confirmação/autorização explícita do usuário.
   - **NUNCA FAZER COMMITS OU PUSHES AUTOMÁTICOS** sem o usuário aprovar a implementação e autorizar expressamente o commit/deploy.

2. **No Native Dialogs (MANDATÓRIO)**:
   - É terminantemente proibido o uso de `window.alert`, `window.confirm` ou `window.prompt`.
   - Use sempre componentes de Modal customizados (ex: `ConfirmModal.tsx`, `NewTransactionModal.tsx`) ou toasts de feedback visual.

3. **Clean Code & Arquivos Enxutos**:
   - Manter arquivos com menos de 250 linhas.
   - Separar lógica de negócio (cálculos, validações) da camada de UI (`views` / `components`).
   - Usar Custom Hooks para orquestração de estado.

4. **Security & RLS no Supabase (MANDATÓRIO)**:
   - Toda query, tabela ou política no Supabase deve respeitar as políticas de **Row Level Security (RLS)** isolando dados por `user_id` / `auth.uid()`.

5. **Regra de Ouro de Tipografia da UI**:
   - Nenhum dado na tela deve ser exibido em negrito pesado excessivo (`font-bold` / `font-black`) em todos os elementos, nem tudo em caixa alta (`uppercase`).
   - Apenas títulos de destaque, badges e cabeçalhos de tabela devem ter ênfase visual.

6. **Proibição de Scripts Locais para Supabase (MANDATÓRIO)**:
   - É estritamente PROIBIDO usar ferramentas de terminal (`run_command`, PowerShell, `node -e`, etc.) para executar scripts locais que se conectam ao Supabase.
   - Interações com banco de dados devem ocorrer via cliente tipado do app ou MCP oficial.

7. **Sincronização do Segundo Cérebro (Obsidian)**:
   - A base de conhecimento e histórico está em `c:\CSC_Dev\Projetos-Ativos\knowledge_obsidian\poupix\`.
   - Sempre que uma funcionalidade for criada, atualize as notas correspondentes no Obsidian.

8. **Idioma**:
   - Todo o processo de trabalho, respostas, planos e relatórios devem ser em **Português do Brasil (pt-BR)**.
   - Código, variáveis e comentários técnicos permanecem em Inglês.
