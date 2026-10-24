import { createClient } from "@/lib/supabase/server";

export type HomeEvent = {
    id: string;
    event_number: number | null;
    type: "regular" | "master_final";
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    capacity: number | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    season_id: string;
};

export type CalendarEvent = {
    number: string;
    date: string;
    venue: string;
    status: string;
    state: "planned" | "featured";
};

export type HomeData = {
    upcomingEvent: {
        id: string | null;
        number: string;
        club: string;
        dateLabel: string;
        yearLabel: string;
        location: string;
        categories: string[];
        status: string | null;
        capacity: number | null;
        registrationOpensLabel: string;
        registrationClosesLabel: string;
    };
    calendarEvents: CalendarEvent[];
    masterFinal: { date: string; status: string } | null;
    rankingPreview: {
        position: number;
        name: string;
        points: number;
        events: number;
        movement: number;
    }[];
    resultsPreview: {
        id: string;
        category: string;
        description: string;
        date: string;
        href: string;
        imageClass: string;
    }[];
    newsItems: {
        id: string;
        tag: string;
        title: string;
        summary: string;
        date: string;
        imageClass: string;
    }[];
    sponsors: {
        id: string;
        name: string;
        logo_url: string | null;
        website_url: string | null;
    }[];
};

const emptyHomeData: HomeData = {
    upcomingEvent: {
        id: null,
        number: "—",
        club: "Próxima prueba por confirmar",
        dateLabel: "Fecha pendiente de publicación",
        yearLabel: "Temporada por confirmar",
        location: "Sagunto, Valencia",
        categories: [],
        status: null,
        capacity: null,
        registrationOpensLabel: "Fecha por confirmar",
        registrationClosesLabel: "Fecha por confirmar",
    },
    calendarEvents: [],
    masterFinal: null,
    rankingPreview: [],
    resultsPreview: [],
    newsItems: [],
    sponsors: [],
};

function formatDateRange(
    startDate: string | null,
    endDate: string | null
) {
    if (!startDate) return "Fecha por confirmar";

    const format = (value: string) =>
        new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(`${value}T00:00:00Z`));

    if (!endDate || endDate === startDate) {
        return format(startDate);
    }

    return `${format(startDate)} – ${format(endDate)}`;
}

function formatShortDate(
    startDate: string | null,
    endDate: string | null
) {
    if (!startDate) return "FECHA POR CONFIRMAR";

    const format = (value: string) =>
        new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            timeZone: "UTC",
        })
            .format(new Date(`${value}T00:00:00Z`))
            .toUpperCase();

    if (!endDate || endDate === startDate) {
        return format(startDate);
    }

    return `${format(startDate)} – ${format(endDate)}`;
}

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        published: "Próximamente",
        registration_open: "Inscripciones abiertas",
        registration_closed: "Inscripciones cerradas",
        in_progress: "En curso",
        completed: "Finalizada",
        cancelled: "Cancelada",
    };

    return labels[status] ?? "Por confirmar";
}

