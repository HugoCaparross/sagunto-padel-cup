


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."category_gender" AS ENUM (
    'mixto',
    'masculino',
    'femenino'
);


ALTER TYPE "public"."category_gender" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pendiente',
    'verificado',
    'rechazado',
    'no_aplicable'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."season_status" AS ENUM (
    'planificada',
    'activa',
    'cerrada',
    'archivada'
);


ALTER TYPE "public"."season_status" OWNER TO "postgres";


CREATE TYPE "public"."tournament_type" AS ENUM (
    'regular',
    'master'
);


ALTER TYPE "public"."tournament_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_rollover_points"("p_points" numeric) RETURNS numeric
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select round(
    greatest(coalesce(p_points, 0), 0) * 0.30
  );
$$;


ALTER FUNCTION "public"."calculate_rollover_points"("p_points" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_inscripcion"("p_pair_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update pairs set estado = 'incompleta' where id = p_pair_id;
  update registrations set estado = 'cancelada' where pair_id = p_pair_id;
end;
$$;


ALTER FUNCTION "public"."cancelar_inscripcion"("p_pair_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_season"("p_season_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_season public.seasons%rowtype;
begin

  -- Solo administradores.
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar una temporada';
  end if;


  -- Obtener temporada.
  select *
  into v_season
  from public.seasons
  where id = p_season_id
  for update;


  if not found then
    raise exception 'La temporada indicada no existe';
  end if;


  -- Evitar cerrar dos veces.
  if v_season.status = 'finalizada' then
    raise exception 'La temporada ya está finalizada';
  end if;


  -- ==========================================================
  -- SNAPSHOT FINAL
  -- ==========================================================

  insert into public.ranking_snapshots (
    player_id,
    temporada,
    season_id,
    fecha_snapshot,
    posicion,
    puntos
  )
  select
    rp.player_id,
    v_season.name,
    v_season.id,
    current_date,
    row_number() over (
      order by
        sum(rp.puntos_obtenidos) desc,
        rp.player_id
    )::integer,
    sum(rp.puntos_obtenidos)
  from public.ranking_points rp
  where rp.season_id = v_season.id
  group by rp.player_id
  on conflict (
    player_id,
    temporada,
    fecha_snapshot
  )
  do update set
    season_id = excluded.season_id,
    posicion = excluded.posicion,
    puntos = excluded.puntos;


  -- ==========================================================
  -- GUARDAR RESULTADO DEL ROLLOVER EN SETTINGS
  -- ==========================================================

  update public.seasons
  set
    settings =
      coalesce(settings, '{}'::jsonb)
      || jsonb_build_object(
        'closed_at', now(),
        'final_ranking_snapshot_date', current_date,
        'rollover_percentage', v_season.rollover_percentage,
        'rollover_processed', true
      ),
    status = 'finalizada',
    updated_at = now()
  where id = v_season.id;


end;
$$;


ALTER FUNCTION "public"."close_season"("p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_previous public.seasons%rowtype;
  v_new_season_id uuid;
begin

  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear una temporada';
  end if;


  -- ==========================================================
  -- TEMPORADA ANTERIOR
  -- ==========================================================

  select *
  into v_previous
  from public.seasons
  where status = 'finalizada'
  order by end_date desc
  limit 1;


  -- ==========================================================
  -- CREAR NUEVA TEMPORADA
  -- ==========================================================

  insert into public.seasons (
    name,
    slug,
    start_date,
    end_date,
    status,
    rollover_percentage,
    settings
  )
  values (
    p_name,
    p_slug,
    p_start_date,
    p_end_date,
    'planificada',
    30.00,
    jsonb_build_object(
      'created_from_season_id', v_previous.id
    )
  )
  returning id
  into v_new_season_id;


  -- ==========================================================
  -- ROLLOVER 30 %
  -- ==========================================================

  if v_previous.id is not null then

    insert into public.ranking_points (
      player_id,
      tournament_id,
      categoria_id,
      puntos_obtenidos,
      ronda_alcanzada,
      fecha,
      season_id,
      source,
      metadata
    )
    select
      rp.player_id,
      null,
      rp.categoria_id,
      public.calculate_rollover_points(
        sum(rp.puntos_obtenidos)
      ),
      'rollover',
      p_start_date,
      v_new_season_id,
      'rollover',
      jsonb_build_object(
        'previous_season_id', v_previous.id,
        'previous_season_name', v_previous.name,
        'rollover_percentage', 30
      )
    from public.ranking_points rp
    where rp.season_id = v_previous.id
    group by
      rp.player_id,
      rp.categoria_id
    having sum(rp.puntos_obtenidos) > 0;

  end if;


  return v_new_season_id;

end;
$$;


ALTER FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_player_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.id
  from public.players p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;


ALTER FUNCTION "public"."current_player_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."season_status" DEFAULT 'planificada'::"public"."season_status" NOT NULL,
    "rollover_percentage" numeric(5,2) DEFAULT 30.00 NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seasons_dates_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "seasons_rollover_check" CHECK ((("rollover_percentage" >= (0)::numeric) AND ("rollover_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


COMMENT ON TABLE "public"."seasons" IS 'Temporadas del circuito Sagunto Padel Cup.';



CREATE OR REPLACE FUNCTION "public"."get_active_season"() RETURNS "public"."seasons"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select s.*
  from public.seasons s
  where s.status = 'activa'
  order by s.start_date desc
  limit 1;
$$;


ALTER FUNCTION "public"."get_active_season"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    sum(rp.puntos_obtenidos),
    0
  )
  from public.ranking_points rp
  where rp.player_id = p_player_id
    and rp.season_id = p_season_id
    and rp.categoria_id = p_categoria_id;
$$;


ALTER FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    sum(rp.puntos_obtenidos),
    0
  )
  from public.ranking_points rp
  where rp.player_id = p_player_id
    and rp.season_id = p_season_id;
$$;


ALTER FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select t.season_id
  from public.tournaments t
  where t.id = p_tournament_id;
$$;


ALTER FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.players (auth_user_id, nombre, apellidos, email, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellidos', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'telefono', '')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.players p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_self_role_escalation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'No autorizado a cambiar el rol';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_self_role_escalation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_pareja"("p_tournament_id" "uuid", "p_categoria_id" "uuid", "p_player_1_id" "uuid", "p_player_2_id" "uuid", "p_talla_camiseta" "text") RETURNS TABLE("pair_id" "uuid", "estado_final" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_cupo_maximo int;
  v_confirmadas int;
  v_estado text;
  v_pair_id uuid;
begin
  -- Bloquea la fila de cupo de esta categoría/torneo hasta el commit
  select cupo_maximo into v_cupo_maximo
  from tournament_categories
  where tournament_id = p_tournament_id and categoria_id = p_categoria_id
  for update;

  if v_cupo_maximo is null then
    v_cupo_maximo := 12;
  end if;

  select count(*) into v_confirmadas
  from pairs
  where tournament_id = p_tournament_id
    and categoria_id = p_categoria_id
    and estado = 'confirmada';

  if v_confirmadas < v_cupo_maximo then
    v_estado := case when p_player_2_id is not null then 'confirmada' else 'incompleta' end;
  else
    v_estado := 'lista_espera';
  end if;

  insert into pairs (tournament_id, categoria_id, player_1_id, player_2_id, estado)
  values (p_tournament_id, p_categoria_id, p_player_1_id, p_player_2_id, v_estado)
  returning id into v_pair_id;

  insert into registrations (pair_id, tournament_id, estado, talla_camiseta)
  values (
    v_pair_id,
    p_tournament_id,
    case when v_estado = 'lista_espera' then 'lista_espera' else 'confirmada' end,
    p_talla_camiseta
  );

  return query select v_pair_id, v_estado;
end;
$$;


ALTER FUNCTION "public"."registrar_pareja"("p_tournament_id" "uuid", "p_categoria_id" "uuid", "p_player_1_id" "uuid", "p_player_2_id" "uuid", "p_talla_camiseta" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entidad" "text" NOT NULL,
    "entidad_id" "uuid" NOT NULL,
    "accion" "text" NOT NULL,
    "usuario_id" "uuid",
    "valores_anteriores_json" "jsonb",
    "valores_nuevos_json" "jsonb",
    "fecha" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "fecha_obtenida" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brackets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "tramo" "text" NOT NULL,
    "estructura_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "campeon_pair_id" "uuid",
    "generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "brackets_tramo_check" CHECK (("tramo" = ANY (ARRAY['oro'::"text", 'plata'::"text", 'bronce'::"text"])))
);


ALTER TABLE "public"."brackets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "nivel_orden" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gender" "public"."category_gender" DEFAULT 'mixto'::"public"."category_gender" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "categories_nivel_orden_check" CHECK (("nivel_orden" > 0))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "categoria_anterior_id" "uuid",
    "categoria_nueva_id" "uuid",
    "motivo" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmado_por" "uuid",
    "status" "text" DEFAULT 'aprobada'::"text" NOT NULL,
    "requested_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."category_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "direccion" "text",
    "lat" numeric,
    "lng" numeric,
    "num_pistas" integer,
    "telefono" "text",
    "fotos_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "tipo" "text" DEFAULT 'foto'::"text" NOT NULL,
    "subido_por" "text",
    "player_tag_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "caption" "text",
    "orden" integer DEFAULT 0 NOT NULL,
    "published" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "gallery_items_tipo_check" CHECK (("tipo" = ANY (ARRAY['foto'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."gallery_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_upload_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "nombre_colaborador" "text" NOT NULL,
    "token_acceso" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "fecha_expiracion" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gallery_upload_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_standings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "pair_id" "uuid" NOT NULL,
    "partidos_jugados" integer DEFAULT 0 NOT NULL,
    "victorias" integer DEFAULT 0 NOT NULL,
    "derrotas" integer DEFAULT 0 NOT NULL,
    "sets_favor" integer DEFAULT 0 NOT NULL,
    "sets_contra" integer DEFAULT 0 NOT NULL,
    "juegos_favor" integer DEFAULT 0 NOT NULL,
    "juegos_contra" integer DEFAULT 0 NOT NULL,
    "puntos" integer DEFAULT 0 NOT NULL,
    "posicion" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_standings_non_negative_check" CHECK ((("partidos_jugados" >= 0) AND ("victorias" >= 0) AND ("derrotas" >= 0) AND ("sets_favor" >= 0) AND ("sets_contra" >= 0) AND ("juegos_favor" >= 0) AND ("juegos_contra" >= 0) AND ("puntos" >= 0)))
);


ALTER TABLE "public"."group_standings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "criterio_desempate_json" "jsonb" DEFAULT '["enfrentamiento_directo", "diferencia_sets", "diferencia_juegos"]'::"jsonb" NOT NULL,
    "draw_position" integer,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "fase" "text" NOT NULL,
    "group_id" "uuid",
    "pair_1_id" "uuid",
    "pair_2_id" "uuid",
    "pista" "text",
    "hora_programada" timestamp with time zone,
    "hora_inicio_real" timestamp with time zone,
    "hora_fin" timestamp with time zone,
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "resultado_json" "jsonb",
    "introducido_por" "uuid",
    "fecha_modificacion" timestamp with time zone,
    "tramo" "text",
    "siguiente_match_id" "uuid",
    "siguiente_slot" integer,
    "format" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "postponed_from" timestamp with time zone,
    "postponement_reason" "text",
    "round_number" integer,
    "match_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "matches_distinct_pairs_check" CHECK ((("pair_1_id" IS NULL) OR ("pair_2_id" IS NULL) OR ("pair_1_id" <> "pair_2_id"))),
    CONSTRAINT "matches_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'en_juego'::"text", 'finalizado'::"text", 'walkover'::"text", 'retirada'::"text", 'aplazado'::"text"]))),
    CONSTRAINT "matches_fase_check" CHECK (("fase" = ANY (ARRAY['grupos'::"text", 'octavos'::"text", 'cuartos'::"text", 'semis'::"text", 'final'::"text"]))),
    CONSTRAINT "matches_siguiente_slot_check" CHECK (("siguiente_slot" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "matches_tramo_check" CHECK (("tramo" = ANY (ARRAY['oro'::"text", 'plata'::"text", 'bronce'::"text"])))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


COMMENT ON TABLE "public"."matches" IS 'Partidos oficiales y resultados gestionados por la organización.';



CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "titulo" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "contenido" "text",
    "imagen_destacada" "text",
    "categoria" "text",
    "estado" "text" DEFAULT 'borrador'::"text" NOT NULL,
    "fecha_publicacion" timestamp with time zone,
    "excerpt" "text",
    "author_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "news_estado_check" CHECK (("estado" = ANY (ARRAY['borrador'::"text", 'publicado'::"text"])))
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "canal" "text" NOT NULL,
    "contenido" "text",
    "leido" boolean DEFAULT false NOT NULL,
    "fecha_envio" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    CONSTRAINT "notifications_canal_check" CHECK (("canal" = ANY (ARRAY['email'::"text", 'in_app'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "player_1_id" "uuid",
    "player_2_id" "uuid",
    "estado" "text" DEFAULT 'pendiente_pago'::"text" NOT NULL,
    "cabeza_de_serie" boolean DEFAULT false NOT NULL,
    "fecha_inscripcion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seed_position" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pairs_distinct_players_check" CHECK ((("player_1_id" IS NULL) OR ("player_2_id" IS NULL) OR ("player_1_id" <> "player_2_id"))),
    CONSTRAINT "pairs_estado_check" CHECK (("estado" = ANY (ARRAY['confirmada'::"text", 'lista_espera'::"text", 'incompleta'::"text", 'pendiente_pago'::"text"])))
);


ALTER TABLE "public"."pairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_pool" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "disponible" boolean DEFAULT true NOT NULL,
    "fecha_publicacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "disponibilidad" "text" DEFAULT 'buscando'::"text" NOT NULL,
    "notas" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."partner_pool" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "nombre" "text" NOT NULL,
    "apellidos" "text",
    "email" "text" NOT NULL,
    "telefono" "text",
    "foto_url" "text",
    "categoria_actual_id" "uuid",
    "mano_dominante" "text",
    "pala" "text",
    "ciudad" "text",
    "instagram" "text",
    "visibilidad_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "fecha_alta" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estado" "text" DEFAULT 'activo'::"text" NOT NULL,
    "onboarding_completado" boolean DEFAULT false NOT NULL,
    "role" "text" DEFAULT 'player'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "players_estado_check" CHECK (("estado" = ANY (ARRAY['activo'::"text", 'suspendido'::"text", 'baja'::"text"]))),
    CONSTRAINT "players_mano_dominante_check" CHECK (("mano_dominante" = ANY (ARRAY['diestro'::"text", 'zurdo'::"text"]))),
    CONSTRAINT "players_role_check" CHECK (("role" = ANY (ARRAY['player'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."premios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid",
    "tramo" "text",
    "posicion" "text",
    "descripcion" "text" NOT NULL,
    "patrocinador_id" "uuid",
    "visible" boolean DEFAULT false NOT NULL,
    "fecha_publicacion_prevista" "date",
    "value" numeric(10,2),
    "image" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "premios_tramo_check" CHECK (("tramo" = ANY (ARRAY['oro'::"text", 'plata'::"text", 'bronce'::"text", 'sorteo'::"text"])))
);


ALTER TABLE "public"."premios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ranking_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "puntos_obtenidos" integer NOT NULL,
    "ronda_alcanzada" "text" NOT NULL,
    "fecha" "date" NOT NULL,
    "fecha_caducidad" "date" GENERATED ALWAYS AS (("fecha" + '365 days'::interval)) STORED,
    "season_id" "uuid",
    "source" "text" DEFAULT 'tournament'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ranking_points_points_check" CHECK (("puntos_obtenidos" >= 0))
);


ALTER TABLE "public"."ranking_points" OWNER TO "postgres";


COMMENT ON TABLE "public"."ranking_points" IS 'Ledger de puntos individuales. El ranking se gestiona por temporada.';



CREATE TABLE IF NOT EXISTS "public"."ranking_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "temporada" "text" NOT NULL,
    "fecha_snapshot" "date" NOT NULL,
    "posicion" integer,
    "puntos" integer,
    "season_id" "uuid",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ranking_snapshots_points_check" CHECK ((("puntos" IS NULL) OR ("puntos" >= 0))),
    CONSTRAINT "ranking_snapshots_position_check" CHECK ((("posicion" IS NULL) OR ("posicion" > 0)))
);


ALTER TABLE "public"."ranking_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pair_id" "uuid" NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "estado" "text" DEFAULT 'pendiente_pago'::"text" NOT NULL,
    "metodo_pago" "text" DEFAULT 'fisico'::"text" NOT NULL,
    "fecha_pago" timestamp with time zone,
    "importe" numeric(10,2),
    "talla_camiseta" "text",
    "qr_code" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(12), 'hex'::"text"),
    "checked_in" boolean DEFAULT false NOT NULL,
    "checked_in_at" timestamp with time zone,
    "categoria_id" "uuid",
    "payment_status" "public"."payment_status" DEFAULT 'pendiente'::"public"."payment_status" NOT NULL,
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registrations_estado_check" CHECK (("estado" = ANY (ARRAY['confirmada'::"text", 'lista_espera'::"text", 'pendiente_pago'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "registrations_importe_check" CHECK ((("importe" IS NULL) OR ("importe" >= (0)::numeric))),
    CONSTRAINT "registrations_talla_camiseta_check" CHECK (("talla_camiseta" = ANY (ARRAY['XS'::"text", 'S'::"text", 'M'::"text", 'L'::"text", 'XL'::"text", 'XXL'::"text"])))
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."registrations" IS 'Inscripciones. El pago se realiza externamente y se verifica manualmente.';



CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "logo_url" "text",
    "descripcion" "text",
    "enlace" "text",
    "tipo" "text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sponsors_tipo_check" CHECK (("tipo" = ANY (ARRAY['comercial'::"text", 'institucion'::"text"])))
);


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_categories" (
    "tournament_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "cupo_minimo" integer DEFAULT 6 NOT NULL,
    "cupo_maximo" integer DEFAULT 12 NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tournament_categories_cupos_check" CHECK ((("cupo_minimo" > 0) AND ("cupo_maximo" >= "cupo_minimo")))
);


ALTER TABLE "public"."tournament_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "club_id" "uuid",
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "estado" "text" DEFAULT 'borrador'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "precio_texto" "text",
    "descripcion" "text",
    "season_id" "uuid",
    "tournament_type" "public"."tournament_type" DEFAULT 'regular'::"public"."tournament_type" NOT NULL,
    "draw_mode" "text" DEFAULT 'aleatorio'::"text" NOT NULL,
    "draw_seed" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "master_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "cover_image" "text",
    "published_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tournaments_estado_check" CHECK (("estado" = ANY (ARRAY['borrador'::"text", 'publicado'::"text", 'inscripciones_abiertas'::"text", 'en_juego'::"text", 'finalizado'::"text", 'archivado'::"text"]))),
    CONSTRAINT "tournaments_fechas_check" CHECK (("fecha_fin" >= "fecha_inicio"))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_changes"
    ADD CONSTRAINT "category_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_items"
    ADD CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_upload_access"
    ADD CONSTRAINT "gallery_upload_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_upload_access"
    ADD CONSTRAINT "gallery_upload_access_token_acceso_key" UNIQUE ("token_acceso");



ALTER TABLE ONLY "public"."group_standings"
    ADD CONSTRAINT "group_standings_group_id_pair_id_key" UNIQUE ("group_id", "pair_id");



ALTER TABLE ONLY "public"."group_standings"
    ADD CONSTRAINT "group_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_pool"
    ADD CONSTRAINT "partner_pool_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."premios"
    ADD CONSTRAINT "premios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_points"
    ADD CONSTRAINT "ranking_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_categories"
    ADD CONSTRAINT "tournament_categories_pkey" PRIMARY KEY ("tournament_id", "categoria_id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_slug_key" UNIQUE ("slug");



CREATE INDEX "audit_log_date_idx" ON "public"."audit_log" USING "btree" ("fecha" DESC);



CREATE INDEX "audit_log_entity_idx" ON "public"."audit_log" USING "btree" ("entidad", "entidad_id");



CREATE INDEX "audit_log_user_idx" ON "public"."audit_log" USING "btree" ("usuario_id");



CREATE INDEX "badges_player_idx" ON "public"."badges" USING "btree" ("player_id");



CREATE INDEX "brackets_category_idx" ON "public"."brackets" USING "btree" ("categoria_id");



CREATE INDEX "brackets_tier_idx" ON "public"."brackets" USING "btree" ("tramo");



CREATE UNIQUE INDEX "brackets_tournament_category_tramo_unique" ON "public"."brackets" USING "btree" ("tournament_id", "categoria_id", "tramo");



CREATE INDEX "brackets_tournament_idx" ON "public"."brackets" USING "btree" ("tournament_id");



CREATE INDEX "categories_active_idx" ON "public"."categories" USING "btree" ("active");



CREATE INDEX "categories_gender_idx" ON "public"."categories" USING "btree" ("gender");



CREATE INDEX "categories_nivel_orden_idx" ON "public"."categories" USING "btree" ("nivel_orden");



CREATE INDEX "category_changes_player_date_idx" ON "public"."category_changes" USING "btree" ("player_id", "fecha" DESC);



CREATE INDEX "category_changes_player_idx" ON "public"."category_changes" USING "btree" ("player_id");



CREATE INDEX "category_changes_status_idx" ON "public"."category_changes" USING "btree" ("status");



CREATE INDEX "clubs_active_idx" ON "public"."clubs" USING "btree" ("active");



CREATE INDEX "gallery_items_player_idx" ON "public"."gallery_items" USING "btree" ("player_tag_id");



CREATE INDEX "gallery_items_player_tag_idx" ON "public"."gallery_items" USING "btree" ("player_tag_id");



CREATE INDEX "gallery_items_published_idx" ON "public"."gallery_items" USING "btree" ("published", "orden");



CREATE INDEX "gallery_items_tournament_idx" ON "public"."gallery_items" USING "btree" ("tournament_id");



CREATE INDEX "gallery_upload_access_active_idx" ON "public"."gallery_upload_access" USING "btree" ("active");



CREATE INDEX "gallery_upload_access_token_idx" ON "public"."gallery_upload_access" USING "btree" ("token_acceso");



CREATE INDEX "gallery_upload_access_tournament_idx" ON "public"."gallery_upload_access" USING "btree" ("tournament_id");



CREATE INDEX "group_standings_group_idx" ON "public"."group_standings" USING "btree" ("group_id");



CREATE UNIQUE INDEX "group_standings_group_pair_unique" ON "public"."group_standings" USING "btree" ("group_id", "pair_id");



CREATE INDEX "group_standings_pair_idx" ON "public"."group_standings" USING "btree" ("pair_id");



CREATE INDEX "groups_category_idx" ON "public"."groups" USING "btree" ("categoria_id");



CREATE INDEX "groups_tournament_category_idx" ON "public"."groups" USING "btree" ("tournament_id", "categoria_id");



CREATE INDEX "groups_tournament_idx" ON "public"."groups" USING "btree" ("tournament_id");



CREATE INDEX "idx_matches_tournament" ON "public"."matches" USING "btree" ("tournament_id");



CREATE INDEX "idx_pairs_tournament" ON "public"."pairs" USING "btree" ("tournament_id");



CREATE INDEX "idx_players_categoria" ON "public"."players" USING "btree" ("categoria_actual_id");



CREATE INDEX "idx_ranking_points_caducidad" ON "public"."ranking_points" USING "btree" ("fecha_caducidad");



CREATE INDEX "idx_ranking_points_player" ON "public"."ranking_points" USING "btree" ("player_id");



CREATE INDEX "idx_registrations_tournament" ON "public"."registrations" USING "btree" ("tournament_id");



CREATE INDEX "matches_category_idx" ON "public"."matches" USING "btree" ("categoria_id");



CREATE INDEX "matches_court_idx" ON "public"."matches" USING "btree" ("pista");



CREATE INDEX "matches_pair1_idx" ON "public"."matches" USING "btree" ("pair_1_id");



CREATE INDEX "matches_pair2_idx" ON "public"."matches" USING "btree" ("pair_2_id");



CREATE INDEX "matches_phase_idx" ON "public"."matches" USING "btree" ("fase");



CREATE INDEX "matches_schedule_idx" ON "public"."matches" USING "btree" ("hora_programada");



CREATE INDEX "matches_status_idx" ON "public"."matches" USING "btree" ("estado");



CREATE INDEX "matches_tournament_category_idx" ON "public"."matches" USING "btree" ("tournament_id", "categoria_id");



CREATE INDEX "matches_tournament_idx" ON "public"."matches" USING "btree" ("tournament_id");



CREATE INDEX "news_estado_idx" ON "public"."news" USING "btree" ("estado");



CREATE INDEX "news_fecha_publicacion_idx" ON "public"."news" USING "btree" ("fecha_publicacion" DESC);



CREATE INDEX "news_publication_idx" ON "public"."news" USING "btree" ("estado", "fecha_publicacion" DESC);



CREATE INDEX "notifications_player_idx" ON "public"."notifications" USING "btree" ("player_id");



CREATE INDEX "notifications_unread_idx" ON "public"."notifications" USING "btree" ("player_id", "leido", "fecha_envio" DESC);



CREATE INDEX "pairs_category_idx" ON "public"."pairs" USING "btree" ("categoria_id");



CREATE INDEX "pairs_estado_idx" ON "public"."pairs" USING "btree" ("estado");



CREATE INDEX "pairs_player1_idx" ON "public"."pairs" USING "btree" ("player_1_id");



CREATE INDEX "pairs_player2_idx" ON "public"."pairs" USING "btree" ("player_2_id");



CREATE UNIQUE INDEX "pairs_player_1_unique_active" ON "public"."pairs" USING "btree" ("tournament_id", "categoria_id", "player_1_id") WHERE (("player_1_id" IS NOT NULL) AND ("estado" = ANY (ARRAY['confirmada'::"text", 'pendiente_pago'::"text", 'lista_espera'::"text"])));



CREATE UNIQUE INDEX "pairs_player_2_unique_active" ON "public"."pairs" USING "btree" ("tournament_id", "categoria_id", "player_2_id") WHERE (("player_2_id" IS NOT NULL) AND ("estado" = ANY (ARRAY['confirmada'::"text", 'pendiente_pago'::"text", 'lista_espera'::"text"])));



CREATE INDEX "pairs_tournament_idx" ON "public"."pairs" USING "btree" ("tournament_id");



CREATE INDEX "partner_pool_category_idx" ON "public"."partner_pool" USING "btree" ("categoria_id");



CREATE INDEX "partner_pool_disponibilidad_idx" ON "public"."partner_pool" USING "btree" ("disponibilidad");



CREATE UNIQUE INDEX "partner_pool_player_tournament_category" ON "public"."partner_pool" USING "btree" ("player_id", "tournament_id", "categoria_id");



CREATE INDEX "partner_pool_search_idx" ON "public"."partner_pool" USING "btree" ("tournament_id", "categoria_id", "disponible", "fecha_publicacion" DESC);



CREATE INDEX "partner_pool_tournament_idx" ON "public"."partner_pool" USING "btree" ("tournament_id");



CREATE INDEX "players_auth_user_idx" ON "public"."players" USING "btree" ("auth_user_id");



CREATE INDEX "players_categoria_actual_idx" ON "public"."players" USING "btree" ("categoria_actual_id");



CREATE INDEX "players_category_idx" ON "public"."players" USING "btree" ("categoria_actual_id");



CREATE INDEX "players_email_idx" ON "public"."players" USING "btree" ("lower"("email"));



CREATE INDEX "players_estado_idx" ON "public"."players" USING "btree" ("estado");



CREATE INDEX "players_nombre_idx" ON "public"."players" USING "btree" ("lower"("nombre"), "lower"(COALESCE("apellidos", ''::"text")));



CREATE INDEX "players_status_idx" ON "public"."players" USING "btree" ("estado");



CREATE INDEX "premios_category_idx" ON "public"."premios" USING "btree" ("categoria_id");



CREATE INDEX "premios_tier_idx" ON "public"."premios" USING "btree" ("tramo");



CREATE INDEX "premios_tournament_idx" ON "public"."premios" USING "btree" ("tournament_id");



CREATE INDEX "premios_tournament_visible_idx" ON "public"."premios" USING "btree" ("tournament_id", "visible", "fecha_publicacion_prevista");



CREATE INDEX "ranking_points_category_idx" ON "public"."ranking_points" USING "btree" ("categoria_id");



CREATE INDEX "ranking_points_player_idx" ON "public"."ranking_points" USING "btree" ("player_id");



CREATE UNIQUE INDEX "ranking_points_player_tournament_category" ON "public"."ranking_points" USING "btree" ("player_id", "tournament_id", "categoria_id");



CREATE INDEX "ranking_points_points_idx" ON "public"."ranking_points" USING "btree" ("season_id", "categoria_id", "puntos_obtenidos" DESC);



CREATE INDEX "ranking_points_season_category_idx" ON "public"."ranking_points" USING "btree" ("season_id", "categoria_id");



CREATE INDEX "ranking_points_season_idx" ON "public"."ranking_points" USING "btree" ("season_id");



CREATE INDEX "ranking_points_season_player_idx" ON "public"."ranking_points" USING "btree" ("season_id", "player_id");



CREATE INDEX "ranking_points_tournament_idx" ON "public"."ranking_points" USING "btree" ("tournament_id");



CREATE INDEX "ranking_snapshots_date_idx" ON "public"."ranking_snapshots" USING "btree" ("fecha_snapshot");



CREATE INDEX "ranking_snapshots_player_idx" ON "public"."ranking_snapshots" USING "btree" ("player_id");



CREATE UNIQUE INDEX "ranking_snapshots_player_season_date" ON "public"."ranking_snapshots" USING "btree" ("player_id", "temporada", "fecha_snapshot");



CREATE INDEX "ranking_snapshots_season_idx" ON "public"."ranking_snapshots" USING "btree" ("season_id");



CREATE INDEX "registrations_category_idx" ON "public"."registrations" USING "btree" ("categoria_id");



CREATE INDEX "registrations_checkin_idx" ON "public"."registrations" USING "btree" ("checked_in");



CREATE INDEX "registrations_estado_idx" ON "public"."registrations" USING "btree" ("estado");



CREATE INDEX "registrations_pair_idx" ON "public"."registrations" USING "btree" ("pair_id");



CREATE UNIQUE INDEX "registrations_pair_tournament_unique" ON "public"."registrations" USING "btree" ("pair_id", "tournament_id");



CREATE INDEX "registrations_payment_status_idx" ON "public"."registrations" USING "btree" ("payment_status");



CREATE INDEX "registrations_tournament_idx" ON "public"."registrations" USING "btree" ("tournament_id");



CREATE INDEX "seasons_dates_idx" ON "public"."seasons" USING "btree" ("start_date", "end_date");



CREATE INDEX "seasons_status_idx" ON "public"."seasons" USING "btree" ("status");



CREATE INDEX "sponsors_active_idx" ON "public"."sponsors" USING "btree" ("active");



CREATE INDEX "sponsors_order_idx" ON "public"."sponsors" USING "btree" ("orden");



CREATE INDEX "sponsors_tournament_idx" ON "public"."sponsors" USING "btree" ("tournament_id");



CREATE INDEX "sponsors_tournament_order_idx" ON "public"."sponsors" USING "btree" ("tournament_id", "orden");



CREATE INDEX "tournament_categories_category_idx" ON "public"."tournament_categories" USING "btree" ("categoria_id");



CREATE INDEX "tournament_categories_tournament_idx" ON "public"."tournament_categories" USING "btree" ("tournament_id");



CREATE INDEX "tournaments_club_idx" ON "public"."tournaments" USING "btree" ("club_id");



CREATE INDEX "tournaments_estado_idx" ON "public"."tournaments" USING "btree" ("estado");



CREATE INDEX "tournaments_fecha_idx" ON "public"."tournaments" USING "btree" ("fecha_inicio", "fecha_fin");



CREATE INDEX "tournaments_season_idx" ON "public"."tournaments" USING "btree" ("season_id");



CREATE INDEX "tournaments_status_date_idx" ON "public"."tournaments" USING "btree" ("estado", "fecha_inicio");



CREATE INDEX "tournaments_type_idx" ON "public"."tournaments" USING "btree" ("tournament_type");



CREATE OR REPLACE TRIGGER "brackets_set_updated_at" BEFORE UPDATE ON "public"."brackets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "clubs_set_updated_at" BEFORE UPDATE ON "public"."clubs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "gallery_items_set_updated_at" BEFORE UPDATE ON "public"."gallery_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "group_standings_set_updated_at" BEFORE UPDATE ON "public"."group_standings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "groups_set_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "matches_set_updated_at" BEFORE UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "news_set_updated_at" BEFORE UPDATE ON "public"."news" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "pairs_set_updated_at" BEFORE UPDATE ON "public"."pairs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "partner_pool_set_updated_at" BEFORE UPDATE ON "public"."partner_pool" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "players_set_updated_at" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "premios_set_updated_at" BEFORE UPDATE ON "public"."premios" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "registrations_set_updated_at" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "seasons_set_updated_at" BEFORE UPDATE ON "public"."seasons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sponsors_set_updated_at" BEFORE UPDATE ON "public"."sponsors" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tournament_categories_set_updated_at" BEFORE UPDATE ON "public"."tournament_categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tournaments_set_updated_at" BEFORE UPDATE ON "public"."tournaments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_prevent_role_change" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_self_role_escalation"();



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_campeon_pair_id_fkey" FOREIGN KEY ("campeon_pair_id") REFERENCES "public"."pairs"("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."brackets"
    ADD CONSTRAINT "brackets_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_changes"
    ADD CONSTRAINT "category_changes_categoria_anterior_id_fkey" FOREIGN KEY ("categoria_anterior_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."category_changes"
    ADD CONSTRAINT "category_changes_categoria_nueva_id_fkey" FOREIGN KEY ("categoria_nueva_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."category_changes"
    ADD CONSTRAINT "category_changes_confirmado_por_fkey" FOREIGN KEY ("confirmado_por") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."category_changes"
    ADD CONSTRAINT "category_changes_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_items"
    ADD CONSTRAINT "gallery_items_player_tag_id_fkey" FOREIGN KEY ("player_tag_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."gallery_items"
    ADD CONSTRAINT "gallery_items_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_upload_access"
    ADD CONSTRAINT "gallery_upload_access_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_standings"
    ADD CONSTRAINT "group_standings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_standings"
    ADD CONSTRAINT "group_standings_pair_id_fkey" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_introducido_por_fkey" FOREIGN KEY ("introducido_por") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pair_1_id_fkey" FOREIGN KEY ("pair_1_id") REFERENCES "public"."pairs"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pair_2_id_fkey" FOREIGN KEY ("pair_2_id") REFERENCES "public"."pairs"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_siguiente_match_id_fkey" FOREIGN KEY ("siguiente_match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_player_1_id_fkey" FOREIGN KEY ("player_1_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_player_2_id_fkey" FOREIGN KEY ("player_2_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_pool"
    ADD CONSTRAINT "partner_pool_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."partner_pool"
    ADD CONSTRAINT "partner_pool_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_pool"
    ADD CONSTRAINT "partner_pool_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_categoria_actual_id_fkey" FOREIGN KEY ("categoria_actual_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."premios"
    ADD CONSTRAINT "premios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."premios"
    ADD CONSTRAINT "premios_patrocinador_id_fkey" FOREIGN KEY ("patrocinador_id") REFERENCES "public"."sponsors"("id");



ALTER TABLE ONLY "public"."premios"
    ADD CONSTRAINT "premios_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ranking_points"
    ADD CONSTRAINT "ranking_points_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."ranking_points"
    ADD CONSTRAINT "ranking_points_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ranking_points"
    ADD CONSTRAINT "ranking_points_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pair_id_fkey" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_categories"
    ADD CONSTRAINT "tournament_categories_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_categories"
    ADD CONSTRAINT "tournament_categories_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "audit_admin_all" ON "public"."audit_log" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "audit_admin_select" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "badges_admin_all" ON "public"."badges" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "badges_authenticated_select" ON "public"."badges" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."brackets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brackets_admin_all" ON "public"."brackets" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "brackets_authenticated_select" ON "public"."brackets" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_admin_all" ON "public"."categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "categories_public_select" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."category_changes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_changes_admin_all" ON "public"."category_changes" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "category_changes_self_select" ON "public"."category_changes" FOR SELECT TO "authenticated" USING ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clubs_admin_all" ON "public"."clubs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "clubs_public_select" ON "public"."clubs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "gallery_access_admin_all" ON "public"."gallery_upload_access" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."gallery_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gallery_items_admin_all" ON "public"."gallery_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "gallery_items_public_select" ON "public"."gallery_items" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."gallery_upload_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_standings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_admin_all" ON "public"."groups" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "groups_authenticated_select" ON "public"."groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "lectura publica bolsa de pareja" ON "public"."partner_pool" FOR SELECT USING (true);



CREATE POLICY "lectura publica categorias" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "lectura publica categorias de torneo" ON "public"."tournament_categories" FOR SELECT USING (true);



CREATE POLICY "lectura publica clasificacion" ON "public"."group_standings" FOR SELECT USING (true);



CREATE POLICY "lectura publica clubs" ON "public"."clubs" FOR SELECT USING (true);



CREATE POLICY "lectura publica cuadros" ON "public"."brackets" FOR SELECT USING (true);



CREATE POLICY "lectura publica de parejas confirmadas" ON "public"."pairs" FOR SELECT USING (true);



CREATE POLICY "lectura publica de perfiles" ON "public"."players" FOR SELECT USING (true);



CREATE POLICY "lectura publica galeria" ON "public"."gallery_items" FOR SELECT USING (true);



CREATE POLICY "lectura publica grupos" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "lectura publica historico ranking" ON "public"."ranking_snapshots" FOR SELECT USING (true);



CREATE POLICY "lectura publica noticias publicadas" ON "public"."news" FOR SELECT USING (("estado" = 'publicado'::"text"));



CREATE POLICY "lectura publica partidos" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "lectura publica patrocinadores" ON "public"."sponsors" FOR SELECT USING (true);



CREATE POLICY "lectura publica premios visibles" ON "public"."premios" FOR SELECT USING (("visible" = true));



CREATE POLICY "lectura publica ranking" ON "public"."ranking_points" FOR SELECT USING (true);



CREATE POLICY "lectura publica torneos" ON "public"."tournaments" FOR SELECT USING (("estado" <> 'borrador'::"text"));



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "matches_admin_all" ON "public"."matches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "matches_authenticated_select" ON "public"."matches" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_admin_all" ON "public"."news" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "news_public_select" ON "public"."news" FOR SELECT TO "authenticated", "anon" USING (("estado" = 'publicado'::"text"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_all" ON "public"."notifications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "notifications_self_select" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "notifications_self_update" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"())) WITH CHECK ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."pairs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pairs_admin_all" ON "public"."pairs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "pairs_authenticated_select" ON "public"."pairs" FOR SELECT TO "authenticated" USING ((("player_1_id" = "public"."current_player_id"()) OR ("player_2_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "pairs_self_insert" ON "public"."pairs" FOR INSERT TO "authenticated" WITH CHECK ((("player_1_id" = "public"."current_player_id"()) OR ("player_2_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "pairs_self_update" ON "public"."pairs" FOR UPDATE TO "authenticated" USING ((("player_1_id" = "public"."current_player_id"()) OR ("player_2_id" = "public"."current_player_id"()) OR "public"."is_admin"())) WITH CHECK ((("player_1_id" = "public"."current_player_id"()) OR ("player_2_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."partner_pool" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partner_pool_admin_all" ON "public"."partner_pool" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "partner_pool_authenticated_select" ON "public"."partner_pool" FOR SELECT TO "authenticated" USING ((("disponible" = true) OR ("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "partner_pool_self_delete" ON "public"."partner_pool" FOR DELETE TO "authenticated" USING ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "partner_pool_self_insert" ON "public"."partner_pool" FOR INSERT TO "authenticated" WITH CHECK ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



CREATE POLICY "partner_pool_self_update" ON "public"."partner_pool" FOR UPDATE TO "authenticated" USING ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"())) WITH CHECK ((("player_id" = "public"."current_player_id"()) OR "public"."is_admin"()));



ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_admin_all" ON "public"."players" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "players_self_select" ON "public"."players" FOR SELECT TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "players_self_update" ON "public"."players" FOR UPDATE TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("auth_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."premios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "premios_admin_all" ON "public"."premios" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "premios_public_select" ON "public"."premios" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));



ALTER TABLE "public"."ranking_points" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ranking_points_admin_all" ON "public"."ranking_points" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "ranking_points_authenticated_select" ON "public"."ranking_points" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."ranking_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ranking_snapshots_admin_all" ON "public"."ranking_snapshots" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "ranking_snapshots_authenticated_select" ON "public"."ranking_snapshots" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registrations_admin_all" ON "public"."registrations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "registrations_self_insert" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."pairs" "p"
  WHERE (("p"."id" = "registrations"."pair_id") AND (("p"."player_1_id" = "public"."current_player_id"()) OR ("p"."player_2_id" = "public"."current_player_id"()))))) OR "public"."is_admin"()));



CREATE POLICY "registrations_self_select" ON "public"."registrations" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."pairs" "p"
  WHERE (("p"."id" = "registrations"."pair_id") AND (("p"."player_1_id" = "public"."current_player_id"()) OR ("p"."player_2_id" = "public"."current_player_id"()))))) OR "public"."is_admin"()));



CREATE POLICY "registrations_self_update" ON "public"."registrations" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."pairs" "p"
  WHERE (("p"."id" = "registrations"."pair_id") AND (("p"."player_1_id" = "public"."current_player_id"()) OR ("p"."player_2_id" = "public"."current_player_id"()))))) OR "public"."is_admin"())) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."pairs" "p"
  WHERE (("p"."id" = "registrations"."pair_id") AND (("p"."player_1_id" = "public"."current_player_id"()) OR ("p"."player_2_id" = "public"."current_player_id"()))))) OR "public"."is_admin"()));



ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seasons_admin_all" ON "public"."seasons" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "seasons_public_select" ON "public"."seasons" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsors_admin_all" ON "public"."sponsors" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "sponsors_public_select" ON "public"."sponsors" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "standings_admin_all" ON "public"."group_standings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "standings_authenticated_select" ON "public"."group_standings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."tournament_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournament_categories_admin_all" ON "public"."tournament_categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "tournament_categories_public_select" ON "public"."tournament_categories" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."tournaments" "t"
  WHERE (("t"."id" = "tournament_categories"."tournament_id") AND ("t"."estado" <> 'borrador'::"text")))));



ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournaments_admin_all" ON "public"."tournaments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "tournaments_public_select" ON "public"."tournaments" FOR SELECT TO "authenticated", "anon" USING (("estado" <> 'borrador'::"text"));



CREATE POLICY "un jugador crea su propia fila al registrarse" ON "public"."players" FOR INSERT WITH CHECK (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "un jugador edita solo su propia fila" ON "public"."players" FOR UPDATE USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "un jugador gestiona su propia entrada en la bolsa" ON "public"."partner_pool" USING ((EXISTS ( SELECT 1
   FROM "public"."players" "pl"
  WHERE (("pl"."id" = "partner_pool"."player_id") AND ("pl"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "un jugador marca sus notificaciones como leidas" ON "public"."notifications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."players" "pl"
  WHERE (("pl"."id" = "notifications"."player_id") AND ("pl"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "un jugador ve solo sus notificaciones" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."players" "pl"
  WHERE (("pl"."id" = "notifications"."player_id") AND ("pl"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "un jugador ve su propio historial de categoria" ON "public"."category_changes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."players" "pl"
  WHERE (("pl"."id" = "category_changes"."player_id") AND ("pl"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "un jugador ve sus propias inscripciones" ON "public"."registrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."pairs" "p"
     JOIN "public"."players" "pl" ON ((("pl"."id" = "p"."player_1_id") OR ("pl"."id" = "p"."player_2_id"))))
  WHERE (("p"."id" = "registrations"."pair_id") AND ("pl"."auth_user_id" = "auth"."uid"())))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."calculate_rollover_points"("p_points" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_rollover_points"("p_points" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_rollover_points"("p_points" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_rollover_points"("p_points" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."cancelar_inscripcion"("p_pair_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancelar_inscripcion"("p_pair_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancelar_inscripcion"("p_pair_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_season_from_previous"("p_name" "text", "p_slug" "text", "p_start_date" "date", "p_end_date" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_player_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_player_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_player_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_player_id"() TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_active_season"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_season"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_season"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_season"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_category_season_points"("p_player_id" "uuid", "p_season_id" "uuid", "p_categoria_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_season_points"("p_player_id" "uuid", "p_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tournament_season"("p_tournament_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_self_role_escalation"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_self_role_escalation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_self_role_escalation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_pareja"("p_tournament_id" "uuid", "p_categoria_id" "uuid", "p_player_1_id" "uuid", "p_player_2_id" "uuid", "p_talla_camiseta" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_pareja"("p_tournament_id" "uuid", "p_categoria_id" "uuid", "p_player_1_id" "uuid", "p_player_2_id" "uuid", "p_talla_camiseta" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_pareja"("p_tournament_id" "uuid", "p_categoria_id" "uuid", "p_player_1_id" "uuid", "p_player_2_id" "uuid", "p_talla_camiseta" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."brackets" TO "anon";
GRANT ALL ON TABLE "public"."brackets" TO "authenticated";
GRANT ALL ON TABLE "public"."brackets" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."category_changes" TO "anon";
GRANT ALL ON TABLE "public"."category_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."category_changes" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_items" TO "anon";
GRANT ALL ON TABLE "public"."gallery_items" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_items" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_upload_access" TO "anon";
GRANT ALL ON TABLE "public"."gallery_upload_access" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_upload_access" TO "service_role";



GRANT ALL ON TABLE "public"."group_standings" TO "anon";
GRANT ALL ON TABLE "public"."group_standings" TO "authenticated";
GRANT ALL ON TABLE "public"."group_standings" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."pairs" TO "anon";
GRANT ALL ON TABLE "public"."pairs" TO "authenticated";
GRANT ALL ON TABLE "public"."pairs" TO "service_role";



GRANT ALL ON TABLE "public"."partner_pool" TO "anon";
GRANT ALL ON TABLE "public"."partner_pool" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_pool" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."premios" TO "anon";
GRANT ALL ON TABLE "public"."premios" TO "authenticated";
GRANT ALL ON TABLE "public"."premios" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_points" TO "anon";
GRANT ALL ON TABLE "public"."ranking_points" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_points" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."ranking_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_categories" TO "anon";
GRANT ALL ON TABLE "public"."tournament_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_categories" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







