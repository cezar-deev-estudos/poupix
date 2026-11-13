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

5. **BLINDAGEM ANTI-LOOP INFINITO & PROTEÇÃO DE COTAS (REGRA DE OURO)**:
   - Todo fluxo de sincronização contínua com Supabase ou bancos na nuvem DEVE possuir três travas obrigatórias:
     a) **Circuit Breaker (Disjuntor)**: Limitar a taxa máxima de requisições de sincronização por minuto (ex: máx 15 req/min). Se ultrapassar, interromper o envio automático temporariamente para não estourar cotas.
     b) **Bloqueio de Eco do Realtime**: Ao realizar mutação local, silenciar e descartar eventos recebidos via WebSocket/Realtime (`postgres_changes`) por pelo menos 15 segundos para impedir loops infinitos de ping-pong (enviar ➔ banco avisar ➔ app baixar tudo ➔ reenviar).
     c) **Throttle de Leitura**: Manter intervalo mínimo prudente (mínimo de 30 a 45 segundos) entre buscas completas automáticas do banco, permitindo bypass apenas em cliques manuais explícitos do usuário ("Baixar da Nuvem").

6. **PROTEÇÃO ANTI-HIBERNAÇÃO DO SUPABASE (KEEP-ALIVE OBRIGATÓRIO)**:
   - Em todo projeto com Supabase (plano gratuito), é **obrigatório** ter configurado o workflow do GitHub Actions `.github/workflows/supabase-keep-alive.yml` agendado via cron (ex: 3 vezes por semana) para pingar o banco e zerar o contador de inatividade de 7 dias, garantindo que o banco nunca seja pausado.

7. **No Native Dialogs**:
   - Nunca usar `window.alert()`, `window.confirm()` ou `window.prompt()`. Usar modais customizados do app.

8. **Sincronização Obsidian**:
   - Manter a base de conhecimento `knowledge_obsidian/poupix/` sempre atualizada.
