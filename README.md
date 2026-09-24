# Poupix PRO — Controle Financeiro Inteligente & Moderno

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests-yellow?style=for-the-badge&logo=vitest)](https://vitest.dev/)

Sistema completo de controle financeiro pessoal e familiar no padrão **Mobills / Nova Ordem**, construído para máxima velocidade, segurança visual e inteligência analítica.

---

## ✨ Funcionalidades Principais

- 🏠 **Dashboard Consolidado**: Visão geral de patrimônio, saldos mensais e receitas vs. despesas.
- 💳 **Cartões de Crédito 3D**: Visual glassmorphism, controle de faturas, limites e melhor dia de compra.
- 🏦 **Contas & Carteiras**: Múltiplas contas correntes, poupanças e investimentos.
- 🏷️ **Categorias & Tetos Orçamentários**: Alertas preventivos de estouro de orçamento por categoria.
- 📈 **Projeções de Fluxo de Caixa**: Motor preditivo de 6 a 12 meses baseado em recorrências e parcelas.
- 📥 **Importador Bancário OFX & CSV**: Auto-categorização por palavras-chave e detecção de duplicatas.
- 🎯 **Metas & Cofres**: Acompanhamento visual de objetivos de curto, médio e longo prazo.
- 🔗 **Hub Open Finance**: Conexão simulada com os principais bancos brasileiros.
- 📊 **Relatórios & DRE**: Exportação em CSV, JSON e visualização para impressão em PDF.
- 👥 **Controle Multi-usuário**: Perfis independentes ou compartilhados com papéis (`admin`, `member`, `guest`).
- 🕶️ **Modo Privacidade**: Ocultação rápida de saldos com `***` para uso seguro em locais públicos.
- 🌗 **Dark & Light Mode**: Alternância visual dinâmica com cores de alto contraste.
- 📱 **PWA (Progressive Web App)**: Instalável no celular como aplicativo nativo.

---

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 16 (App Router + React 19)
- **Estilização**: Tailwind CSS v4 + Lucide Icons + Recharts
- **Banco de Dados**: Supabase (PostgreSQL) com RLS (Row Level Security)
- **Persistência**: Arquitetura Híbrida (Local-First via `localStorage` + Cloud Sync)
- **Testes Unitários**: Vitest + Testing Library

---

## 🚀 Como Executar o Projeto Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/poupix.git
cd poupix

# 2. Instalar dependências
npm install

# 3. Rodar os testes unitários
npm run test

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador: [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Configuração do Banco de Dados (Supabase)

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** do Supabase, copie o conteúdo do arquivo `supabase/schema.sql` e execute.
3. Copie a `Project URL` e a `anon key` e cole nas Configurações do app ou no arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```
