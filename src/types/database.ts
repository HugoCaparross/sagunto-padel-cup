/**
 * Supabase / PostgreSQL database types
 * Sagunto Padel Cup
 *
 * Fuente de verdad: esquema SQL actual de public.* de Supabase.
 *
 * IMPORTANTE:
 * - Los nombres de propiedades coinciden con las columnas reales de PostgreSQL.
 * - Los campos nullable reflejan exactamente las columnas que admiten NULL.
 * - Los campos con DEFAULT son opcionales en los tipos Insert.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// -----------------------------------------------------------------------------
// ENUMS / DOMINIO SQL
// -----------------------------------------------------------------------------

export type UserRole = "player" | "admin";

export type PlayerStatus = "activo" | "suspendido" | "baja";

export type TournamentState =
    | "borrador"
    | "publicado"
    | "inscripciones_abiertas"
    | "en_juego"
    | "finalizado"
    | "archivado";

export type PairStatus =
    | "confirmada"
    | "lista_espera"
    | "incompleta"
    | "pendiente_pago";

export type RegistrationStatus =
    | "confirmada"
    | "lista_espera"
    | "pendiente_pago"
    | "cancelada";

export type PaymentMethod =
    | "fisico"
    | "transferencia"
    | "otro";

export type PaymentStatus =
    | "pendiente"
    | "verificado"
    | "rechazado"
    | "no_requerido";

export type MatchPhase =
    | "grupos"
    | "octavos"
    | "cuartos"
    | "semis"
    | "final";

export type MatchStatus =
    | "pendiente"
    | "en_juego"
    | "finalizado"
    | "walkover"
    | "retirada"
    | "aplazado";

export type MatchTier = "oro" | "plata" | "bronce";

export type DominantHand = "diestro" | "zurdo";

export type CategoryGender =
    | "masculino"
    | "femenino"
    | "mixto";

export type TournamentType =
    | "regular"
    | "master";

export type SeasonStatus =
    | "planificada"
    | "activa"
    | "finalizada"
    | "archivada";

export type SponsorType =
    | "comercial"
    | "institucion";

export type SponsorStatus =
    | "activo"
    | "inactivo";

export type NewsStatus =
    | "borrador"
    | "publicado";

export type NotificationChannel =
    | "email"
    | "in_app";

export type AuditAction =
    | "create"
    | "update"
    | "delete"
    | "publish"
    | "cancel"
    | "login"
    | "logout"
    | "result_update"
    | "category_change"
    | "registration_update"
    | "other";

export type GalleryItemType =
    | "foto"
    | "video";

export type GalleryPositionSlot = 1 | 2;

// -----------------------------------------------------------------------------
// GENERIC TABLE HELPERS
// -----------------------------------------------------------------------------

type TableDefinition<
    Row,
    Insert extends Record<string, unknown> = Partial<Row>,
    Update extends Record<string, unknown> = Partial<Row>,
> = {
    Row: Row;
    Insert: Insert;
    Update: Update;
    Relationships: [];
};

// -----------------------------------------------------------------------------
// SEASONS
// -----------------------------------------------------------------------------

export type Season = {
    id: string;
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    status: SeasonStatus;
    rollover_percentage: number;
    settings: Json;
    created_at: string;
    updated_at: string;
};

export type SeasonInsert = {
    id?: string;
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    status?: SeasonStatus;
    rollover_percentage?: number;
    settings?: Json;
    created_at?: string;
    updated_at?: string;
};

export type SeasonUpdate = Partial<SeasonInsert>;

// -----------------------------------------------------------------------------
// CATEGORIES
// -----------------------------------------------------------------------------

export type Category = {
    id: string;
    nombre: string;
    nivel_orden: number;
    created_at: string;
    gender: CategoryGender;
    active: boolean;
    updated_at: string;
};

export type CategoryInsert = {
    id?: string;
    nombre: string;
    nivel_orden: number;
    created_at?: string;
    gender?: CategoryGender;
    active?: boolean;
    updated_at?: string;
};

export type CategoryUpdate = Partial<CategoryInsert>;

// -----------------------------------------------------------------------------
// CLUBS
// -----------------------------------------------------------------------------

export type Club = {
    id: string;
    nombre: string;
    direccion: string | null;
    lat: number | null;
    lng: number | null;
    num_pistas: number | null;
    telefono: string | null;
    fotos_json: Json;
    created_at: string;
    active: boolean;
    updated_at: string;
};

export type ClubInsert = {
    id?: string;
    nombre: string;
    direccion?: string | null;
    lat?: number | null;
    lng?: number | null;
    num_pistas?: number | null;
    telefono?: string | null;
    fotos_json?: Json;
    created_at?: string;
    active?: boolean;
    updated_at?: string;
};

export type ClubUpdate = Partial<ClubInsert>;

// -----------------------------------------------------------------------------
// PLAYERS
// -----------------------------------------------------------------------------

export type Player = {
    id: string;
    auth_user_id: string | null;
    nombre: string;
    apellidos: string | null;
    email: string;
    telefono: string | null;
    foto_url: string | null;
    categoria_actual_id: string | null;
    mano_dominante: DominantHand | null;
    pala: string | null;
    ciudad: string | null;
    instagram: string | null;
    visibilidad_json: Json;
    fecha_alta: string;
    estado: PlayerStatus;
    onboarding_completado: boolean;
    role: UserRole;
    metadata: Json;
    updated_at: string;
};

export type PlayerInsert = {
    id?: string;
    auth_user_id?: string | null;
    nombre: string;
    apellidos?: string | null;
    email: string;
    telefono?: string | null;
    foto_url?: string | null;
    categoria_actual_id?: string | null;
    mano_dominante?: DominantHand | null;
    pala?: string | null;
    ciudad?: string | null;
    instagram?: string | null;
    visibilidad_json?: Json;
    fecha_alta?: string;
    estado?: PlayerStatus;
    onboarding_completado?: boolean;
    role?: UserRole;
    metadata?: Json;
    updated_at?: string;
};

export type PlayerUpdate = Partial<PlayerInsert>;

// -----------------------------------------------------------------------------
// CATEGORY CHANGES
// -----------------------------------------------------------------------------

export type CategoryChange = {
    id: string;
    player_id: string;
    categoria_anterior_id: string | null;
    categoria_nueva_id: string | null;
    motivo: string;
    fecha: string;
    confirmado_por: string | null;
    status: string;
    requested_at: string | null;
    reviewed_at: string | null;
    metadata: Json;
};

export type CategoryChangeInsert = {
    id?: string;
    player_id: string;
    categoria_anterior_id?: string | null;
    categoria_nueva_id?: string | null;
    motivo: string;
    fecha?: string;
    confirmado_por?: string | null;
    status?: string;
    requested_at?: string | null;
    reviewed_at?: string | null;
    metadata?: Json;
};

export type CategoryChangeUpdate = Partial<CategoryChangeInsert>;

// -----------------------------------------------------------------------------
// TOURNAMENTS
// -----------------------------------------------------------------------------

export type Tournament = {
    id: string;
    nombre: string;
    slug: string;
    club_id: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    estado: TournamentState;
    created_at: string;
    precio_texto: string | null;
    descripcion: string | null;
    season_id: string | null;
    tournament_type: TournamentType;
    draw_mode: string;
    draw_seed: string | null;
    settings: Json;
    master_settings: Json;
    cover_image: string | null;
    published_at: string | null;
    updated_at: string;
};

export type TournamentInsert = {
    id?: string;
    nombre: string;
    slug: string;
    club_id?: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    estado?: TournamentState;
    created_at?: string;
    precio_texto?: string | null;
    descripcion?: string | null;
    season_id?: string | null;
    tournament_type?: TournamentType;
    draw_mode?: string;
    draw_seed?: string | null;
    settings?: Json;
    master_settings?: Json;
    cover_image?: string | null;
    published_at?: string | null;
    updated_at?: string;
};

export type TournamentUpdate = Partial<TournamentInsert>;

// -----------------------------------------------------------------------------
// TOURNAMENT CATEGORIES
// -----------------------------------------------------------------------------

/**
 * La tabla tiene PK compuesta (tournament_id, categoria_id).
 * NO existe una columna id.
 */
