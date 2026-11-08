-- ============================================================
-- SAGUNTO PADEL CUP
-- Migracion 2: esquema funcional de competicion
-- Requiere: 20261020130000_initial_schema.sql
-- BORRADOR: no ejecutar en Supabase hasta validar.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. JUGADORES Y HISTORIAL DE CATEGORIAS
-- ============================================================

CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    player_code TEXT UNIQUE,
    birth_date DATE,
    phone TEXT,
    city TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER players_set_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.player_category_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL
        REFERENCES public.categories(id) ON DELETE RESTRICT,
    subgroup_id UUID
        REFERENCES public.subgroups(id) ON DELETE RESTRICT,
    valid_from DATE NOT NULL,
    valid_to DATE,
    assigned_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT player_category_dates_valid
        CHECK (valid_to IS NULL OR valid_to >= valid_from),

    CONSTRAINT player_category_history_start_unique
        UNIQUE (player_id, valid_from)
);

CREATE INDEX player_category_history_current_idx
ON public.player_category_history (player_id, valid_to);


-- ============================================================
-- 2. CLUBES, SEDES Y PISTAS
-- ============================================================

CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    city TEXT,
    website_url TEXT,
    logo_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER clubs_set_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.event_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL
        REFERENCES public.events(id) ON DELETE CASCADE,
    club_id UUID
        REFERENCES public.clubs(id) ON DELETE SET NULL,
    venue_name TEXT NOT NULL,
    address TEXT,
    court_count INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT event_venues_court_count_valid
        CHECK (court_count IS NULL OR court_count > 0)
);

CREATE INDEX event_venues_event_idx
ON public.event_venues (event_id);


-- ============================================================
-- 3. PAREJAS E INTEGRANTES
-- Los jugadores pueden cambiar de pareja entre pruebas.
-- El historial anterior debe conservarse.
-- ============================================================

CREATE TABLE public.pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT,
    created_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);


CREATE TABLE public.pair_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID NOT NULL
        REFERENCES public.pairs(id) ON DELETE RESTRICT,
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pair_member_dates_valid
        CHECK (valid_to IS NULL OR valid_to >= valid_from),

    CONSTRAINT pair_member_unique_start
        UNIQUE (pair_id, player_id, valid_from)
);

CREATE INDEX pair_members_player_idx
ON public.pair_members (player_id);

CREATE INDEX pair_members_pair_idx
ON public.pair_members (pair_id);


-- ============================================================
-- 4. INSCRIPCIONES Y PARTICIPANTES
-- La organizacion debe validar todas las inscripciones.
-- ============================================================

CREATE TYPE public.registration_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'waitlisted',
    'cancelled',
    'withdrawn'
);


CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL
        REFERENCES public.events(id) ON DELETE RESTRICT,
    event_category_id UUID NOT NULL
        REFERENCES public.event_categories(id) ON DELETE RESTRICT,
    pair_id UUID NOT NULL
        REFERENCES public.pairs(id) ON DELETE RESTRICT,
    status public.registration_status NOT NULL DEFAULT 'pending',
    submitted_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_reason TEXT,
    waitlist_position INTEGER,
    seed_number INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT registrations_waitlist_position_valid
        CHECK (waitlist_position IS NULL OR waitlist_position > 0),

    CONSTRAINT registrations_seed_number_valid
        CHECK (seed_number IS NULL OR seed_number > 0),

    CONSTRAINT registrations_event_pair_category_unique
        UNIQUE (event_id, event_category_id, pair_id)
);

CREATE INDEX registrations_event_status_idx
ON public.registrations (event_id, status);

CREATE INDEX registrations_pair_idx
ON public.registrations (pair_id);

CREATE TRIGGER registrations_set_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.registration_players (
    registration_id UUID NOT NULL
        REFERENCES public.registrations(id) ON DELETE CASCADE,
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    slot SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (registration_id, player_id),

    CONSTRAINT registration_players_slot_valid
        CHECK (slot IN (1, 2)),

    CONSTRAINT registration_players_slot_unique
        UNIQUE (registration_id, slot)
);

CREATE INDEX registration_players_player_idx
ON public.registration_players (player_id);


-- ============================================================
-- 5. FASES, GRUPOS Y ASIGNACIONES
-- ============================================================

