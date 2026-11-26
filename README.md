# ONIRA | Sonhe. Descanse. Viva Melhor.

<div align="center">

![Status](https://img.shields.io/badge/STATUS-CONCLU%C3%8DDO-10B981?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

> **Plataforma Full Stack do Travesseiro Inteligente ONIRA (Dormire Tecnologia do Sono) focada na programação de roteiros de sonho, indução luminosa NeoPixel, despertar suave e acompanhamento real do histórico das noites.**

</div>

---

## Sobre o Projeto

A **ONIRA** foi desenvolvida no projeto integrador **Fábrica do Futuro (SENAI-SP)** para atender à demanda da **Dormire Tecnologia do Sono** (Campinas/SP). O objetivo é ir além do monitoramento passivo do sono, oferecendo uma plataforma real onde o usuário escolhe o tema do sonho, define a duração e o horário de despertar suave, acompanha seu histórico e configura os parâmetros do travesseiro inteligente.

A interface foi construída seguindo a identidade visual oficial da ONIRA (logo vetorial em **SVG** com a estrela de 4 pontas na letra **A**), combinando um **Dark Mode noturno** com acentos em roxo/violeta na área do usuário e um **Painel Administrativo** de alta legibilidade, 100% responsivo para celular e computador (RNF02).

### Integrantes da Equipe

- **Arthur Silva Andrade** — Técnico em Desenvolvimento de Sistemas · DS A (Back-end e Banco de Dados)
- **Vinícius Montuani** — Técnico em Desenvolvimento de Sistemas · DS B (Front-end e Funcionalidade)
- **Pietro** — Técnico em Desenvolvimento de Sistemas · DS B (Front-end e Funcionalidade)
- **Lívia** — Técnico em Multimídia (Design, Identidade Visual e Produto)
- **Luara** — Técnico em Multimídia (Design, Identidade Visual e Produto)

---

## Funcionalidades Principais

### Controle de Acesso e Autenticação (RF01, RF02, RF03, RNF01)
- **Cadastro Completo (`/cadastro`):** Registra nome completo, e-mail, **horário habitual de dormir** e senha armazenada com **hash bcrypt** via Supabase Auth, recusando e-mails duplicados (CT-01).
- **Login Seguro (`/login`):** Validação real de credenciais no Supabase, recusando senhas incorretas com mensagem genérica sem revelar qual campo errou (CT-02).
- **Redefinição de Senha (`/redefinir-senha` e `/atualizar-senha`):** Confere em tempo real via função RPC no PostgreSQL se o e-mail existe na base (avisando quando não encontrado) e dispara o link real de recuperação pelo Supabase Auth (CT-03).
- **Níveis de Acesso (RBAC + RLS):**
  * **Administrador (`admin`):** Acesso total ao painel `/admin` com CRUD de temas de sonho, visualização de usuários, dispositivos e métricas reais.
  * **Usuário Comum (`user`):** Acesso à experiência pessoal sem exibir o item *Administrador* no menu e com bloqueio estrito (403 no front-end + RLS no PostgreSQL) caso tente acessar `/admin` diretamente (CT-04).

### Roteiro do Sonho e Biblioteca de Temas (RF05 / CT-05)
- **Programação da Noite (`/roteiro-do-sonho`):** Seleção de tema carregado ao vivo do banco, definição de duração (recusa valores menores que 1 hora no front-end e no banco) e horário de despertar suave com cálculo automático do horário sugerido para deitar.
- **Visualizador NeoPixel ao Vivo:** Anel de LEDs SVG reagindo em tempo real à cor da luz do tema escolhido.
- **Biblioteca de Temas (`/temas`):** Catálogo completo com busca textual, filtro por cor de luz e seleção direta para o Roteiro do Sonho.

### Histórico, Relatórios e Configurações do Dispositivo
- **Histórico e Relatórios (`/historico`):** Filtros por status (`Programada`, `Concluída`, `Cancelada`), gráfico real de duração das últimas noites, tema favorito e modal de **Avaliação Matinal** (nota de 1 a 5 + anotações) salvo no PostgreSQL.
- **Meu Travesseiro ONIRA (`/dispositivo`):** Persistência real de parâmetros do hardware previsto (código de série, brilho do NeoPixel, volume do Buzzer, limite térmico do sensor NTC para ventilação automática e sensibilidade do LDR).
- **Perfil e Segurança (`/perfil`):** Edição de nome, horário habitual de dormir e troca real de senha autenticada.

### Painel Administrativo (RF04 / CT-04)
- **Dashboard Analítico (`/admin`):** KPIs e gráficos (atividade dos últimos 7 dias e distribuição por tema) calculados 100% sobre registros reais do banco.
- **CRUD Completo de Temas de Sonho:** Cadastro, edição e exclusão de temas (`nome`, `descrição` e `cor da luz`) com validação de campos obrigatórios e sincronização imediata com o Roteiro do Sonho.
- **Visão de Usuários, Dispositivos e Noites:** Tabelas administrativas protegidas por RLS.

---

## Estrutura do Banco de Dados (Supabase / PostgreSQL)

O sistema opera sobre um banco de dados relacional protegido por **Row Level Security (RLS)** definido em [`supabase/schema.sql`](./supabase/schema.sql):

1. **`profiles`**: Perfis vinculados ao `auth.users` via trigger automático (`id`, `full_name`, `email`, `habitual_sleep_time`, `role`, timestamps). Senhas protegidas por hash em `auth.users`.
2. **`dream_themes`**: Catálogo de temas de sonho gerenciado exclusivamente por administradores (`id`, `name`, `description`, `light_color`, `light_hex`, `created_by`).
3. **`dream_nights`**: Noites programadas e histórico de cada usuário (`id`, `user_id`, `theme_id`, `theme_name`, `theme_light_color`, `duration_hours >= 1`, `wake_up_time`, `status`, `sleep_quality`, `morning_notes`).
4. **`device_settings`**: Preferências reais do Travesseiro Inteligente vinculadas ao usuário (`user_id`, `device_code`, `device_name`, `neopixel_brightness`, `buzzer_volume`, `max_temp_celsius`, `auto_ventilation`, `ldr_sensitivity`).

---

## Tecnologias Utilizadas

- **Front-End:** React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router v7, Lucide Icons, identidade visual em SVG puro.
- **Back-End & Autenticação:** Supabase Auth (bcrypt, sessões JWT, recuperação de senha por e-mail), Funções RPC e Triggers em PL/pgSQL.
- **Banco de Dados:** PostgreSQL gerenciado no Supabase com **Row Level Security (RLS)** e constraints de integridade.

---

## Estrutura de Arquivos

```bash
onira-web/
├── index.html                        # Entrypoint HTML com fontes e favicon SVG
├── package.json                      # Dependências e scripts Vite/TypeScript
├── vite.config.ts                    # Configuração Vite + Tailwind CSS v4
├── .env.example                      # Modelo de variáveis de ambiente (sem chaves reais)
│
├── public/
│   ├── favicon.svg                   # Ícone vetorial orbital ONIRA
│   ├── onira-logo.svg                # Logo oficial ONIRA em SVG
│   └── images/
│       └── onira-pillow.png          # Imagem do produto físico ONIRA
│
├── supabase/
│   └── schema.sql                    # Script SQL completo (tabelas, triggers, RPC, RLS e seeds)
│
└── src/
    ├── main.tsx                      # Bootstrap da aplicação React
    ├── App.tsx                       # Definição de todas as rotas públicas, privadas e admin
    ├── index.css                     # Tokens visuais, tema Dark Mode e animações
    │
    ├── lib/
    │   ├── supabase.ts               # Cliente Supabase configurado via variáveis de ambiente
    │   └── colors.ts                 # Mapeamento de cores de luz NeoPixel e utilitários de horário
    │
    ├── types/
    │   └── database.ts               # Tipagens TypeScript das tabelas PostgreSQL
    │
    ├── contexts/
    │   └── AuthContext.tsx           # Estado global de sessão, perfil, RBAC e ações de Auth
    │
    ├── components/
    │   ├── OniraLogo.tsx             # Componente SVG oficial da marca ONIRA
    │   ├── WaveBackdrop.tsx          # Fundo com ondas noturnas da identidade visual
    │   ├── NeoPixelRing.tsx          # Visualizador interativo do anel de LEDs NeoPixel
    │   ├── AuthLayout.tsx            # Layout responsivo das telas de autenticação
    │   ├── AppShell.tsx              # Navegação desktop + bottom bar mobile da área interna
    │   ├── RouteGuards.tsx           # Proteção de rotas (ProtectedRoute, GuestRoute, AdminRoute)
    │   └── AdminCharts.tsx           # Gráficos SVG reais do painel administrativo
    │
    └── pages/
        ├── LandingPage.tsx           # Página inicial comercial apresentando o produto ONIRA
        ├── LoginPage.tsx             # Tela de Login (RF02 / CT-02)
        ├── RegisterPage.tsx          # Tela de Cadastro com horário habitual (RF01 / CT-01)
        ├── ForgotPasswordPage.tsx    # Redefinição de senha com validação real (RF03 / CT-03)
        ├── UpdatePasswordPage.tsx    # Atualização de senha via link do Supabase
        ├── DreamScriptPage.tsx       # Roteiro do Sonho — ação principal (RF05 / CT-05)
        ├── ThemesLibraryPage.tsx     # Biblioteca completa de temas com busca e filtro de cor
        ├── HistoryPage.tsx           # Histórico das noites, relatórios e avaliação matinal
        ├── DevicePage.tsx            # Configurações reais do Travesseiro ONIRA (IoT)
        ├── ProfilePage.tsx           # Dados pessoais, rotina de sono e alteração de senha
        └── AdminDashboardPage.tsx    # Painel Administrativo restrito e CRUD de temas (RF04 / CT-04)
```

---

## Como Rodar o Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` (ignorado pelo Git para nunca versionar chaves):

```bash
cp .env.example .env.local
```

Preencha com as credenciais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-ou-publishable
```

### 3. Executar o banco de dados no Supabase

1. No painel do Supabase, acesse **SQL Editor → New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
3. Em **Authentication → URL Configuration**, adicione `http://localhost:5173/atualizar-senha` em **Redirect URLs**.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:5173`.

---

## Usuário Administrador de Teste

1. Cadastre o administrador pela página `/cadastro`:
   - **Nome:** `Administrador ONIRA`
   - **E-mail:** `admin@onira.com.br`
   - **Horário habitual de dormir:** `23:00`
   - **Senha:** `Admin@123`
2. Promova o usuário a administrador no **SQL Editor** do Supabase:

```sql
SELECT public.promote_to_admin('admin@onira.com.br');
```

3. Faça login em `/login` com essas credenciais e acesse **Administrador** (`/admin`).