export type TournamentCategory = {
    tournament_id: string;
    categoria_id: string;
    cupo_minimo: number;
    cupo_maximo: number;
    enabled: boolean;
    settings: Json;
    created_at: string;
    updated_at: string;
};

export type TournamentCategoryInsert = {
    tournament_id: string;
    categoria_id: string;
    cupo_minimo?: number;
    cupo_maximo?: number;
    enabled?: boolean;
    settings?: Json;
    created_at?: string;
    updated_at?: string;
};

export type TournamentCategoryUpdate =
    Partial<TournamentCategoryInsert>;

// -----------------------------------------------------------------------------
// PAIRS
// -----------------------------------------------------------------------------

export type Pair = {
    id: string;
    tournament_id: string;
    categoria_id: string;
    player_1_id: string | null;
    player_2_id: string | null;
    estado: PairStatus;
    cabeza_de_serie: boolean;
    fecha_inscripcion: string;
    seed_position: number | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
};

export type PairInsert = {
    id?: string;
    tournament_id: string;
    categoria_id: string;
    player_1_id?: string | null;
    player_2_id?: string | null;
    estado?: PairStatus;
    cabeza_de_serie?: boolean;
    fecha_inscripcion?: string;
    seed_position?: number | null;
    metadata?: Json;
    created_at?: string;
    updated_at?: string;
};

