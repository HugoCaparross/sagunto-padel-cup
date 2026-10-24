import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchType =
    | "Prueba"
    | "Temporada"
    | "Categoría"
    | "Subgrupo"
    | "Jugador/a"
    | "Pareja"
    | "Partido"
    | "Club"
    | "Noticia"
    | "Patrocinador"
    | "Pregunta frecuente";

type SearchResult = {
    id: string;
    title: string;
    description: string;
    href: string;
    type: SearchType;
};

const MAX_RESULTS_PER_TYPE = 4;
const MAX_TOTAL_RESULTS = 30;

function escapeLike(value: string) {
    return value.replace(/[\\%_,]/g, "\\$&");
}

function getText(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function getDescription(
    ...values: unknown[]
): string {
    return (
        values
            .map(getText)
            .find((value) => value.trim().length > 0) ?? ""
    );
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function GET(request: NextRequest) {
    const query = (
        request.nextUrl.searchParams.get("q") ?? ""
    )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 100);

    if (query.length < 2) {
        return NextResponse.json(
            { results: [], query },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    }

    try {
        const supabase = await createClient();
        const pattern = `%${escapeLike(query)}%`;

        const safeQuery = async <T,>(
            name: string,
            operation: PromiseLike<{
                data: T[] | null;
                error: { message: string } | null;
            }>,
        ): Promise<T[]> => {
            try {
                const { data, error } = await operation;

                if (error) {
                    console.error(
                        `[Búsqueda] Error en ${name}:`,
                        error.message,
                    );
                    return [];
                }

                return data ?? [];
            } catch (error) {
                console.error(
                    `[Búsqueda] Error inesperado en ${name}:`,
                    error,
                );
                return [];
            }
        };

        const [
            events,
            seasons,
            categories,
            subgroups,
            players,
            pairs,
            matches,
            clubs,
            news,
            sponsors,
            faqs,
        ] = await Promise.all([
            safeQuery<{
                id: string;
                name: string;
                slug: string;
                description: string | null;
                location: string | null;
                status: string;
            }>(
                "pruebas",
                supabase
                    .from("events")
                    .select(
                        "id, name, slug, description, location, status",
                    )
                    .neq("status", "draft")
                    .neq("status", "cancelled")
                    .ilike("name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                name: string;
                slug: string;
                year: number;
                description: string | null;
                status: string;
            }>(
                "temporadas",
                supabase
                    .from("seasons")
                    .select(
                        "id, name, slug, year, description, status",
                    )
                    .neq("status", "draft")
                    .neq("status", "archived")
                    .ilike("name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                name: string;
                slug: string;
                description: string | null;
                is_active: boolean;
            }>(
                "categorías",
                supabase
                    .from("categories")
                    .select(
                        "id, name, slug, description, is_active",
                    )
                    .eq("is_active", true)
                    .ilike("name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                name: string;
                description: string | null;
                is_active: boolean;
            }>(
                "subgrupos",
                supabase
                    .from("subgroups")
                    .select(
                        "id, name, description, is_active",
                    )
                    .eq("is_active", true)
                    .ilike("name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                player_code: string | null;
                profiles: unknown;
            }>(
                "jugadores",
                supabase
                    .from("players")
                    .select(
                        "id, player_code, profiles!inner(display_name, is_public)",
                    )
                    .eq("is_active", true)
                    .eq("profiles.is_public", true)
                    .ilike("profiles.display_name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                display_name: string | null;
            }>(
                "parejas",
                supabase
                    .from("pairs")
                    .select("id, display_name")
                    .is("archived_at", null)
                    .not("display_name", "is", null)
                    .ilike("display_name", pattern)
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                match_number: number | null;
                round_label: string | null;
                court_label: string | null;
            }>(
                "partidos",
                supabase
                    .from("matches")
                    .select(
                        "id, match_number, round_label, court_label",
                    )
                    .eq("result_status", "validated")
                    .neq("status", "cancelled")
                    .or(
                        `round_label.ilike.${pattern},court_label.ilike.${pattern}`,
                    )
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                name: string;
                slug: string;
                description: string | null;
                city: string | null;
            }>(
                "clubes",
                supabase
                    .from("clubs")
                    .select(
                        "id, name, slug, description, city",
                    )
                    .eq("is_published", true)
                    .or(
                        `name.ilike.${pattern},city.ilike.${pattern}`,
                    )
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                title: string;
                slug: string;
                excerpt: string | null;
                published_at: string | null;
            }>(
                "noticias",
                supabase
                    .from("news")
                    .select(
                        "id, title, slug, excerpt, published_at",
                    )
                    .eq("status", "published")
                    .not("published_at", "is", null)
                    .lte("published_at", new Date().toISOString())
                    .or(
                        `title.ilike.${pattern},excerpt.ilike.${pattern}`,
                    )
                    .order("published_at", {
                        ascending: false,
                    })
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                name: string;
                slug: string;
                description: string | null;
            }>(
                "patrocinadores",
                supabase
                    .from("sponsors")
                    .select(
                        "id, name, slug, description",
                    )
                    .eq("is_published", true)
                    .or(
                        `name.ilike.${pattern},description.ilike.${pattern}`,
                    )
                    .limit(MAX_RESULTS_PER_TYPE),
            ),

            safeQuery<{
                id: string;
                question: string;
                answer: string;
            }>(
                "preguntas frecuentes",
                supabase
                    .from("faqs")
                    .select("id, question, answer")
                    .eq("is_published", true)
                    .or(
                        `question.ilike.${pattern},answer.ilike.${pattern}`,
                    )
                    .limit(MAX_RESULTS_PER_TYPE),
            ),
        ]);

        const results: SearchResult[] = [];

        results.push(
            ...events.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.location,
                    item.description,
                    "Prueba del circuito",
                ),
                href: `/calendario`,
                type: "Prueba" as const,
            })),
        );

        results.push(
            ...seasons.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.description,
                    `Temporada ${item.year}`,
                ),
                href: "/circuito",
                type: "Temporada" as const,
            })),
        );

        results.push(
            ...categories.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.description,
                    "Categoría de competición",
                ),
                href: "/ranking",
                type: "Categoría" as const,
            })),
        );

        results.push(
            ...subgroups.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.description,
                    "Subgrupo de competición",
                ),
                href: "/ranking",
                type: "Subgrupo" as const,
            })),
        );

        results.push(
            ...players.map((item) => {
                const profile = Array.isArray(item.profiles)
                    ? item.profiles[0]
                    : item.profiles;

                const displayName = isRecord(profile)
                    ? getText(profile.display_name)
                    : "";

                return {
                    id: item.id,
                    title: displayName || "Jugador/a",
                    description: item.player_code
                        ? `Código ${item.player_code}`
                        : "Jugador/a del circuito",
                    href: "/ranking",
                    type: "Jugador/a" as const,
                };
            }),
        );

        results.push(
            ...pairs
                .filter((item) => item.display_name)
                .map((item) => ({
                    id: item.id,
                    title: item.display_name!,
                    description: "Pareja del circuito",
                    href: "/resultados",
                    type: "Pareja" as const,
                })),
        );

        results.push(
            ...matches.map((item) => ({
                id: item.id,
                title: item.round_label
                    ? item.round_label
                    : `Partido ${item.match_number ?? ""}`.trim(),
                description: getDescription(
                    item.court_label
                        ? `Pista ${item.court_label}`
                        : "",
                    "Resultado validado",
                ),
                href: "/resultados",
                type: "Partido" as const,
            })),
        );

        results.push(
            ...clubs.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.city,
                    item.description,
                    "Club colaborador",
                ),
                href: "/clubes",
                type: "Club" as const,
            })),
        );

        results.push(
            ...news.map((item) => ({
                id: item.id,
                title: item.title,
                description: getDescription(
                    item.excerpt,
                    "Actualidad del circuito",
                ),
                href: "/noticias",
                type: "Noticia" as const,
            })),
        );

        results.push(
            ...sponsors.map((item) => ({
                id: item.id,
                title: item.name,
                description: getDescription(
                    item.description,
                    "Patrocinador de Sagunto Padel Cup",
                ),
                href: "/",
                type: "Patrocinador" as const,
            })),
        );

        results.push(
            ...faqs.map((item) => ({
                id: item.id,
                title: item.question,
                description: item.answer,
                href: "/faq",
                type: "Pregunta frecuente" as const,
            })),
        );

        return NextResponse.json(
            {
                query,
                results: results.slice(0, MAX_TOTAL_RESULTS),
                total: results.length,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        console.error(
            "[Búsqueda] Error general:",
            error,
        );

        return NextResponse.json(
            {
                error: "No se ha podido completar la búsqueda.",
                results: [],
            },
            { status: 500 },
        );
    }
}