-- ============================================================================
-- ONIRA — Seed de Dados de Demonstração (Supabase SQL Editor)
-- Popula usuários reais no Auth + Profiles, Temas, Dispositivos e 65+ Noites
-- ============================================================================
-- Seguro para os Casos de Teste:
-- • NÃO cria aline.moraes@teste.com (reservado para CT-01 / CT-02)
-- • NÃO cria "Voo sobre montanhas" (reservado para CT-04)
-- • Mantém "Praia ao entardecer" (usado no CT-05)
-- • 100% idempotente: pode rodar mais de uma vez sem duplicar usuários/temas
-- ============================================================================

-- 1) TEMAS DE SONHO ADICIONAIS (total de 10 temas no catálogo)
INSERT INTO public.dream_themes (name, description, light_color, light_hex)
SELECT v.name, v.description, v.light_color, v.light_hex
FROM (
  VALUES
    (
      'Jardim de lavanda',
      'Campos aromáticos sob brisa calma da noite para aliviar a tensão do dia.',
      'lilás',
      '#C084FC'
    ),
    (
      'Chuva na cabana',
      'Gotas suaves no telhado de madeira e aconchego térmico durante todo o sono.',
      'âmbar quente',
      '#FB923C'
    ),
    (
      'Oceano bioluminescente',
      'Mar calmo iluminado por ondas azul-ciano conduzindo a sonhos tranquilos.',
      'ciano sereno',
      '#22D3EE'
    ),
    (
      'Vale das nuvens',
      'Sensação leve de flutuação acima das montanhas sob neblina prateada.',
      'branco lunar',
      '#E2E8F0'
    ),
    (
      'Templo zen ao luar',
      'Silêncio absoluto em jardim japonês com reflexo prateado na água.',
      'azul claro',
      '#38BDF8'
    ),
    (
      'Nebulosa violeta',
      'Viagem serena pelo espaço profundo com transições luminosas suaves.',
      'roxo profundo',
      '#8B5CF6'
    )
) AS v(name, description, light_color, light_hex)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dream_themes dt WHERE lower(dt.name) = lower(v.name)
);

-- 2) 18 USUÁRIOS DE DEMONSTRAÇÃO (com senha hash bcrypt: OniraDemo@123)
DO $$
DECLARE
  u RECORD;
  v_uid UUID;
  v_pass TEXT;
BEGIN
  PERFORM set_config('search_path', 'public, extensions, auth', true);
  v_pass := crypt('OniraDemo@123', gen_salt('bf'));
  FOR u IN
    SELECT * FROM (
      VALUES
        ('Luna Martins', 'luna.martins@onira-demo.com', '22:30', 22),
        ('Rafael Costa', 'rafael.costa@onira-demo.com', '23:00', 20),
        ('Ana Moreira', 'ana.moreira@onira-demo.com', '22:00', 19),
        ('Gabriel Silva', 'gabriel.silva@onira-demo.com', '23:30', 18),
        ('Camila Ferreira', 'camila.ferreira@onira-demo.com', '22:15', 16),
        ('Lucas Oliveira', 'lucas.oliveira@onira-demo.com', '23:45', 15),
        ('Beatriz Almeida', 'beatriz.almeida@onira-demo.com', '21:45', 14),
        ('Thiago Rocha', 'thiago.rocha@onira-demo.com', '00:00', 13),
        ('Mariana Souza', 'mariana.souza@onira-demo.com', '22:30', 12),
        ('Pedro Henrique', 'pedro.henrique@onira-demo.com', '23:15', 11),
        ('Juliana Mendes', 'juliana.mendes@onira-demo.com', '22:00', 10),
        ('Matheus Carvalho', 'matheus.carvalho@onira-demo.com', '23:30', 9),
        ('Larissa Ribeiro', 'larissa.ribeiro@onira-demo.com', '21:30', 8),
        ('Felipe Araújo', 'felipe.araujo@onira-demo.com', '23:00', 7),
        ('Isabela Duarte', 'isabela.duarte@onira-demo.com', '22:45', 6),
        ('Bruno Nascimento', 'bruno.nascimento@onira-demo.com', '00:15', 5),
        ('Fernanda Lima', 'fernanda.lima@onira-demo.com', '22:20', 3),
        ('Diego Barbosa', 'diego.barbosa@onira-demo.com', '23:10', 2)
    ) AS t(full_name, email, sleep_time, days_ago)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(u.email)) THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_uid,
        'authenticated',
        'authenticated',
        u.email,
        v_pass,
        NOW() - (u.days_ago || ' days')::INTERVAL,
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', u.full_name, 'habitual_sleep_time', u.sleep_time),
        NOW() - (u.days_ago || ' days')::INTERVAL,
        NOW() - (u.days_ago || ' days')::INTERVAL,
        '',
        '',
        '',
        ''
      );

      -- Ajusta a data de criação do profile criado pelo trigger
      UPDATE public.profiles
      SET created_at = NOW() - (u.days_ago || ' days')::INTERVAL
      WHERE id = v_uid;
    END IF;
  END LOOP;