export type PairUpdate = Partial<PairInsert>;

// -----------------------------------------------------------------------------
// PARTNER POOL
// -----------------------------------------------------------------------------

export type PartnerPoolEntry = {
    id: string;
    player_id: string;
    tournament_id: string;
    categoria_id: string;
    disponible: boolean;
    fecha_publicacion: string;
    disponibilidad: string;
    notas: string | null;
    updated_at: string;
};

export type PartnerPoolInsert = {
    id?: string;
    player_id: string;
    tournament_id: string;
    categoria_id: string;
    disponible?: boolean;
    fecha_publicacion?: string;
    disponibilidad?: string;
    notas?: string | null;
    updated_at?: string;
};

export type PartnerPoolUpdate =
    Partial<PartnerPoolInsert>;

// -----------------------------------------------------------------------------
// REGISTRATIONS
// -----------------------------------------------------------------------------

export type Registration = {
    id: string;
    pair_id: string;
    tournament_id: string;
    estado: RegistrationStatus;
    metodo_pago: PaymentMethod;
    fecha_pago: string | null;
    importe: number | null;
    talla_camiseta: string | null;
    qr_code: string | null;
    checked_in: boolean;
    checked_in_at: string | null;
    categoria_id: string | null;
    payment_status: PaymentStatus;
    notes: string | null;
    updated_at: string;
};

export type RegistrationInsert = {
    id?: string;
    pair_id: string;
    tournament_id: string;
    estado?: RegistrationStatus;
    metodo_pago?: PaymentMethod;
    fecha_pago?: string | null;
    importe?: number | null;
    talla_camiseta?: string | null;
    qr_code?: string | null;
    checked_in?: boolean;
    checked_in_at?: string | null;
    categoria_id?: string | null;
    payment_status?: PaymentStatus;
    notes?: string | null;
    updated_at?: string;
};

export type RegistrationUpdate = Partial<RegistrationInsert>;

// -----------------------------------------------------------------------------
// GROUPS
// -----------------------------------------------------------------------------

export type Group = {
    id: string;
    tournament_id: string;
    categoria_id: string;
    nombre: string;
    criterio_desempate_json: Json;
    draw_position: number | null;
    settings: Json;
    created_at: string;
    updated_at: string;
};

