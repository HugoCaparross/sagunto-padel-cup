import type { Metadata } from "next";
import Link from "next/link";

import {
    getAuthenticatedContext,
} from "@/lib/auth/flow";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Mi perfil",

    description:
        "Tu área privada de jugador en Sagunto Padel Cup.",

    robots: {
        index: false,
        follow: false,
    },
};

type Props = {
    searchParams: Promise<{
        welcome?: string;
    }>;
};

export default async function PerfilPage({
    searchParams,
}: Props) {
    const {
        user,
        player,
    } =
        await getAuthenticatedContext();

    const params =
        await searchParams;

    if (!user || !player) {
        return null;
    }

    const name =
        `${player.nombre} ${player.apellidos ?? ""}`.trim();

    const initials =
        `${player.nombre.charAt(0)}${player.apellidos?.charAt(0) ?? ""}`.toUpperCase();

    return (
        <main className={styles.page}>
            <section
                className={styles.hero}
            >
                <div
                    className={
                        styles.container
                    }
                >
                    {params.welcome ===
                        "1" && (
                            <div
                                className={
                                    styles.welcome
                                }
                                role="status"
                            >
                                <strong>
                                    Bienvenido a
                                    Sagunto Padel
                                    Cup.
                                </strong>

                                <span>
                                    Tu perfil de
                                    jugador ya
                                    está preparado.
                                </span>
                            </div>
                        )}

                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        ÁREA DE JUGADOR
                    </span>

                    <div
                        className={
                            styles.heroRow
                        }
                    >
                        <div
                            className={
                                styles.identity
                            }
                        >
                            <div
                                className={
                                    styles.avatar
                                }
                            >
                                {player.foto_url ? (
                                    <img
                                        src={
                                            player.foto_url
                                        }
                                        alt=""
                                    />
                                ) : (
                                    initials
                                )}
                            </div>

                            <div>
                                <h1>
                                    {name}
                                </h1>

                                <p>
                                    {
                                        player.email
                                    }
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/app/seguridad"
                            className={
                                styles.secondaryButton
                            }
                        >
                            Seguridad
                        </Link>
                    </div>
                </div>
            </section>

            <section
                className={styles.content}
            >
                <div
                    className={
                        styles.container
                    }
                >
                    <div
                        className={
                            styles.grid
                        }
                    >
                        <article
                            className={
                                styles.card
                            }
                        >
                            <span>
                                CATEGORÍA
                            </span>

                            <strong>
                                {player.categoria_actual_id
                                    ? "Asignada"
                                    : "Pendiente"}
                            </strong>

                            <p>
                                Tu categoría
                                actual
                                determina el
                                contexto
                                competitivo
                                de tus
                                próximos
                                torneos.
                            </p>
                        </article>

                        <article
                            className={
                                styles.card
                            }
                        >
                            <span>
                                ESTADO
                            </span>

                            <strong>
                                {player.estado ===
                                    "activo"
                                    ? "Activo"
                                    : player.estado}
                            </strong>

                            <p>
                                Tu cuenta está
                                correctamente
                                vinculada a tu
                                perfil de
                                jugador.
                            </p>
                        </article>

                        <article
                            className={
                                styles.card
                            }
                        >
                            <span>
                                CUENTA
                            </span>

                            <strong>
                                Verificada
                            </strong>

                            <p>
                                Acceso mediante
                                Supabase Auth.
                                Puedes gestionar
                                tu contraseña
                                desde
                                Seguridad.
                            </p>
                        </article>
                    </div>
                </div>
            </section>
        </main>
    );
}