CREATE TYPE public.stage_type AS ENUM (
    'group',
    'round_robin',
    'round_of_32',
    'round_of_16',
    'quarter_final',
    'semi_final',
    'third_place',
    'final',
    'other'
);

CREATE TYPE public.match_status AS ENUM (
    'scheduled',
    'in_progress',
    'pending_validation',
    'validated',
    'cancelled',
    'walkover',
    'abandoned'
);

CREATE TYPE public.match_result_status AS ENUM (
    'draft',
    'submitted',
    'validated',
    'rejected',
    'superseded'
);


CREATE TABLE public.competition_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_category_id UUID NOT NULL
        REFERENCES public.event_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    stage_type public.stage_type NOT NULL DEFAULT 'other',
    stage_order INTEGER NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT competition_stages_order_valid
        CHECK (stage_order > 0),

    CONSTRAINT competition_stages_event_category_order_unique
        UNIQUE (event_category_id, stage_order)
);

CREATE TRIGGER competition_stages_set_updated_at
BEFORE UPDATE ON public.competition_stages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL
        REFERENCES public.competition_stages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    group_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT groups_order_valid
        CHECK (group_order > 0),

    CONSTRAINT groups_stage_name_unique
        UNIQUE (stage_id, name)
);


CREATE TABLE public.group_entries (
    group_id UUID NOT NULL
        REFERENCES public.groups(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    seed_number INTEGER,

    PRIMARY KEY (group_id, registration_id),

    CONSTRAINT group_entries_seed_valid
        CHECK (seed_number IS NULL OR seed_number > 0)
);


-- ============================================================
-- 6. PARTIDOS, SETS Y REVISIONES DE RESULTADOS
-- ============================================================

CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL
        REFERENCES public.competition_stages(id) ON DELETE RESTRICT,
    group_id UUID
        REFERENCES public.groups(id) ON DELETE RESTRICT,
    match_number INTEGER,
    round_label TEXT,
    registration_a_id UUID
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    registration_b_id UUID
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    winner_registration_id UUID
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    venue_id UUID
        REFERENCES public.event_venues(id) ON DELETE SET NULL,
    court_label TEXT,
    scheduled_at TIMESTAMPTZ,
    status public.match_status NOT NULL DEFAULT 'scheduled',
    result_status public.match_result_status NOT NULL DEFAULT 'draft',
    submitted_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    walkover_registration_id UUID
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT matches_distinct_registrations
        CHECK (
            registration_a_id IS NULL
            OR registration_b_id IS NULL
            OR registration_a_id <> registration_b_id
        ),

    CONSTRAINT matches_winner_is_participant
        CHECK (
            winner_registration_id IS NULL
            OR winner_registration_id = registration_a_id
            OR winner_registration_id = registration_b_id
        ),

    CONSTRAINT matches_walkover_is_participant
        CHECK (
            walkover_registration_id IS NULL
            OR walkover_registration_id = registration_a_id
            OR walkover_registration_id = registration_b_id
        ),

    CONSTRAINT matches_number_positive
        CHECK (match_number IS NULL OR match_number > 0)
);

CREATE INDEX matches_stage_schedule_idx
ON public.matches (stage_id, scheduled_at);

CREATE INDEX matches_status_idx
ON public.matches (status, result_status);

CREATE TRIGGER matches_set_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.match_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL
        REFERENCES public.matches(id) ON DELETE RESTRICT,
    set_number SMALLINT NOT NULL,
    games_a SMALLINT NOT NULL,
    games_b SMALLINT NOT NULL,
    tie_break_a SMALLINT,
    tie_break_b SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT match_sets_number_valid
        CHECK (set_number BETWEEN 1 AND 5),

    CONSTRAINT match_sets_games_valid
        CHECK (games_a >= 0 AND games_b >= 0),

    CONSTRAINT match_sets_tiebreak_valid
        CHECK (
            (tie_break_a IS NULL AND tie_break_b IS NULL)
            OR (
                tie_break_a IS NOT NULL
                AND tie_break_b IS NOT NULL
                AND tie_break_a >= 0
                AND tie_break_b >= 0
            )
        ),

    CONSTRAINT match_sets_unique_number
        UNIQUE (match_id, set_number)
);


