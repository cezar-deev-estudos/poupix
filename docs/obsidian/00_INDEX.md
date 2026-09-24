# 🧠 Poupix PRO: Segundo Cérebro (Knowledge Base)

Bem-vindo à base de conhecimento integrada do **Poupix PRO**.
Esta estrutura mantém o contexto das regras de negócio, arquitetura modular, padrões de desenvolvimento e histórico de evolução do sistema.

---

## 📱 Módulos do Sistema (Funcional)

Guias de funcionamento e regras de negócio de cada módulo:

- 🏠 **[[Modulos/dashboard|Dashboard]]**: Visão consolidada, saldos do mês, gráficos e atalhos rápidos.
- 💳 **[[Modulos/cartoes|Cartões de Crédito]]**: Faturas, melhor dia de compra, limites e visual 3D Glassmorphism.
- 🏦 **[[Modulos/contas|Contas & Carteiras]]**: Múltiplas contas, transferências e consolidação de patrimônio.
- 🏷️ **[[Modulos/categorias|Categorias & Orçamentos]]**: Tetos de gastos mensais, barras de progresso e alertas.
- 📈 **[[Modulos/projecoes|Projeções & Fluxo de Caixa]]**: Motor preditivo de 6 a 12 meses baseado em recorrências e parcelas.
- 📥 **[[Modulos/importador|Importador Bancário (OFX/CSV)]]**: Motor de categorização inteligente por palavras-chave e detecção de duplicatas.
- 🎯 **[[Modulos/metas|Metas Financeiras]]**: Cofres, prazos e acompanhamento percentual.
- 🔗 **[[Modulos/open-finance|Open Finance Hub]]**: Conexão simulada de instituições bancárias com consentimento e auto-sync.
- 📊 **[[Modulos/relatorios|Relatórios & Exportação]]**: DRE pessoal, exportação em CSV/JSON e PDF para impressão.
- 👥 **[[Modulos/usuarios|Controle Multi-usuário]]**: Perfis familiares/empresariais com permissões (`admin`, `member`, `guest`).
- ⚙️ **[[Modulos/configuracoes|Configurações, Privacidade & Nuvem]]**: Modo Privacidade (`***`), Backup JSON e Conexão Supabase.

---

## 🛠️ Conhecimento Técnico & Engenharia

- 🗄️ **[[Tecnico/banco-dados-supabase|Banco de Dados (Supabase PostgreSQL)]]**: Tabelas, Chaves Estrangeiras, RLS e Índices.
- 🧪 **[[Tecnico/testes-unitarios|Testes Unitários & TDD]]**: Suíte Vitest, cobertura de parsers e projeções financeiras.
- 🧩 **[[Tecnico/arquitetura-modular|Arquitetura Modular & Clean Code]]**: Divisão estrita de responsabilidades (máximo 250 linhas por arquivo).
- 🎨 **[[Tecnico/design-system|Design System & Temas]]**: Suporte completo a Dark/Light mode e Tailwind CSS v4.

---

## 📜 Histórico de Versões & Marcos

- **Fase 1 (MVP)**: Dashboard, Contas, Cartões 3D, Categorias, Lançamentos Parcelados.
- **Fase 2 (Analytics)**: Projeções 12M, Importador OFX/CSV, Metas, Central de Alertas.
- **Fase 3 (Open Finance & Nuvem)**: Hub Open Finance, Relatórios Consolidados, Multi-usuário, Supabase e Vitest.
