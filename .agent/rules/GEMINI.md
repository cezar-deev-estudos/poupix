---
trigger: always_on
---

# GEMINI.md - Poupix PRO Directives

> Este arquivo define o protocolo de atuação do agente no Poupix PRO.

---

## 🛑 PROTOCOLO DE COMMITS, IMPLEMENTAÇÃO E DEPLOY (ATUALIZADO)

1. **AUTORIZAÇÃO CONTÍNUA DE IMPLEMENTAÇÃO**:
   - Quando o usuário disser *"Aprovado a implementação"*, *"Siga em frente"*, *"Autorizado até o final"* ou similar, o assistente **ESTÁ AUTORIZADO A PROSSEGUIR ATÉ O FIM** do ciclo completo (código, testes, build, commit e push/deploy) sem ficar interrompendo para pedir autorizações intermediárias a cada micro-passo.

2. **FLUXO PADRÃO AUTÔNOMO QUANDO AUTORIZADO**:
   1. Implementar as mudanças no código de forma limpa e modular.
   2. Rodar testes unitários (`npm run test`) e build (`npm run build`).
   3. Realizar `git commit` com mensagem descritiva semântica.
   4. Realizar `git push` nas branches `develop` e `main` para acionar a Vercel.
   5. Atualizar a base de conhecimento no Obsidian (`knowledge_obsidian/poupix/`).
   6. Apresentar o resumo final consolidado ao usuário.

3. **No Native Dialogs**:
   - Nunca usar `alert()` ou `confirm()`.

4. **Sincronização Obsidian**:
   - Manter a base de conhecimento `knowledge_obsidian/poupix/` sempre atualizada.
