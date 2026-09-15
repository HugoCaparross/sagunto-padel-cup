/**
 * Player domain types
 * Sagunto Padel Cup
 *
 * Reglas principales:
 * - Cada jugador tiene un perfil único.
 * - Un jugador solo puede competir en una categoría simultáneamente.
 * - Puede cambiar de categoría mediante solicitud/validación.
 * - Los cambios de categoría NO eliminan el histórico.
 * - Los puntos y resultados históricos permanecen vinculados
 *   al contexto en el que fueron obtenidos.
 * - La categoría nueva se aplica a los siguientes torneos.
 */

import type {
    Category,
    CategoryChange,
    Pair,
    Player,
    RankingPoint,
    RankingSnapshot,
} from "@/types/database";

// =============================================================================
// PLAYER PROFILE
// =============================================================================

export type PlayerProfile = Player & {
    category: Category | null;

    ranking: PlayerRankingSummary | null;

    statistics: PlayerStatistics;

    current_pair: Pair | null;
};

// =============================================================================
// PLAYER RANKING SUMMARY
// =============================================================================

export type PlayerRankingSummary = {
    season_id: string;

    categoria_id: string;

    posicion: number | null;

    puntos_obtenidos: number;

    previous_position: number | null;

    position_change: number;

    tournaments_played: number;

    results_count: number;

    master_eligible: boolean;
};

// =============================================================================
// PLAYER STATISTICS
// =============================================================================

export type PlayerStatistics = {
    tournaments_played: number;

    tournaments_won: number;

    finals: number;

    semifinals: number;

    quarterfinals: number;

    matches_played: number;

    matches_won: number;

    matches_lost: number;

    win_rate: number;

    sets_won: number;

    sets_lost: number;

    games_won: number;

    games_lost: number;
};

// =============================================================================
// PLAYER PUBLIC PROFILE
// =============================================================================

export type PlayerPublicProfile = {
    id: string;

    name: string;

    surname: string;

    display_name: string;

    foto_url: string | null;

    city: string | null;

    current_category: Category | null;

    instagram: string | null;

    ranking: PlayerRankingSummary | null;

    statistics: PlayerStatistics;

    visibilidad_json: PlayerVisibility;
};

// =============================================================================
// PLAYER VISIBILITY
// =============================================================================

export type PlayerVisibility = {
    profile: boolean;

    telefono: boolean;

    email: boolean;

    instagram: boolean;

    city: boolean;

    ranking: boolean;

    statistics: boolean;

    tournament_history: boolean;
};

export const DEFAULT_PLAYER_VISIBILITY: PlayerVisibility = {
    profile: true,

    telefono: false,

    email: false,

    instagram: true,

    city: true,

    ranking: true,

    statistics: true,

    tournament_history: true,
};

// =============================================================================
// PLAYER REGISTRATION
// =============================================================================

export type CreatePlayerInput = {
    auth_user_id?: string | null;

    name: string;

    surname: string;

    email: string;

    telefono?: string | null;

    foto_url?: string | null;

    categoria_actual_id?: string | null;

    mano_dominante?: "derecha" | "izquierda" | null;

    pala?: string | null;

    city?: string | null;

    instagram?: string | null;

    visibilidad_json?: Partial<PlayerVisibility>;
};

export type CreatePlayerResult = {
    success: boolean;

    player: Player | null;

    message: string;

    errors: string[];
};

// =============================================================================
// PLAYER UPDATE
// =============================================================================

export type UpdatePlayerInput = {
    player_id: string;

    name?: string;

    surname?: string;

    telefono?: string | null;

    foto_url?: string | null;

    mano_dominante?: "derecha" | "izquierda" | null;

    pala?: string | null;

    city?: string | null;

    instagram?: string | null;

    visibilidad_json?: Partial<PlayerVisibility>;
};

export type UpdatePlayerResult = {
    success: boolean;

    player: Player | null;

    message: string;

    errors: string[];
};

// =============================================================================
// CATEGORY
// =============================================================================

export type PlayerCategoryState = {
    player_id: string;

    current_category: Category | null;

    pending_change: CategoryChange | null;

    history: CategoryHistoryEntry[];
};

export type CategoryHistoryEntry = {
    category: Category;

    from_date: string;

    to_date: string | null;

    current: boolean;
};

// =============================================================================
// CATEGORY CHANGE REQUEST
// =============================================================================

export type CategoryChangeRequest = {
    player_id: string;

    categoria_anterior_id: string | null;

    categoria_nueva_id: string;

    reason: string | null;
};

export type CategoryChangeRequestResult = {
    success: boolean;

    request: CategoryChange | null;

    message: string;

    errors: string[];
};

// =============================================================================
// CATEGORY CHANGE ADMIN
// =============================================================================

export type ReviewCategoryChangeInput = {
    category_change_id: string;

    decision: "approve" | "reject";

    notes?: string | null;

    reviewed_by: string;
};

export type ReviewCategoryChangeResult = {
    success: boolean;

    change: CategoryChange | null;

    player: Player | null;

    message: string;

    errors: string[];
};

// =============================================================================
// CATEGORY CHANGE RULES
// =============================================================================

