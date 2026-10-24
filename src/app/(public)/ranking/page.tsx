import { createClient } from "@/lib/supabase/server";
import RankingTable, { type RankingRow } from "./ranking-table";

export const metadata = {
    title: "Ranking individual | Sagunto Padel Cup",
    description: "Clasificación individual oficial de Sagunto Padel Cup.",
};

export const dynamic = "force-dynamic";

export default async function RankingPage() {
    let rows: RankingRow[] = [];
    let published = false;
    let error = false;

    try {
        const supabase = await createClient();

        const { data: season } = await supabase
            .from("seasons")
            .select("id")
            .eq("status", "active")
            .order("start_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (season) {
            const { data: snapshot } = await supabase
                .from("ranking_snapshots")
                .select("id,taken_at")
                .eq("season_id", season.id)
                .eq("snapshot_type", "published")
                .order("taken_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (snapshot) {
                published = true;

                const { data: entries, error: entriesError } =
                    await supabase
                        .from("ranking_snapshot_entries")
                        .select(
                            "player_id,position,total_points,players!inner(id,profiles!inner(display_name))",
                        )
                        .eq("snapshot_id", snapshot.id)
                        .order("position", {
                            ascending: true,
                            nullsFirst: false,
                        });

                if (entriesError) {
                    throw entriesError;
                }

                const playerIds = (entries ?? []).map(
                    (entry: any) => entry.player_id,
                );

                const { data: history } = playerIds.length
                    ? await supabase
                        .from("player_category_history")
                        .select("player_id,categories!inner(level)")
                        .in("player_id", playerIds)
                        .is("valid_to", null)
                    : { data: [] };

                const categoryByPlayer = new Map<string, string>();

                for (const item of (history ?? []) as any[]) {
                    categoryByPlayer.set(
                        item.player_id,
                        item.categories?.level ?? "",
                    );
                }

                rows = (entries ?? []).map((entry: any) => ({
                    id: entry.player_id,
                    position: entry.position,
                    name:
                        entry.players?.profiles?.display_name?.trim() ||
                        "Jugador/a",
                    points: Number(entry.total_points ?? 0),
                    category:
                        categoryByPlayer.get(entry.player_id) || null,
                }));
            }
        }
    } catch {
        error = true;
    }

    return (
        <main className="section section-light">
            <div className="container">
                <p className="ranking-eyebrow">RACE TO MASTER</p>

                <h1 className="ranking-title">
                    <span aria-hidden="true">/</span> RANKING INDIVIDUAL
                </h1>

                <RankingTable
                    rows={rows}
                    published={published}
                    error={error}
                />

                <p className="ranking-note">
                    El ranking oficial se actualizará cuando la organización
                    publique una nueva clasificación de la temporada activa.
                </p>
            </div>

            <style>{`
                .ranking-eyebrow {
                    margin: 0 0 5px;
                    color: #f0443a;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: .16em;
                }

                .ranking-title {
                    margin: 0 0 20px;
                    color: #0d1b2a;
                    font-family: var(--font-oswald), Impact, sans-serif;
                    font-size: clamp(28px, 3vw, 40px);
                    font-weight: 800;
                    line-height: 1.15;
                }

                .ranking-title span {
                    color: #f0443a;
                    margin-right: 8px;
                }

                .ranking-note {
                    margin: 16px 0 0;
                    color: #697680;
                    font-size: 13px;
                }
            `}</style>
        </main>
    );
}