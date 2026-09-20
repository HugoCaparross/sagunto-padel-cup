import type {
    PublicNews,
    PublicTournament,
} from "@/lib/public/site";

export type TournamentStatus =
    | "borrador"
    | "publicado"
    | "inscripciones_abiertas"
    | "en_juego"
    | "finalizado"
    | "archivado";

export type HomeTournament = PublicTournament;

export type HomeData = {
    tournaments: PublicTournament[];
    categories: Array<{
        id: string;
        nombre: string;
    }>;
    news: PublicNews[];
};

export type HomeLoadState =
    | "idle"
    | "loading"
    | "success"
    | "error";

export function formatTournamentDate(
    fechaInicio: string,
    fechaFin: string,
): string {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return `${fechaInicio} — ${fechaFin}`;
    }

    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

    const sameYear =
        start.getFullYear() === end.getFullYear();

    const startDay = start
        .getDate()
        .toString()
        .padStart(2, "0");

    const endDay = end
        .getDate()
        .toString()
        .padStart(2, "0");

    const startMonth = new Intl.DateTimeFormat("es-ES", {
        month: "long",
    }).format(start);

    const normalizedStartMonth =
        startMonth.charAt(0).toUpperCase() +
        startMonth.slice(1);

    if (sameMonth) {
        return `${startDay}–${endDay} ${normalizedStartMonth.toUpperCase()} ${start.getFullYear()}`;
    }

    if (sameYear) {
        const endMonth = new Intl.DateTimeFormat("es-ES", {
            month: "long",
        }).format(end);

        return `${startDay} ${startMonth.toUpperCase()} – ${endDay} ${endMonth.toUpperCase()} ${start.getFullYear()}`;
    }

    const endMonth = new Intl.DateTimeFormat("es-ES", {
        month: "long",
    }).format(end);

    return `${startDay} ${startMonth.toUpperCase()} ${start.getFullYear()} – ${endDay} ${endMonth.toUpperCase()} ${end.getFullYear()}`;
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

export function getTournamentHref(
    slug: string,
): string {
    return `/torneos/${slug}`;
}

export function getPlayerHref(
    playerId: string,
): string {
    return `/jugadores/${playerId}`;
}

export function getNewsHref(
    slug: string,
): string {
    return `/noticias/${slug}`;
}

export function getCategoryHref(
    categoryId: string,
): string {
    return `/ranking?categoria=${encodeURIComponent(categoryId)}`;
}

export function formatRankingPoints(
    points: number,
): string {
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
        month: "long",
        year: "numeric",
    }).format(date);
}