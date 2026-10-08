import Link from "next/link";
import { notFound } from "next/navigation";

import {
    getAdminRegistrationHistory,
    getCategories,
    requireAdminContext,
} from "@/lib/services/admin";

import { getRegistrationById } from "@/lib/services/registrations";

import { getPlayerById } from "@/lib/services/players";

import styles from "../../admin-list.module.css";

function dateLabel(
    value:
        | string
        | null
        | undefined,
): string {
    if (!value) {
        return "No disponible";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "No disponible";
    }

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short",

            timeZone:
                "Europe/Madrid",
        },
    ).format(date);
}

function stateLabel(
    value: string,
): string {
    return (
        {
            confirmada:
                "Confirmada",

            lista_espera:
                "Lista de espera",

            pendiente_pago:
                "Pendiente de pago",

            cancelada:
                "Cancelada",

            verificado:
                "Pagado",

            rechazado:
                "Rechazado",

            pendiente:
                "Pendiente",

            no_aplicable:
                "No aplica",

            registration_update:
                "Actualización",
        } as Record<
            string,
            string
        >
    )[value] ?? value;
}

function operationLabel(
    value: unknown,
): string {
    if (
        typeof value !==
        "string"
    ) {
        return "Operación administrativa";
    }

    const labels: Record<
        string,
        string
    > = {
        payment_verified:
            "Pago verificado",

        payment_marked_pending:
            "Pago devuelto a pendiente",

        registration_cancelled:
            "Inscripción cancelada",

        registration_confirmed:
            "Inscripción confirmada",

        registration_moved_to_waiting_list:
            "Movida a lista de espera",

        registration_promoted_from_waiting_list:
            "Promovida desde lista de espera",

        check_in_registered:
            "Check-in registrado",
    };

    return (
        labels[value] ??
        value
    );
}

function metadataEntries(
    value: unknown,
): Array<
    [string, string]
> {
    if (
        !value ||
        typeof value !==
        "object" ||
        Array.isArray(value)
    ) {
        return [];
    }

    return Object.entries(
        value as Record<
            string,
            unknown
        >,
    )
        .filter(
            ([key]) =>
                key !==
                "operation",
        )
        .map(
            ([key, item]) => [
                key,
                item === null ||
                    item === undefined
                    ? "—"
                    : String(item),
            ],
        );
}

