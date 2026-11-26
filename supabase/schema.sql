-- ============================================================================
-- ONIRA — Travesseiro dos Sonhos (Dormire Tecnologia do Sono)
-- Schema completo e idempotente do banco de dados Supabase (PostgreSQL + RLS)
-- ============================================================================
-- Como executar:
-- 1. Acesse o painel do Supabase -> SQL Editor -> New Query
-- 2. Cole todo este arquivo e clique em "Run" (pode ser reexecutado com segurança)
-- 3. Em Authentication -> Providers -> Email, confirme que "Confirm email"
--    está desativado para login imediato em testes (CT-01/CT-02)
-- 4. Cadastre sua conta admin em /cadastro (ex.: admin@onira.com.br) e execute:
--      SELECT public.promote_to_admin('admin@onira.com.br');
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
  sleep_quality SMALLINT CHECK (sleep_quality IS NULL OR (sleep_quality BETWEEN 1 AND 5)),
  morning_notes TEXT,
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migração segura caso dream_nights já exista sem as colunas de avaliação matinal
ALTER TABLE public.dream_nights
  ADD COLUMN IF NOT EXISTS sleep_quality SMALLINT CHECK (sleep_quality IS NULL OR (sleep_quality BETWEEN 1 AND 5));
ALTER TABLE public.dream_nights
  ADD COLUMN IF NOT EXISTS morning_notes TEXT;

COMMENT ON TABLE public.dream_nights IS 'Noites programadas pelos usuários na página Roteiro do Sonho (RF05 / CT-05) com histórico e avaliação matinal.';

-- ----------------------------------------------------------------------------
-- 4. TABELA DE CONFIGURAÇÕES DO TRAVESSEIRO ONIRA (IoT / Preferências Reais)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_code TEXT NOT NULL DEFAULT 'ONR-2026-001' CHECK (char_length(trim(device_code)) >= 3),
  device_name TEXT NOT NULL DEFAULT 'Travesseiro ONIRA Principal' CHECK (char_length(trim(device_name)) >= 2),
  neopixel_brightness SMALLINT NOT NULL DEFAULT 65 CHECK (neopixel_brightness BETWEEN 10 AND 100),
  buzzer_volume SMALLINT NOT NULL DEFAULT 50 CHECK (buzzer_volume BETWEEN 0 AND 100),
  max_temp_celsius NUMERIC(4,1) NOT NULL DEFAULT 27.5 CHECK (max_temp_celsius BETWEEN 18.0 AND 36.0),
  auto_ventilation BOOLEAN NOT NULL DEFAULT TRUE,
  ldr_sensitivity TEXT NOT NULL DEFAULT 'Média' CHECK (ldr_sensitivity IN ('Baixa', 'Média', 'Alta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.device_settings IS 'Preferências reais do Travesseiro Inteligente ONIRA (NeoPixel, Buzzer, NTC, ventilação e LDR).';

CREATE INDEX IF NOT EXISTS idx_dream_nights_user_id ON public.dream_nights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_nights_theme_id ON public.dream_nights(theme_id);
CREATE INDEX IF NOT EXISTS idx_dream_themes_name ON public.dream_themes(name);

-- ----------------------------------------------------------------------------
-- 5. FUNÇÕES AUXILIARES & TRIGGERS
-- ----------------------------------------------------------------------------

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

DROP TRIGGER IF EXISTS trg_device_settings_updated_at ON public.device_settings;
CREATE TRIGGER trg_device_settings_updated_at
  BEFORE UPDATE ON public.device_settings
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

-- Restringe promote_to_admin apenas ao SQL Editor / service_role (nunca acessível via API pública)
REVOKE ALL ON FUNCTION public.promote_to_admin(TEXT) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) — SEGURANÇA NO BANCO DE DADOS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_nights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_settings ENABLE ROW LEVEL SECURITY;

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

-- Policies: device_settings
DROP POLICY IF EXISTS "device_settings_select_own_or_admin" ON public.device_settings;
CREATE POLICY "device_settings_select_own_or_admin"
  ON public.device_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "device_settings_insert_own" ON public.device_settings;
CREATE POLICY "device_settings_insert_own"
  ON public.device_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_settings_update_own" ON public.device_settings;
CREATE POLICY "device_settings_update_own"
  ON public.device_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. TEMAS INICIAIS (inclui "Praia ao entardecer" usado no CT-05)
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
