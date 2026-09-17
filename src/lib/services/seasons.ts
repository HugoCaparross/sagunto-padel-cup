import { createClient } from "@/lib/supabase/server";
import type { Season, SeasonInsert, SeasonUpdate } from "@/types/database";
import {
    calculateRetainedPoints,
    calculateRemovedPoints,
    validateSeasonInput,
    type SeasonInput,
} from "@/lib/competition/seasons";

export async function getSeasons(): Promise<Season[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("seasons").select("*").order("start_date", { ascending: false });
    if (error) throw new Error(`No se pudieron obtener las temporadas: ${error.message}`);
    return (data ?? []) as Season[];
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!seasonId) return null;
    const supabase = await createClient();
    const { data, error } = await supabase.from("seasons").select("*").eq("id", seasonId).maybeSingle();
    if (error) throw new Error(`No se pudo obtener la temporada: ${error.message}`);
    return data as Season | null;
}

export async function createSeasonRecord(input: SeasonInput): Promise<Season> {
    const validation = validateSeasonInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(" "));

    const settings = input.masterFinalDate ? { master_final_date: input.masterFinalDate } : {};
    const payload: SeasonInsert = {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        start_date: new Date(input.startDate).toISOString(),
        end_date: new Date(input.endDate).toISOString(),
        status: "planificada",
        rollover_percentage: 30,
        settings,
    };

    const supabase = await createClient();
    const { data, error } = await supabase.from("seasons").insert(payload).select("*").single();
    if (error) throw new Error(`No se pudo crear la temporada: ${error.message}`);
    return data as Season;
}

export async function updateSeasonRecord(seasonId: string, input: SeasonUpdate): Promise<Season> {
    if (!seasonId) throw new Error("Falta seasonId.");
    if (input.rollover_percentage !== undefined && input.rollover_percentage !== 30) {
        throw new Error("El porcentaje de arrastre de temporada de SPC debe ser 30 %.");
    }
    const supabase = await createClient();
    const { data, error } = await supabase.from("seasons").update(input).eq("id", seasonId).select("*").single();
    if (error) throw new Error(`No se pudo actualizar la temporada: ${error.message}`);
    return data as Season;
}

export async function closeSeasonPreview(points: number) {
    return {
        previousPoints: points,
        retainedPoints: calculateRetainedPoints(points),
        removedPoints: calculateRemovedPoints(points),
        retainedPercentage: 30,
        removedPercentage: 70,
    };
}