export default async function AdminRegistrationDetailPage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    await requireAdminContext();

    const {
        id,
    } = await params;

    const registration =
        await getRegistrationById(
            id,
        );

    if (!registration) {
        notFound();
    }

    const player2 =
        registration.pair
            ?.player_2_id
            ? await getPlayerById(
                registration.pair
                    .player_2_id,
            )
            : null;

    const [
        categories,
        history,
    ] = await Promise.all([
        getCategories(),
        getAdminRegistrationHistory(
            id,
        ),
    ]);

    const categoryId =
        registration.categoria_id ??
        registration.pair
            ?.categoria_id;

    const category =
        categories.find(
            (item) =>
                item.id ===
                categoryId,
        );

    const player1Name =
        registration.player
            ? `${registration.player.nombre} ${registration.player.apellidos ??
                ""
                }`.trim()
            : "Jugador no disponible";

    const player2Name =
        player2
            ? `${player2.nombre} ${player2.apellidos ??
                ""
                }`.trim()
            : null;

    return (
        <main
            className={
                styles.page
            }
        >
            <nav
                className={
                    styles.breadcrumbs
                }
                aria-label="Migas de pan"
            >
                <Link href="/admin">
                    Administración
                </Link>

                <span>
                    /
                </span>

                <Link
                    href="/admin/inscripciones"
                >
                    Inscripciones
                </Link>

                <span>
                    /
                </span>

                <span
                    aria-current="page"
                >
                    Detalle
                </span>
            </nav>

            <header
                className={
                    styles.header
                }
            >
                <div>
                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        Ficha administrativa
                    </span>

                    <h1
                        className={
                            styles.title
                        }
                    >
                        Inscripción
                    </h1>

                    <p
                        className={
                            styles.description
                        }
                    >
                        {
                            registration
                                .tournament
                                ?.nombre ??
                            "Torneo no disponible"
                        }
                    </p>
                </div>

                <Link
                    className={
                        styles.quietButton
                    }
                    href={`/admin/inscripciones?torneo=${registration.tournament_id}`}
                >
                    Volver a inscripciones
                </Link>
            </header>

            <section
                className={
                    styles.panel
                }
                aria-labelledby="registration-data"
            >
                <h2 id="registration-data">
                    Datos de la inscripción
                </h2>

                <dl
                    className={
                        styles.detailGrid
                    }
                >
                    <div>
                        <dt>
                            Identificador
                        </dt>

                        <dd>
                            <code>
                                {
                                    registration.id
                                }
                            </code>
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Torneo
                        </dt>

                        <dd>
                            {
                                registration
                                    .tournament
                                    ?.nombre ??
                                "No disponible"
                            }
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Categoría
                        </dt>

                        <dd>
                            {
                                category
                                    ?.nombre ??
                                "No disponible"
                            }
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Estado de inscripción
                        </dt>

                        <dd>
                            {stateLabel(
                                registration.estado,
                            )}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Estado de pago
                        </dt>

                        <dd>
                            {stateLabel(
                                registration.payment_status ??
                                "pendiente",
                            )}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Importe registrado
                        </dt>

                        <dd>
                            {registration.importe ===
                                null
                                ? "No registrado"
                                : new Intl.NumberFormat(
                                    "es-ES",
                                    {
                                        style:
                                            "currency",
                                        currency:
                                            "EUR",
                                    },
                                ).format(
                                    registration.importe,
                                )}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Método de pago
                        </dt>

                        <dd>
                            {
                                registration.metodo_pago
                            }
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Check-in
                        </dt>

                        <dd>
                            {registration.checked_in
                                ? `Realizado · ${dateLabel(
                                    registration.checked_in_at,
                                )}`
                                : "Pendiente"}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Última actualización
                        </dt>

                        <dd>
                            {dateLabel(
                                registration.updated_at,
                            )}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Pareja
                        </dt>

                        <dd>
                            {player1Name}

                            {player2Name
                                ? ` / ${player2Name}`
                                : " / Segundo jugador pendiente"}
                        </dd>
                    </div>
                </dl>
            </section>

            <section
                className={
                    styles.panel
                }
                aria-labelledby="registration-history"
            >
                <h2 id="registration-history">
                    Historial de actividad
                </h2>

                <p
                    className={
                        styles.privateNote
                    }
                >
                    Este historial utiliza el
                    registro de auditoría general
                    de Sagunto Padel Cup. Solo se
                    muestran las operaciones
                    registradas desde que la
                    auditoría de inscripciones fue
                    instrumentada.
                </p>

                {!history.length ? (
                    <div
                        className={
                            styles.empty
                        }
                    >
                        <h3>
                            Sin eventos de auditoría
                        </h3>

                        <p>
                            Todavía no hay
                            operaciones
                            administrativas
                            registradas para esta
                            inscripción.
                        </p>
                    </div>
                ) : (
                    <ol
                        className={
                            styles.historyList
                        }
                    >
                        {history.map(
                            (
                                event,
                            ) => {
                                const operation =
                                    event
                                        .metadata &&
                                        typeof event.metadata ===
                                        "object" &&
                                        !Array.isArray(
                                            event.metadata,
                                        )
                                        ? (
                                            event
                                                .metadata as Record<
                                                    string,
                                                    unknown
                                                >
                                        ).operation
                                        : null;

                                const details =
                                    metadataEntries(
                                        event.metadata,
                                    );

                                return (
                                    <li
                                        key={
                                            event.id
                                        }
                                    >
                                        <strong>
                                            {operationLabel(
                                                operation,
                                            )}
                                        </strong>

                                        <time
                                            dateTime={
                                                event.fecha
                                            }
                                        >
                                            {dateLabel(
                                                event.fecha,
                                            )}
                                        </time>

                                        <span>
                                            {event.usuario_id
                                                ? `Administrador · ${event.usuario_id}`
                                                : "Usuario no registrado"}
                                        </span>

                                        {details.length >
                                            0 && (
                                                <small>
                                                    {details
                                                        .map(
                                                            (
                                                                [
                                                                    key,
                                                                    value,
                                                                ],
                                                            ) =>
                                                                `${key}: ${value}`,
                                                        )
                                                        .join(
                                                            " · ",
                                                        )}
                                                </small>
                                            )}
                                    </li>
                                );
                            },
                        )}
                    </ol>
                )}
            </section>
        </main>
    );
}