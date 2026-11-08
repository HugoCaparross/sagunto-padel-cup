SET local check_function_bodies = off;

CREATE TABLE "public"."app_settings" (
  "key"        text                     NOT NULL,
  "value"      jsonb                    NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_by" uuid,
  CONSTRAINT "app_settings_key_check" CHECK ((key ~ '^[a-z_]+$'::text)),
  CONSTRAINT "app_settings_pkey" PRIMARY KEY (key)
);

ALTER TABLE "public"."app_settings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audit_logs" (
  "id"            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "actor_user_id" uuid,
  "action"        text                     NOT NULL,
  "entity_table"  text                     NOT NULL,
  "entity_id"     text,
  "old_values"    jsonb,
  "new_values"    jsonb,
  "reason"        text,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bracket_entries" (
  "registration_id" uuid    NOT NULL,
  "stage_id"        uuid    NOT NULL,
  "seed"            integer NOT NULL,
  CONSTRAINT "bracket_entries_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "bracket_entries_seed_check" CHECK ((seed > 0)),
  CONSTRAINT "bracket_entries_stage_id_seed_key" UNIQUE (stage_id, seed)
);

ALTER TABLE "public"."bracket_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bracket_matches" (
  "match_id" uuid    NOT NULL,
  "stage_id" uuid    NOT NULL,
  "round_no" integer NOT NULL,
  "pos"      integer NOT NULL,
  "teams"    integer NOT NULL,
  CONSTRAINT "bracket_matches_pkey" PRIMARY KEY (match_id),
  CONSTRAINT "bracket_matches_pos_check" CHECK ((pos > 0)),
  CONSTRAINT "bracket_matches_round_no_check" CHECK ((round_no > 0)),
  CONSTRAINT "bracket_matches_stage_id_round_no_pos_key" UNIQUE (stage_id, round_no, pos),
  CONSTRAINT "bracket_matches_teams_check" CHECK ((teams >= 2))
);

ALTER TABLE "public"."bracket_matches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bracket_stages" (
  "stage_id"     uuid                     NOT NULL,
  "event_id"     uuid                     NOT NULL,
  "category_id"  uuid                     NOT NULL,
  "subgroup_id"  uuid                     NOT NULL,
  "size"         integer,
  "generated_at" timestamp with time zone,
  CONSTRAINT "bracket_stages_event_id_category_id_subgroup_id_key" UNIQUE (event_id, category_id, subgroup_id),
  CONSTRAINT "bracket_stages_pkey" PRIMARY KEY (stage_id)
);

ALTER TABLE "public"."bracket_stages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "code"          text                     NOT NULL,
  "name"          text                     NOT NULL,
  "display_order" integer                  NOT NULL,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "categories_code_key" UNIQUE (code),
  CONSTRAINT "categories_display_order_key" UNIQUE (display_order),
  CONSTRAINT "categories_name_key" UNIQUE (name),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."clubs" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"          text                     NOT NULL,
  "slug"          text                     NOT NULL,
  "description"   text,
  "logo_url"      text,
  "website_url"   text,
  "address"       text,
  "city"          text,
  "is_organizer"  boolean                  NOT NULL DEFAULT false,
  "is_published"  boolean                  NOT NULL DEFAULT false,
  "display_order" integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "clubs_name_key" UNIQUE (name),
  CONSTRAINT "clubs_pkey" PRIMARY KEY (id),
  CONSTRAINT "clubs_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."clubs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."competition_groups" (
  "id"            uuid    NOT NULL DEFAULT gen_random_uuid(),
  "stage_id"      uuid    NOT NULL,
  "name"          text    NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "competition_groups_pkey" PRIMARY KEY (id),
  CONSTRAINT "competition_groups_stage_id_name_key" UNIQUE (stage_id, name)
);

ALTER TABLE "public"."competition_groups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."competition_stages" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "event_category_id" uuid                     NOT NULL,
  "name"              text                     NOT NULL,
  "stage_type"        text                     NOT NULL DEFAULT 'other'::text,
  "stage_order"       integer                  NOT NULL DEFAULT 1,
  "status"            text                     NOT NULL DEFAULT 'draft'::text,
  "rules_json"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "competition_stages_event_category_id_stage_order_key" UNIQUE (event_category_id, stage_order),
  CONSTRAINT "competition_stages_pkey" PRIMARY KEY (id),
  CONSTRAINT "competition_stages_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);

ALTER TABLE "public"."competition_stages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contact_messages" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"           text                     NOT NULL,
  "email"          text                     NOT NULL,
  "subject"        text,
  "message"        text                     NOT NULL,
  "status"         text                     NOT NULL DEFAULT 'new'::text,
  "internal_notes" text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "contact_messages_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'in_progress'::text, 'answered'::text, 'closed'::text, 'spam'::text])))
);

ALTER TABLE "public"."contact_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_categories" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "event_id"    uuid    NOT NULL,
  "category_id" uuid    NOT NULL,
  "subgroup_id" uuid,
  "capacity"    integer,
  CONSTRAINT "event_categories_capacity_check" CHECK (((capacity IS NULL) OR (capacity > 0))),
  CONSTRAINT "event_categories_event_id_category_id_subgroup_id_key" UNIQUE (event_id, category_id, subgroup_id),
  CONSTRAINT "event_categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."event_categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_organizers" (
  "event_id"       uuid    NOT NULL,
  "club_id"        uuid    NOT NULL,
  "organizer_role" text    NOT NULL DEFAULT 'organizer'::text,
  "display_order"  integer NOT NULL DEFAULT 0,
  CONSTRAINT "event_organizers_organizer_role_check" CHECK ((organizer_role = ANY (ARRAY['main_organizer'::text, 'organizer'::text, 'venue'::text, 'collaborator'::text]))),
  CONSTRAINT "event_organizers_pkey" PRIMARY KEY (event_id, club_id)
);

ALTER TABLE "public"."event_organizers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_point_batches" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "event_id"        uuid                     NOT NULL,
  "version"         integer                  NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'active'::text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"      uuid,
  "reverted_at"     timestamp with time zone,
  "reverted_by"     uuid,
  "reverted_reason" text,
  CONSTRAINT "event_point_batches_event_id_version_key" UNIQUE (event_id, VERSION),
  CONSTRAINT "event_point_batches_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_point_batches_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'reverted'::text]))),
  CONSTRAINT "event_point_batches_version_check" CHECK ((version > 0))
);

ALTER TABLE "public"."event_point_batches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_scoring_rules" (
  "event_category_id" uuid                     NOT NULL,
  "rule_set_id"       uuid                     NOT NULL,
  "assigned_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "assigned_by"       uuid,
  CONSTRAINT "event_scoring_rules_pkey" PRIMARY KEY (event_category_id)
);

ALTER TABLE "public"."event_scoring_rules"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_sponsors" (
  "event_id"      uuid    NOT NULL,
  "sponsor_id"    uuid    NOT NULL,
  "placement"     text,
  "display_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "event_sponsors_pkey" PRIMARY KEY (event_id, sponsor_id)
);

ALTER TABLE "public"."event_sponsors"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_venues" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "address"    text,
  "city"       text,
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "event_venues_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."event_venues"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."events" (
  "id"           uuid     NOT NULL DEFAULT gen_random_uuid(),
  "season_id"    uuid     NOT NULL,
  "event_number" smallint,
  CONSTRAINT "events_event_number_check" CHECK (((event_number IS NULL) OR ((event_number >= 1) AND (event_number <= 6)))),
  CONSTRAINT "events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."faqs" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "category"        text,
  "question"        text                     NOT NULL,
  "answer_markdown" text                     NOT NULL,
  "display_order"   integer                  NOT NULL DEFAULT 0,
  "is_published"    boolean                  NOT NULL DEFAULT false,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "faqs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."faqs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."group_entries" (
  "id"              bigint  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "group_id"        uuid    NOT NULL,
  "registration_id" uuid    NOT NULL,
  "seed_number"     integer,
  CONSTRAINT "group_entries_group_id_registration_id_key" UNIQUE (group_id, registration_id),
  CONSTRAINT "group_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_entries_seed_number_check" CHECK (((seed_number IS NULL) OR (seed_number > 0)))
);

ALTER TABLE "public"."group_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."incidents" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"           text                     NOT NULL,
  "description"     text,
  "severity"        text                     NOT NULL DEFAULT 'medium'::text,
  "status"          text                     NOT NULL DEFAULT 'open'::text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"      uuid,
  "resolved_at"     timestamp with time zone,
  "resolved_by"     uuid,
  "resolution_note" text,
  CONSTRAINT "incidents_check" CHECK (((status <> 'resolved'::text) OR ((resolved_at IS NOT NULL) AND (resolution_note IS
    NOT NULL) AND (length(TRIM(BOTH FROM resolution_note)) >= 5)))),
  CONSTRAINT "incidents_pkey" PRIMARY KEY (id),
  CONSTRAINT "incidents_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "incidents_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text]))),
  CONSTRAINT "incidents_title_check" CHECK (((length(title) >= 5) AND (length(title) <= 140)))
);

ALTER TABLE "public"."incidents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."master_final_qualifications" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "season_id"            uuid                     NOT NULL,
  "event_id"             uuid                     NOT NULL,
  "player_id"            uuid                     NOT NULL,
  "ranking_position"     integer,
  "eligibility_status"   text                     NOT NULL DEFAULT 'candidate'::text,
  "qualification_reason" text,
  "confirmed_by"         uuid,
  "confirmed_at"         timestamp with time zone,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "master_final_qualifications_eligibility_status_check"
    CHECK ((eligibility_status = ANY (ARRAY['candidate'::text, 'eligible'::text, 'confirmed'::text, 'declined'::text, 'ineligible'::text, 'waitlist'::text]))),
  CONSTRAINT "master_final_qualifications_event_id_player_id_key" UNIQUE (event_id, player_id),
  CONSTRAINT "master_final_qualifications_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."master_final_qualifications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."master_final_results" (
  "registration_id" uuid                     NOT NULL,
  "event_id"        uuid                     NOT NULL,
  "placement"       integer                  NOT NULL,
  "set_by"          uuid,
  "set_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "master_final_results_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "master_final_results_placement_check" CHECK ((placement = ANY (ARRAY[1, 2, 3, 5, 9, 17])))
);

ALTER TABLE "public"."master_final_results"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_result_revisions" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "match_id"        uuid                     NOT NULL,
  "revision_number" integer                  NOT NULL,
  "previous_result" jsonb,
  "new_result"      jsonb                    NOT NULL,
  "reason"          text                     NOT NULL,
  "changed_by"      uuid,
  "changed_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "match_result_revisions_match_id_revision_number_key" UNIQUE (match_id, revision_number),
  CONSTRAINT "match_result_revisions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."match_result_revisions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."match_sets" (
  "id"          bigint   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "match_id"    uuid     NOT NULL,
  "set_number"  smallint NOT NULL,
  "score_a"     smallint NOT NULL,
  "score_b"     smallint NOT NULL,
  "tie_break_a" smallint,
  "tie_break_b" smallint,
  CONSTRAINT "match_sets_check" CHECK ((((tie_break_a IS NULL) AND (tie_break_b IS NULL)) OR ((tie_break_a IS NOT NULL) AND (tie_break_b IS
    NOT NULL) AND (tie_break_a >= 0) AND (tie_break_b >= 0)))),
  CONSTRAINT "match_sets_match_id_set_number_key" UNIQUE (match_id, set_number),
  CONSTRAINT "match_sets_pkey" PRIMARY KEY (id),
  CONSTRAINT "match_sets_score_a_check" CHECK ((score_a >= 0)),
  CONSTRAINT "match_sets_score_b_check" CHECK ((score_b >= 0)),
  CONSTRAINT "match_sets_set_number_check" CHECK (((set_number >= 1) AND (set_number <= 5)))
);

ALTER TABLE "public"."match_sets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."matches" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "stage_id"          uuid                     NOT NULL,
  "group_id"          uuid,
  "match_number"      text,
  "round_name"        text,
  "registration_a_id" uuid,
  "registration_b_id" uuid,
  "scheduled_at"      timestamp with time zone,
  "venue_id"          uuid,
  "court_name"        text,
  CONSTRAINT "matches_check" CHECK (((registration_a_id IS NULL) OR (registration_b_id IS NULL) OR (registration_a_id <> registration_b_id))),
  CONSTRAINT "matches_pkey" PRIMARY KEY (id),
  CONSTRAINT "matches_stage_id_match_number_key" UNIQUE (stage_id, match_number)
);

ALTER TABLE "public"."matches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."news" (
  "id"              uuid NOT NULL DEFAULT gen_random_uuid(),
  "title"           text NOT NULL,
  "slug"            text NOT NULL,
  "excerpt"         text,
  "body_markdown"   text NOT NULL,
  "cover_image_url" text,
  CONSTRAINT "news_pkey" PRIMARY KEY (id),
  CONSTRAINT "news_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."news"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"           uuid                     NOT NULL,
  "title"             text                     NOT NULL,
  "body"              text                     NOT NULL,
  "notification_type" text                     NOT NULL DEFAULT 'general'::text,
  "target_url"        text,
  "deduplication_key" text,
  "read_at"           timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "metadata"          jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "notifications_user_id_deduplication_key_key" UNIQUE (user_id, deduplication_key)
);