export type GroupInsert = {
    id?: string;
    tournament_id: string;
    categoria_id: string;
    nombre: string;
    criterio_desempate_json?: Json;
    draw_position?: number | null;
    settings?: Json;
    created_at?: string;
    updated_at?: string;
};

export type GroupUpdate = Partial<GroupInsert>;

// -----------------------------------------------------------------------------
// GROUP STANDINGS
// -----------------------------------------------------------------------------

export type GroupStanding = {
    id: string;
    group_id: string;
    pair_id: string;
    partidos_jugados: number;
    victorias: number;
    derrotas: number;
    sets_favor: number;
    sets_contra: number;
    juegos_favor: number;
    juegos_contra: number;
    puntos: number;
    posicion: number | null;
    created_at: string;
    updated_at: string;
};

export type GroupStandingInsert = {
    id?: string;
    group_id: string;
    pair_id: string;
    partidos_jugados?: number;
    victorias?: number;
    derrotas?: number;
    sets_favor?: number;
    sets_contra?: number;
    juegos_favor?: number;
    juegos_contra?: number;
    puntos?: number;
    posicion?: number | null;
    created_at?: string;
    updated_at?: string;
};

export type GroupStandingUpdate =
    Partial<GroupStandingInsert>;

// -----------------------------------------------------------------------------
// MATCHES
// -----------------------------------------------------------------------------

export type Match = {
    id: string;
    tournament_id: string;
    categoria_id: string;
    fase: MatchPhase;
    group_id: string | null;
    pair_1_id: string | null;
    pair_2_id: string | null;
    pista: string | null;
    hora_programada: string | null;
    hora_inicio_real: string | null;
    hora_fin: string | null;
    estado: MatchStatus;
    resultado_json: Json | null;
    introducido_por: string | null;
    fecha_modificacion: string | null;
    tramo: MatchTier | null;
    siguiente_match_id: string | null;
    siguiente_slot: number | null;
    format: Json;
    postponed_from: string | null;
    postponement_reason: string | null;
    round_number: number | null;
    match_number: number | null;
    created_at: string;
    updated_at: string;
};

export type MatchInsert = {
    id?: string;
    tournament_id: string;
    categoria_id: string;
    fase: MatchPhase;
    group_id?: string | null;
    pair_1_id?: string | null;
    pair_2_id?: string | null;
    pista?: string | null;
    hora_programada?: string | null;
    hora_inicio_real?: string | null;
    hora_fin?: string | null;
    estado?: MatchStatus;
    resultado_json?: Json | null;
    introducido_por?: string | null;
    fecha_modificacion?: string | null;
    tramo?: MatchTier | null;
    siguiente_match_id?: string | null;
    siguiente_slot?: number | null;
    format?: Json;
    postponed_from?: string | null;
    postponement_reason?: string | null;
    round_number?: number | null;
    match_number?: number | null;
    created_at?: string;
    updated_at?: string;
};

export type MatchUpdate = Partial<MatchInsert>;

// -----------------------------------------------------------------------------
// BRACKETS
// -----------------------------------------------------------------------------

export type Bracket = {
    id: string;
    tournament_id: string;
    categoria_id: string;
    tramo: MatchTier;
    estructura_json: Json;
    campeon_pair_id: string | null;
    generated_at: string | null;
    created_at: string;
    updated_at: string;
};

