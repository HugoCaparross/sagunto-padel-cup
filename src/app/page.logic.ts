export type TournamentStatus =
    | "borrador"
    | "publicado"
    | "inscripciones_abiertas"
    | "en_juego"
    | "finalizado"
    | "archivado";

export interface HomeTournament {
    id: string;
    nombre: string;
    slug: string;
    fechaInicio: string;
    fechaFin: string;
    estado: TournamentStatus;
    precioTexto: string | null;
    descripcion: string | null;
    club: {
        nombre: string;
        direccion: string | null;
    } | null;
    categorias: string[];
}

export interface HomeRankingPlayer {
    position: number;
    playerId: string;
    nombre: string;
    apellidos: string | null;
    puntos: number;
    pruebas: number;
    fotoUrl: string | null;
}

export interface HomeNewsItem {
    id: string;
    titulo: string;
    slug: string;
    contenido: string | null;
    imagenDestacada: string | null;
    categoria: string | null;
    fechaPublicacion: string | null;
}

export interface HomeSponsor {
    id: string;
    nombre: string;
    logoUrl: string | null;
    descripcion: string | null;
    enlace: string | null;
    tipo: "comercial" | "institucion";
}

export interface HomeCategory {
    id: string;
    nombre: string;
    nivelOrden: number;
}

export interface HomeData {
    nextTournament: HomeTournament | null;
    upcomingTournaments: HomeTournament[];
    rankingPreview: HomeRankingPlayer[];
    categories: HomeCategory[];
    news: HomeNewsItem[];
    sponsors: HomeSponsor[];
}

export type HomeLoadState =
    | {
        status: "success";
        data: HomeData;
    }
    | {
        status: "error";
        message: string;
    };

export const DEFAULT_CATEGORIES: HomeCategory[] = [
    {
        id: "2",
        nombre: "2ª CATEGORÍA",
        nivelOrden: 2,
    },
    {
        id: "3",
        nombre: "3ª CATEGORÍA",
        nivelOrden: 3,
    },
    {
        id: "4",
        nombre: "4ª CATEGORÍA",
        nivelOrden: 4,
    },
    {
        id: "iniciacion",
        nombre: "INICIACIÓN",
        nivelOrden: 5,
    },
];

export function formatTournamentDate(
    fechaInicio: string,
    fechaFin: string,
): string {
    const start = parseDate(fechaInicio);
    const end = parseDate(fechaFin);

    if (!start || !end) {
        return `${fechaInicio} — ${fechaFin}`;
    }

    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

    const sameYear = start.getFullYear() === end.getFullYear();

    const startDay = start.getDate().toString().padStart(2, "0");
    const endDay = end.getDate().toString().padStart(2, "0");

    const month = new Intl.DateTimeFormat("es-ES", {
        month: "long",
    }).format(start);

    const normalizedMonth =
        month.charAt(0).toUpperCase() + month.slice(1);

    if (sameMonth) {
        return `${startDay}–${endDay} ${normalizedMonth.toUpperCase()} ${start.getFullYear()}`;
    }

    if (sameYear) {
        const endMonth = new Intl.DateTimeFormat("es-ES", {
            month: "long",
        }).format(end);

        return `${startDay} ${month.toUpperCase()} – ${endDay} ${endMonth.toUpperCase()} ${start.getFullYear()}`;
    }

    return `${startDay} ${month.toUpperCase()} ${start.getFullYear()} – ${endDay} ${new Intl.DateTimeFormat(
        "es-ES",
        {
            month: "long",
        },
    )
        .format(end)
        .toUpperCase()} ${end.getFullYear()}`;
}

export function getTournamentStatusLabel(
    status: TournamentStatus,
): string {
    switch (status) {
        case "inscripciones_abiertas":
            return "INSCRIPCIONES ABIERTAS";

        case "en_juego":
            return "EN JUEGO";

        case "publicado":
            return "PRÓXIMAMENTE";

        case "finalizado":
            return "FINALIZADO";

        case "borrador":
            return "PRÓXIMAMENTE";

        case "archivado":
            return "FINALIZADO";

        default:
            return "PRÓXIMAMENTE";
    }
}

export function getTournamentStatusVariant(
    status: TournamentStatus,
): "open" | "upcoming" | "live" | "finished" {
    switch (status) {
        case "inscripciones_abiertas":
            return "open";

        case "en_juego":
            return "live";

        case "finalizado":
        case "archivado":
            return "finished";

        case "borrador":
        case "publicado":
        default:
            return "upcoming";
    }
}

export function canRegisterTournament(
    status: TournamentStatus,
): boolean {
    return status === "inscripciones_abiertas";
}

export function getTournamentHref(slug: string): string {
    return `/torneos/${slug}`;
}

export function getPlayerHref(playerId: string): string {
    return `/jugadores/${playerId}`;
}

export function getNewsHref(slug: string): string {
    return `/noticias/${slug}`;
}

export function getCategoryHref(categoryId: string): string {
    return `/ranking?categoria=${encodeURIComponent(categoryId)}`;
}

export function formatRankingPoints(points: number): string {
    return new Intl.NumberFormat("es-ES").format(points);
}

export function formatNewsDate(
    value: string | null,
): string {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
        .format(date)
        .replace(".", "")
        .toUpperCase();
}

function parseDate(value: string): Date | null {
    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}