CREATE TABLE public.match_result_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL
        REFERENCES public.matches(id) ON DELETE RESTRICT,
    revision_number INTEGER NOT NULL,
    previous_result JSONB,
    new_result JSONB NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    authorized_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT match_result_revisions_number_valid
        CHECK (revision_number > 0),

    CONSTRAINT match_result_revisions_unique
        UNIQUE (match_id, revision_number)
);


-- ============================================================
-- 7. REGLAS DE PUNTUACION VERSIONADAS
-- ============================================================

CREATE TABLE public.scoring_rule_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    description TEXT,
    effective_from DATE,
    effective_to DATE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT scoring_rule_sets_version_valid
        CHECK (version > 0),

    CONSTRAINT scoring_rule_sets_dates_valid
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        ),

    CONSTRAINT scoring_rule_sets_name_version_unique
        UNIQUE (name, version)
);


CREATE TABLE public.scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_set_id UUID NOT NULL
        REFERENCES public.scoring_rule_sets(id) ON DELETE RESTRICT,
    event_category_id UUID
        REFERENCES public.event_categories(id) ON DELETE RESTRICT,
    category_id UUID
        REFERENCES public.categories(id) ON DELETE RESTRICT,
    subgroup_id UUID
        REFERENCES public.subgroups(id) ON DELETE RESTRICT,
    placement INTEGER,
    points NUMERIC(10, 2) NOT NULL,
    condition_code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT scoring_rules_placement_valid
        CHECK (placement IS NULL OR placement > 0),

    CONSTRAINT scoring_rules_points_nonnegative
        CHECK (points >= 0)
);

CREATE INDEX scoring_rules_set_idx
ON public.scoring_rules (rule_set_id);