ALTER TABLE "public"."notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."pair_members" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "pair_id"    uuid                     NOT NULL,
  "player_id"  uuid                     NOT NULL,
  "valid_from" date                     NOT NULL DEFAULT CURRENT_DATE,
  "valid_to"   date,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "pair_members_check" CHECK (((valid_to IS NULL) OR (valid_to >= valid_from))),
  CONSTRAINT "pair_members_pair_id_player_id_valid_from_key" UNIQUE (pair_id, player_id, valid_from),
  CONSTRAINT "pair_members_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."pair_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."pairs" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "display_name" text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"   uuid,
  CONSTRAINT "pairs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."pairs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."player_category_history" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "player_id"   uuid                     NOT NULL,
  "category_id" uuid                     NOT NULL,
  "subgroup_id" uuid,
  "valid_from"  date                     NOT NULL,
  "valid_to"    date,
  "reason"      text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"  uuid,
  CONSTRAINT "player_category_history_check" CHECK (((valid_to IS NULL) OR (valid_to >= valid_from))),
  CONSTRAINT "player_category_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."player_category_history"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."players" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "profile_id"       uuid,
  "player_code"      text,
  "display_name"     text                     NOT NULL,
  "public_photo_url" text,
  "public_bio"       text,
  "public_profile"   boolean                  NOT NULL DEFAULT false,
  "status"           text                     NOT NULL DEFAULT 'active'::text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"       uuid,
  CONSTRAINT "players_pkey" PRIMARY KEY (id),
  CONSTRAINT "players_player_code_key" UNIQUE (player_code),
  CONSTRAINT "players_profile_id_key" UNIQUE (profile_id),
  CONSTRAINT "players_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'retired'::text])))
);

ALTER TABLE "public"."players"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."point_adjustments" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "player_id"      uuid                     NOT NULL,
  "season_id"      uuid                     NOT NULL,
  "points"         numeric(10,2)            NOT NULL,
  "reason"         text                     NOT NULL,
  "status"         text                     NOT NULL DEFAULT 'pending'::text,
  "requested_by"   uuid,
  "reviewed_by"    uuid,
  "reviewed_at"    timestamp with time zone,
  "transaction_id" uuid,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "point_adjustments_pkey" PRIMARY KEY (id),
  CONSTRAINT "point_adjustments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'reversed'::text])))
);

ALTER TABLE "public"."point_adjustments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."point_transactions" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "player_id"               uuid                     NOT NULL,
  "season_id"               uuid                     NOT NULL,
  "event_id"                uuid,
  "registration_id"         uuid,
  "match_id"                uuid,
  "scoring_rule_id"         uuid,
  "transaction_type"        text                     NOT NULL,
  "points"                  numeric(10,2)            NOT NULL,
  "idempotency_key"         text,
  "reverses_transaction_id" uuid,
  "reason"                  text,
  "metadata"                jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "created_by"              uuid,
  CONSTRAINT "point_transactions_idempotency_key_key" UNIQUE (idempotency_key),
  CONSTRAINT "point_transactions_pkey" PRIMARY KEY (id),
  CONSTRAINT "point_transactions_transaction_type_check"
    CHECK ((transaction_type = ANY (ARRAY['match_award'::text, 'manual_adjustment'::text, 'season_carryover'::text, 'reversal'::text, 'correction'::text])))
);

ALTER TABLE "public"."point_transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text,
  "avatar_url"   text,
  "bio"          text,
  "is_public"    boolean                  NOT NULL DEFAULT false,
  "is_active"    boolean                  NOT NULL DEFAULT true,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ranking_snapshot_entries" (
  "id"                  bigint        GENERATED ALWAYS AS IDENTITY NOT NULL,
  "snapshot_id"         uuid          NOT NULL,
  "player_id"           uuid          NOT NULL,
  "position"            integer,
  "points"              numeric(10,2) NOT NULL DEFAULT 0,
  "category_id"         uuid,
  "subgroup_id"         uuid,
  "events_played"       integer       NOT NULL DEFAULT 0,
  "wins"                integer       NOT NULL DEFAULT 0,
  "losses"              integer       NOT NULL DEFAULT 0,
  "points_before_close" numeric(10,2),
  "points_carried"      numeric(10,2),
  CONSTRAINT "ranking_snapshot_entries_events_played_check" CHECK ((events_played >= 0)),
  CONSTRAINT "ranking_snapshot_entries_losses_check" CHECK ((losses >= 0)),
  CONSTRAINT "ranking_snapshot_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "ranking_snapshot_entries_position_check" CHECK ((("position" IS NULL) OR ("position" > 0))),
  CONSTRAINT "ranking_snapshot_entries_snapshot_id_player_id_key" UNIQUE (snapshot_id, player_id),
  CONSTRAINT "ranking_snapshot_entries_wins_check" CHECK ((wins >= 0))
);

ALTER TABLE "public"."ranking_snapshot_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ranking_snapshots" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "season_id"     uuid                     NOT NULL,
  "snapshot_type" text                     NOT NULL,
  "as_of"         timestamp with time zone NOT NULL DEFAULT now(),
  "is_public"     boolean                  NOT NULL DEFAULT false,
  "metadata"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_by"    uuid,
  CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY (id),
  CONSTRAINT "ranking_snapshots_snapshot_type_check"
    CHECK ((snapshot_type = ANY (ARRAY['live'::text, 'pre_close'::text, 'post_close'::text, 'master_final'::text, 'published'::text])))
);

ALTER TABLE "public"."ranking_snapshots"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."registration_players" (
  "id"              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "registration_id" uuid                     NOT NULL,
  "player_id"       uuid                     NOT NULL,
  "player_order"    smallint                 NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "registration_players_pkey" PRIMARY KEY (id),
  CONSTRAINT "registration_players_player_order_check" CHECK ((player_order = ANY (ARRAY[1, 2]))),
  CONSTRAINT "registration_players_registration_id_player_id_key" UNIQUE (registration_id, player_id),
  CONSTRAINT "registration_players_registration_id_player_order_key" UNIQUE (registration_id, player_order)
);

ALTER TABLE "public"."registration_players"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."registration_results" (
  "registration_id" uuid                     NOT NULL,
  "event_id"        uuid                     NOT NULL,
  "subgroup_id"     uuid                     NOT NULL,
  "placement"       integer                  NOT NULL,
  "set_by"          uuid,
  "set_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "registration_results_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registration_results_placement_check" CHECK ((placement = ANY (ARRAY[1, 2, 3, 5, 9, 17, 33])))
);

ALTER TABLE "public"."registration_results"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."registration_status_history" (
  "id"              bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "registration_id" uuid   NOT NULL,
  CONSTRAINT "registration_status_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."registration_status_history"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."registrations" (
  "id"                uuid NOT NULL DEFAULT gen_random_uuid(),
  "event_id"          uuid NOT NULL,
  "event_category_id" uuid NOT NULL,
  "pair_id"           uuid,
  CONSTRAINT "registrations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."registrations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."scoring_rule_sets" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"        text NOT NULL,
  "version"     text NOT NULL,
  "description" text,
  CONSTRAINT "scoring_rule_sets_name_version_key" UNIQUE (name, VERSION),
  CONSTRAINT "scoring_rule_sets_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."scoring_rule_sets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."scoring_rules" (
  "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
  "rule_set_id" uuid          NOT NULL,
  "category_id" uuid,
  "subgroup_id" uuid,
  "placement"   integer       NOT NULL,
  "points"      numeric(10,2) NOT NULL,
  CONSTRAINT "scoring_rules_pkey" PRIMARY KEY (id),
  CONSTRAINT "scoring_rules_placement_check" CHECK ((placement > 0)),
  CONSTRAINT "scoring_rules_points_check" CHECK ((points >= (0)::numeric)),
  CONSTRAINT "scoring_rules_rule_set_id_category_id_subgroup_id_placement_key" UNIQUE (rule_set_id, category_id, subgroup_id, placement)
);

ALTER TABLE "public"."scoring_rules"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."season_closure_entries" (
  "id"               bigint        GENERATED ALWAYS AS IDENTITY NOT NULL,
  "closure_id"       uuid          NOT NULL,
  "player_id"        uuid          NOT NULL,
  "points_before"    numeric(10,2) NOT NULL,
  "points_carried"   numeric(10,2) NOT NULL,
  "points_discarded" numeric(10,2) NOT NULL,
  "points_after"     numeric(10,2) NOT NULL,
  "calculation"      jsonb         NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "season_closure_entries_closure_id_player_id_key" UNIQUE (closure_id, player_id),
  CONSTRAINT "season_closure_entries_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."season_closure_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."season_closures" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "season_id"              uuid                     NOT NULL,
  "revision_number"        integer                  NOT NULL DEFAULT 1,
  "status"                 text                     NOT NULL DEFAULT 'draft'::text,
  "carryover_percentage"   numeric(5,2)             NOT NULL,
  "discarded_percentage"   numeric(5,2)             NOT NULL,
  "rounding_method"        text                     NOT NULL,
  "pre_close_snapshot_id"  uuid,
  "post_close_snapshot_id" uuid,
  "supersedes_closure_id"  uuid,
  "started_at"             timestamp with time zone,
  "completed_at"           timestamp with time zone,
  "executed_by"            uuid,
  "notes"                  text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "season_closures_carryover_percentage_check" CHECK (((carryover_percentage >= (0)::numeric) AND (carryover_percentage <= (100)::numeric))),
  CONSTRAINT "season_closures_check" CHECK (((carryover_percentage + discarded_percentage) = (100)::numeric)),
  CONSTRAINT "season_closures_discarded_percentage_check" CHECK (((discarded_percentage >= (0)::numeric) AND (discarded_percentage <= (100)::numeric))),
  CONSTRAINT "season_closures_pkey" PRIMARY KEY (id),
  CONSTRAINT "season_closures_revision_number_check" CHECK ((revision_number > 0)),
  CONSTRAINT "season_closures_rounding_method_check" CHECK ((rounding_method = ANY (ARRAY['nearest_integer'::text, 'floor'::text, 'ceiling'::text]))),
  CONSTRAINT "season_closures_season_id_revision_number_key" UNIQUE (season_id, revision_number),
  CONSTRAINT "season_closures_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'processing'::text, 'completed'::text, 'superseded'::text, 'cancelled'::text])))
);

ALTER TABLE "public"."season_closures"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."seasons" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"       text NOT NULL,
  "slug"       text NOT NULL,
  "start_date" date NOT NULL,
  "end_date"   date NOT NULL,
  CONSTRAINT "seasons_check" CHECK ((end_date >= start_date)),
  CONSTRAINT "seasons_name_key" UNIQUE (name),
  CONSTRAINT "seasons_pkey" PRIMARY KEY (id),
  CONSTRAINT "seasons_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."seasons"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sponsors" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"          text                     NOT NULL,
  "slug"          text                     NOT NULL,
  "description"   text,
  "logo_url"      text,
  "website_url"   text,
  "sponsor_type"  text                     NOT NULL DEFAULT 'sponsor'::text,
  "is_published"  boolean                  NOT NULL DEFAULT false,
  "display_order" integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sponsors_name_key" UNIQUE (name),
  CONSTRAINT "sponsors_pkey" PRIMARY KEY (id),
  CONSTRAINT "sponsors_slug_key" UNIQUE (slug),
  CONSTRAINT "sponsors_sponsor_type_check" CHECK ((sponsor_type = ANY (ARRAY['sponsor'::text, 'collaborator'::text, 'organizer'::text, 'club'::text])))
);

ALTER TABLE "public"."sponsors"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."subgroups" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "code"          text                     NOT NULL,
  "name"          text                     NOT NULL,
  "display_order" integer                  NOT NULL,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "subgroups_code_key" UNIQUE (code),
  CONSTRAINT "subgroups_display_order_key" UNIQUE (display_order),
  CONSTRAINT "subgroups_name_key" UNIQUE (name),
  CONSTRAINT "subgroups_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."subgroups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_roles" (
  "id"      bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id" uuid   NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."user_roles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SEQUENCE "public"."audit_logs_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."group_entries_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."match_result_revisions_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."match_sets_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."pair_members_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."player_category_history_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."registration_players_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."registration_status_history_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."season_closure_entries_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."user_roles_id_seq" FROM "anon";

CREATE TYPE "public"."app_role" AS ENUM (
  'player',
  'admin'
);

ALTER TABLE "public"."user_roles"
  ADD COLUMN "role" public.app_role NOT NULL DEFAULT 'player'::public.app_role;

ALTER TABLE "public"."user_roles"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."user_roles"
  ADD COLUMN "created_by" uuid;

CREATE TYPE "public"."content_status" AS ENUM (
  'draft',
  'scheduled',
  'published',
  'archived'
);

ALTER TABLE "public"."news"
  ADD COLUMN "status" public.content_status NOT NULL DEFAULT 'draft'::public.content_status;

ALTER TABLE "public"."news"
  ADD COLUMN "is_pinned" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."news"
  ADD COLUMN "event_id" uuid;

ALTER TABLE "public"."news"
  ADD COLUMN "published_at" timestamp WITH time zone;

ALTER TABLE "public"."news"
  ADD COLUMN "scheduled_at" timestamp WITH time zone;

ALTER TABLE "public"."news"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."news"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."news"
  ADD COLUMN "author_id" uuid;

ALTER TABLE "public"."scoring_rule_sets"
  ADD COLUMN "status" public.content_status NOT NULL DEFAULT 'draft'::public.content_status;

ALTER TABLE "public"."scoring_rule_sets"
  ADD COLUMN "effective_from" date;

ALTER TABLE "public"."scoring_rule_sets"
  ADD COLUMN "effective_to" date;

ALTER TABLE "public"."scoring_rule_sets"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."scoring_rule_sets"
  ADD COLUMN "created_by" uuid;

CREATE TYPE "public"."event_status" AS ENUM (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'postponed',
  'cancelled',
  'archived'
);

CREATE TYPE "public"."event_type" AS ENUM (
  'regular',
  'master_final'
);

ALTER TABLE "public"."events"
  ADD COLUMN "event_type" public.event_type NOT NULL DEFAULT 'regular'::public.event_type;

ALTER TABLE "public"."events"
  ADD COLUMN "name" text NOT NULL;

ALTER TABLE "public"."events"
  ADD COLUMN "slug" text NOT NULL;

ALTER TABLE "public"."events"
  ADD COLUMN "description" text;

ALTER TABLE "public"."events"
  ADD COLUMN "venue_id" uuid;

ALTER TABLE "public"."events"
  ADD COLUMN "starts_at" timestamp WITH time zone;