export type BracketInsert = {
    id?: string;
    tournament_id: string;
    categoria_id: string;
    tramo: MatchTier;
    estructura_json?: Json;
    campeon_pair_id?: string | null;
    generated_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type BracketUpdate = Partial<BracketInsert>;

// -----------------------------------------------------------------------------
// RANKING POINTS
// -----------------------------------------------------------------------------

export type RankingPointSource =
    | "tournament"
    | "manual_adjustment"
    | "season_operation";

export type RankingPoint = {
    id: string;
    player_id: string;
    tournament_id: string;
    categoria_id: string;
    puntos_obtenidos: number;
    ronda_alcanzada: string;
    fecha: string;
    fecha_caducidad: string | null;
    season_id: string | null;
    source: string;
    metadata: Json;
    created_at: string;
};

export type RankingPointInsert = {
    id?: string;
    player_id: string;
    tournament_id: string;
    categoria_id: string;
    puntos_obtenidos: number;
    ronda_alcanzada: string;
    fecha: string;
    fecha_caducidad?: string | null;
    season_id?: string | null;
    source?: string;
    metadata?: Json;
    created_at?: string;
};

export type RankingPointUpdate =
    Partial<RankingPointInsert>;

// -----------------------------------------------------------------------------
// RANKING SNAPSHOTS
// -----------------------------------------------------------------------------

export type RankingSnapshot = {
    id: string;
    player_id: string;
    temporada: string;
    fecha_snapshot: string;
    posicion: number | null;
    puntos: number | null;
    season_id: string | null;
    data: Json;
    generated_at: string;
};

export type RankingSnapshotInsert = {
    id?: string;
    player_id: string;
    temporada: string;
    fecha_snapshot: string;
    posicion?: number | null;
    puntos?: number | null;
    season_id?: string | null;
    data?: Json;
    generated_at?: string;
};

export type RankingSnapshotUpdate =
    Partial<RankingSnapshotInsert>;

// -----------------------------------------------------------------------------
// SPONSORS
// -----------------------------------------------------------------------------

export type Sponsor = {
    id: string;
    tournament_id: string;
    nombre: string;
    logo_url: string | null;
    descripcion: string | null;
    enlace: string | null;
    tipo: SponsorType;
    orden: number;
    active: boolean;
    metadata: Json;
    created_at: string;
    updated_at: string;
};

export type SponsorInsert = {
    id?: string;
    tournament_id: string;
    nombre: string;
    logo_url?: string | null;
    descripcion?: string | null;
    enlace?: string | null;
    tipo: SponsorType;
    orden?: number;
    active?: boolean;
    metadata?: Json;
    created_at?: string;
    updated_at?: string;
};

export type SponsorUpdate = Partial<SponsorInsert>;

// -----------------------------------------------------------------------------
// PREMIOS
// -----------------------------------------------------------------------------

export type Prize = {
    id: string;
    tournament_id: string;
    categoria_id: string | null;
    tramo: MatchTier | "sorteo" | null;
    posicion: string | null;
    descripcion: string;
    patrocinador_id: string | null;
    visible: boolean;
    fecha_publicacion_prevista: string | null;
    value: number | null;
    image: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
};

export type PrizeInsert = {
    id?: string;
    tournament_id: string;
    categoria_id?: string | null;
    tramo?: Prize["tramo"];
    posicion?: string | null;
    descripcion: string;
    patrocinador_id?: string | null;
    visible?: boolean;
    fecha_publicacion_prevista?: string | null;
    value?: number | null;
    image?: string | null;
    metadata?: Json;
    created_at?: string;
    updated_at?: string;
};

export type PrizeUpdate = Partial<PrizeInsert>;

// -----------------------------------------------------------------------------
// NEWS
// -----------------------------------------------------------------------------

export type News = {
    id: string;
    titulo: string;
    slug: string;
    contenido: string | null;
    imagen_destacada: string | null;
    categoria: string | null;
    estado: NewsStatus;
    fecha_publicacion: string | null;
    excerpt: string | null;
    author_id: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
};

export type NewsInsert = {
    id?: string;
    titulo: string;
    slug: string;
    contenido?: string | null;
    imagen_destacada?: string | null;
    categoria?: string | null;
    estado?: NewsStatus;
    fecha_publicacion?: string | null;
    excerpt?: string | null;
    author_id?: string | null;
    metadata?: Json;
    created_at?: string;
    updated_at?: string;
};

export type NewsUpdate = Partial<NewsInsert>;

// -----------------------------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------------------------

export type Notification = {
    id: string;
    player_id: string;
    tipo: string;
    canal: NotificationChannel;
    contenido: string | null;
    leido: boolean;
    fecha_envio: string;
    title: string | null;
    data: Json;
    read_at: string | null;
};

export type NotificationInsert = {
    id?: string;
    player_id: string;
    tipo: string;
    canal: NotificationChannel;
    contenido?: string | null;
    leido?: boolean;
    fecha_envio?: string;
    title?: string | null;
    data?: Json;
    read_at?: string | null;
};

export type NotificationUpdate =
    Partial<NotificationInsert>;

// -----------------------------------------------------------------------------
// AUDIT LOG
// -----------------------------------------------------------------------------

export type AuditLog = {
    id: string;
    entidad: string;
    entidad_id: string;
    accion: string;
    usuario_id: string | null;
    valores_anteriores_json: Json | null;
    valores_nuevos_json: Json | null;
    fecha: string;
    metadata: Json;
};

export type AuditLogInsert = {
    id?: string;
    entidad: string;
    entidad_id: string;
    accion: string;
    usuario_id?: string | null;
    valores_anteriores_json?: Json | null;
    valores_nuevos_json?: Json | null;
    fecha?: string;
    metadata?: Json;
};

export type AuditLogUpdate =
    Partial<AuditLogInsert>;

// -----------------------------------------------------------------------------
// GALLERY UPLOAD ACCESS
// -----------------------------------------------------------------------------

export type GalleryUploadAccess = {
    id: string;
    tournament_id: string;
    nombre_colaborador: string;
    token_acceso: string;
    fecha_expiracion: string | null;
    active: boolean;
    created_by: string | null;
    created_at: string;
};

export type GalleryUploadAccessInsert = {
    id?: string;
    tournament_id: string;
    nombre_colaborador: string;
    token_acceso?: string;
    fecha_expiracion?: string | null;
    active?: boolean;
    created_by?: string | null;
    created_at?: string;
};

export type GalleryUploadAccessUpdate =
    Partial<GalleryUploadAccessInsert>;

// -----------------------------------------------------------------------------
// GALLERY ITEMS
// -----------------------------------------------------------------------------

export type GalleryItem = {
    id: string;
    tournament_id: string;
    url: string;
    tipo: GalleryItemType;
    subido_por: string | null;
    player_tag_id: string | null;
    created_at: string;
    title: string | null;
    caption: string | null;
    orden: number;
    published: boolean;
    metadata: Json;
    updated_at: string;
};

export type GalleryItemInsert = {
    id?: string;
    tournament_id: string;
    url: string;
    tipo?: GalleryItemType;
    subido_por?: string | null;
    player_tag_id?: string | null;
    created_at?: string;
    title?: string | null;
    caption?: string | null;
    orden?: number;
    published?: boolean;
    metadata?: Json;
    updated_at?: string;
};

export type GalleryItemUpdate =
    Partial<GalleryItemInsert>;

// -----------------------------------------------------------------------------
// BADGES
// -----------------------------------------------------------------------------

export type Badge = {
    id: string;
    player_id: string;
    tipo: string;
    fecha_obtenida: string;
};

export type BadgeInsert = {
    id?: string;
    player_id: string;
    tipo: string;
    fecha_obtenida?: string;
};

export type BadgeUpdate = Partial<BadgeInsert>;

// -----------------------------------------------------------------------------
// DATABASE
// -----------------------------------------------------------------------------

export type Database = {
    public: {
        Tables: {
            categories: TableDefinition<Category, CategoryInsert, CategoryUpdate>;
            clubs: TableDefinition<Club, ClubInsert, ClubUpdate>;
            players: TableDefinition<Player, PlayerInsert, PlayerUpdate>;
            category_changes: TableDefinition<CategoryChange, CategoryChangeInsert, CategoryChangeUpdate>;
            tournaments: TableDefinition<Tournament, TournamentInsert, TournamentUpdate>;
            tournament_categories: TableDefinition<TournamentCategory, TournamentCategoryInsert, TournamentCategoryUpdate>;
            pairs: TableDefinition<Pair, PairInsert, PairUpdate>;
            partner_pool: TableDefinition<PartnerPoolEntry, PartnerPoolInsert, PartnerPoolUpdate>;
            registrations: TableDefinition<Registration, RegistrationInsert, RegistrationUpdate>;
            groups: TableDefinition<Group, GroupInsert, GroupUpdate>;
            group_standings: TableDefinition<GroupStanding, GroupStandingInsert, GroupStandingUpdate>;
            matches: TableDefinition<Match, MatchInsert, MatchUpdate>;
            brackets: TableDefinition<Bracket, BracketInsert, BracketUpdate>;
            ranking_points: TableDefinition<RankingPoint, RankingPointInsert, RankingPointUpdate>;
            ranking_snapshots: TableDefinition<RankingSnapshot, RankingSnapshotInsert, RankingSnapshotUpdate>;
            sponsors: TableDefinition<Sponsor, SponsorInsert, SponsorUpdate>;
            premios: TableDefinition<Prize, PrizeInsert, PrizeUpdate>;
            news: TableDefinition<News, NewsInsert, NewsUpdate>;
            notifications: TableDefinition<Notification, NotificationInsert, NotificationUpdate>;
            audit_log: TableDefinition<AuditLog, AuditLogInsert, AuditLogUpdate>;
            gallery_upload_access: TableDefinition<GalleryUploadAccess, GalleryUploadAccessInsert, GalleryUploadAccessUpdate>;
            gallery_items: TableDefinition<GalleryItem, GalleryItemInsert, GalleryItemUpdate>;
            seasons: TableDefinition<Season, SeasonInsert, SeasonUpdate>;
            badges: TableDefinition<Badge, BadgeInsert, BadgeUpdate>;
        };

        Views: Record<string, never>;

        Functions: Record<string, never>;

        Enums: {
            user_role: UserRole;
            player_status: PlayerStatus;
            tournament_state: TournamentState;
            pair_status: PairStatus;
            registration_status: RegistrationStatus;
            payment_method: PaymentMethod;
            payment_status: PaymentStatus;
            match_phase: MatchPhase;
            match_status: MatchStatus;
            category_gender: CategoryGender;
            tournament_type: TournamentType;
            season_status: SeasonStatus;
            sponsor_type: SponsorType;
            sponsor_status: SponsorStatus;
            news_status: NewsStatus;
            notification_channel: NotificationChannel;
            audit_action: AuditAction;
        };

        CompositeTypes: Record<string, never>;
    };
};

// -----------------------------------------------------------------------------
// SUPABASE HELPERS
// -----------------------------------------------------------------------------

export type Tables<
    TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
    TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
    TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];