CREATE TABLE public.event_scoring_rules (
    event_id UUID PRIMARY KEY
        REFERENCES public.events(id) ON DELETE RESTRICT,
    rule_set_id UUID NOT NULL
        REFERENCES public.scoring_rule_sets(id) ON DELETE RESTRICT,
    assigned_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. LIBRO DE MOVIMIENTOS DE PUNTOS
-- El historial no debe borrarse.
-- ============================================================

CREATE TYPE public.point_transaction_type AS ENUM (
    'award',
    'reversal',
    'adjustment',
    'season_carryover',
    'season_expiry',
    'master_final'
);


CREATE TABLE public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    season_id UUID NOT NULL
        REFERENCES public.seasons(id) ON DELETE RESTRICT,
    event_id UUID
        REFERENCES public.events(id) ON DELETE RESTRICT,
    match_id UUID
        REFERENCES public.matches(id) ON DELETE RESTRICT,
    scoring_rule_id UUID
        REFERENCES public.scoring_rules(id) ON DELETE RESTRICT,
    registration_id UUID
        REFERENCES public.registrations(id) ON DELETE RESTRICT,
    transaction_type public.point_transaction_type NOT NULL,
    points NUMERIC(10, 2) NOT NULL,
    reverses_transaction_id UUID
        REFERENCES public.point_transactions(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL UNIQUE,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX point_transactions_player_season_idx
ON public.point_transactions (player_id, season_id);

CREATE INDEX point_transactions_event_idx
ON public.point_transactions (event_id);

CREATE INDEX point_transactions_match_idx
ON public.point_transactions (match_id);


CREATE TABLE public.point_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    season_id UUID NOT NULL
        REFERENCES public.seasons(id) ON DELETE RESTRICT,
    points NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    requested_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    transaction_id UUID
        REFERENCES public.point_transactions(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. SNAPSHOTS DEL RANKING Y CIERRE DE TEMPORADA 70/30
-- Redondeo al entero mas cercano.
-- Correcciones posteriores requieren autorizacion.
-- ============================================================

CREATE TABLE public.ranking_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL
        REFERENCES public.seasons(id) ON DELETE RESTRICT,
    snapshot_type TEXT NOT NULL,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    taken_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    source_closure_id UUID,
    notes TEXT,

    CONSTRAINT ranking_snapshots_type_valid
        CHECK (
            snapshot_type IN (
                'manual',
                'pre_close',
                'post_close',
                'master_final',
                'published'
            )
        ),

    CONSTRAINT ranking_snapshots_season_type_time_unique
        UNIQUE (season_id, snapshot_type, taken_at)
);


CREATE TABLE public.ranking_snapshot_entries (
    snapshot_id UUID NOT NULL
        REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT,
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    position INTEGER,
    total_points NUMERIC(12, 2) NOT NULL,
    retained_points NUMERIC(12, 2),
    discarded_points NUMERIC(12, 2),
    breakdown JSONB NOT NULL DEFAULT '{}'::JSONB,

    PRIMARY KEY (snapshot_id, player_id),

    CONSTRAINT ranking_snapshot_position_valid
        CHECK (position IS NULL OR position > 0),

    CONSTRAINT ranking_snapshot_points_valid
        CHECK (total_points >= 0)
);


CREATE TYPE public.season_closure_status AS ENUM (
    'prepared',
    'executed',
    'reversed'
);


CREATE TABLE public.season_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL UNIQUE
        REFERENCES public.seasons(id) ON DELETE RESTRICT,
    status public.season_closure_status NOT NULL DEFAULT 'prepared',
    retention_percent NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    expiry_percent NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    rounding_method TEXT NOT NULL DEFAULT 'nearest_integer',
    pre_close_snapshot_id UUID
        REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT,
    post_close_snapshot_id UUID
        REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT,
    formula_version TEXT NOT NULL DEFAULT '70-30-v1',
    prepared_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    executed_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    reversal_of UUID
        REFERENCES public.season_closures(id) ON DELETE RESTRICT,
    reversal_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT season_closures_percentages_valid
        CHECK (
            retention_percent >= 0
            AND expiry_percent >= 0
            AND retention_percent + expiry_percent = 100
        ),

    CONSTRAINT season_closures_rounding_valid
        CHECK (rounding_method = 'nearest_integer')
);


CREATE TABLE public.season_closure_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closure_id UUID NOT NULL
        REFERENCES public.season_closures(id) ON DELETE RESTRICT,
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    points_before NUMERIC(12, 2) NOT NULL,
    retained_points NUMERIC(12, 2) NOT NULL,
    discarded_points NUMERIC(12, 2) NOT NULL,
    points_after NUMERIC(12, 2) NOT NULL,
    source_snapshot_entry JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT season_closure_entries_player_unique
        UNIQUE (closure_id, player_id),

    CONSTRAINT season_closure_entries_points_valid
        CHECK (
            points_before >= 0
            AND retained_points >= 0
            AND discarded_points >= 0
            AND points_after >= 0
        )
);


ALTER TABLE public.ranking_snapshots
ADD CONSTRAINT ranking_snapshots_closure_fk
FOREIGN KEY (source_closure_id)
REFERENCES public.season_closures(id) ON DELETE RESTRICT;


-- ============================================================
-- 10. MASTER FINAL
-- La elegibilidad se basa en ranking y criterios aprobados.
-- ============================================================

CREATE TYPE public.master_candidate_status AS ENUM (
    'candidate',
    'confirmed',
    'reserve',
    'rejected',
    'withdrawn'
);


CREATE TABLE public.master_final_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_event_id UUID NOT NULL
        REFERENCES public.events(id) ON DELETE RESTRICT,
    player_id UUID NOT NULL
        REFERENCES public.players(id) ON DELETE RESTRICT,
    source_snapshot_id UUID
        REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT,
    ranking_position INTEGER,
    points_at_qualification NUMERIC(12, 2),
    status public.master_candidate_status NOT NULL DEFAULT 'candidate',
    decision_reason TEXT,
    decided_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT master_qualification_position_valid
        CHECK (ranking_position IS NULL OR ranking_position > 0),

    CONSTRAINT master_qualification_points_valid
        CHECK (
            points_at_qualification IS NULL
            OR points_at_qualification >= 0
        ),

    CONSTRAINT master_qualification_player_unique
        UNIQUE (master_event_id, player_id)
);


-- ============================================================
-- 11. PATROCINADORES, NOTICIAS, FAQ Y CONTACTO
-- ============================================================

