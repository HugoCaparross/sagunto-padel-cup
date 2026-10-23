const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type QueryParams = Record<
    string,
    string | number | boolean | null | undefined
>;

export async function supabaseSelect<T>(
    table: string,
    params: QueryParams = {}
): Promise<T[]> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("Supabase no está configurado.");
        return [];
    }

    const url = new URL(
        `/rest/v1/${table}`,
        SUPABASE_URL
    );

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    }

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
            next: {
                revalidate: 60,
            },
        });

        if (!response.ok) {
            const error = await response.text();

            console.error(
                `Error consultando Supabase (${table}):`,
                response.status,
                error
            );

            return [];
        }

        return (await response.json()) as T[];
    } catch (error) {
        console.error(
            `Error de conexión con Supabase (${table}):`,
            error
        );

        return [];
    }
}