ALTER TABLE "public"."events"
  ADD COLUMN "ends_at" timestamp WITH time zone;

ALTER TABLE "public"."events"
  ADD COLUMN "registration_opens_at" timestamp WITH time zone;

ALTER TABLE "public"."events"
  ADD COLUMN "registration_closes_at" timestamp WITH time zone;

ALTER TABLE "public"."events"
  ADD COLUMN "status" public.event_status NOT NULL DEFAULT 'draft'::public.event_status;

ALTER TABLE "public"."events"
  ADD COLUMN "registration_capacity" integer;

ALTER TABLE "public"."events"
  ADD COLUMN "waitlist_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "public"."events"
  ADD COLUMN "prizes_description" text;

ALTER TABLE "public"."events"
  ADD COLUMN "practical_information" text;

ALTER TABLE "public"."events"
  ADD COLUMN "published_at" timestamp WITH time zone;

ALTER TABLE "public"."events"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."events"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."events"
  ADD COLUMN "created_by" uuid;

CREATE TYPE "public"."match_status" AS ENUM (
  'scheduled',
  'in_progress',
  'finished_pending_validation',
  'validated',
  'suspended',
  'not_played',
  'walkover',
  'cancelled'
);

ALTER TABLE "public"."matches"
  ADD COLUMN "status" public.match_status NOT NULL DEFAULT 'scheduled'::public.match_status;

ALTER TABLE "public"."matches"
  ADD COLUMN "winner_registration_id" uuid;

ALTER TABLE "public"."matches"
  ADD COLUMN "validated_at" timestamp WITH time zone;

ALTER TABLE "public"."matches"
  ADD COLUMN "validated_by" uuid;

ALTER TABLE "public"."matches"
  ADD COLUMN "public_notes" text;

ALTER TABLE "public"."matches"
  ADD COLUMN "internal_notes" text;

ALTER TABLE "public"."matches"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."matches"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."matches"
  ADD COLUMN "created_by" uuid;

CREATE TYPE "public"."registration_status" AS ENUM (
  'pending',
  'confirmed',
  'waitlist',
  'cancelled',
  'rejected'
);

ALTER TABLE "public"."registration_status_history"
  ADD COLUMN "old_status" public.registration_status;

ALTER TABLE "public"."registration_status_history"
  ADD COLUMN "new_status" public.registration_status NOT NULL;

ALTER TABLE "public"."registration_status_history"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."registration_status_history"
  ADD COLUMN "changed_by" uuid;

ALTER TABLE "public"."registration_status_history"
  ADD COLUMN "changed_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."registrations"
  ADD COLUMN "status" public.registration_status NOT NULL DEFAULT 'pending'::public.registration_status;

ALTER TABLE "public"."registrations"
  ADD COLUMN "submitted_by" uuid;

ALTER TABLE "public"."registrations"
  ADD COLUMN "submitted_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."registrations"
  ADD COLUMN "reviewed_by" uuid;

ALTER TABLE "public"."registrations"
  ADD COLUMN "reviewed_at" timestamp WITH time zone;

ALTER TABLE "public"."registrations"
  ADD COLUMN "review_notes" text;

ALTER TABLE "public"."registrations"
  ADD COLUMN "cancellation_reason" text;

ALTER TABLE "public"."registrations"
  ADD COLUMN "cancelled_at" timestamp WITH time zone;

ALTER TABLE "public"."registrations"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."registrations"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."season_status" AS ENUM (
  'draft',
  'active',
  'closed',
  'archived'
);

ALTER TABLE "public"."seasons"
  ADD COLUMN "status" public.season_status NOT NULL DEFAULT 'draft'::public.season_status;

ALTER TABLE "public"."seasons"
  ADD COLUMN "carryover_percentage" numeric(5,2) NOT NULL DEFAULT 30;

ALTER TABLE "public"."seasons"
  ADD COLUMN "discarded_percentage" numeric(5,2) NOT NULL DEFAULT 70;

ALTER TABLE "public"."seasons"
  ADD COLUMN "rounding_method" text NOT NULL DEFAULT 'nearest_integer'::text;

ALTER TABLE "public"."seasons"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."seasons"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."seasons"
  ADD COLUMN "created_by" uuid;