CREATE TABLE public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER sponsors_set_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.event_sponsors (
    event_id UUID NOT NULL
        REFERENCES public.events(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL
        REFERENCES public.sponsors(id) ON DELETE RESTRICT,
    sponsorship_label TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (event_id, sponsor_id)
);


CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    body TEXT NOT NULL,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT news_status_valid
        CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TRIGGER news_set_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER faqs_set_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    handled_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT contact_messages_status_valid
        CHECK (
            status IN ('new', 'in_progress', 'answered', 'archived')
        )
);


CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'general',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_unread_idx
ON public.notifications (user_id, created_at DESC)
WHERE read_at IS NULL;


-- ============================================================
-- 12. AUDITORIA ADMINISTRATIVA
-- ============================================================

CREATE TABLE public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    before_data JSONB,
    after_data JSONB,
    reason TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_entity_idx
ON public.audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX audit_logs_actor_idx
ON public.audit_logs (actor_user_id, created_at DESC);


-- ============================================================
-- 13. ACTIVAR RLS EN LAS TABLAS NUEVAS
-- ============================================================

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_category_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_result_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_snapshot_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_closure_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_final_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 14. PERMISOS Y POLITICAS RLS
-- ============================================================

REVOKE ALL ON
    public.players,
    public.player_category_history,
    public.clubs,
    public.event_venues,
    public.pairs,
    public.pair_members,
    public.registrations,
    public.registration_players,
    public.competition_stages,
    public.groups,
    public.group_entries,
    public.matches,
    public.match_sets,
    public.match_result_revisions,
    public.scoring_rule_sets,
    public.scoring_rules,
    public.event_scoring_rules,
    public.point_transactions,
    public.point_adjustments,
    public.ranking_snapshots,
    public.ranking_snapshot_entries,
    public.season_closures,
    public.season_closure_entries,
    public.master_final_qualifications,
    public.sponsors,
    public.event_sponsors,
    public.news,
    public.faqs,
    public.contact_messages,
    public.notifications,
    public.audit_logs
FROM anon, authenticated;


-- Contenido publico: GRANT de lectura limitado por RLS.
GRANT SELECT ON
    public.clubs,
    public.sponsors,
    public.event_sponsors,
    public.news,
    public.faqs,
    public.matches,
    public.match_sets,
    public.ranking_snapshots,
    public.ranking_snapshot_entries
TO anon, authenticated;


-- No exponer la secuencia de auditoria.
REVOKE ALL ON SEQUENCE public.audit_logs_id_seq
FROM anon, authenticated;


-- Jugadores
CREATE POLICY "Admins manage players"
ON public.players
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage player category history"
ON public.player_category_history
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Clubes y sedes
CREATE POLICY "Public can view published clubs"
ON public.clubs
FOR SELECT TO anon, authenticated
USING (is_published = TRUE);


CREATE POLICY "Admins manage clubs"
ON public.clubs
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Public can view published event venues"
ON public.event_venues
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_venues.event_id
          AND e.status <> 'draft'
    )
);


CREATE POLICY "Admins manage event venues"
ON public.event_venues
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Parejas e inscripciones: solo administradores en este borrador.
CREATE POLICY "Admins manage pairs"
ON public.pairs
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage pair members"
ON public.pair_members
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage registrations"
ON public.registrations
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage registration players"
ON public.registration_players
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Fases y grupos
CREATE POLICY "Admins manage competition stages"
ON public.competition_stages
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage groups"
ON public.groups
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage group entries"
ON public.group_entries
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Partidos: solo resultados validados son publicos.
CREATE POLICY "Public can view published match results"
ON public.matches
FOR SELECT TO anon, authenticated
USING (
    result_status = 'validated'
    AND EXISTS (
        SELECT 1
        FROM public.events e
        JOIN public.event_categories ec ON ec.event_id = e.id
        JOIN public.competition_stages cs ON cs.event_category_id = ec.id
        WHERE cs.id = matches.stage_id
          AND e.status IN (
              'published',
              'registration_open',
              'registration_closed',
              'in_progress',
              'completed'
          )
    )
);


CREATE POLICY "Admins manage matches"
ON public.matches
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Public can view validated match sets"
ON public.match_sets
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.matches m
        WHERE m.id = match_sets.match_id
          AND m.result_status = 'validated'
    )
);


