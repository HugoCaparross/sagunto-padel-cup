import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import { getPublicTournamentBySlug } from "@/lib/public/site";
import {
    getPartnerPool,
    getPlayerRegistration,
    getRegistrationCapacity,
} from "@/lib/services/registrations";

import RegistrationForm from "./RegistrationForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Inscripción al torneo",
    description:
        "Completa tu inscripción en Sagunto Padel Cup.",
    robots: {
        index: false,
        follow: false,
    },
};

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        inscrito?: string;
        error?: string;
    }>;
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

export default async function TournamentRegistrationPage({
    params,
    searchParams,
}: PageProps) {
    const { slug } = await params;
    const query = await searchParams;

    const { user, player } =
        await getAuthenticatedContext();

    if (!user) {
        redirect("/login");
    }

    if (
        !player ||
        !player.onboarding_completado
    ) {
        redirect("/registro/confirma");
    }

    if (player.role === "admin") {
        redirect("/admin/torneos");
    }

    const result =
        await getPublicTournamentBySlug(slug);

    if (
        result.error?.message ===
        "TORNEO_NOT_FOUND"
    ) {
        notFound();
    }

    if (
        result.error ||
        !result.data
    ) {
        throw (
            result.error ??
            new Error(
                "No se ha podido cargar el torneo.",
            )
        );
    }

    const {
        tournament,
        club,
        categories,
    } = result.data;

    if (
        tournament.estado !==
        "inscripciones_abiertas"
    ) {
        return (
            <main className={styles.page}>
                <div className={styles.container}>
                    <Link
                        href={`/torneos/${slug}`}
                        className={styles.backLink}
                    >
                        <ArrowLeft
                            size={16}
                            aria-hidden="true"
                        />

                        Volver al torneo
                    </Link>

                    <section
                        className={
                            styles.closedState
                        }
                    >
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            INSCRIPCIONES
                        </span>

                        <h1>
                            Las inscripciones no
                            están abiertas.
                        </h1>

                        <p>
                            Este torneo no admite
                            nuevas inscripciones
                            en este momento.
                        </p>

                        <Link
                            href={`/torneos/${slug}`}
                            className={
                                styles.secondaryButton
                            }
                        >
                            Ver información del
                            torneo
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    const existingRegistration =
        await getPlayerRegistration(
            player.id,
            tournament.id,
        );

    if (existingRegistration) {
        const justRegistered =
            query.inscrito === "1";

        return (
            <main className={styles.page}>
                <div
                    className={
                        styles.container
                    }
                >
                    <Link
                        href={`/torneos/${slug}`}
                        className={
                            styles.backLink
                        }
                    >
                        <ArrowLeft
                            size={16}
                            aria-hidden="true"
                        />

                        Volver al torneo
                    </Link>

                    {justRegistered ? (
                        <section
                            className={
                                styles.successPage
                            }
                        >
                            <div
                                className={
                                    styles.successMark
                                }
                            >
                                ✓
                            </div>

                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                INSCRIPCIÓN
                                CONFIRMADA
                            </span>

                            <h1>
                                Ya estás dentro
                                del torneo.
                            </h1>

                            <p>
                                Tu inscripción se ha
                                registrado
                                correctamente. El
                                pago se realizará de
                                forma presencial y
                                la organización
                                verificará
                                manualmente el pago.
                            </p>

                            <div
                                className={
                                    styles.successActions
                                }
                            >
                                <Link
                                    href={`/torneos/${slug}`}
                                    className={
                                        styles.secondaryButton
                                    }
                                >
                                    Volver al torneo
                                </Link>

                                <Link
                                    href="/app"
                                    className={
                                        styles.primaryButton
                                    }
                                >
                                    Ir a mi área
                                </Link>
                            </div>
                        </section>
                    ) : (
                        <section
                            className={
                                styles.closedState
                            }
                        >
                            <span
                                className={
                                    styles.eyebrow
                                }
                            >
                                INSCRIPCIÓN
                            </span>

                            <h1>
                                Ya tienes una
                                inscripción en
                                este torneo.
                            </h1>

                            <p>
                                No puedes registrar
                                una segunda
                                inscripción para el
                                mismo torneo.
                                Puedes consultar el
                                estado de la
                                inscripción desde tu
                                área de jugador.
                            </p>

                            <Link
                                href="/app"
                                className={
                                    styles.secondaryButton
                                }
                            >
                                Volver a mi área
                            </Link>
                        </section>
                    )}
                </div>
            </main>
        );
    }

    const enabledCategories =
        categories.filter(
            (item) =>
                item.enabled &&
                item.category,
        );

    if (
        enabledCategories.length === 0
    ) {
        return (
            <main className={styles.page}>
                <div
                    className={
                        styles.container
                    }
                >
                    <Link
                        href={`/torneos/${slug}`}
                        className={
                            styles.backLink
                        }
                    >
                        <ArrowLeft
                            size={16}
                            aria-hidden="true"
                        />

                        Volver al torneo
                    </Link>

                    <section
                        className={
                            styles.closedState
                        }
                    >
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            INSCRIPCIONES
                        </span>

                        <h1>
                            No hay categorías
                            disponibles.
                        </h1>

                        <p>
                            La organización todavía
                            no ha configurado
                            categorías disponibles
                            para este torneo.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    const capacities =
        await Promise.all(
            enabledCategories.map(
                async (item) => {
                    try {
                        const capacity =
                            await getRegistrationCapacity(
                                tournament.id,
                                item.categoria_id,
                            );

                        return [
                            item.categoria_id,
                            capacity,
                        ] as const;
                    } catch {
                        return [
                            item.categoria_id,
                            null,
                        ] as const;
                    }
                },
            ),
        );

    const capacityMap =
        Object.fromEntries(
            capacities,
        );

    const partnerPoolResults =
        await Promise.all(
            enabledCategories.map(
                async (item) => {
                    try {
                        const pool =
                            await getPartnerPool(
                                tournament.id,
                                item.categoria_id,
                            );

                        return [
                            item.categoria_id,
                            pool.filter(
                                (entry) =>
                                    entry.player
                                        ?.id !==
                                    player.id,
                            ),
                        ] as const;
                    } catch {
                        return [
                            item.categoria_id,
                            [],
                        ] as const;
                    }
                },
            ),
        );

    const partnerPoolMap =
        Object.fromEntries(
            partnerPoolResults,
        );

    const defaultCategoryId =
        enabledCategories.some(
            (item) =>
                item.categoria_id ===
                player.categoria_actual_id,
        )
            ? player.categoria_actual_id ??
            enabledCategories[0]
                .categoria_id
            : enabledCategories[0]
                .categoria_id;

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <Link
                    href={`/torneos/${slug}`}
                    className={styles.backLink}
                >
                    <ArrowLeft
                        size={16}
                        aria-hidden="true"
                    />

                    Volver al torneo
                </Link>

                <header
                    className={styles.header}
                >
                    <div>
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            INSCRIPCIÓN ·
                            SAGUNTO PADEL CUP
                        </span>

                        <h1>
                            Inscríbete en{" "}
                            {tournament.nombre}
                        </h1>

                        <p>
                            Elige tu categoría y
                            configura tu pareja.
                            El pago se realiza
                            presencialmente y será
                            verificado por la
                            organización.
                        </p>
                    </div>

                    <div
                        className={
                            styles.tournamentMeta
                        }
                    >
                        <div>
                            <CalendarDays
                                size={16}
                                aria-hidden="true"
                            />

                            <span>
                                {formatDate(
                                    tournament.fecha_inicio,
                                )}{" "}
                                —{" "}
                                {formatDate(
                                    tournament.fecha_fin,
                                )}
                            </span>
                        </div>

                        <div>
                            <MapPin
                                size={16}
                                aria-hidden="true"
                            />

                            <span>
                                {club?.nombre ??
                                    "Club pendiente"}
                            </span>
                        </div>
                    </div>
                </header>

                {query.error && (
                    <section
                        className={
                            styles.error
                        }
                        role="alert"
                    >
                        <strong>
                            No hemos podido
                            completar la
                            inscripción.
                        </strong>

                        <p>
                            {query.error}
                        </p>
                    </section>
                )}

                <RegistrationForm
                    slug={slug}
                    tournamentId={
                        tournament.id
                    }
                    categories={enabledCategories.map(
                        (item) => ({
                            id:
                                item.categoria_id,
                            name:
                                item.category
                                    ?.nombre ??
                                "Categoría",
                            gender:
                                item.category
                                    ?.gender ??
                                "mixto",
                            maxCapacity:
                                item.cupo_maximo,
                            capacity:
                                capacityMap[
                                item
                                    .categoria_id
                                ],
                            partnerPool:
                                partnerPoolMap[
                                item
                                    .categoria_id
                                ] ?? [],
                        }),
                    )}
                    defaultCategoryId={
                        defaultCategoryId
                    }
                    playerName={[
                        player.nombre,
                        player.apellidos,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .trim()}
                />

                <aside
                    className={
                        styles.notice
                    }
                >
                    <Users
                        size={18}
                        aria-hidden="true"
                    />

                    <div>
                        <strong>
                            ¿No tienes pareja?
                        </strong>

                        <p>
                            Puedes entrar en el
                            Partner Pool de la
                            categoría. Tu
                            solicitud quedará
                            vinculada a la
                            inscripción y podremos
                            conectarte con otros
                            jugadores disponibles.
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}