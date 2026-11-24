-- ============================================================================
-- ONIRA — Travesseiro dos Sonhos (Dormire Tecnologia do Sono)
-- Schema completo do banco de dados Supabase (PostgreSQL + Auth + RLS)
-- ============================================================================
-- Como executar:
-- 1. Acesse o painel do Supabase -> SQL Editor -> New Query
-- 2. Cole todo este arquivo e clique em "Run"
-- 3. Em Authentication -> Providers -> Email, desative "Confirm email"
--    (para permitir login imediato de contas de teste como aline.moraes@teste.com)
-- 4. Crie sua conta de administrador pela tela /cadastro (ou no painel Auth)
--    e execute: SELECT public.promote_to_admin('admin@onira.com.br');
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABELA DE PERFIS DE USUÁRIO (vinculada ao auth.users com senha em hash)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL UNIQUE,
  habitual_sleep_time TEXT NOT NULL DEFAULT '22:30'
    CHECK (habitual_sleep_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfis dos usuários ONIRA. Senhas ficam armazenadas com hash bcrypt em auth.users.';
COMMENT ON COLUMN public.profiles.habitual_sleep_time IS 'Horário habitual de dormir (RF01 / CT-01), formato HH:MM.';

-- ----------------------------------------------------------------------------
-- 2. TABELA DE TEMAS DE SONHO (gerenciada pelo Administrador — RF04 / CT-04)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dream_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
  light_color TEXT NOT NULL CHECK (char_length(trim(light_color)) > 0),
  light_hex TEXT NOT NULL DEFAULT '#8B5CF6'
    CHECK (light_hex ~ '^#[0-9A-Fa-f]{6}$'),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dream_themes IS 'Catálogo de temas de sonho gerenciado exclusivamente por administradores.';

-- ----------------------------------------------------------------------------
-- 3. TABELA DE NOITES PROGRAMADAS (Roteiro do Sonho — RF05 / CT-05)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dream_nights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.dream_themes(id) ON DELETE SET NULL,
  theme_name TEXT NOT NULL CHECK (char_length(trim(theme_name)) > 0),
  theme_light_color TEXT NOT NULL CHECK (char_length(trim(theme_light_color)) > 0),
  theme_light_hex TEXT NOT NULL DEFAULT '#8B5CF6'
    CHECK (theme_light_hex ~ '^#[0-9A-Fa-f]{6}$'),
  duration_hours NUMERIC(4,1) NOT NULL
    CHECK (duration_hours >= 1 AND duration_hours <= 24),
  wake_up_time TEXT NOT NULL
    CHECK (wake_up_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  status TEXT NOT NULL DEFAULT 'Programada'
    CHECK (status IN ('Programada', 'Concluída', 'Cancelada')),
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dream_nights IS 'Noites programadas pelos usuários na página Roteiro do Sonho (RF05 / CT-05).';

CREATE INDEX IF NOT EXISTS idx_dream_nights_user_id ON public.dream_nights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_nights_theme_id ON public.dream_nights(theme_id);
CREATE INDEX IF NOT EXISTS idx_dream_themes_name ON public.dream_themes(name);

-- ----------------------------------------------------------------------------
-- 4. FUNÇÕES AUXILIARES & TRIGGERS
-- ----------------------------------------------------------------------------

-- Atualiza automaticamente updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dream_themes_updated_at ON public.dream_themes;
CREATE TRIGGER trg_dream_themes_updated_at
  BEFORE UPDATE ON public.dream_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Verifica se o usuário autenticado atual é administrador (evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Impede que usuários comuns alterem a própria coluna role para 'admin'
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o nível de acesso.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Cria automaticamente o registro em public.profiles ao cadastrar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_sleep_time TEXT;
BEGIN
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );
  v_sleep_time := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'habitual_sleep_time'), ''),
    '22:30'
  );

  IF v_sleep_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    v_sleep_time := '22:30';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, habitual_sleep_time, role)
  VALUES (NEW.id, v_full_name, lower(trim(NEW.email)), v_sleep_time, 'user')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        habitual_sleep_time = EXCLUDED.habitual_sleep_time;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verifica se um e-mail existe na base (necessário para CT-03: avisar quando e-mail não existe)
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;

-- Função prática para promover um usuário cadastrado a administrador via SQL Editor
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE lower(email) = lower(trim(p_email));

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN 'Nenhum usuário encontrado com o e-mail: ' || p_email;
  END IF;

  RETURN 'Usuário promovido a administrador com sucesso: ' || p_email;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) — SEGURANÇA NO BANCO DE DADOS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_nights ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'user');

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Policies: dream_themes (somente Admin cria, edita e exclui — RF04 / CT-04)
DROP POLICY IF EXISTS "dream_themes_select_authenticated" ON public.dream_themes;
CREATE POLICY "dream_themes_select_authenticated"
  ON public.dream_themes FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "dream_themes_insert_admin_only" ON public.dream_themes;
CREATE POLICY "dream_themes_insert_admin_only"
  ON public.dream_themes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "dream_themes_update_admin_only" ON public.dream_themes;
CREATE POLICY "dream_themes_update_admin_only"
  ON public.dream_themes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "dream_themes_delete_admin_only" ON public.dream_themes;
CREATE POLICY "dream_themes_delete_admin_only"
  ON public.dream_themes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Policies: dream_nights (usuário gerencia suas próprias noites; admin lê métricas)
DROP POLICY IF EXISTS "dream_nights_select_own_or_admin" ON public.dream_nights;
CREATE POLICY "dream_nights_select_own_or_admin"
  ON public.dream_nights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "dream_nights_insert_own" ON public.dream_nights;
CREATE POLICY "dream_nights_insert_own"
  ON public.dream_nights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dream_nights_update_own_or_admin" ON public.dream_nights;
CREATE POLICY "dream_nights_update_own_or_admin"
  ON public.dream_nights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "dream_nights_delete_own_or_admin" ON public.dream_nights;
CREATE POLICY "dream_nights_delete_own_or_admin"
  ON public.dream_nights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. TEMAS INICIAIS (inclui "Praia ao entardecer" usado no CT-05)
-- ----------------------------------------------------------------------------
INSERT INTO public.dream_themes (name, description, light_color, light_hex)
SELECT v.name, v.description, v.light_color, v.light_hex
FROM (
  VALUES
    (
      'Praia ao entardecer',
      'Ondas suaves, brisa morna e céu dourado conduzindo a um descanso profundo.',
      'dourado suave',
      '#F59E0B'
    ),
    (
      'Floresta serena',
      'Folhas ao vento, aroma de mata úmida e serenidade natural durante a noite.',
      'verde esmeralda',
      '#10B981'
    ),
    (
      'Céu estrelado',
      'Silêncio noturno sob constelações tranquilas para desacelerar a mente.',
      'azul índigo',
      '#6366F1'
    ),
    (
      'Aurora boreal',
      'Luzes dançantes no horizonte ártico com transição suave para o despertar.',
      'lilás',
      '#A855F7'
    )
) AS v(name, description, light_color, light_hex)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dream_themes dt WHERE lower(dt.name) = lower(v.name)
);
