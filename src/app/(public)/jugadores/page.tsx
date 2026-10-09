import Link from "next/link";
import type { Metadata } from "next";

import PublicShell from "@/components/public/PublicShell";
import {
    EmptyPublic,
    ErrorPublic,
    PageIntro,
} from "@/components/public/PublicBlocks";
import { getPublicPlayers } from "@/lib/public/site";
import { buildMetadata } from "@/lib/public/seo";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
    title: "Jugadores",
    description:
        "Directorio público de jugadores de Sagunto Padel Cup con categoría y puntos de temporada.",
    path: "/jugadores",
});

function playerName(player: {
    nombre: string;
    apellidos: string | null;
}) {
    return [player.nombre, player.apellidos]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function initials(player: {
    nombre: string;
    apellidos: string | null;
}) {
    const name = playerName(player);

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

export default async function PlayersPage() {
    const result = await getPublicPlayers();

    if (result.error) {
        return (
            <PublicShell>
                <PageIntro
                    eyebrow="JUGADORES"
                    title="Directorio de jugadores"
                    description="Consulta los perfiles deportivos que han decidido formar parte del directorio público del circuito."
                />

                <section className={styles.content}>
                    <ErrorPublic message={result.error.message} />
                </section>
            </PublicShell>
        );
    }

    const players = [...result.data].sort((a, b) => {
        const nameA = playerName(a).toLocaleLowerCase("es");
        const nameB = playerName(b).toLocaleLowerCase("es");

        return nameA.localeCompare(nameB, "es");
    });

    return (
        <PublicShell>
            <PageIntro
                eyebrow="JUGADORES"
                title="Directorio de jugadores"
                description="Perfiles deportivos públicos del circuito, con categoría y puntos acumulados durante la temporada activa."
            />

            <section className={styles.content}>
                {players.length === 0 ? (
                    <EmptyPublic
                        title="Todavía no hay jugadores públicos"
                        description="Los jugadores aparecerán aquí cuando tengan habilitada la visibilidad pública de su perfil."
                    />
                ) : (
                    <div className={styles.grid}>
                        {players.map((player) => (
                            <Link
                                href={`/jugadores/${player.id}`}
                                className={styles.card}
                                key={player.id}
                            >
                                <span
                                    className={styles.avatar}
                                    aria-hidden="true"
                                >
                                    {initials(player)}
                                </span>

                                <span className={styles.body}>
                                    <strong className={styles.name}>
                                        {playerName(player)}
                                    </strong>

                                    <span className={styles.category}>
                                        {player.category?.nombre ??
                                            "Categoría pendiente"}
                                    </span>

                                    <span className={styles.stats}>
                                        <span>
                                            {player.points} pts
                                        </span>

                                        {player.ciudad ? (
                                            <span>{player.ciudad}</span>
                                        ) : null}
                                    </span>
                                </span>

                                <span
                                    className={styles.arrow}
                                    aria-hidden="true"
                                >
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </PublicShell>
    );
}