export async function getHomeData(): Promise<HomeData> {
    try {
        const supabase = await createClient();
        const today = new Date().toISOString().slice(0, 10);

        const [
            seasonResult,
            sponsorsResult,
            newsResult,
            rankingResult,
            matchesResult,
        ] = await Promise.all([
            supabase
                .from("seasons")
                .select("id, name, start_date, end_date, status")
                .eq("status", "active")
                .order("start_date", { ascending: false })
                .limit(1)
                .maybeSingle(),

            supabase
                .from("sponsors")
                .select("id, name, logo_url, website_url, display_order")
                .eq("is_published", true)
                .order("display_order", { ascending: true })
                .limit(12),

            supabase
                .from("news")
                .select("id, title, slug, excerpt, published_at")
                .eq("status", "published")
                .not("published_at", "is", null)
                .lte("published_at", new Date().toISOString())
                .order("published_at", { ascending: false })
                .limit(3),

            supabase
                .from("public_ranking_preview")
                .select(
                    "player_id, display_name, position, total_points, event_count"
                )
                .order("position", { ascending: true })
                .limit(5),

            supabase
                .from("matches")
                .select("id, stage_id, scheduled_at, status, validated_at")
                .not("validated_at", "is", null)
                .order("validated_at", {
                    ascending: false,
                    nullsFirst: false,
                })
                .limit(3),
        ]);

        for (const [label, result] of [
            ["temporada activa", seasonResult],
            ["patrocinadores", sponsorsResult],
            ["noticias", newsResult],
            ["ranking público", rankingResult],
            ["resultados validados", matchesResult],
        ] as const) {
            if (result.error) {
                console.error(
                    `Supabase: error cargando ${label}:`,
                    result.error.message
                );
            }
        }

        const season = seasonResult.data;

        let events: HomeEvent[] = [];

        let venues: {
            event_id: string;
            venue_name: string;
            address: string | null;
        }[] = [];

        let eventCategories: {
            event_id: string;
            category_id: string;
        }[] = [];

        let categoryRows: {
            id: string;
            name: string;
            sort_order: number;
        }[] = [];

        if (season?.id) {
            const eventsResult = await supabase
                .from("events")
                .select(
                    "id, event_number, type, name, slug, description, location, start_date, end_date, status, capacity, registration_opens_at, registration_closes_at, season_id"
                )
                .eq("season_id", season.id)
                .neq("status", "draft")
                .neq("status", "cancelled")
                .order("start_date", {
                    ascending: true,
                    nullsFirst: false,
                });

            if (eventsResult.error) {
                console.error(
                    "Supabase: error cargando pruebas:",
                    eventsResult.error.message
                );
            }

            events = (eventsResult.data ?? []) as HomeEvent[];

            const eventIds = events.map((event) => event.id);

            if (eventIds.length) {
                const [
                    venuesResult,
                    eventCategoriesResult,
                ] = await Promise.all([
                    supabase
                        .from("event_venues")
                        .select("event_id, venue_name, address")
                        .in("event_id", eventIds),

                    supabase
                        .from("event_categories")
                        .select("event_id, category_id")
                        .in("event_id", eventIds),
                ]);

                if (venuesResult.error) {
                    console.error(
                        "Supabase: error cargando sedes:",
                        venuesResult.error.message
                    );
                }

                if (eventCategoriesResult.error) {
                    console.error(
                        "Supabase: error cargando categorías de las pruebas:",
                        eventCategoriesResult.error.message
                    );
                }

                venues = venuesResult.data ?? [];
                eventCategories = eventCategoriesResult.data ?? [];

                const categoryIds = [
                    ...new Set(
                        eventCategories.map((row) => row.category_id)
                    ),
                ];

                if (categoryIds.length) {
                    const categoriesResult = await supabase
                        .from("categories")
                        .select("id, name, sort_order")
                        .in("id", categoryIds)
                        .eq("is_active", true)
                        .order("sort_order", { ascending: true });

                    if (categoriesResult.error) {
                        console.error(
                            "Supabase: error cargando categorías:",
                            categoriesResult.error.message
                        );
                    }

                    categoryRows = categoriesResult.data ?? [];
                }
            }
        }

        const regularEvents = events.filter(
            (event) => event.type === "regular"
        );

        const upcoming =
            regularEvents.find(
                (event) =>
                    event.start_date &&
                    event.start_date >= today &&
                    event.status !== "completed"
            ) ??
            regularEvents.find(
                (event) => event.status === "in_progress"
            ) ??
            null;

        const venueFor = (eventId: string) =>
            venues.find((venue) => venue.event_id === eventId);

        const categoriesFor = (eventId: string) => {
            const ids = eventCategories
                .filter((row) => row.event_id === eventId)
                .map((row) => row.category_id);

            return categoryRows
                .filter((category) => ids.includes(category.id))
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((category) => category.name);
        };

        const upcomingVenue = upcoming
            ? venueFor(upcoming.id)
            : undefined;

        const upcomingEvent = upcoming
            ? {
                id: upcoming.id,
                number: String(
                    upcoming.event_number ?? "—"
                ).padStart(2, "0"),
                club: upcoming.name,
                dateLabel: formatDateRange(
                    upcoming.start_date,
                    upcoming.end_date
                ),
                yearLabel:
                    season?.name ??
                    (season?.start_date
                        ? `Temporada ${new Date(
                            `${season.start_date}T00:00:00Z`
                        ).getUTCFullYear()}`
                        : "Temporada por confirmar"),
                location:
                    upcomingVenue?.venue_name ??
                    upcoming.location ??
                    upcomingVenue?.address ??
                    "Sagunto, Valencia",
                categories: categoriesFor(upcoming.id),
                status: upcoming.status,
                capacity: upcoming.capacity,
                registrationOpensLabel:
                    upcoming.registration_opens_at
                        ? new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        }).format(
                            new Date(upcoming.registration_opens_at)
                        )
                        : "Fecha por confirmar",
                registrationClosesLabel:
                    upcoming.registration_closes_at
                        ? new Intl.DateTimeFormat("es-ES", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        }).format(
                            new Date(upcoming.registration_closes_at)
                        )
                        : "Fecha por confirmar",
            }
            : emptyHomeData.upcomingEvent;

        const calendarEvents = regularEvents.map((event) => ({
            number: String(
                event.event_number ?? "—"
            ).padStart(2, "0"),
            date: formatShortDate(
                event.start_date,
                event.end_date
            ),
            venue:
                venueFor(event.id)?.venue_name ??
                event.location ??
                "Sede por confirmar",
            status: statusLabel(event.status),
            state:
                event.id === upcoming?.id
                    ? ("featured" as const)
                    : ("planned" as const),
        }));

        const master = events.find(
            (event) => event.type === "master_final"
        );

        const rankingPreview = (rankingResult.data ?? []).map(
            (row, index) => ({
                position: row.position ?? index + 1,
                name: row.display_name || "Jugador/a",
                points: Number(row.total_points ?? 0),
                events: Number(row.event_count ?? 0),
                movement: 0,
            })
        );

        let resultsPreview: HomeData["resultsPreview"] = [];

        const matches = matchesResult.data ?? [];

        if (matches.length) {
            const matchIds = matches.map((match) => match.id);

            const setsResult = await supabase
                .from("match_sets")
                .select("match_id, set_number, games_a, games_b")
                .in("match_id", matchIds)
                .order("set_number", { ascending: true });

            if (setsResult.error) {
                console.error(
                    "Supabase: error cargando parciales de los partidos:",
                    setsResult.error.message
                );
            }

            const sets = setsResult.data ?? [];

            resultsPreview = matches.map((match, index) => {
                const score = sets
                    .filter((set) => set.match_id === match.id)
                    .map(
                        (set) => `${set.games_a}-${set.games_b}`
                    )
                    .join(", ");

                const date = match.scheduled_at
                    ? new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "medium",
                    }).format(new Date(match.scheduled_at))
                    : "Fecha no disponible";

                return {
                    id: match.id,
                    category: "RESULTADO VALIDADO",
                    description: score
                        ? `Marcador: ${score}`
                        : "Resultado validado por la organización.",
                    date,
                    href: "/resultados",
                    imageClass: [
                        "resultImageOne",
                        "resultImageTwo",
                        "resultImageThree",
                    ][index % 3],
                };
            });
        }

        const newsItems = (newsResult.data ?? []).map(
            (item, index) => ({
                id: item.id,
                tag: "ACTUALIDAD",
                title: item.title,
                summary:
                    item.excerpt ??
                    "Consulta la información oficial de Sagunto Padel Cup.",
                date: item.published_at
                    ? new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "medium",
                    }).format(new Date(item.published_at))
                    : "",
                imageClass: [
                    "newsImageOne",
                    "newsImageTwo",
                    "newsImageThree",
                ][index % 3],
            })
        );

        return {
            upcomingEvent,
            calendarEvents,
            masterFinal: master
                ? {
                    date: formatShortDate(
                        master.start_date,
                        master.end_date
                    ),
                    status: statusLabel(master.status),
                }
                : null,
            rankingPreview,
            resultsPreview,
            newsItems,
            sponsors: (sponsorsResult.data ?? []).map(
                (sponsor) => ({
                    id: sponsor.id,
                    name: sponsor.name,
                    logo_url: sponsor.logo_url,
                    website_url: sponsor.website_url,
                })
            ),
        };
    } catch (error) {
        console.error(
            "No se pudieron cargar los datos de la página de inicio desde Supabase:",
            error
        );

        return emptyHomeData;
    }
}