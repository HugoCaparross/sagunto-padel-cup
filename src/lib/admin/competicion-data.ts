import { createClient } from "@/lib/supabase/server";

export type EventOption = { id: string; name: string; status: string; event_type: string };

export async function loadEvents(): Promise<EventOption[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("events")
        .select("id,name,status,event_type")
        .order("starts_at", { ascending: false, nullsFirst: false });
    return (data ?? []) as EventOption[];
}

/** Hora local de Madrid a partir de un ISO. */
export function hhmm(iso: string | null): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export async function loadPresentation(eventId: string) {
    const supabase = await createClient();

    const [courtsRes, regsRes, stagesRes] = await Promise.all([
        supabase.from("event_courts").select("id,name,position").eq("event_id", eventId).order("position"),
        supabase
            .from("registrations")
            .select("id,presented_at,registration_players(player_order,players(display_name))")
            .eq("event_id", eventId)
            .eq("status", "confirmed"),
        supabase.from("competition_stages").select("id,event_categories!inner(event_id)").eq("event_categories.event_id", eventId),
    ]);

    const regs = (regsRes.data ?? []) as any[];
    const names = new Map<string, string>(
        regs.map((r) => [
            r.id,
            [...(r.registration_players ?? [])]
                .sort((x: any, y: any) => x.player_order - y.player_order)
                .map((rp: any) => rp.players?.display_name)
                .filter(Boolean)
                .join(" / ") || "Pareja sin nombre",
        ]),
    );

    const stageIds = ((stagesRes.data ?? []) as any[]).map((s) => s.id as string);

    let matches: any[] = [];
    if (stageIds.length > 0) {
        const { data } = await supabase
            .from("matches")
            .select("id,match_number,round_name,status,scheduled_at,court_name,registration_a_id,registration_b_id")
            .in("stage_id", stageIds)
            .eq("status", "scheduled")
            .order("scheduled_at", { ascending: true, nullsFirst: false });
        matches = (data ?? []) as any[];
    }

    return {
        courts: (courtsRes.data ?? []) as { id: string; name: string; position: number }[],
        pairs: regs.map((r) => ({
            id: r.id as string,
            name: names.get(r.id) ?? "Pareja sin nombre",
            presentedAt: hhmm(r.presented_at),
        })),
        matches: matches.map((m) => ({
            id: m.id as string,
            label: `${m.match_number ?? "Partido"}${m.round_name ? ` · ${m.round_name}` : ""}`,
            a: m.registration_a_id ? names.get(m.registration_a_id) ?? "Por definir" : "Por definir",
            b: m.registration_b_id ? names.get(m.registration_b_id) ?? "Por definir" : "Por definir",
            court: (m.court_name as string | null) ?? null,
        })),
    };
}