CREATE POLICY "Admins manage match sets"
ON public.match_sets
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage result revisions"
ON public.match_result_revisions
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Reglas de puntuacion
CREATE POLICY "Admins manage scoring rule sets"
ON public.scoring_rule_sets
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage scoring rules"
ON public.scoring_rules
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage event scoring rules"
ON public.event_scoring_rules
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Rankings publicados
CREATE POLICY "Public can view ranking snapshots"
ON public.ranking_snapshots
FOR SELECT TO anon, authenticated
USING (
    snapshot_type IN (
        'published',
        'pre_close',
        'post_close',
        'master_final'
    )
);


CREATE POLICY "Public can view ranking snapshot entries"
ON public.ranking_snapshot_entries
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.ranking_snapshots rs
        WHERE rs.id = ranking_snapshot_entries.snapshot_id
          AND rs.snapshot_type IN (
              'published',
              'pre_close',
              'post_close',
              'master_final'
          )
    )
);


CREATE POLICY "Admins manage ranking snapshots"
ON public.ranking_snapshots
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage ranking snapshot entries"
ON public.ranking_snapshot_entries
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Puntos, ajustes y cierres
CREATE POLICY "Admins manage point transactions"
ON public.point_transactions
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage point adjustments"
ON public.point_adjustments
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage season closures"
ON public.season_closures
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage season closure entries"
ON public.season_closure_entries
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Admins manage master qualifications"
ON public.master_final_qualifications
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Patrocinadores y contenidos
CREATE POLICY "Public can view published sponsors"
ON public.sponsors
FOR SELECT TO anon, authenticated
USING (is_published = TRUE);


CREATE POLICY "Admins manage sponsors"
ON public.sponsors
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Public can view published event sponsors"
ON public.event_sponsors
FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_sponsors.event_id
          AND e.status <> 'draft'
    )
    AND EXISTS (
        SELECT 1
        FROM public.sponsors s
        WHERE s.id = event_sponsors.sponsor_id
          AND s.is_published = TRUE
    )
);


CREATE POLICY "Admins manage event sponsors"
ON public.event_sponsors
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Public can view published news"
ON public.news
FOR SELECT TO anon, authenticated
USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
);


CREATE POLICY "Admins manage news"
ON public.news
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


CREATE POLICY "Public can view published faqs"
ON public.faqs
FOR SELECT TO anon, authenticated
USING (is_published = TRUE);


CREATE POLICY "Admins manage faqs"
ON public.faqs
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Mensajes de contacto: solo administradores pueden leerlos.
CREATE POLICY "Admins manage contact messages"
ON public.contact_messages
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Notificaciones privadas
CREATE POLICY "Users view own notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_role('admin'))
);


CREATE POLICY "Users update own notifications"
ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));


CREATE POLICY "Admins manage notifications"
ON public.notifications
FOR ALL TO authenticated
USING ((SELECT public.has_role('admin')))
WITH CHECK ((SELECT public.has_role('admin')));


-- Auditoria: sin politicas de actualizacion ni borrado para clientes.
CREATE POLICY "Admins read audit logs"
ON public.audit_logs
FOR SELECT TO authenticated
USING ((SELECT public.has_role('admin')));


CREATE POLICY "Admins insert audit logs"
ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.has_role('admin')));


-- ============================================================
-- 15. CONCESIONES SQL
-- Las politicas RLS siguen siendo obligatorias.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.players,
    public.player_category_history,
    public.clubs,
    public.event_venues,
    public.pairs,
    public.pair_members,
    public.registrations,
    public.registration_players,
    public.competition_stages,
    public.groups,
    public.group_entries,
    public.matches,
    public.match_sets,
    public.match_result_revisions,
    public.scoring_rule_sets,
    public.scoring_rules,
    public.event_scoring_rules,
    public.point_transactions,
    public.point_adjustments,
    public.ranking_snapshots,
    public.ranking_snapshot_entries,
    public.season_closures,
    public.season_closure_entries,
    public.master_final_qualifications,
    public.sponsors,
    public.event_sponsors,
    public.news,
    public.faqs,
    public.contact_messages,
    public.notifications
TO authenticated;


GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

GRANT SELECT ON
    public.players,
    public.registration_players,
    public.registrations,
    public.pairs,
    public.pair_members,
    public.point_transactions
TO authenticated;


COMMIT;