END $$;

-- 3) 14 DISPOSITIVOS ONIRA CONFIGURADOS PARA OS USUÁRIOS DEMO
INSERT INTO public.device_settings (
  user_id,
  device_code,
  device_name,
  neopixel_brightness,
  buzzer_volume,
  max_temp_celsius,
  auto_ventilation,
  ldr_sensitivity
)
SELECT
  p.id,
  'ONR-2026-' || lpad((100 + row_number() OVER (ORDER BY p.created_at))::TEXT, 3, '0'),
  CASE (row_number() OVER (ORDER BY p.created_at)) % 4
    WHEN 0 THEN 'Suíte Principal'
    WHEN 1 THEN 'Quarto Casal'
    WHEN 2 THEN 'Travesseiro ONIRA Pro'
    ELSE 'Quarto Hóspedes'
  END,
  (45 + ((row_number() OVER (ORDER BY p.created_at) * 10) % 50))::SMALLINT,
  (30 + ((row_number() OVER (ORDER BY p.created_at) * 15) % 60))::SMALLINT,
  (25.5 + ((row_number() OVER (ORDER BY p.created_at) % 6) * 0.5))::NUMERIC(4,1),
  ((row_number() OVER (ORDER BY p.created_at)) % 5 <> 0),
  CASE (row_number() OVER (ORDER BY p.created_at)) % 3
    WHEN 0 THEN 'Alta'
    WHEN 1 THEN 'Média'
    ELSE 'Baixa'
  END
FROM public.profiles p
WHERE p.email LIKE '%@onira-demo.com'
  AND NOT EXISTS (SELECT 1 FROM public.device_settings ds WHERE ds.user_id = p.id)
LIMIT 14;