CREATE OR REPLACE FUNCTION public.add_points_adjustment (
  p_player_id uuid,
  p_season_id uuid,
  p_points    numeric,
  p_reason    text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_id uuid;
    v_status text;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_points is null or p_points = 0 then
        raise exception 'Indica una cantidad de puntos distinta de cero';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Escribe un motivo claro para el ajuste';
    end if;

    select status into v_status from public.seasons where id = p_season_id;
    if v_status is null then
        raise exception 'Temporada no encontrada';
    end if;
    if v_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden añadir ajustes';
    end if;

    insert into public.point_transactions (
        player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
    )
    values (
        p_player_id, p_season_id, 'manual_adjustment', p_points,
        'adjust:' || gen_random_uuid(), trim(p_reason), (select auth.uid())
    )
    returning id into v_id;

    perform public.log_audit(
        'points.adjusted', 'point_transactions', v_id::text,
        null,
        jsonb_build_object('player_id', p_player_id, 'season_id', p_season_id, 'points', p_points),
        trim(p_reason)
    );

    return v_id;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."add_points_adjustment"(uuid, uuid, numeric, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.apply_bracket_results (
  p_stage uuid
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    bs public.bracket_stages%rowtype;
    v_status text;
    v_rows integer := 0;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into bs from public.bracket_stages where stage_id = p_stage;
    if not found then
        raise exception 'Cuadro no encontrado';
    end if;

    select status into v_status from public.competition_stages where id = p_stage;
    if v_status <> 'completed' then
        raise exception 'El cuadro aún no ha terminado';
    end if;

    if exists (
        select 1 from public.event_point_batches
        where event_id = bs.event_id and status = 'active'
    ) then
        raise exception 'La prueba tiene puntos asignados. Revierte la asignación antes de aplicar el cuadro.';
    end if;

    insert into public.registration_results (registration_id, event_id, subgroup_id, placement, set_by, set_at)
    select
        be.registration_id,
        bs.event_id,
        bs.subgroup_id,
        case
            when m.winner_registration_id = be.registration_id then 1
            else case bm.teams
                when 2 then 2
                when 4 then 3
                when 8 then 5
                when 16 then 9
                else 17
            end
        end,
        (select auth.uid()),
        now()
    from public.bracket_entries be
    join public.matches m
        on m.stage_id = p_stage
       and (m.registration_a_id = be.registration_id or m.registration_b_id = be.registration_id)
    join public.bracket_matches bm on bm.match_id = m.id
    where be.stage_id = p_stage
      and m.winner_registration_id is not null
      and (m.winner_registration_id <> be.registration_id or bm.teams = 2)
    on conflict (registration_id) do update
        set event_id = excluded.event_id,
            subgroup_id = excluded.subgroup_id,
            placement = excluded.placement,
            set_by = excluded.set_by,
            set_at = excluded.set_at;

    get diagnostics v_rows = row_count;

    perform public.log_audit(
        'bracket.results_applied', 'competition_stages', p_stage::text,
        null, jsonb_build_object('registrations', v_rows), null
    );

    return v_rows;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."apply_bracket_results"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.assign_player_category (
  p_player     uuid,
  p_category   uuid,
  p_subgroup   uuid,
  p_valid_from date,
  p_reason     text
)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    cur public.player_category_history%rowtype;
    v_active boolean;
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Escribe un motivo claro para el cambio de categoría';
    end if;
    if p_valid_from is null then
        raise exception 'Indica la fecha de inicio de la vigencia';
    end if;
    if not exists (select 1 from public.players where id = p_player) then
        raise exception 'Jugador no encontrado';
    end if;

    select is_active into v_active from public.categories where id = p_category;
    if not found or not v_active then
        raise exception 'La categoría no existe o está desactivada';
    end if;

    if p_subgroup is not null then
        select is_active into v_active from public.subgroups where id = p_subgroup;
        if not found or not v_active then
            raise exception 'El subgrupo no existe o está desactivado';
        end if;
    end if;

    select * into cur
    from public.player_category_history
    where player_id = p_player and valid_to is null
    order by valid_from desc
    limit 1
    for update;

    if found then
        if cur.category_id = p_category and cur.subgroup_id is not distinct from p_subgroup then
            raise exception 'El jugador ya está en esa categoría y subgrupo';
        end if;
        if p_valid_from <= cur.valid_from then
            raise exception 'La fecha debe ser posterior a %', cur.valid_from;
        end if;

        update public.player_category_history
        set valid_to = p_valid_from - 1
        where id = cur.id;
    end if;

    insert into public.player_category_history (
        player_id, category_id, subgroup_id, valid_from, valid_to, reason, created_by
    )
    values (
        p_player, p_category, p_subgroup, p_valid_from, null, trim(p_reason), (select auth.uid())
    )
    returning id into v_id;

    perform public.log_audit(
        'player.category_assigned', 'player_category_history', v_id::text,
        null,
        jsonb_build_object('player_id', p_player, 'category_id', p_category,
                           'subgroup_id', p_subgroup, 'valid_from', p_valid_from),
        trim(p_reason)
    );

    return v_id;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."assign_player_category"(uuid, uuid, uuid, date, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.award_event_points (
  p_event_id uuid
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_rule_set uuid;
    v_season uuid;
    v_season_status text;
    v_batch uuid;
    v_version integer;
    v_total integer := 0;
    v_n integer;
    r record;
    p record;
    v_rule record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select e.season_id, s.status into v_season, v_season_status
    from public.events e
    join public.seasons s on s.id = e.season_id
    where e.id = p_event_id;

    if v_season is null then
        raise exception 'Prueba no encontrada';
    end if;
    if v_season_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden modificar sus puntos';
    end if;
    if exists (
        select 1 from public.event_point_batches
        where event_id = p_event_id and status = 'active'
    ) then
        raise exception 'La prueba ya tiene puntos asignados. Revierte la asignación antes de volver a asignar.';
    end if;

    select id into v_rule_set
    from public.scoring_rule_sets
    where status = 'published'
    order by effective_from desc nulls last, created_at desc
    limit 1;
    if v_rule_set is null then
        raise exception 'No hay reglas de puntuación publicadas';
    end if;

    select coalesce(max(version), 0) + 1 into v_version
    from public.event_point_batches where event_id = p_event_id;

    insert into public.event_point_batches (event_id, version, status, created_by)
    values (p_event_id, v_version, 'active', (select auth.uid()))
    returning id into v_batch;

    for r in
        select rr.registration_id, rr.subgroup_id, rr.placement, ec.category_id
        from public.registration_results rr
        join public.registrations reg on reg.id = rr.registration_id
        join public.event_categories ec on ec.id = reg.event_category_id
        where rr.event_id = p_event_id
          and reg.status = 'confirmed'
    loop
        select sr.id, sr.points into v_rule
        from public.scoring_rules sr
        where sr.rule_set_id = v_rule_set
          and sr.category_id = r.category_id
          and sr.subgroup_id = r.subgroup_id
          and sr.placement = r.placement;

        if v_rule.id is null then
            raise exception 'Sin regla de puntuación para esa categoría, subgrupo y posición';
        end if;

        for p in
            select rp.player_id
            from public.registration_players rp
            where rp.registration_id = r.registration_id
        loop
            insert into public.point_transactions (
                player_id, season_id, event_id, registration_id, scoring_rule_id,
                transaction_type, points, idempotency_key, reason, metadata, created_by
            )
            values (
                p.player_id, v_season, p_event_id, r.registration_id, v_rule.id,
                'match_award', v_rule.points,
                'award:' || v_batch || ':' || r.registration_id || ':' || p.player_id,
                'Resultado final de la prueba (v' || v_version || ')',
                jsonb_build_object('batch', v_batch),
                (select auth.uid())
            )
            on conflict (idempotency_key) do nothing;

            get diagnostics v_n = row_count;
            v_total := v_total + v_n;
        end loop;
    end loop;

    if v_total = 0 then
        raise exception 'No hay resultados finales confirmados para asignar';
    end if;

    perform public.log_audit(
        'event.points_awarded', 'events', p_event_id::text,
        null, jsonb_build_object('batch', v_batch, 'version', v_version, 'movements', v_total), null
    );

    return v_total;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."award_event_points"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.bracket_clear_winner (
  p_match uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    bm public.bracket_matches%rowtype;
    v_next uuid;
    v_status text;
begin
    select * into bm from public.bracket_matches where match_id = p_match;
    if not found then
        return;
    end if;

    update public.competition_stages set status = 'in_progress' where id = bm.stage_id;

    if bm.teams = 2 then
        return;
    end if;

    select match_id into v_next
    from public.bracket_matches
    where stage_id = bm.stage_id
      and round_no = bm.round_no + 1
      and pos = (bm.pos + 1) / 2;

    if v_next is null then
        return;
    end if;

    select status into v_status from public.matches where id = v_next;
    if v_status <> 'scheduled' then
        raise exception 'No se puede revertir: el siguiente partido del cuadro ya ha comenzado';
    end if;

    if bm.pos % 2 = 1 then
        update public.matches set registration_a_id = null where id = v_next;
    else
        update public.matches set registration_b_id = null where id = v_next;
    end if;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."bracket_clear_winner"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.bracket_place_winner (
  p_match uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    bm public.bracket_matches%rowtype;
    w uuid;
    v_next uuid;
begin
    select * into bm from public.bracket_matches where match_id = p_match;
    if not found then
        return;
    end if;

    select winner_registration_id into w from public.matches where id = p_match;
    if w is null then
        return;
    end if;

    if bm.teams = 2 then
        update public.competition_stages set status = 'completed' where id = bm.stage_id;
        return;
    end if;

    select match_id into v_next
    from public.bracket_matches
    where stage_id = bm.stage_id
      and round_no = bm.round_no + 1
      and pos = (bm.pos + 1) / 2;

    if v_next is null then
        return;
    end if;

    if bm.pos % 2 = 1 then
        update public.matches set registration_a_id = w where id = v_next;
    else
        update public.matches set registration_b_id = w where id = v_next;
    end if;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."bracket_place_winner"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.check_master_registration_player()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_type public.event_type;
    v_event uuid;
begin
    select e.event_type, e.id into v_type, v_event
    from public.registrations reg
    join public.events e on e.id = reg.event_id
    where reg.id = new.registration_id;

    if v_type = 'master_final' then
        if not exists (
            select 1 from public.master_final_qualifications q
            where q.event_id = v_event
              and q.player_id = new.player_id
              and q.eligibility_status = 'confirmed'
        ) then
            raise exception 'Solo pueden inscribirse jugadores confirmados para el Máster Final';
        end if;
    end if;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_pinned_news()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if new.is_pinned and new.status in ('published', 'scheduled') then
        if (
            select count(*) from public.news n
            where n.is_pinned
              and n.status in ('published', 'scheduled')
              and n.id <> new.id
        ) >= 3 then
            raise exception 'Solo puedes fijar hasta 3 noticias a la vez';
        end if;
    end if;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.clone_rule_set (
  p_source      uuid,
  p_version     text,
  p_description text DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_name text;
    v_new uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_version is null or length(trim(p_version)) = 0 then
        raise exception 'Indica el nombre de la versión';
    end if;

    select name into v_name from public.scoring_rule_sets where id = p_source;
    if v_name is null then
        raise exception 'Versión origen no encontrada';
    end if;

    insert into public.scoring_rule_sets (name, version, description, status, created_by)
    values (v_name, trim(p_version), coalesce(p_description, 'Nueva versión'), 'draft', (select auth.uid()))
    returning id into v_new;

    insert into public.scoring_rules (rule_set_id, category_id, subgroup_id, placement, points)
    select v_new, category_id, subgroup_id, placement, points
    from public.scoring_rules
    where rule_set_id = p_source;

    perform public.log_audit(
        'rules.cloned', 'scoring_rule_sets', v_new::text,
        null, jsonb_build_object('from', p_source, 'version', trim(p_version)), null
    );

    return v_new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."clone_rule_set"(uuid, text, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.close_season (
  p_season_id      uuid,
  p_next_season_id uuid DEFAULT NULL::uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    s public.seasons%rowtype;
    v_closure uuid;
    v_snapshot uuid;
    v_rev integer;
    v_pos integer := 0;
    r record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_next_season_id = p_season_id then
        raise exception 'La temporada siguiente no puede ser la misma';
    end if;

    select * into s from public.seasons where id = p_season_id for update;
    if not found then
        raise exception 'Temporada no encontrada';
    end if;
    if s.status in ('closed', 'archived') then
        raise exception 'La temporada ya está cerrada';
    end if;
    if exists (
        select 1 from public.season_closures
        where season_id = p_season_id and status = 'completed'
    ) then
        raise exception 'Esta temporada ya tiene un cierre completado';
    end if;

    select coalesce(max(revision_number), 0) + 1 into v_rev
    from public.season_closures where season_id = p_season_id;

    insert into public.season_closures (
        season_id, revision_number, status, carryover_percentage, discarded_percentage,
        rounding_method, started_at, executed_by
    )
    values (
        p_season_id, v_rev, 'processing', s.carryover_percentage, s.discarded_percentage,
        s.rounding_method, now(), (select auth.uid())
    )
    returning id into v_closure;

    insert into public.ranking_snapshots (season_id, snapshot_type, is_public, metadata, created_by)
    values (p_season_id, 'pre_close', false, jsonb_build_object('closure_id', v_closure), (select auth.uid()))
    returning id into v_snapshot;

    for r in select * from public.preview_season_closure(p_season_id) loop
        v_pos := v_pos + 1;

        insert into public.ranking_snapshot_entries (
            snapshot_id, player_id, position, points, points_before_close, points_carried
        )
        values (v_snapshot, r.player_id, v_pos, r.points_before, r.points_before, r.points_carried);

        insert into public.season_closure_entries (
            closure_id, player_id, points_before, points_carried, points_discarded, points_after, calculation
        )
        values (
            v_closure, r.player_id, r.points_before, r.points_carried, r.points_discarded, r.points_after,
            jsonb_build_object('carryover_percentage', s.carryover_percentage, 'rounding', s.rounding_method)
        );

        insert into public.point_transactions (
            player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
        )
        values (
            r.player_id, p_season_id, 'season_carryover', -r.points_discarded,
            'closure:' || v_closure || ':discard:' || r.player_id,
            'Cierre 70/30: puntos eliminados', (select auth.uid())
        );

        if p_next_season_id is not null and r.points_carried > 0 then
            insert into public.point_transactions (
                player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
            )
            values (
                r.player_id, p_next_season_id, 'season_carryover', r.points_carried,
                'closure:' || v_closure || ':carry:' || r.player_id,
                'Arrastre del 30 % de la temporada anterior', (select auth.uid())
            );
        end if;
    end loop;

    update public.season_closures
    set status = 'completed', pre_close_snapshot_id = v_snapshot, completed_at = now()
    where id = v_closure;

    update public.seasons set status = 'closed' where id = p_season_id;

    perform public.log_audit(
        'season.closed', 'seasons', p_season_id::text,
        jsonb_build_object('status', s.status),
        jsonb_build_object('status', 'closed', 'closure_id', v_closure, 'next_season_id', p_next_season_id),
        null
    );

    return v_closure;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."close_season"(uuid, uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.closure_discrepancies (
  p_season_id uuid
)
  RETURNS TABLE (
    player_id    uuid,
    display_name text,
    expected     numeric,
    actual       numeric,
    diff         numeric
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    -- Sin cierre completado no hay nada que comparar
    if not exists (
        select 1 from public.season_closures
        where season_id = p_season_id and status = 'completed'
    ) then
        return;
    end if;

    return query
    with last_closure as (
        select sc.id
        from public.season_closures sc
        where sc.season_id = p_season_id and sc.status = 'completed'
        order by sc.revision_number desc
        limit 1
    ),
    expected_pts as (
        select sce.player_id as pid, sce.points_after as exp
        from public.season_closure_entries sce
        join last_closure lc on lc.id = sce.closure_id
    ),
    actual_pts as (
        select pt.player_id as pid, sum(pt.points) as act
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    merged as (
        select
            coalesce(e.pid, a.pid) as pid,
            coalesce(e.exp, 0) as exp,
            coalesce(a.act, 0) as act
        from expected_pts e
        full join actual_pts a on a.pid = e.pid
    )
    select
        m.pid,
        pl.display_name::text,
        m.exp,
        m.act,
        m.act - m.exp
    from merged m
    join public.players pl on pl.id = m.pid
    where m.act - m.exp <> 0
    order by abs(m.act - m.exp) desc;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."closure_discrepancies"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.compare_rule_sets (
  p_a uuid,
  p_b uuid
)
  RETURNS TABLE (
    cat_name   text,
    sub_name   text,
    pos        integer,
    old_points numeric,
    new_points numeric,
    delta      numeric
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select
        c.name::text,
        sg.name::text,
        a.placement,
        a.points,
        b.points,
        b.points - a.points
    from public.scoring_rules a
    join public.scoring_rules b
        on b.rule_set_id = p_b
       and b.category_id = a.category_id
       and b.subgroup_id = a.subgroup_id
       and b.placement = a.placement
    join public.categories c on c.id = a.category_id
    join public.subgroups sg on sg.id = a.subgroup_id
    where a.rule_set_id = p_a
      and b.points <> a.points
    order by c.display_order, sg.display_order, a.placement;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."compare_rule_sets"(uuid, uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.compute_master_candidates (
  p_event_id   uuid,
  p_places     integer DEFAULT 6,
  p_min_events integer DEFAULT 1
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_season uuid;
    v_type public.event_type;
    v_status public.event_status;
    v_total integer := 0;
    v_pos integer;
    v_new text;
    c record;
    rk record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_places < 1 or p_min_events < 0 then
        raise exception 'Parámetros no válidos';
    end if;

    select e.season_id, e.event_type, e.status
    into v_season, v_type, v_status
    from public.events e
    where e.id = p_event_id;

    if not found then
        raise exception 'Prueba no encontrada';
    end if;
    if v_type <> 'master_final' then
        raise exception 'La prueba no es el Máster Final';
    end if;
    if v_status in ('in_progress', 'completed', 'archived', 'cancelled') then
        raise exception 'La lista ya está cerrada y no se puede recalcular';
    end if;

    for c in
        select id, name from public.categories where is_active order by display_order
    loop
        v_pos := 0;

        for rk in
            select
                pl.id as pid,
                pl.display_name,
                coalesce(sum(pt.points), 0) as pts,
                count(distinct pt.event_id) filter (
                    where pt.event_id is not null and pt.transaction_type = 'match_award'
                ) as evs
            from public.players pl
            join public.player_category_history h
                 on h.player_id = pl.id and h.valid_to is null and h.category_id = c.id
            left join public.point_transactions pt
                 on pt.player_id = pl.id and pt.season_id = v_season
            where pl.status = 'active'
            group by pl.id, pl.display_name
            order by pts desc, evs desc, pl.display_name
        loop
            if rk.evs < p_min_events then
                v_new := 'ineligible';
            else
                v_pos := v_pos + 1;
                v_new := case when v_pos <= p_places then 'eligible' else 'candidate' end;
            end if;

            insert into public.master_final_qualifications (
                season_id, event_id, player_id, ranking_position, eligibility_status, qualification_reason
            )
            values (
                v_season, p_event_id, rk.pid,
                case when v_new = 'ineligible' then null else v_pos end,
                v_new,
                c.name || ' · ' || rk.pts::text || ' pts · ' || rk.evs::text || ' prueba(s)'
            )
            on conflict (event_id, player_id) do update
            set ranking_position = excluded.ranking_position,
                qualification_reason = excluded.qualification_reason,
                eligibility_status = case
                    when public.master_final_qualifications.eligibility_status in ('confirmed', 'declined', 'waitlist')
                        then public.master_final_qualifications.eligibility_status
                    else excluded.eligibility_status
                end;

            v_total := v_total + 1;
        end loop;
    end loop;

    perform public.log_audit(
        'master.candidates_calculated', 'events', p_event_id::text,
        null,
        jsonb_build_object('places', p_places, 'min_events', p_min_events, 'evaluated', v_total),
        null
    );

    return v_total;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."compute_master_candidates"(uuid, integer, integer) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.create_ranking_snapshot (
  p_season_id uuid,
  p_type      text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_snap uuid;
    r record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_type not in ('live', 'published') then
        raise exception 'Tipo de snapshot no válido';
    end if;
    if not exists (select 1 from public.seasons where id = p_season_id) then
        raise exception 'Temporada no encontrada';
    end if;

    -- Solo un ranking publicado a la vez por temporada
    if p_type = 'published' then
        update public.ranking_snapshots
        set is_public = false
        where season_id = p_season_id
          and snapshot_type = 'published'
          and is_public;
    end if;

    insert into public.ranking_snapshots (season_id, snapshot_type, as_of, is_public, metadata, created_by)
    values (
        p_season_id, p_type, now(), p_type = 'published',
        jsonb_build_object('source', 'get_ranking_live'),
        (select auth.uid())
    )
    returning id into v_snap;

    for r in select * from public.get_ranking_live(p_season_id) loop
        insert into public.ranking_snapshot_entries (snapshot_id, player_id, position, points, events_played)
        values (v_snap, r.player_id, r.rank_position, r.points, r.events_played);
    end loop;

    perform public.log_audit(
        'ranking.snapshot_created', 'ranking_snapshots', v_snap::text,
        null, jsonb_build_object('type', p_type, 'season_id', p_season_id), null
    );

    return v_snap;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."create_ranking_snapshot"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.generate_bracket (
  p_stage uuid
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    bs public.bracket_stages%rowtype;
    cs public.competition_stages%rowtype;
    v_n integer;
    v_bad integer;
    v_size integer := 2;
    v_rounds integer := 0;
    v_t integer;
    v_order integer[] := array[1];
    v_m integer;
    v_new integer[];
    v_teams integer;
    v_name text;
    v_mid uuid;
    v_ra uuid;
    v_rb uuid;
    v_created integer := 0;
    v_seed_a integer;
    v_seed_b integer;
    b record;
    r integer;
    p integer;
    i integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into bs from public.bracket_stages where stage_id = p_stage;
    if not found then
        raise exception 'Este estado no es un cuadro';
    end if;

    select * into cs from public.competition_stages where id = p_stage for update;
    if cs.status <> 'draft' then
        raise exception 'El cuadro ya está generado o en juego';
    end if;
    if exists (select 1 from public.matches where stage_id = p_stage) then
        raise exception 'El cuadro ya tiene partidos';
    end if;

    select count(*) into v_n from public.bracket_entries where stage_id = p_stage;
    if v_n < 2 then
        raise exception 'Necesitas al menos dos parejas en el cuadro';
    end if;

    select count(*) into v_bad
    from public.bracket_entries be
    join public.registrations reg on reg.id = be.registration_id
    where be.stage_id = p_stage
      and (reg.event_id <> bs.event_id
           or reg.status <> 'confirmed'
           or not exists (
                select 1 from public.event_categories ec
                where ec.id = reg.event_category_id
                  and ec.category_id = bs.category_id));

    if v_bad > 0 then
        raise exception 'Hay parejas que no están confirmadas o no pertenecen a esta categoría';
    end if;

    while v_size < v_n loop
        v_size := v_size * 2;
    end loop;

    v_t := v_size;
    while v_t > 1 loop
        v_t := v_t / 2;
        v_rounds := v_rounds + 1;
    end loop;

    -- Orden estándar de cruces
    while array_length(v_order, 1) < v_size loop
        v_m := array_length(v_order, 1) * 2;
        v_new := '{}';
        for i in 1 .. array_length(v_order, 1) loop
            v_new := v_new || array[v_order[i], v_m + 1 - v_order[i]];
        end loop;
        v_order := v_new;
    end loop;

    for r in 1 .. v_rounds loop
        v_teams := v_size >> (r - 1);
        v_name := case v_teams
            when 2 then 'Final'
            when 4 then 'Semifinal'
            when 8 then 'Cuartos'
            when 16 then 'Octavos'
            when 32 then 'Dieciseisavos'
            else 'Ronda de ' || v_teams
        end;

        for p in 1 .. (v_teams / 2) loop
            v_ra := null;
            v_rb := null;

            if r = 1 then
                v_seed_a := v_order[2 * p - 1];
                v_seed_b := v_order[2 * p];
                select registration_id into v_ra
                from public.bracket_entries where stage_id = p_stage and seed = v_seed_a;
                select registration_id into v_rb
                from public.bracket_entries where stage_id = p_stage and seed = v_seed_b;
            end if;

            insert into public.matches (
                stage_id, match_number, round_name, registration_a_id, registration_b_id, status, created_by
            )
            values (
                p_stage, 'R' || r || '-' || p, v_name, v_ra, v_rb, 'scheduled', (select auth.uid())
            )
            returning id into v_mid;

            insert into public.bracket_matches (match_id, stage_id, round_no, pos, teams)
            values (v_mid, p_stage, r, p, v_teams);

            v_created := v_created + 1;
        end loop;
    end loop;

    -- Byes: la pareja sin rival pasa automáticamente (el disparador la coloca en la siguiente ronda)
    for b in
        select m.id, m.registration_a_id, m.registration_b_id
        from public.matches m
        join public.bracket_matches bm on bm.match_id = m.id
        where bm.stage_id = p_stage
          and bm.round_no = 1
          and (m.registration_a_id is null) <> (m.registration_b_id is null)
    loop
        update public.matches
        set status = 'walkover',
            winner_registration_id = coalesce(b.registration_a_id, b.registration_b_id)
        where id = b.id;
    end loop;

    update public.competition_stages set status = 'in_progress' where id = p_stage;
    update public.bracket_stages set size = v_size, generated_at = now() where stage_id = p_stage;

    perform public.log_audit(
        'bracket.generated', 'competition_stages', p_stage::text,
        null, jsonb_build_object('size', v_size, 'entries', v_n, 'matches', v_created), null
    );

    return v_created;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."generate_bracket"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.get_ranking_live (
  p_season_id uuid
)
  RETURNS TABLE (
    player_id     uuid,
    display_name  text,
    points        numeric,
    events_played integer,
    category_name text,
    subgroup_name text,
    rank_position integer
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    with totals as (
        select
            pt.player_id as pid,
            sum(pt.points) as pts,
            count(distinct pt.event_id) filter (
                where pt.event_id is not null and pt.transaction_type = 'match_award'
            ) as evs
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    ranked as (
        select
            t.pid,
            t.pts,
            t.evs,
            pl.display_name::text as dname,
            cat.name::text as cname,
            sg.name::text as sname
        from totals t
        join public.players pl on pl.id = t.pid
        left join lateral (
            select h.category_id, h.subgroup_id
            from public.player_category_history h
            where h.player_id = t.pid and h.valid_to is null
            limit 1
        ) cur on true
        left join public.categories cat on cat.id = cur.category_id
        left join public.subgroups sg on sg.id = cur.subgroup_id
    )
    select
        r.pid,
        r.dname,
        r.pts,
        r.evs::integer,
        r.cname,
        r.sname,
        (row_number() over (order by r.pts desc, r.evs desc, r.dname))::integer
    from ranked r
    order by 7;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."get_ranking_live"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.grant_admin_role (
  p_email  text,
  p_reason text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_user uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica el motivo para conceder el rol';
    end if;

    select id into v_user from auth.users where lower(email) = lower(trim(p_email));
    if v_user is null then
        raise exception 'Esa cuenta no existe. La persona debe registrarse antes.';
    end if;

    insert into public.user_roles (user_id, role, created_by)
    values (v_user, 'admin', (select auth.uid()))
    on conflict (user_id, role) do nothing;

    perform public.log_audit(
        'admin.granted', 'user_roles', v_user::text,
        null, jsonb_build_object('email', trim(p_email)), trim(p_reason)
    );

    return v_user;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."grant_admin_role"(text, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.guard_scoring_rule_edit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_set uuid;
    v_status public.content_status;
begin
    if tg_op = 'DELETE' then
        v_set := old.rule_set_id;
    else
        v_set := new.rule_set_id;
    end if;

    select status into v_status from public.scoring_rule_sets where id = v_set;

    if v_status is distinct from 'draft' then
        raise exception 'Solo se pueden modificar reglas de una versión en borrador';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(
      pg_catalog.btrim(
        coalesce(new.raw_user_meta_data ->> 'display_name', '')
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'player'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.has_role (
  requested_role public.app_role
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = requested_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select public.has_role('admin'::public.app_role);
$function$;

CREATE OR REPLACE FUNCTION public.list_admins()
  RETURNS TABLE (
    user_id    uuid,
    email      text,
    granted_at timestamp with time zone,
    is_me      boolean
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select ur.user_id, u.email::text, ur.created_at, (ur.user_id = (select auth.uid()))
    from public.user_roles ur
    join auth.users u on u.id = ur.user_id
    where ur.role = 'admin'
    order by ur.created_at;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."list_admins"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.list_audit_log (
  p_action text                     DEFAULT NULL::text,
  p_table  text                     DEFAULT NULL::text,
  p_from   timestamp with time zone DEFAULT NULL::timestamp WITH time zone,
  p_to     timestamp with time zone DEFAULT NULL::timestamp WITH time zone,
  p_limit  integer                  DEFAULT 200,
  p_before timestamp with time zone DEFAULT NULL::timestamp WITH time zone
)
  RETURNS TABLE (
    id           bigint,
    created_at   timestamp with time zone,
    action       text,
    entity_table text,
    entity_id    text,
    actor_email  text,
    reason       text,
    old_values   jsonb,
    new_values   jsonb
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select
        a.id,
        a.created_at,
        a.action,
        a.entity_table,
        a.entity_id,
        u.email::text,
        a.reason,
        a.old_values,
        a.new_values
    from public.audit_logs a
    left join auth.users u on u.id = a.actor_user_id
    where (p_action is null or a.action like p_action || '%')
      and (p_table is null or a.entity_table = p_table)
      and (p_from is null or a.created_at >= p_from)
      and (p_to is null or a.created_at <= p_to)
      and (p_before is null or a.created_at < p_before)
    order by a.created_at desc
    limit least(greatest(p_limit, 1), 500);
end;
$function$;

REVOKE ALL ON FUNCTION "public"."list_audit_log"(text, text, timestamp WITH time zone, timestamp WITH time zone, integer, timestamp WITH time zone) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.log_audit (
  p_action       text,
  p_entity_table text,
  p_entity_id    text,
  p_old          jsonb DEFAULT NULL::jsonb,
  p_new          jsonb DEFAULT NULL::jsonb,
  p_reason       text  DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    insert into public.audit_logs (actor_user_id, action, entity_table, entity_id, old_values, new_values, reason)
    values ((select auth.uid()), p_action, p_entity_table, p_entity_id, p_old, p_new, p_reason);
end;
$function$;

REVOKE ALL ON FUNCTION "public"."log_audit"(text, text, text, jsonb, jsonb, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.move_category (
  p_id        uuid,
  p_direction text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    me public.categories%rowtype;
    other public.categories%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_direction not in ('up', 'down') then
        raise exception 'Dirección no válida';
    end if;

    select * into me from public.categories where id = p_id for update;
    if not found then
        raise exception 'Categoría no encontrada';
    end if;

    if p_direction = 'up' then
        select * into other from public.categories
        where display_order < me.display_order
        order by display_order desc limit 1 for update;
    else
        select * into other from public.categories
        where display_order > me.display_order
        order by display_order asc limit 1 for update;
    end if;

    if not found then
        return;
    end if;

    -- Intercambio en tres pasos para no chocar con la restricción de orden único
    update public.categories set display_order = -1 where id = me.id;
    update public.categories set display_order = me.display_order where id = other.id;
    update public.categories set display_order = other.display_order where id = me.id;

    perform public.log_audit(
        'category.reordered', 'categories', p_id::text,
        jsonb_build_object('display_order', me.display_order),
        jsonb_build_object('display_order', other.display_order), null
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."move_category"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.move_subgroup (
  p_id        uuid,
  p_direction text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    me public.subgroups%rowtype;
    other public.subgroups%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_direction not in ('up', 'down') then
        raise exception 'Dirección no válida';
    end if;

    select * into me from public.subgroups where id = p_id for update;
    if not found then
        raise exception 'Subgrupo no encontrado';
    end if;

    if p_direction = 'up' then
        select * into other from public.subgroups
        where display_order < me.display_order
        order by display_order desc limit 1 for update;
    else
        select * into other from public.subgroups
        where display_order > me.display_order
        order by display_order asc limit 1 for update;
    end if;

    if not found then
        return;
    end if;

    update public.subgroups set display_order = -1 where id = me.id;
    update public.subgroups set display_order = me.display_order where id = other.id;
    update public.subgroups set display_order = other.display_order where id = me.id;

    perform public.log_audit(
        'subgroup.reordered', 'subgroups', p_id::text,
        jsonb_build_object('display_order', me.display_order),
        jsonb_build_object('display_order', other.display_order), null
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."move_subgroup"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.preview_season_closure (
  p_season_id uuid
)
  RETURNS TABLE (
    player_id        uuid,
    display_name     text,
    points_before    numeric,
    points_carried   numeric,
    points_discarded numeric,
    points_after     numeric
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    s public.seasons%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into s from public.seasons where id = p_season_id;
    if not found then
        raise exception 'Temporada no encontrada';
    end if;

    return query
    with totals as (
        select pt.player_id as pid, sum(pt.points) as before_total
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    calc as (
        select
            t.pid,
            greatest(t.before_total, 0) as before_pts,
            case s.rounding_method
                when 'floor' then floor(greatest(t.before_total, 0) * s.carryover_percentage / 100)
                when 'ceiling' then ceiling(greatest(t.before_total, 0) * s.carryover_percentage / 100)
                else round(greatest(t.before_total, 0) * s.carryover_percentage / 100)
            end as carried_pts
        from totals t
    )
    select
        c.pid,
        pl.display_name::text,
        c.before_pts,
        c.carried_pts,
        c.before_pts - c.carried_pts,
        c.carried_pts
    from calc c
    join public.players pl on pl.id = c.pid
    where c.before_pts > 0
    order by c.before_pts desc;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."preview_season_closure"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.publish_due_news()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    n integer;
begin
    update public.news
    set status = 'published',
        published_at = coalesce(scheduled_at, now())
    where status = 'scheduled'
      and scheduled_at <= now();

    get diagnostics n = row_count;
    return n;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."publish_due_news"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.publish_rule_set (
  p_rule_set       uuid,
  p_effective_from date
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_set public.scoring_rule_sets%rowtype;
    v_prev record;
    v_errors integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into v_set from public.scoring_rule_sets where id = p_rule_set for update;
    if not found then
        raise exception 'Versión no encontrada';
    end if;
    if v_set.status <> 'draft' then
        raise exception 'Solo se publican versiones en borrador';
    end if;
    if p_effective_from is null then
        raise exception 'Indica la fecha de entrada en vigor';
    end if;

    select count(*) into v_errors
    from public.validate_rule_set(p_rule_set)
    where severity = 'error';

    if v_errors > 0 then
        raise exception 'La versión tiene errores de validación. Corrígelos antes de publicar.';
    end if;

    for v_prev in
        select id, effective_from
        from public.scoring_rule_sets
        where status = 'published' and id <> p_rule_set
    loop
        if v_prev.effective_from is not null and p_effective_from <= v_prev.effective_from then
            raise exception 'La fecha debe ser posterior a la entrada en vigor de la versión actual';
        end if;

        update public.scoring_rule_sets
        set status = 'archived', effective_to = p_effective_from - 1
        where id = v_prev.id;
    end loop;

    update public.scoring_rule_sets
    set status = 'published', effective_from = p_effective_from
    where id = p_rule_set;

    perform public.log_audit(
        'rules.published', 'scoring_rule_sets', p_rule_set::text,
        jsonb_build_object('status', 'draft'),
        jsonb_build_object('status', 'published', 'effective_from', p_effective_from),
        null
    );

    return p_rule_set;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."publish_rule_set"(uuid, date) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.revert_event_points (
  p_event_id uuid,
  p_reason   text
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_batch record;
    v_status text;
    t record;
    v_n integer := 0;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica un motivo claro para la reversión';
    end if;

    select s.status into v_status
    from public.events e join public.seasons s on s.id = e.season_id
    where e.id = p_event_id;

    if v_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden revertir sus puntos';
    end if;

    select * into v_batch
    from public.event_point_batches
    where event_id = p_event_id and status = 'active'
    for update;

    if not found then
        raise exception 'La prueba no tiene puntos asignados activos';
    end if;

    for t in
        select * from public.point_transactions
        where event_id = p_event_id
          and transaction_type = 'match_award'
          and metadata->>'batch' = v_batch.id::text
    loop
        insert into public.point_transactions (
            player_id, season_id, event_id, registration_id, scoring_rule_id,
            transaction_type, points, idempotency_key, reverses_transaction_id, reason, metadata, created_by
        )
        values (
            t.player_id, t.season_id, t.event_id, t.registration_id, t.scoring_rule_id,
            'reversal', -t.points, 'reversal:' || t.id, t.id,
            trim(p_reason), jsonb_build_object('batch', v_batch.id), (select auth.uid())
        );
        v_n := v_n + 1;
    end loop;

    update public.event_point_batches
    set status = 'reverted', reverted_at = now(),
        reverted_by = (select auth.uid()), reverted_reason = trim(p_reason)
    where id = v_batch.id;

    perform public.log_audit(
        'event.points_reverted', 'events', p_event_id::text,
        jsonb_build_object('version', v_batch.version),
        jsonb_build_object('movements', v_n), trim(p_reason)
    );

    return v_n;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."revert_event_points"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.revert_match (
  p_match_id uuid,
  p_reason   text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    m public.matches%rowtype;
    t record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) = 0 then
        raise exception 'Indica el motivo de la reversión';
    end if;

    select * into m from public.matches where id = p_match_id for update;
    if not found or m.status <> 'validated' then
        raise exception 'Solo se pueden revertir partidos validados';
    end if;

    for t in
        select * from public.point_transactions
        where match_id = p_match_id and transaction_type = 'match_award'
    loop
        insert into public.point_transactions (
            player_id, season_id, event_id, registration_id, match_id,
            transaction_type, points, idempotency_key, reverses_transaction_id, reason, created_by
        )
        values (
            t.player_id, t.season_id, t.event_id, t.registration_id, p_match_id,
            'reversal', -t.points, 'reversal:' || t.id, t.id, p_reason, (select auth.uid())
        );
    end loop;

    update public.matches
    set status = 'finished_pending_validation',
        winner_registration_id = null,
        validated_at = null,
        validated_by = null
    where id = p_match_id;

    insert into public.match_result_revisions (
        match_id, revision_number, previous_result, new_result, reason, changed_by
    )
    values (
        p_match_id,
        (select coalesce(max(revision_number), 0) + 1 from public.match_result_revisions where match_id = p_match_id),
        jsonb_build_object('status', 'validated', 'winner', m.winner_registration_id),
        jsonb_build_object('status', 'finished_pending_validation'),
        p_reason,
        (select auth.uid())
    );

    perform public.log_audit(
        'match.reverted', 'matches', p_match_id::text,
        jsonb_build_object('status', 'validated'),
        jsonb_build_object('status', 'finished_pending_validation'),
        p_reason
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."revert_match"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.revoke_admin_role (
  p_user   uuid,
  p_reason text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_admins integer;
    v_email text;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_user = (select auth.uid()) then
        raise exception 'No puedes retirarte tu propio rol de administrador';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica el motivo para retirar el rol';
    end if;

    select count(*) into v_admins from public.user_roles where role = 'admin';
    if v_admins <= 1 then
        raise exception 'Debe quedar al menos un administrador';
    end if;

    select email::text into v_email from auth.users where id = p_user;

    delete from public.user_roles where user_id = p_user and role = 'admin';
    if not found then
        raise exception 'Ese usuario no es administrador';
    end if;

    perform public.log_audit(
        'admin.revoked', 'user_roles', p_user::text,
        jsonb_build_object('email', v_email), null, trim(p_reason)
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."revoke_admin_role"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.set_app_setting (
  p_key    text,
  p_value  jsonb,
  p_reason text  DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_old jsonb;
    v_valid boolean;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    if p_key = 'maintenance_mode' then
        v_valid := jsonb_typeof(p_value) = 'boolean';
        if p_reason is null or length(trim(p_reason)) < 5 then
            raise exception 'Indica un motivo para cambiar el modo mantenimiento';
        end if;
    elsif p_key in ('site_name', 'contact_email', 'contact_phone') then
        v_valid := jsonb_typeof(p_value) = 'string' and length(p_value #>> '{}') <= 200;
    else
        raise exception 'Ajuste no permitido: %', p_key;
    end if;

    if not v_valid then
        raise exception 'Valor no válido para %', p_key;
    end if;

    select value into v_old from public.app_settings where key = p_key;

    insert into public.app_settings (key, value, updated_at, updated_by)
    values (p_key, p_value, now(), (select auth.uid()))
    on conflict (key) do update
        set value = excluded.value,
            updated_at = now(),
            updated_by = excluded.updated_by;

    perform public.log_audit(
        'setting.updated', 'app_settings', p_key,
        jsonb_build_object('value', v_old),
        jsonb_build_object('value', p_value),
        p_reason
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."set_app_setting"(text, jsonb, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_bracket_advance()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    if new.status in ('validated', 'walkover')
       and old.status not in ('validated', 'walkover')
       and new.winner_registration_id is not null then
        perform public.bracket_place_winner(new.id);
    elsif old.status = 'validated' and new.status <> 'validated' then
        perform public.bracket_clear_winner(new.id);
    end if;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_match (
  p_match_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    m public.matches%rowtype;
    v_sets_a integer;
    v_sets_b integer;
    v_winner uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into m from public.matches where id = p_match_id for update;
    if not found then
        raise exception 'Partido no encontrado';
    end if;
    if m.status <> 'finished_pending_validation' then
        raise exception 'Solo se validan partidos finalizados pendientes de validación';
    end if;
    if m.registration_a_id is null or m.registration_b_id is null then
        raise exception 'Faltan las dos parejas';
    end if;

    select
        count(*) filter (where ms.score_a > ms.score_b
            or (ms.score_a = ms.score_b and coalesce(ms.tie_break_a, 0) > coalesce(ms.tie_break_b, 0))),
        count(*) filter (where ms.score_b > ms.score_a
            or (ms.score_a = ms.score_b and coalesce(ms.tie_break_b, 0) > coalesce(ms.tie_break_a, 0)))
    into v_sets_a, v_sets_b
    from public.match_sets ms
    where ms.match_id = p_match_id;

    if v_sets_a = v_sets_b then
        raise exception 'El resultado no tiene un ganador claro';
    end if;

    v_winner := case when v_sets_a > v_sets_b then m.registration_a_id else m.registration_b_id end;

    update public.matches
    set status = 'validated',
        winner_registration_id = v_winner,
        validated_at = now(),
        validated_by = (select auth.uid())
    where id = p_match_id;

    perform public.log_audit(
        'match.validated', 'matches', p_match_id::text,
        jsonb_build_object('status', m.status),
        jsonb_build_object('status', 'validated', 'winner', v_winner),
        null
    );
end;
$function$;

REVOKE ALL ON FUNCTION "public"."validate_match"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.validate_registration_category()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if not exists (
    select 1
    from public.event_categories ec
    where ec.id = new.event_category_id
      and ec.event_id = new.event_id
  ) then
    raise exception 'La categoría seleccionada no pertenece a esta prueba.';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_rule_set (
  p_rule_set uuid
)
  RETURNS TABLE (
    severity text,
    detail   text
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
    v_expected integer;
    v_actual integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select count(*) into v_expected
    from public.categories c
    cross join public.subgroups s
    cross join (values (1), (2), (3), (5), (9), (17), (33)) as p(x)
    where c.is_active and s.is_active;

    select count(*) into v_actual
    from public.scoring_rules sr
    where sr.rule_set_id = p_rule_set;

    if v_actual < v_expected then
        return query select 'error'::text,
            ('Faltan ' || (v_expected - v_actual) || ' puntuaciones por definir')::text;
    end if;

    if exists (
        select 1 from public.scoring_rules sr
        where sr.rule_set_id = p_rule_set and sr.points < 0
    ) then
        return query select 'error'::text, 'Hay puntuaciones negativas'::text;
    end if;

    -- Una posición peor nunca puede puntuar más que una mejor en la misma categoría y subgrupo
    if exists (
        with ordered as (
            select
                sr.points,
                lead(sr.points) over (
                    partition by sr.category_id, sr.subgroup_id order by sr.placement
                ) as next_points
            from public.scoring_rules sr
            where sr.rule_set_id = p_rule_set
        )
        select 1 from ordered where next_points > points
    ) then
        return query select 'error'::text,
            'Una posición peor puntúa más que una mejor en la misma categoría y subgrupo'::text;
    end if;

    -- Aviso: un subgrupo inferior no debería puntuar más que uno superior
    if exists (
        with x as (
            select sr.category_id, sr.placement, sr.points, sg.display_order as so
            from public.scoring_rules sr
            join public.subgroups sg on sg.id = sr.subgroup_id
            where sr.rule_set_id = p_rule_set
        )
        select 1
        from x a
        join x b on b.category_id = a.category_id and b.placement = a.placement
        where a.so < b.so and b.points > a.points
    ) then
        return query select 'warning'::text,
            'Un subgrupo inferior puntúa más que uno superior en la misma posición'::text;
    end if;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."validate_rule_set"(uuid) FROM PUBLIC, "anon";

ALTER TABLE "public"."app_settings"
  ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."audit_logs"
  ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."bracket_stages"
  ADD CONSTRAINT "bracket_stages_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bracket_entries"
  ADD CONSTRAINT "bracket_entries_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE CASCADE;

ALTER TABLE "public"."bracket_matches"
  ADD CONSTRAINT "bracket_matches_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE CASCADE;

ALTER TABLE "public"."bracket_stages"
  ADD CONSTRAINT "bracket_stages_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE CASCADE;

ALTER TABLE "public"."competition_groups"
  ADD CONSTRAINT "competition_groups_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_categories"
  ADD CONSTRAINT "event_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."competition_stages"
  ADD CONSTRAINT "competition_stages_event_category_id_fkey" FOREIGN KEY (event_category_id) REFERENCES public.event_categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_organizers"
  ADD CONSTRAINT "event_organizers_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_point_batches"
  ADD CONSTRAINT "event_point_batches_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_point_batches"
  ADD CONSTRAINT "event_point_batches_reverted_by_fkey" FOREIGN KEY (reverted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_scoring_rules"
  ADD CONSTRAINT "event_scoring_rules_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_scoring_rules"
  ADD CONSTRAINT "event_scoring_rules_event_category_id_fkey" FOREIGN KEY (event_category_id) REFERENCES public.event_categories(id) ON DELETE CASCADE;

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_check1" CHECK (((registration_closes_at IS NULL) OR (registration_opens_at IS NULL) OR (registration_closes_at >= registration_opens_at)));

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_check2" CHECK ((((event_type = 'regular'::public.event_type) AND (event_number IS
    NOT NULL)) OR ((event_type = 'master_final'::public.event_type) AND (event_number IS NULL))));

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_check" CHECK (((ends_at IS NULL) OR (starts_at IS NULL) OR (ends_at >= starts_at)));

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."bracket_stages"
  ADD CONSTRAINT "bracket_stages_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_categories"
  ADD CONSTRAINT "event_categories_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_organizers"
  ADD CONSTRAINT "event_organizers_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_point_batches"
  ADD CONSTRAINT "event_point_batches_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_sponsors"
  ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_registration_capacity_check" CHECK (((registration_capacity IS NULL) OR (registration_capacity > 0)));

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_slug_key" UNIQUE (slug);

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES public.event_venues(id) ON DELETE SET NULL;

ALTER TABLE "public"."group_entries"
  ADD CONSTRAINT "group_entries_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.competition_groups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."incidents"
  ADD CONSTRAINT "incidents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."incidents"
  ADD CONSTRAINT "incidents_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."master_final_qualifications"
  ADD CONSTRAINT "master_final_qualifications_confirmed_by_fkey" FOREIGN KEY (confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."master_final_qualifications"
  ADD CONSTRAINT "master_final_qualifications_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."master_final_results"
  ADD CONSTRAINT "master_final_results_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."master_final_results"
  ADD CONSTRAINT "master_final_results_set_by_fkey" FOREIGN KEY (set_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."match_result_revisions"
  ADD CONSTRAINT "match_result_revisions_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_check1" CHECK (((winner_registration_id IS NULL) OR (winner_registration_id = registration_a_id) OR (winner_registration_id = registration_b_id)));

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.competition_groups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bracket_matches"
  ADD CONSTRAINT "bracket_matches_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

ALTER TABLE "public"."match_result_revisions"
  ADD CONSTRAINT "match_result_revisions_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE RESTRICT;

ALTER TABLE "public"."match_sets"
  ADD CONSTRAINT "match_sets_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE RESTRICT;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_validated_by_fkey" FOREIGN KEY (validated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES public.event_venues(id) ON DELETE SET NULL;

ALTER TABLE "public"."news"
  ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."news"
  ADD CONSTRAINT "news_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."pairs"
  ADD CONSTRAINT "pairs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."pair_members"
  ADD CONSTRAINT "pair_members_pair_id_fkey" FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE RESTRICT;

ALTER TABLE "public"."player_category_history"
  ADD CONSTRAINT "player_category_history_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."player_category_history"
  ADD CONSTRAINT "player_category_history_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."players"
  ADD CONSTRAINT "players_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."master_final_qualifications"
  ADD CONSTRAINT "master_final_qualifications_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."pair_members"
  ADD CONSTRAINT "pair_members_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."player_category_history"
  ADD CONSTRAINT "player_category_history_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_adjustments"
  ADD CONSTRAINT "point_adjustments_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_adjustments"
  ADD CONSTRAINT "point_adjustments_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."point_adjustments"
  ADD CONSTRAINT "point_adjustments_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_adjustments"
  ADD CONSTRAINT "point_adjustments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.point_transactions(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_reverses_transaction_id_fkey" FOREIGN KEY (reverses_transaction_id) REFERENCES public.point_transactions(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE "public"."players"
  ADD CONSTRAINT "players_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."ranking_snapshot_entries"
  ADD CONSTRAINT "ranking_snapshot_entries_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ranking_snapshot_entries"
  ADD CONSTRAINT "ranking_snapshot_entries_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ranking_snapshots"
  ADD CONSTRAINT "ranking_snapshots_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."ranking_snapshot_entries"
  ADD CONSTRAINT "ranking_snapshot_entries_snapshot_id_fkey" FOREIGN KEY (snapshot_id) REFERENCES public.ranking_snapshots(id) ON DELETE CASCADE;

ALTER TABLE "public"."registration_players"
  ADD CONSTRAINT "registration_players_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registration_results"
  ADD CONSTRAINT "registration_results_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registration_results"
  ADD CONSTRAINT "registration_results_set_by_fkey" FOREIGN KEY (set_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."registration_status_history"
  ADD CONSTRAINT "registration_status_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."registrations"
  ADD CONSTRAINT "registrations_event_category_id_fkey" FOREIGN KEY (event_category_id) REFERENCES public.event_categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registrations"
  ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registrations"
  ADD CONSTRAINT "registrations_pair_id_fkey" FOREIGN KEY (pair_id) REFERENCES public.pairs(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bracket_entries"
  ADD CONSTRAINT "bracket_entries_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;

ALTER TABLE "public"."group_entries"
  ADD CONSTRAINT "group_entries_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."master_final_results"
  ADD CONSTRAINT "master_final_results_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_registration_a_id_fkey" FOREIGN KEY (registration_a_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_registration_b_id_fkey" FOREIGN KEY (registration_b_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."matches"
  ADD CONSTRAINT "matches_winner_registration_id_fkey" FOREIGN KEY (winner_registration_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registration_players"
  ADD CONSTRAINT "registration_players_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;

ALTER TABLE "public"."registration_results"
  ADD CONSTRAINT "registration_results_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;

ALTER TABLE "public"."registration_status_history"
  ADD CONSTRAINT "registration_status_history_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registrations"
  ADD CONSTRAINT "registrations_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."registrations"
  ADD CONSTRAINT "registrations_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."scoring_rule_sets"
  ADD CONSTRAINT "scoring_rule_sets_check" CHECK (((effective_to IS NULL) OR (effective_from IS NULL) OR (effective_to >= effective_from)));

ALTER TABLE "public"."scoring_rule_sets"
  ADD CONSTRAINT "scoring_rule_sets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_scoring_rules"
  ADD CONSTRAINT "event_scoring_rules_rule_set_id_fkey" FOREIGN KEY (rule_set_id) REFERENCES public.scoring_rule_sets(id) ON DELETE RESTRICT;

ALTER TABLE "public"."scoring_rules"
  ADD CONSTRAINT "scoring_rules_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_scoring_rule_id_fkey" FOREIGN KEY (scoring_rule_id) REFERENCES public.scoring_rules(id) ON DELETE RESTRICT;

ALTER TABLE "public"."scoring_rules"
  ADD CONSTRAINT "scoring_rules_rule_set_id_fkey" FOREIGN KEY (rule_set_id) REFERENCES public.scoring_rule_sets(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closure_entries"
  ADD CONSTRAINT "season_closure_entries_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closures"
  ADD CONSTRAINT "season_closures_executed_by_fkey" FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."season_closure_entries"
  ADD CONSTRAINT "season_closure_entries_closure_id_fkey" FOREIGN KEY (closure_id) REFERENCES public.season_closures(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closures"
  ADD CONSTRAINT "season_closures_post_close_snapshot_id_fkey" FOREIGN KEY (post_close_snapshot_id) REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closures"
  ADD CONSTRAINT "season_closures_pre_close_snapshot_id_fkey" FOREIGN KEY (pre_close_snapshot_id) REFERENCES public.ranking_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closures"
  ADD CONSTRAINT "season_closures_supersedes_closure_id_fkey" FOREIGN KEY (supersedes_closure_id) REFERENCES public.season_closures(id) ON DELETE RESTRICT;

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_carryover_percentage_check" CHECK (((carryover_percentage >= (0)::numeric) AND (carryover_percentage <= (100)::numeric)));

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_check1" CHECK (((carryover_percentage + discarded_percentage) = (100)::numeric));

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_discarded_percentage_check" CHECK (((discarded_percentage >= (0)::numeric) AND (discarded_percentage <= (100)::numeric)));

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."master_final_qualifications"
  ADD CONSTRAINT "master_final_qualifications_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_adjustments"
  ADD CONSTRAINT "point_adjustments_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."point_transactions"
  ADD CONSTRAINT "point_transactions_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ranking_snapshots"
  ADD CONSTRAINT "ranking_snapshots_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."season_closures"
  ADD CONSTRAINT "season_closures_season_id_fkey" FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE RESTRICT;

ALTER TABLE "public"."seasons"
  ADD CONSTRAINT "seasons_rounding_method_check" CHECK ((rounding_method = ANY (ARRAY['nearest_integer'::text, 'floor'::text, 'ceiling'::text])));

ALTER TABLE "public"."event_sponsors"
  ADD CONSTRAINT "event_sponsors_sponsor_id_fkey" FOREIGN KEY (sponsor_id) REFERENCES public.sponsors(id) ON DELETE RESTRICT;

ALTER TABLE "public"."bracket_stages"
  ADD CONSTRAINT "bracket_stages_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_categories"
  ADD CONSTRAINT "event_categories_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."player_category_history"
  ADD CONSTRAINT "player_category_history_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."ranking_snapshot_entries"
  ADD CONSTRAINT "ranking_snapshot_entries_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."registration_results"
  ADD CONSTRAINT "registration_results_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."scoring_rules"
  ADD CONSTRAINT "scoring_rules_subgroup_id_fkey" FOREIGN KEY (subgroup_id) REFERENCES public.subgroups(id) ON DELETE RESTRICT;

ALTER TABLE "public"."user_roles"
  ADD CONSTRAINT "user_roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_roles"
  ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, ROLE);

CREATE VIEW "public"."public_ranking_preview" WITH (security_barrier=true) AS  WITH current_season AS (
         SELECT s.id
           FROM public.seasons s
          WHERE ((s.status = 'active'::public.season_status) AND (CURRENT_DATE >= s.start_date) AND ((s.end_date IS NULL) OR (CURRENT_DATE <= s.end_date)))
          ORDER BY s.start_date DESC
         LIMIT 1
        ), latest_public_snapshot AS (
         SELECT rs.id,
            rs.season_id
           FROM (public.ranking_snapshots rs
             JOIN current_season cs ON ((cs.id = rs.season_id)))
          WHERE (rs.is_public = true)
          ORDER BY rs.as_of DESC NULLS LAST
         LIMIT 1
        )
 SELECT rse.player_id,
    p.display_name,
    rse."position",
    rse.points AS total_points,
    COALESCE(rse.events_played, 0) AS event_count
   FROM ((latest_public_snapshot snapshot
     JOIN public.ranking_snapshot_entries rse ON ((rse.snapshot_id = snapshot.id)))
     JOIN public.players p ON ((p.id = rse.player_id)))
  WHERE ((p.status = 'active'::text) AND (p.public_profile = true));

CREATE UNIQUE INDEX event_organizers_one_main ON public.event_organizers USING btree (event_id)
  WHERE (organizer_role = 'main_organizer'::text);

CREATE UNIQUE INDEX event_point_batches_one_active ON public.event_point_batches USING btree (event_id)
  WHERE (status = 'active'::text);

CREATE UNIQUE INDEX events_master_final_unique ON public.events USING btree (season_id)
  WHERE (event_type = 'master_final'::public.event_type);

CREATE UNIQUE INDEX events_regular_number_unique ON public.events USING btree (season_id, event_number)
  WHERE (event_type = 'regular'::public.event_type);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_table, entity_id, created_at DESC);

CREATE INDEX idx_events_season_status ON public.events USING btree (season_id, status);

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);

CREATE INDEX idx_matches_scheduled_at ON public.matches USING btree (scheduled_at);

CREATE INDEX idx_matches_stage_status ON public.matches USING btree (stage_id, status);

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_point_transactions_player_season ON public.point_transactions USING btree (player_id, season_id);

CREATE INDEX idx_ranking_entries_player ON public.ranking_snapshot_entries USING btree (player_id);

CREATE INDEX idx_ranking_snapshots_season_date ON public.ranking_snapshots USING btree (season_id, as_of DESC);

CREATE INDEX idx_registration_players_player ON public.registration_players USING btree (player_id);

CREATE INDEX idx_registrations_event_status ON public.registrations USING btree (event_id, status);

CREATE INDEX idx_registrations_submitted_by ON public.registrations USING btree (submitted_by);

CREATE UNIQUE INDEX matches_court_slot_unique ON public.matches USING btree (court_name, scheduled_at)
  WHERE ((court_name IS NOT NULL) AND (scheduled_at IS NOT NULL) AND (status <> 'cancelled'::public.match_status));

CREATE UNIQUE INDEX registrations_unique_active_pair ON public.registrations USING btree (event_id, event_category_id, pair_id)
  WHERE ((pair_id IS NOT NULL) AND (status <> 'cancelled'::public.registration_status));

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bracket_advance
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bracket_advance();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_check_pinned_news
  BEFORE INSERT OR UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pinned_news();

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_check_master_registration_player
  BEFORE INSERT OR UPDATE OF player_id ON public.registration_players
  FOR EACH ROW
  EXECUTE FUNCTION public.check_master_registration_player();

CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_validate_registration_category
  BEFORE INSERT OR UPDATE OF event_id, event_category_id ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_registration_category();

CREATE TRIGGER trg_guard_scoring_rule_edit
  BEFORE INSERT OR DELETE OR UPDATE ON public.scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_scoring_rule_edit();

CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "app_settings_admin_all" ON "public"."app_settings"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "app_settings_public_select" ON "public"."app_settings"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((key = ANY (ARRAY['site_name'::text, 'contact_email'::text, 'contact_phone'::text, 'maintenance_mode'::text])));

CREATE POLICY "audit_admin_insert" ON "public"."audit_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "audit_admin_select" ON "public"."audit_logs"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "bracket_entries_admin_all" ON "public"."bracket_entries"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "bracket_matches_admin_all" ON "public"."bracket_matches"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "bracket_stages_admin_all" ON "public"."bracket_stages"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_all" ON "public"."categories"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_public_select" ON "public"."categories"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_active);

CREATE POLICY "clubs_admin_all" ON "public"."clubs"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "clubs_public_select" ON "public"."clubs"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_published);

CREATE POLICY "groups_admin_all" ON "public"."competition_groups"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "stages_admin_all" ON "public"."competition_stages"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_admin_delete" ON "public"."contact_messages"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "contact_admin_select" ON "public"."contact_messages"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "contact_admin_update" ON "public"."contact_messages"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_public_insert" ON "public"."contact_messages"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (((status = 'new'::text) AND (internal_notes IS NULL)));

CREATE POLICY "event_categories_admin_all" ON "public"."event_categories"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_categories_public_select" ON "public"."event_categories"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE
    ((e.id = event_categories.event_id) AND (e.status = ANY (ARRAY['published'::public.event_status, 'registration_open'::public.event_status,
    'registration_closed'::public.event_status, 'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status]))))));

CREATE POLICY "event_organizers_admin_all" ON "public"."event_organizers"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_organizers_public_select" ON "public"."event_organizers"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE
    ((e.id = event_organizers.event_id) AND (e.status = ANY (ARRAY['published'::public.event_status, 'registration_open'::public.event_status,
    'registration_closed'::public.event_status, 'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status]))))));

CREATE POLICY "event_point_batches_admin_all" ON "public"."event_point_batches"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_scoring_admin_all" ON "public"."event_scoring_rules"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_sponsors_admin_all" ON "public"."event_sponsors"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "event_sponsors_public_select" ON "public"."event_sponsors"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE
    ((e.id = event_sponsors.event_id) AND (e.status = ANY (ARRAY['published'::public.event_status, 'registration_open'::public.event_status,
    'registration_closed'::public.event_status, 'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status]))))));

CREATE POLICY "venues_admin_all" ON "public"."event_venues"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "venues_public_select" ON "public"."event_venues"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_active);

CREATE POLICY "events_admin_all" ON "public"."events"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "events_public_select" ON "public"."events"
  FOR SELECT
  TO "anon", "authenticated"
  USING
    ((status = ANY (ARRAY['published'::public.event_status, 'registration_open'::public.event_status, 'registration_closed'::public.event_status,
    'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status])));

CREATE POLICY "faqs_admin_all" ON "public"."faqs"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "faqs_public_select" ON "public"."faqs"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_published);

CREATE POLICY "group_entries_admin_all" ON "public"."group_entries"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "incidents_admin_all" ON "public"."incidents"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "master_qualifications_admin_all" ON "public"."master_final_qualifications"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "master_qualifications_public_select" ON "public"."master_final_qualifications"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((eligibility_status = 'confirmed'::text));

CREATE POLICY "master_results_admin_all" ON "public"."master_final_results"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "master_results_public_select" ON "public"."master_final_results"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = master_final_results.event_id) AND (e.status = 'completed'::public.event_status)))));

CREATE POLICY "result_revisions_admin_all" ON "public"."match_result_revisions"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "match_sets_admin_all" ON "public"."match_sets"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "match_sets_public_select" ON "public"."match_sets"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (((public.matches m
     JOIN public.competition_stages cs ON ((cs.id = m.stage_id)))
     JOIN public.event_categories ec ON ((ec.id = cs.event_category_id)))
     JOIN public.events e ON ((e.id = ec.event_id)))
  WHERE
    ((m.id = match_sets.match_id) AND (m.status = 'validated'::public.match_status) AND (e.status = ANY (ARRAY['published'::public.event_status,
    'registration_open'::public.event_status,
    'registration_closed'::public.event_status, 'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status]))))));

CREATE POLICY "matches_admin_all" ON "public"."matches"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "matches_public_select" ON "public"."matches"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((status = 'validated'::public.match_status) AND (EXISTS ( SELECT 1
   FROM ((public.competition_stages cs
     JOIN public.event_categories ec ON ((ec.id = cs.event_category_id)))
     JOIN public.events e ON ((e.id = ec.event_id)))
  WHERE
    ((cs.id = matches.stage_id) AND (e.status = ANY (ARRAY['published'::public.event_status, 'registration_open'::public.event_status, 'registration_closed'::public.event_status,
    'in_progress'::public.event_status, 'completed'::public.event_status, 'postponed'::public.event_status])))))));

CREATE POLICY "news_admin_all" ON "public"."news"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "news_public_select" ON "public"."news"
  FOR SELECT
  TO "anon", "authenticated"
  USING (((status = 'published'::public.content_status) AND (published_at IS NOT NULL) AND (published_at <= now())));

CREATE POLICY "notifications_admin_all" ON "public"."notifications"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications_select_own" ON "public"."notifications"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));

CREATE POLICY "notifications_update_own" ON "public"."notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "player_categories_admin_all" ON "public"."player_category_history"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "player_categories_own_select" ON "public"."player_category_history"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.players p
  WHERE ((p.id = player_category_history.player_id) AND (p.profile_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "players_admin_all" ON "public"."players"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "players_public_select" ON "public"."players"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((public_profile AND (status = 'active'::text)));

CREATE POLICY "players_select_own_or_admin" ON "public"."players"
  FOR SELECT
  TO "authenticated"
  USING (((profile_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));

CREATE POLICY "adjustments_admin_all" ON "public"."point_adjustments"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "adjustments_select_own_or_admin" ON "public"."point_adjustments"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.players p
  WHERE ((p.id = point_adjustments.player_id) AND (p.profile_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "points_admin_all" ON "public"."point_transactions"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "points_select_own_or_admin" ON "public"."point_transactions"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.players p
  WHERE ((p.id = point_transactions.player_id) AND (p.profile_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "profiles_admin_all" ON "public"."profiles"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_select_own" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));

CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "ranking_entries_admin_all" ON "public"."ranking_snapshot_entries"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ranking_entries_public_select" ON "public"."ranking_snapshot_entries"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.ranking_snapshots rs
  WHERE ((rs.id = ranking_snapshot_entries.snapshot_id) AND rs.is_public))));

CREATE POLICY "ranking_snapshots_admin_all" ON "public"."ranking_snapshots"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ranking_snapshots_public_select" ON "public"."ranking_snapshots"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_public);

CREATE POLICY "registration_players_admin_all" ON "public"."registration_players"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "registration_players_select_own_or_admin" ON "public"."registration_players"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.players p
  WHERE ((p.id = registration_players.player_id) AND (p.profile_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "registration_results_admin_all" ON "public"."registration_results"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "registration_results_own_select" ON "public"."registration_results"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.registration_players rp
     JOIN public.players p ON ((p.id = rp.player_id)))
  WHERE ((rp.registration_id = registration_results.registration_id) AND (p.profile_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "registration_history_admin_all" ON "public"."registration_status_history"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "registrations_admin_all" ON "public"."registrations"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "registrations_select_own_or_admin" ON "public"."registrations"
  FOR SELECT
  TO "authenticated"
  USING (((submitted_by = ( SELECT auth.uid() AS uid)) OR public.is_admin() OR (EXISTS ( SELECT 1
   FROM (public.registration_players rp
     JOIN public.players p ON ((p.id = rp.player_id)))
  WHERE ((rp.registration_id = registrations.id) AND (p.profile_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "scoring_sets_admin_all" ON "public"."scoring_rule_sets"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "scoring_sets_public_select" ON "public"."scoring_rule_sets"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'published'::public.content_status));

CREATE POLICY "scoring_rules_admin_all" ON "public"."scoring_rules"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "closure_entries_admin_all" ON "public"."season_closure_entries"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "closures_admin_all" ON "public"."season_closures"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "seasons_admin_all" ON "public"."seasons"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "seasons_public_select" ON "public"."seasons"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = ANY (ARRAY['active'::public.season_status, 'closed'::public.season_status, 'archived'::public.season_status])));

CREATE POLICY "sponsors_admin_all" ON "public"."sponsors"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "sponsors_public_select" ON "public"."sponsors"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_published);

CREATE POLICY "subgroups_admin_all" ON "public"."subgroups"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subgroups_public_select" ON "public"."subgroups"
  FOR SELECT
  TO "anon", "authenticated"
  USING (is_active);

CREATE POLICY "roles_admin_all" ON "public"."user_roles"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "roles_select_own" ON "public"."user_roles"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));

GRANT EXECUTE ON FUNCTION "public"."add_points_adjustment"(uuid, uuid, numeric, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."add_points_adjustment"(uuid, uuid, numeric, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."add_points_adjustment"(uuid, uuid, numeric, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."add_points_adjustment"(uuid, uuid, numeric, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."apply_bracket_results"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."apply_bracket_results"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."apply_bracket_results"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."apply_bracket_results"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."assign_player_category"(uuid, uuid, uuid, date, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."assign_player_category"(uuid, uuid, uuid, date, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."assign_player_category"(uuid, uuid, uuid, date, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."assign_player_category"(uuid, uuid, uuid, date, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."award_event_points"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."award_event_points"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."award_event_points"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."award_event_points"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."bracket_clear_winner"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."bracket_clear_winner"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."bracket_clear_winner"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."bracket_clear_winner"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."bracket_place_winner"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."bracket_place_winner"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."bracket_place_winner"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."bracket_place_winner"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."check_master_registration_player"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."check_master_registration_player"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_master_registration_player"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_master_registration_player"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."check_pinned_news"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."check_pinned_news"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_pinned_news"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_pinned_news"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."clone_rule_set"(uuid, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."clone_rule_set"(uuid, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."clone_rule_set"(uuid, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."clone_rule_set"(uuid, text, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."close_season"(uuid, uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."close_season"(uuid, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."close_season"(uuid, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."close_season"(uuid, uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."closure_discrepancies"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."closure_discrepancies"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."closure_discrepancies"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."closure_discrepancies"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."compare_rule_sets"(uuid, uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."compare_rule_sets"(uuid, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."compare_rule_sets"(uuid, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."compare_rule_sets"(uuid, uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."compute_master_candidates"(uuid, integer, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."compute_master_candidates"(uuid, integer, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."compute_master_candidates"(uuid, integer, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."compute_master_candidates"(uuid, integer, integer) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."create_ranking_snapshot"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."create_ranking_snapshot"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_ranking_snapshot"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_ranking_snapshot"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."generate_bracket"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."generate_bracket"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."generate_bracket"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."generate_bracket"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_ranking_live"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_ranking_live"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_ranking_live"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_ranking_live"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."grant_admin_role"(text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."grant_admin_role"(text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."grant_admin_role"(text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."grant_admin_role"(text, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."guard_scoring_rule_edit"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."guard_scoring_rule_edit"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."guard_scoring_rule_edit"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."guard_scoring_rule_edit"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."has_role"(public.app_role) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."has_role"(public.app_role) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_role"(public.app_role) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_role"(public.app_role) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."list_admins"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."list_admins"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_admins"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_admins"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."list_audit_log"(text, text, timestamp WITH time zone, timestamp WITH time zone, integer, timestamp WITH time zone) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."list_audit_log"(text, text, timestamp WITH time zone, timestamp WITH time zone, integer, timestamp WITH time zone) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_audit_log"(text, text, timestamp WITH time zone, timestamp WITH time zone, integer, timestamp WITH time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_audit_log"(text, text, timestamp WITH time zone, timestamp WITH time zone, integer, timestamp WITH time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."log_audit"(text, text, text, jsonb, jsonb, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."log_audit"(text, text, text, jsonb, jsonb, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_audit"(text, text, text, jsonb, jsonb, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_audit"(text, text, text, jsonb, jsonb, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."move_category"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."move_category"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."move_category"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."move_category"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."move_subgroup"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."move_subgroup"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."move_subgroup"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."move_subgroup"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."preview_season_closure"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."preview_season_closure"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."preview_season_closure"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."preview_season_closure"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."publish_due_news"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."publish_due_news"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."publish_due_news"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."publish_due_news"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."publish_rule_set"(uuid, date) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."publish_rule_set"(uuid, date) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."publish_rule_set"(uuid, date) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."publish_rule_set"(uuid, date) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."revert_event_points"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."revert_event_points"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."revert_event_points"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."revert_event_points"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."revert_match"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."revert_match"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."revert_match"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."revert_match"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."revoke_admin_role"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."revoke_admin_role"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."revoke_admin_role"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."revoke_admin_role"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_app_setting"(text, jsonb, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."set_app_setting"(text, jsonb, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_app_setting"(text, jsonb, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_app_setting"(text, jsonb, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."trg_bracket_advance"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."trg_bracket_advance"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."trg_bracket_advance"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."trg_bracket_advance"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_match"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_match"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_match"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_match"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_registration_category"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_registration_category"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_registration_category"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_registration_category"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_rule_set"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_rule_set"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_rule_set"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_rule_set"(uuid) TO "service_role";

REVOKE ALL ON SEQUENCE "public"."audit_logs_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."audit_logs_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_logs_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."audit_logs_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."group_entries_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."group_entries_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."group_entries_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."group_entries_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."group_entries_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."group_entries_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."match_result_revisions_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_result_revisions_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."match_result_revisions_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_result_revisions_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."match_result_revisions_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_result_revisions_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."match_sets_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_sets_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."match_sets_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_sets_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."match_sets_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."match_sets_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."pair_members_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."pair_members_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."pair_members_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."pair_members_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."pair_members_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."pair_members_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."player_category_history_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."player_category_history_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."player_category_history_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."player_category_history_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."player_category_history_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."player_category_history_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."registration_players_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_players_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."registration_players_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_players_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."registration_players_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_players_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."registration_status_history_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_status_history_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."registration_status_history_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_status_history_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."registration_status_history_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."registration_status_history_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."season_closure_entries_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."season_closure_entries_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."season_closure_entries_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."season_closure_entries_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."season_closure_entries_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."season_closure_entries_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."user_roles_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."user_roles_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."user_roles_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."user_roles_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_settings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."app_settings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_settings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_settings" TO "service_role";

REVOKE ALL ON TABLE "public"."audit_logs" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."audit_logs" TO "anon";

REVOKE ALL ON TABLE "public"."audit_logs" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."audit_logs" TO "authenticated";

REVOKE ALL ON TABLE "public"."audit_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_entries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."bracket_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_entries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_entries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_matches" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."bracket_matches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_matches" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_matches" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_stages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."bracket_stages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_stages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bracket_stages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."clubs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."clubs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."clubs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."clubs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_groups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."competition_groups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_groups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_groups" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_stages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."competition_stages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_stages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."competition_stages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."contact_messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_categories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_categories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_categories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_categories" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_organizers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_organizers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_organizers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_organizers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_point_batches" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_point_batches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_point_batches" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_point_batches" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_scoring_rules" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_scoring_rules" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_scoring_rules" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_scoring_rules" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_sponsors" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_sponsors" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_sponsors" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_sponsors" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_venues" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."event_venues" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_venues" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_venues" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faqs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."faqs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faqs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."faqs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_entries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."group_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_entries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_entries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."incidents" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."incidents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."incidents" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."incidents" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_qualifications" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."master_final_qualifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_qualifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_qualifications" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_results" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."master_final_results" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_results" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."master_final_results" TO "service_role";

REVOKE ALL ON TABLE "public"."match_result_revisions" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."match_result_revisions" TO "anon";

REVOKE ALL ON TABLE "public"."match_result_revisions" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."match_result_revisions" TO "authenticated";

REVOKE ALL ON TABLE "public"."match_result_revisions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_result_revisions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_result_revisions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_sets" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."match_sets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_sets" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_sets" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."matches" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."matches" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."news" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."news" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."news" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."news" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon";

REVOKE ALL ON TABLE "public"."notifications" FROM "authenticated";

REVOKE ALL ("read_at") ON TABLE "public"."notifications" FROM "authenticated";

GRANT UPDATE ("read_at") ON TABLE "public"."notifications" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."notifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pair_members" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."pair_members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pair_members" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pair_members" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pairs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."pairs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pairs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pairs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."player_category_history" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."player_category_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."player_category_history" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."player_category_history" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."players" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."players" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."players" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."players" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."point_adjustments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."point_adjustments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."point_adjustments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."point_adjustments" TO "service_role";

REVOKE ALL ON TABLE "public"."point_transactions" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."point_transactions" TO "anon";

REVOKE ALL ON TABLE "public"."point_transactions" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."point_transactions" TO "authenticated";

REVOKE ALL ON TABLE "public"."point_transactions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."point_transactions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."point_transactions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

REVOKE ALL ("avatar_url") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("avatar_url") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("bio") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("bio") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("display_name") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("display_name") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("is_public") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("is_public") ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."ranking_snapshot_entries" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."ranking_snapshot_entries" TO "anon";

REVOKE ALL ON TABLE "public"."ranking_snapshot_entries" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."ranking_snapshot_entries" TO "authenticated";

REVOKE ALL ON TABLE "public"."ranking_snapshot_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ranking_snapshot_entries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ranking_snapshot_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."ranking_snapshots" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."ranking_snapshots" TO "anon";

REVOKE ALL ON TABLE "public"."ranking_snapshots" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."ranking_snapshots" TO "authenticated";

REVOKE ALL ON TABLE "public"."ranking_snapshots" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ranking_snapshots" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ranking_snapshots" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_players" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."registration_players" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_players" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_players" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_results" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."registration_results" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_results" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_results" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_status_history" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."registration_status_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_status_history" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registration_status_history" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registrations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."registrations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registrations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."registrations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rule_sets" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."scoring_rule_sets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rule_sets" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rule_sets" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rules" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."scoring_rules" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rules" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."scoring_rules" TO "service_role";

REVOKE ALL ON TABLE "public"."season_closure_entries" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."season_closure_entries" TO "anon";

REVOKE ALL ON TABLE "public"."season_closure_entries" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."season_closure_entries" TO "authenticated";

REVOKE ALL ON TABLE "public"."season_closure_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."season_closure_entries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."season_closure_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."season_closures" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."season_closures" TO "anon";

REVOKE ALL ON TABLE "public"."season_closures" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."season_closures" TO "authenticated";

REVOKE ALL ON TABLE "public"."season_closures" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."season_closures" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."season_closures" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seasons" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."seasons" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seasons" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."seasons" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sponsors" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sponsors" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sponsors" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sponsors" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subgroups" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."subgroups" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subgroups" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subgroups" TO "service_role";

REVOKE ALL ON TABLE "public"."user_roles" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."user_roles" TO "anon";

REVOKE ALL ON TABLE "public"."user_roles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."user_roles" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_roles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."public_ranking_preview" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."public_ranking_preview" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."public_ranking_preview" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."public_ranking_preview" TO "service_role";