export type Enums<
    EnumName extends keyof Database["public"]["Enums"],
> = Database["public"]["Enums"][EnumName];

// -----------------------------------------------------------------------------
// COMMON RELATIONAL TYPES
// -----------------------------------------------------------------------------

export type PlayerWithCategory = Player & {
    category: Category | null;
};

export type TournamentWithClub = Tournament & {
    club: Club | null;
};

export type TournamentWithSeason = Tournament & {
    season: Season | null;
};

export type TournamentCategoryWithCategory =
    TournamentCategory & {
        category: Category | null;
    };

export type PairWithPlayers = Pair & {
    player1: Player | null;
    player2: Player | null;
};

export type PairWithCategory = Pair & {
    category: Category | null;
};

export type RegistrationWithPair = Registration & {
    pair: PairWithPlayers | null;
};

export type GroupWithStandings = Group & {
    standings: GroupStanding[];
};

export type MatchWithPairs = Match & {
    pair1: PairWithPlayers | null;
    pair2: PairWithPlayers | null;
};

export type RankingPointWithPlayer = RankingPoint & {
    player: Player | null;
};

export type RankingSnapshotWithPlayer = RankingSnapshot & {
    player: Player | null;
};

export type DatabaseTableName =
    keyof Database["public"]["Tables"];

export type DatabaseEnumName =
    keyof Database["public"]["Enums"];
