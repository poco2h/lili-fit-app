-- ============================================================================
-- Lili Fit / MindTwin — Esquema de Base de Datos Backend Oficial (v1.0)
-- B2B2C: Owners (profesionales) + Followers (clientes)
-- Incluye: Seguridad con claves, EGO ID, GUT ID, Hábitos (Microbiota vs Deportes),
-- Sesiones, Billing por Minutos Reales y Bolsa de Minutos No Utilizados.
-- ============================================================================

-- 1. CLAVES DE ACCESO PROFESIONAL (ONBOARDING OWNER)
CREATE TABLE IF NOT EXISTS professional_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  access_key VARCHAR(32) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '72 hours',
  used_at TIMESTAMPTZ,
  owner_id UUID
);

-- 2. OWNERS (PROFESIONALES)
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  especialidad TEXT NOT NULL,
  precio_follower_texto_min NUMERIC(6, 2) DEFAULT 0,
  margen_profesional_pct NUMERIC(4, 2) DEFAULT 0,
  nif TEXT,
  direccion_facturacion TEXT,
  stripe_conectado BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  twin_profile JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FOLLOWERS (CLIENTES)
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  twin_profile JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PERFILES TWIN (EGO ID, GUT ID, TALES, DEPORTES, AVATARES)
CREATE TABLE IF NOT EXISTS twin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES followers(id) ON DELETE CASCADE,
  ego_id JSONB DEFAULT '{}'::jsonb,           -- BFI-20, Enneagram, ECR-4, RFQ-6, TEIQue, VIA-24
  gut_data JSONB DEFAULT '{}'::jsonb,         -- GUT ID microbiota
  tales_weights JSONB DEFAULT '{}'::jsonb,    -- 9 lentes TALES
  sports_profile JSONB DEFAULT '{}'::jsonb,   -- Sesión 4 datos deportivos
  avatar_soul_id VARCHAR,                     -- Para vídeos RRSS (V3/V4)
  avatar_replica_id VARCHAR,                  -- Para videoconferencia RT (V1)
  voice_id VARCHAR,                           -- Voz clonada TTS
  heygen_avatar_id VARCHAR,                   -- Digital Twin HeyGen (entrenado a mano en heygen.com), añadida 2026-08-25
  heygen_voice_id VARCHAR,                    -- Voz del catálogo HeyGen (no ElevenLabs), añadida 2026-08-25
  fidelity_pct NUMERIC(4,1) DEFAULT 65.0,
  demo_twin JSONB DEFAULT '{}'::jsonb,         -- blob DemoTwin completo por owner (Mis Fuentes/Mi Cerebro/Onboarding), añadida 2026-08-20 vía SQL Editor
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. BOLSA DE MINUTOS (MINUTE WALLET)
CREATE TABLE IF NOT EXISTS follower_minute_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES followers(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  canal TEXT CHECK (canal IN ('texto', 'voz', 'video_rt')) NOT NULL,
  balance_seconds INT NOT NULL DEFAULT 0,
  total_purchased_seconds INT NOT NULL DEFAULT 0,
  total_consumed_seconds INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, owner_id, canal)
);

-- 6. TRANSACCIONES AUDITABLES DE LA BOLSA DE MINUTOS
CREATE TABLE IF NOT EXISTS minute_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES follower_minute_wallets(id) ON DELETE CASCADE,
  session_id UUID,
  type TEXT CHECK (type IN ('purchase', 'consumption', 'refund', 'adjustment')) NOT NULL,
  amount_seconds INT NOT NULL,
  balance_after_seconds INT NOT NULL,
  price_eur NUMERIC(8, 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SESIONES CON CONVERSACIÓN
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES followers(id) ON DELETE CASCADE,
  session_number SMALLINT, -- 1,2,3 = iniciales; 4 = deportiva; NULL = libre
  canal TEXT CHECK (canal IN ('texto', 'voz', 'video_rt')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'exhausted')) DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  elapsed_seconds INT NOT NULL DEFAULT 0,
  messages JSONB DEFAULT '[]'::jsonb
);