-- 4) 68 NOITES PROGRAMADAS DISTRIBUÍDAS NOS ÚLTIMOS 7 DIAS (gráficos e métricas cheias!)
DO $$
DECLARE
  v_existing INTEGER;
  v_users UUID[];
  v_theme_ids UUID[];
  v_theme_names TEXT[];
  v_theme_colors TEXT[];
  v_theme_hexes TEXT[];
  v_u_count INTEGER;
  v_t_count INTEGER;
  i INTEGER;
  v_day_offset INTEGER;
  v_u_idx INTEGER;
  v_t_idx INTEGER;
  v_dur NUMERIC(4,1);
  v_wake TEXT;
  v_status TEXT;
  v_quality SMALLINT;
  v_note TEXT;
  v_durations NUMERIC[] := ARRAY[6.0, 6.5, 7.0, 7.0, 7.5, 7.5, 8.0, 8.0, 8.5, 9.0];
  v_wakes TEXT[] := ARRAY['05:30', '06:00', '06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '08:00'];
  v_notes TEXT[] := ARRAY[
    'Acordei super disposto com a luz suave do amanhecer.',
    'Sono profundo a noite toda, sem despertar brusco.',
    'A cor da luz ajudou bastante a desacelerar antes de dormir.',
    'Despertar gradual muito agradável, zero susto.',
    'Noite excelente e temperatura super confortável.',
    NULL
  ];
BEGIN
  -- Evita duplicar se o seed de noites já foi rodado
  SELECT COUNT(*) INTO v_existing
  FROM public.dream_nights dn
  JOIN public.profiles p ON p.id = dn.user_id
  WHERE p.email LIKE '%@onira-demo.com';

  IF v_existing >= 40 THEN
    RAISE NOTICE 'Noites de demonstração já populadas (% registros).', v_existing;
    RETURN;
  END IF;

  SELECT array_agg(id ORDER BY created_at) INTO v_users
  FROM public.profiles
  WHERE email LIKE '%@onira-demo.com';

  SELECT
    array_agg(id ORDER BY name),
    array_agg(name ORDER BY name),
    array_agg(light_color ORDER BY name),
    array_agg(light_hex ORDER BY name)
  INTO v_theme_ids, v_theme_names, v_theme_colors, v_theme_hexes
  FROM public.dream_themes;

  v_u_count := COALESCE(array_length(v_users, 1), 0);
  v_t_count := COALESCE(array_length(v_theme_ids, 1), 0);

  IF v_u_count = 0 OR v_t_count = 0 THEN
    RETURN;
  END IF;

  -- Curva crescente ao longo dos últimos 7 dias (de 5 noites há 6 dias até 15 hoje)
  FOR i IN 1..68 LOOP
    IF i <= 5 THEN v_day_offset := 6;
    ELSIF i <= 12 THEN v_day_offset := 5;
    ELSIF i <= 21 THEN v_day_offset := 4;
    ELSIF i <= 31 THEN v_day_offset := 3;
    ELSIF i <= 42 THEN v_day_offset := 2;
    ELSIF i <= 54 THEN v_day_offset := 1;
    ELSE v_day_offset := 0;
    END IF;

    v_u_idx := 1 + ((i * 7) % v_u_count);
    -- Pesa levemente os primeiros temas para o gráfico donut ficar natural e variado
    v_t_idx := 1 + (((i * 3) + (i / 5)) % v_t_count);
    v_dur := v_durations[1 + (i % array_length(v_durations, 1))];
    v_wake := v_wakes[1 + ((i * 2) % array_length(v_wakes, 1))];

    IF v_day_offset = 0 THEN
      v_status := 'Programada';
      v_quality := NULL;
      v_note := NULL;
    ELSIF (i % 11) = 0 THEN
      v_status := 'Cancelada';
      v_quality := NULL;
      v_note := NULL;
    ELSE
      v_status := 'Concluída';
      v_quality := CASE WHEN (i % 4) = 0 THEN 4 ELSE 5 END;
      v_note := v_notes[1 + (i % array_length(v_notes, 1))];
    END IF;

    INSERT INTO public.dream_nights (
      user_id,
      theme_id,
      theme_name,
      theme_light_color,
      theme_light_hex,
      duration_hours,
      wake_up_time,
      status,
      sleep_quality,
      morning_notes,
      scheduled_for,
      created_at
    ) VALUES (
      v_users[v_u_idx],
      v_theme_ids[v_t_idx],
      v_theme_names[v_t_idx],
      v_theme_colors[v_t_idx],
      v_theme_hexes[v_t_idx],
      v_dur,
      v_wake,
      v_status,
      v_quality,
      v_note,
      (CURRENT_DATE - v_day_offset),
      NOW() - (v_day_offset || ' days')::INTERVAL - ((i % 10) || ' hours')::INTERVAL
    );
  END LOOP;
END $$;

-- Resumo rápido do que foi populado:
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_usuarios,
  (SELECT COUNT(*) FROM public.dream_themes) AS total_temas,
  (SELECT COUNT(*) FROM public.dream_nights) AS total_noites,
  (SELECT COUNT(*) FROM public.device_settings) AS total_dispositivos;