export const CATEGORY_CHANGE_RULES = {
    only_one_current_category: true,

    preserve_ranking_history: true,

    preserve_tournament_history: true,

    preserve_previous_results: true,

    applies_to_future_tournaments: true,

    does_not_recalculate_historical_results: true,

    does_not_delete_previous_points: true,

    organizer_validation_required: true,
} as const;

// =============================================================================
// PLAYER COMPETITION ELIGIBILITY
// =============================================================================

export type PlayerCompetitionEligibility = {
    eligible: boolean;

    player: Player;

    category: Category;

    reasons: PlayerEligibilityReason[];

    warnings: PlayerEligibilityWarning[];
};

export type PlayerEligibilityReason =
    | "inactive"
    | "suspended"
    | "already_in_tournament"
    | "already_in_category"
    | "category_change_pending"
    | "invalid_category"
    | "unknown";

export type PlayerEligibilityWarning =
    | "individual_registration"
    | "partner_required"
    | "partner_pool_available"
    | "master"
    | "category_change";

// =============================================================================
// PLAYER TOURNAMENT HISTORY
// =============================================================================

export type PlayerTournamentHistoryEntry = {
    tournament_id: string;

    tournament_name: string;

    season_id: string;

    categoria_id: string;

    category_name: string;

    tournament_date: string;

    pair_id: string | null;

    partner_name: string | null;

    tramo: "oro" | "plata" | "bronce" | null;

    resultado_json:
    | "campeon"
    | "finalista"
    | "semifinalista"
    | "cuartos"
    | "participacion"
    | null;

    ranking_points: number;

    matches_played: number;

    matches_won: number;

    matches_lost: number;
};

export type PlayerTournamentHistory = {
    player: Player;

    entries: PlayerTournamentHistoryEntry[];

    total_tournaments: number;

    puntos: number;
};

// =============================================================================
// PLAYER RANKING HISTORY
// =============================================================================

export type PlayerRankingHistoryEntry = {
    date: string;

    season_id: string;

    categoria_id: string;

    posicion: number;

    puntos_obtenidos: number;

    points_change: number;

    position_change: number;
};

export type PlayerRankingHistory = {
    player: Player;

    entries: PlayerRankingHistoryEntry[];

    current_position: number | null;

    current_points: number;
};

// =============================================================================
// PLAYER RESULTS
// =============================================================================

export type PlayerResultSummary = {
    player_id: string;

    tournament_id: string;

    categoria_id: string;

    pair_id: string;

    tramo: "oro" | "plata" | "bronce";

    resultado_json:
    | "campeon"
    | "finalista"
    | "semifinalista"
    | "cuartos";

    puntos_obtenidos: number;
};

// =============================================================================
// PLAYER PAIRS
// =============================================================================

export type PlayerPairHistoryEntry = {
    pair_id: string;

    tournament_id: string;

    categoria_id: string;

    partner: Player | null;

    estado:
    | "confirmada"
    | "lista_espera"
    | "incompleta"
    | "pendiente_pago";

    tournament_date: string;

    resultado_json: string | null;

    puntos_obtenidos: number;
};

export type PlayerPairHistory = {
    player: Player;

    pairs: PlayerPairHistoryEntry[];
};

// =============================================================================
// PLAYER DASHBOARD
// =============================================================================

export type PlayerDashboard = {
    player: Player;

    category: Category | null;

    ranking: PlayerRankingSummary | null;

    active_tournament: PlayerActiveTournament | null;

    next_match: PlayerNextMatch | null;

    recent_results: PlayerRecentResult[];

    notifications_count: number;
};

export type PlayerActiveTournament = {
    tournament_id: string;

    tournament_name: string;

    category: Category;

    pair: Pair | null;

    registration_status:
    | "incomplete"
    | "pending_payment"
    | "confirmed"
    | "waiting_list"
    | null;

    payment_status:
    | "pending_verification"
    | "verified"
    | "rejected"
    | null;
};

export type PlayerNextMatch = {
    match_id: string;

    tournament_id: string;

    tournament_name: string;

    opponent_name: string;

    pista: number | null;

    hora_programada: string | null;

    fase: string;

    tramo: "oro" | "plata" | "bronce" | null;
};

export type PlayerRecentResult = {
    tournament_id: string;

    tournament_name: string;

    date: string;

    tramo: "oro" | "plata" | "bronce" | null;

    resultado_json: string;

    puntos_obtenidos: number;
};

// =============================================================================
// PLAYER SEARCH
// =============================================================================

export type PlayerSearchFilters = {
    search: string;

    categoria_id: string | "all";

    city: string | "all";

    estado: "all" | "activo" | "inactivo" | "suspendido";

    page: number;

    page_size: number;
};

export type PlayerSearchResult = {
    players: PlayerPublicProfile[];

    total: number;

    page: number;

    page_size: number;

    total_pages: number;
};

// =============================================================================
// PLAYER ADMIN FILTERS
// =============================================================================

