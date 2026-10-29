---
trigger: always_on
---

# GEMINI.md - Poupix PRO Directives

> Este arquivo define o protocolo de atuação do agente no Poupix PRO.

---

## 🛑 REGRAS DE OURO & PROTOCOLO MANDATÓRIO

1. **AUTORIZAÇÃO DE PLANO ÚNICA & EXECUÇÃO 100% AUTÔNOMA (MODO TURBO)**:
   - O assistente deve apresentar o plano e os arquivos a serem modificados antes de iniciar a implementação.
   - **APÓS APROVAÇÃO DO PLANO PELO USUÁRIO, O ASSISTENTE DEVE EXECUTAR TUDO ATÉ O FINAL DE FORMA 100% AUTÔNOMA, SEM PARAR PARA FAZER PERGUNTAS, PEDIR AUTORIZAÇÃO INTERMEDIÁRIA OU CONFIRMAÇÃO DE LEITURA/EDIÇÃO.**
   - Fica terminantemente proibido interromper a implementação com perguntas desnecessárias. Faça o trabalho de ponta a ponta, rode os testes (`npm run test`), valide o build (`npm run build`) e apresente o resultado concluído.

2. **PROIBIÇÃO ESTRITA DE COMMITS E PUSHES/DEPLOY AUTOMÁTICOS**:
   - **NUNCA FAZER `git commit`, `git push` OU MERGE EM `main`/`develop` AUTOMATICAMENTE**.
   - O assistente deve apenas implementar no código local, testar (`npm run test`) e validar o build (`npm run build`).
   - Apresentar o resultado final ao usuário e **AGUARDAR AUTORIZAÇÃO EXPRESSA E INDIVIDUAL** caso o usuário queira que seja feito o commit ou o deploy.

3. **PERSISTÊNCIA OBRIGATÓRIA EM TABELAS/CAMPOS DO SUPABASE (REGRA DE OURO)**:
   - **TUDO DEVE SER ARMAZENADO EM TABELAS OU COLUNAS REAIS NO SUPABASE**. Não use nenhuma outra forma (nem apenas `localStorage`, nem metadados improvisados).
   - **Geração Obrigatória de SQL para o Usuário**: Se o assistente não tiver acesso direto para executar DDL (criar tabelas ou campos no Supabase), **DEVE OBRIGATORIAMENTE GERAR O SCRIPT SQL COMPLETO** (com tabelas, tipos, foreign keys, índices e políticas de RLS) e fornecer para o usuário rodar no SQL Editor do Supabase.
   - O código da aplicação deve interagir diretamente com essas tabelas/colunas reais no banco de dados.

4. **VERIFICAÇÃO PRÉVIA DE DEPLOY EM PRODUÇÃO (REGRA DE OURO)**:
   - Sempre que o usuário reportar qualquer problema, inconsistência ou comportamento anômalo em ambiente publicado (ex: link Vercel), o assistente DEVE OBRIGATORIAMENTE verificar antes se as últimas correções ou alterações locais já foram commitadas e enviadas para deploy em produção (`git status`, commits pendentes) para esclarecer de imediato se o problema em questão já foi solucionado localmente e aguarda apenas o deploy.

5. **No Native Dialogs**:
   - Nunca usar `window.alert()`, `window.confirm()` ou `window.prompt()`. Usar modais customizados do app.

6. **Sincronização Obsidian**:
   - Manter a base de conhecimento `knowledge_obsidian/poupix/` sempre atualizada.
