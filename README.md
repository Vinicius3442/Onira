# ONIRA — Sonhe. Descanse. Viva melhor.

Plataforma web oficial do **Travesseiro Inteligente ONIRA**, desenvolvida para a **Dormire Tecnologia do Sono** no projeto integrador **Fábrica do Futuro** (SENAI-SP).

A aplicação permite que usuários criem suas contas, programem o **Roteiro do Sonho** (tema, duração e horário de despertar suave) com acompanhamento de histórico real e que administradores gerenciem o catálogo de temas de sonho com segurança baseada em **Supabase Auth + PostgreSQL + Row Level Security (RLS)**.

---

## Integrantes

- **Vinícius Montuani** — Técnico em Desenvolvimento de Sistemas (Back-end & Front-end)
- **Pietro** — Técnico em Desenvolvimento de Sistemas (Back-end & Front-end)
- **Lívia** — Técnico em Multimídia (Design, Identidade Visual & Produto)
- **Luara** — Técnico em Multimídia (Design, Identidade Visual & Produto)

---

## Stack Tecnológica

- **Front-end:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + Lucide Icons
- **Back-end & Banco de Dados:** Supabase (PostgreSQL, Supabase Auth com hash bcrypt, Triggers, RPC e RLS)
- **Identidade Visual:** Logo vetorial SVG (`public/onira-logo.svg` e `src/components/OniraLogo.tsx`) e layout 100% responsivo (mobile e desktop)

---

## Páginas e Requisitos Atendidos

| Rota | Página | Requisito / Caso de Teste |
| --- | --- | --- |
| `/cadastro` | Cadastro de usuário (nome, e-mail, senha em hash e horário habitual de dormir) | RF01, RNF01 · CT-01 |
| `/login` | Autenticação real no Supabase (recusa credenciais erradas sem expor qual campo errou) | RF02 · CT-02 |
| `/redefinir-senha` | Conferência real do e-mail na base + envio de link de recuperação pelo Supabase | RF03 · CT-03 |
| `/atualizar-senha` | Definição da nova senha após clicar no link recebido por e-mail | RF03 |
| `/roteiro-do-sonho` | Seleção de tema (ao vivo do banco), duração (mín. 1h), horário de despertar e histórico | RF05 · CT-05 |
| `/admin` | Painel exclusivo para administradores com CRUD completo de temas e métricas reais | RF04 · CT-04 |

---

## Como Rodar o Projeto Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` (o arquivo `.env.local` é ignorado pelo Git para nunca expor chaves no repositório):

```bash
cp .env.example .env.local
```

Preencha `.env.local` com a URL e a chave pública (`anon` ou `publishable`) do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 3. Configurar o banco de dados no Supabase

1. Acesse o painel do Supabase → **SQL Editor** → **New query**.
2. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
   - Isso cria as tabelas `profiles`, `dream_themes` e `dream_nights`, os triggers automáticos, as políticas RLS, a função `check_email_exists` (CT-03) e os temas iniciais (incluindo **Praia ao entardecer** para o CT-05).
3. Em **Authentication → Providers → Email**, desative **Confirm email** para permitir login imediato de contas de teste (como `aline.moraes@teste.com`).
4. Em **Authentication → URL Configuration**, adicione `http://localhost:5173/atualizar-senha` em **Redirect URLs**.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:5173`.

---

## Usuário Administrador de Teste

Para criar e ativar o usuário administrador de teste:

1. Acesse `/cadastro` na plataforma e cadastre:
   - **Nome:** Administrador ONIRA
   - **E-mail:** `admin@onira.com.br`
   - **Horário habitual de dormir:** `23:00`
   - **Senha:** `Admin@123`
2. No **SQL Editor** do Supabase, promova essa conta para administrador executando:

```sql
SELECT public.promote_to_admin('admin@onira.com.br');
```

3. Faça login em `/login` com `admin@onira.com.br` e `Admin@123`. O item **Administrador** passará a aparecer no menu, liberando acesso a `/admin`.

> **Segurança:** Nenhum usuário comum consegue promover a si mesmo ou acessar `/admin` — o bloqueio é garantido tanto no front-end (`AdminRoute`) quanto diretamente no PostgreSQL via **Row Level Security (RLS)**.