export type PlayerAdminFilters = {
    search: string;

    categoria_id: string | "all";

    estado: "all" | "activo" | "inactivo" | "suspendido";

    role: "all" | "player" | "admin";

    onboarding:
    | "all"
    | "completed"
    | "pending";

    page: number;

    page_size: number;
};

// =============================================================================
// PLAYER ADMIN ACTIONS
// =============================================================================

export type PlayerAdminAction =
    | "activate"
    | "deactivate"
    | "suspend"
    | "unsuspend"
    | "change_category"
    | "reset_onboarding"
    | "update_profile";

export type PlayerAdminActionInput = {
    player_id: string;

    accion: PlayerAdminAction;

    categoria_id?: string | null;

    notes?: string | null;

    usuario_id: string;
};

export type PlayerAdminActionResult = {
    success: boolean;

    player: Player | null;

    accion: PlayerAdminAction;

    message: string;

    errors: string[];
};

// =============================================================================
// PLAYER STATUS HELPERS
// =============================================================================

export function isPlayerActive(
    player: Player,
): boolean {
    return player.estado === "activo";
}

export function isPlayerSuspended(
    player: Player,
): boolean {
    return player.estado === "suspendido";
}

export function isPlayerInactive(
    player: Player,
): boolean {
    return player.estado === "inactivo";
}

export function canPlayerCompete(
    player: Player,
): boolean {
    return (
        player.estado === "activo" &&
        player.onboarding_completado
    );
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export function getPlayerFullName(
    player: Player,
): string {
    return `${player.name} ${player.surname}`.trim();
}

export function getPlayerInitials(
    player: Player,
): string {
    const first =
        player.name.trim().charAt(0);

    const last =
        player.surname.trim().charAt(0);

    return `${first}${last}`.toUpperCase();
}

export function getPlayerDisplayName(
    player: Player,
): string {
    return getPlayerFullName(player);
}

// =============================================================================
// VISIBILITY
// =============================================================================

export function canShowPlayerField(
    player: Player,
    field: keyof PlayerVisibility,
): boolean {
    const visibilidad_json =
        player.visibilidad_json as Partial<PlayerVisibility>;

    if (visibilidad_json[field] === undefined) {
        return DEFAULT_PLAYER_VISIBILITY[field];
    }

    return Boolean(visibilidad_json[field]);
}

// =============================================================================
// CATEGORY CHANGE
// =============================================================================

export function hasPendingCategoryChange(
    change: CategoryChange | null,
): boolean {
    return change?.estado === "pendiente";
}

export function canRequestCategoryChange(
    player: Player,
    pendingChange: CategoryChange | null,
): boolean {
    if (!canPlayerCompete(player)) {
        return false;
    }

    if (hasPendingCategoryChange(pendingChange)) {
        return false;
    }

    return true;
}

// =============================================================================
// PLAYER RANKING
// =============================================================================

export function getPlayerRankingLabel(
    posicion: number | null,
): string {
    if (posicion === null) {
        return "Sin clasificar";
    }

    return `#${posicion}`;
}

export function getPositionChangeLabel(
    change: number,
): string {
    if (change > 0) {
        return `+${change}`;
    }

    if (change < 0) {
        return `${change}`;
    }

    return "—";
}

// =============================================================================
// PLAYER STATISTICS
// =============================================================================

export function calculateWinRate(
    victorias: number,
    derrotas: number,
): number {
    const total = victorias + derrotas;

    if (total === 0) {
        return 0;
    }

    return Math.round(
        (victorias / total) * 100,
    );
}

// =============================================================================
// PLAYER RANKING DATA
// =============================================================================

export type PlayerRankingData = {
    player: Player;

    category: Category | null;

    puntos_obtenidos: RankingPoint[];

    snapshots: RankingSnapshot[];

    current_position: number | null;
};

// =============================================================================
// PROFILE UPDATE
// =============================================================================

export type PlayerProfileUpdate = {
    name?: string;

    surname?: string;

    telefono?: string | null;

    foto_url?: string | null;

    mano_dominante?: "derecha" | "izquierda" | null;

    pala?: string | null;

    city?: string | null;

    instagram?: string | null;

    visibilidad_json?: Partial<PlayerVisibility>;
};

// =============================================================================
// ONBOARDING
// =============================================================================

export type PlayerOnboardingState = {
    completed: boolean;

    current_step:
    | "profile"
    | "category"
    | "preferences"
    | "finished";

    completed_steps: (
        | "profile"
        | "category"
        | "preferences"
    )[];
};

export type CompletePlayerOnboardingResult = {
    success: boolean;

    player: Player | null;

    message: string;

    errors: string[];
};

// =============================================================================
// PLAYER LIST ITEM
// =============================================================================

export type PlayerListItem = {
    player: Player;

    category: Category | null;

    ranking_position: number | null;

    ranking_points: number;

    tournaments_played: number;

    active: boolean;
};

// =============================================================================
// PLAYER EXPORT
// =============================================================================

export type PlayerExportRow = {
    player_id: string;

    name: string;

    surname: string;

    email: string;

    telefono: string;

    city: string;

    category: string;

    ranking_position: number | null;

    ranking_points: number;

    tournaments_played: number;

    estado: string;

    signup_date: string;
};