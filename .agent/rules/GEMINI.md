---
trigger: always_on
---

# GEMINI.md - Poupix PRO Directives

> Este arquivo define o protocolo de atuação do agente no Poupix PRO.

---

## 🛑 REGRA DE OURO: PROTOCOLO DE COMMITS, IMPLEMENTAÇÃO E DEPLOY (MANDATÓRIO)

1. **AUTORIZAÇÃO PRÉVIA DE ESCOPO**:
   - O assistente deve listar todos os arquivos que pretende modificar ANTES de iniciar e aguardar confirmação explícita do usuário.

2. **PROIBIÇÃO ESTRITA DE COMMITS E PUSHES/DEPLOY AUTOMÁTICOS**:
   - **NUNCA FAZER `git commit`, `git push` OU MERGE EM `main`/`develop` AUTOMATICAMENTE**.
   - O assistente deve apenas implementar no código local, testar (`npm run test`) e validar o build (`npm run build`).
   - Apresentar o resultado final ao usuário e **AGUARDAR AUTORIZAÇÃO EXPRESSA E INDIVIDUAL** caso o usuário queira que seja feito o commit ou o deploy.

3. **VERIFICAÇÃO PRÉVIA DE DEPLOY EM PRODUÇÃO (REGRA DE OURO)**:
   - Sempre que o usuário reportar qualquer problema, inconsistência ou comportamento anômalo em ambiente publicado (ex: link Vercel), o assistente DEVE OBRIGATORIAMENTE verificar antes se as últimas correções ou alterações locais já foram commitadas e enviadas para deploy em produção (`git status`, commits pendentes) para esclarecer de imediato se o problema em questão já foi solucionado localmente e aguarda apenas o deploy.

3. **No Native Dialogs**:
   - Nunca usar `window.alert()`, `window.confirm()` ou `window.prompt()`. Usar modais customizados do app.

4. **Sincronização Obsidian**:
   - Manter a base de conhecimento `knowledge_obsidian/poupix/` sempre atualizada.