-- 8. BILLING POR SESIÓN — MINUTOS REALES
CREATE TABLE IF NOT EXISTS session_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id),
  follower_id UUID REFERENCES followers(id),
  canal TEXT CHECK (canal IN ('texto', 'voz', 'video_rt')) NOT NULL,
  selected_min SMALLINT NOT NULL,
  actual_min NUMERIC(6,2),
  seconds_deducted_from_wallet INT DEFAULT 0,
  unit_rate NUMERIC(6, 6) NOT NULL,
  professional_margin_pct NUMERIC(4, 2) DEFAULT 0,
  final_price_eur NUMERIC(8, 2),
  billing_status TEXT CHECK (billing_status IN ('pending', 'covered_by_wallet', 'charged', 'refunded', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  charged_at TIMESTAMPTZ
);

-- 9. HÁBITOS (MICROBIOTA VS DEPORTES)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES followers(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('microbiota', 'deportes')) NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AUTOEVALUACIONES SEMANALES
CREATE TABLE IF NOT EXISTS habit_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  category TEXT CHECK (category IN ('microbiota', 'deportes')) NOT NULL,
  week_date DATE NOT NULL,
  scores JSONB NOT NULL,
  voice_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. AGENDA SEMANAL GENERADA POR LLM
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT CHECK (category IN ('microbiota', 'deportes')) NOT NULL,
  week_start DATE NOT NULL,
  slot TEXT CHECK (slot IN ('manana', 'mediodia', 'tarde', 'noche')) NOT NULL,
  type TEXT NOT NULL, -- comida|suplemento|bacteria|actividad|receta|entreno
  title TEXT NOT NULL,
  description TEXT,
  duration_min SMALLINT,
  completed BOOLEAN DEFAULT false,
  note TEXT,
  generated_by TEXT DEFAULT 'llm',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. SNAPSHOTS GUT ID
CREATE TABLE IF NOT EXISTS gut_id_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. RECETAS POR MICROBIOMA (16 BACTERIAS Y NUTRIENTES)
CREATE TABLE IF NOT EXISTS bacterias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT CHECK (color IN ('turquesa', 'verde', 'amarilla', 'roja')) NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bacteria_nutriente (
  bacteria_id TEXT REFERENCES bacterias(id) ON DELETE CASCADE,
  nutriente_id TEXT REFERENCES nutrientes(id) ON DELETE CASCADE,
  intensidad SMALLINT CHECK (intensidad BETWEEN 1 AND 3) NOT NULL,
  PRIMARY KEY (bacteria_id, nutriente_id)
);

CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ingredientes JSONB NOT NULL,
  pasos JSONB NOT NULL,
  tiempo_min SMALLINT NOT NULL,
  porciones SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS receta_nutriente (
  receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
  nutriente_id TEXT REFERENCES nutrientes(id) ON DELETE CASCADE,
  PRIMARY KEY (receta_id, nutriente_id)
);

-- 13.5 VÍDEOS GENERADOS (galería persistente — antes se perdían al recargar)
CREATE TABLE IF NOT EXISTS generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  variante TEXT NOT NULL, -- v3 (hablar a cámara) / v4 (cuerpo en acción) / combo / heygen
  guion TEXT,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14.5. VISUAL COACH — columnas nuevas en tablas existentes (ya aplicadas en
-- Supabase vía ALTER TABLE, CREATE TABLE IF NOT EXISTS no las tocaría si la
-- tabla ya existe — ver visual_coach_events más abajo).
ALTER TABLE followers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE twin_profiles ADD COLUMN IF NOT EXISTS elevenlabs_agent_id VARCHAR;

-- 15. VISUAL COACH — EVENTOS DE FEEDBACK AUTOMÁTICO Y TRANSCRIPT DE SESIONES
-- twin_profiles.sports_profile (owner-level, follower_id IS NULL) guarda la
-- config del entrenador: { sport, knowledge_base, exercises: [{id, label,
-- joint_targets: {joint: [min, max]}}] }. Una sola tabla de eventos cubre
-- tanto el feedback automático (cada 8s, con ángulos) como el transcript de
-- preguntas/respuestas — evita crear 3 tablas separadas para el MVP.
CREATE TABLE IF NOT EXISTS visual_coach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES followers(id) ON DELETE CASCADE,
  session_billing_id UUID REFERENCES session_billing(id) ON DELETE SET NULL,
  event_type TEXT CHECK (event_type IN ('feedback_auto', 'qa_alumno', 'qa_coach')) NOT NULL,
  exercise TEXT,
  joint_angles JSONB,
  deviations JSONB,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visual_coach_events_owner_follower ON visual_coach_events(owner_id, follower_id, created_at);

-- 16. MINDTWIN GENERATOR — alta self-service multi-vertical (idiomas/fit/
-- wakeup/celeb, no solo Lili Fit). Reutiliza owners/followers/twin_profiles
-- y el sistema de bolsa de minutos ya existentes (follower_minute_wallets) en
-- vez de duplicar un modelo de "Purchase" paralelo — un pack comprado simplemente
-- añade segundos a la bolsa ya existente del follower.
ALTER TABLE owners ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS vertical TEXT NOT NULL DEFAULT 'fit';
-- El check se recrea siempre (no ADD COLUMN IF NOT EXISTS) porque la columna
-- ya existía antes de sustituir business/coach/custom por wakeup/celeb.
ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_vertical_check;
ALTER TABLE owners ADD CONSTRAINT owners_vertical_check
  CHECK (vertical IN ('fit', 'speak', 'wakeup', 'celeb'));
ALTER TABLE owners ADD COLUMN IF NOT EXISTS mindtwin_status TEXT NOT NULL DEFAULT 'active'
  CHECK (mindtwin_status IN ('pending', 'generating', 'active', 'suspended', 'error'));
ALTER TABLE owners ADD COLUMN IF NOT EXISTS mindtwin_error TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS mindscore INT NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS min_hourly_rate_cents INT NOT NULL DEFAULT 600;
-- Suscripción del owner a Poco2h (99€/mes) — DISTINTA de stripe_account_id
-- (esa es la cuenta Connect por la que el owner cobra a SUS alumnos).
ALTER TABLE owners ADD COLUMN IF NOT EXISTS generator_stripe_customer_id TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS generator_stripe_subscription_id TEXT;
-- Buscador público de profesionales (src/app/clientes/buscar) — antes usaba un
-- array hardcodeado de 4 profesionales de ejemplo, nunca a los owners reales.
ALTER TABLE owners ADD COLUMN IF NOT EXISTS ciudad TEXT;

CREATE TABLE IF NOT EXISTS packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  hours NUMERIC(5, 2) NOT NULL,
  price_cents INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packs_owner ON packs(owner_id);

-- Registro de cada compra de pack (Stripe Checkout de pago único) — historial e
-- ingresos del owner ("Ingresos este mes: €284"). El efecto real (añadir tiempo)
-- se aplica sobre follower_minute_wallets/minute_wallet_transactions ya existentes.
CREATE TABLE IF NOT EXISTS pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES followers(id) ON DELETE SET NULL,
  pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
  follower_email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INT NOT NULL,
  seconds_granted INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_owner ON pack_purchases(owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_visual_coach_events_owner_exercise ON visual_coach_events(owner_id, exercise);

-- 16. ROW LEVEL SECURITY (RLS) — REGLAS ESTRICTAS DE PRIVACIDAD
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_minute_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE minute_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_coach_events ENABLE ROW LEVEL SECURITY;

-- 17. PLANTILLAS DE MODELO POR VERTICAL (clonado real, sin IA)
-- Antes cada MindTwin nuevo recibía un system_prompt distinto, redactado
-- desde cero por Gemini en el alta — nunca una copia real de nada. Esta
-- tabla guarda UN prompt de referencia por vertical (editable aquí sin
-- redeploy) con placeholders {{nombre}}/{{especialidad}}; el alta ahora
-- sustituye esos placeholders y usa el resultado tal cual — copia exacta
-- del original, solo con el nombre y la especialidad del profesional.
CREATE TABLE IF NOT EXISTS vertical_templates (
  vertical TEXT PRIMARY KEY CHECK (vertical IN ('fit', 'speak', 'wakeup', 'celeb')),
  system_prompt_template TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE vertical_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vertical_templates_read ON vertical_templates;
CREATE POLICY vertical_templates_read ON vertical_templates FOR SELECT USING (true);

INSERT INTO vertical_templates (vertical, system_prompt_template) VALUES
('fit', 'Soy {{nombre}}, tu MindTwin de entrenamiento y nutrición. Especialidad: {{especialidad}}. Hablo en español, en 2-3 frases, con tono cercano, directo y motivador — nunca genérico. Reviso lo que me cuentas sobre tu entrenamiento, alimentación o cómo te encuentras, y te doy un consejo concreto y aplicable ya, con el mismo criterio que aplicaría en una sesión presencial. Corrijo con firmeza pero sin dureza, y refuerzo cuando algo va bien. Nunca menciono precios ni tarifas. Cierro cada sesión proponiendo un siguiente paso concreto para la próxima vez.'),
('speak', 'Soy {{nombre}}, tu MindTwin de idiomas. Especialidad: {{especialidad}}. Hablo en español (o en el idioma que estemos practicando si el alumno lo pide), en 2-3 frases, con tono cercano y profesional. Corrijo errores de gramática o vocabulario en el momento, explicando el porqué en una frase, y propongo ejercicios breves de conversación adaptados al nivel del alumno. Refuerzo lo que ya hace bien antes de corregir. Nunca menciono precios ni tarifas. Cierro cada sesión con una frase o expresión nueva para practicar antes de la próxima vez.'),
('wakeup', 'Soy {{nombre}}, tu MindTwin de motivación y rutinas. Especialidad: {{especialidad}}. Hablo en español, en 2-3 frases, con tono enérgico, cercano y sin sermones. Ayudo a construir y mantener hábitos concretos (rutina matutina, constancia, energía del día), preguntando cómo ha ido el día anterior y proponiendo un ajuste pequeño y realista para hoy. Celebro los avances, por pequeños que sean, y no juzgo los días flojos. Nunca menciono precios ni tarifas. Cierro cada sesión con un único compromiso claro para mañana.'),
('celeb', 'Soy {{nombre}}, tu MindTwin. Especialidad: {{especialidad}}. Hablo en español, en 2-3 frases, con el tono cercano y auténtico que me caracteriza, como si estuviéramos charlando directamente. Respondo preguntas sobre mi trabajo, mi trayectoria y mi punto de vista con mi propio criterio y estilo, sin sonar a comunicado de prensa. Nunca menciono precios ni tarifas. Cierro cada conversación invitando a seguir hablando de lo que de verdad le interesa a la persona.')
ON CONFLICT (vertical) DO NOTHING;
