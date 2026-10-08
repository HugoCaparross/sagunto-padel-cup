import Link from "next/link";

import type {
    RegistrationStatus,
} from "@/types/database";

import {
    getAdminPlayersByIds,
    getAdminRegistrations,
    getCategories,
} from "@/lib/services/admin";

import {
    getTournaments,
} from "@/lib/services/tournaments";

import {
    cancelRegistrationAction,
    checkInAction,
    confirmRegistrationAction,
    markPaymentPendingAction,
    moveRegistrationToWaitingListAction,
    promoteWaitingRegistrationAction,
    verifyPaymentAction,
} from "./actions";

import RegistrationMutationForm from "./RegistrationMutationForm";

import styles from "../admin-list.module.css";

type SearchParams = Promise<{
    q?: string;
    torneo?: string;
    categoria?: string;
    estado?: string;
    pago?: string;
    resultado?: string;
}>;

const REGISTRATION_STATES: RegistrationStatus[] =
    [
        "confirmada",
        "lista_espera",
        "pendiente_pago",
        "cancelada",
    ];

const PAYMENT_STATES = [
    "pendiente",
    "verificado",
    "rechazado",
    "no_aplicable",
] as const;

const REGISTRATION_LABELS: Record<
    RegistrationStatus,
    string
> = {
    confirmada:
        "Confirmada",

    lista_espera:
        "Lista de espera",

    pendiente_pago:
        "Pendiente de pago",

    cancelada:
        "Cancelada",
};

function getBadgeTone(
    status: string,
): string {
    if (
        [
            "confirmada",
            "verificado",
        ].includes(status)
    ) {
        return styles.success;
    }

    if (
        [
            "pendiente_pago",
            "pendiente",
            "lista_espera",
        ].includes(status)
    ) {
        return styles.warning;
    }

    if (
        [
            "cancelada",
            "rechazado",
        ].includes(status)
    ) {
        return styles.danger;
    }

    return styles.neutral;
}

function getPaymentLabel(
    status: string | undefined,
): string {
    switch (status) {
        case "verificado":
            return "Pagado";

        case "rechazado":
            return "Rechazado";

        case "no_aplicable":
            return "No aplicable";

        default:
            return "Pendiente";
    }
}

function getPlayerFullName(
    player:
        | {
            nombre: string;
            apellidos?: string | null;
        }
        | null
        | undefined,
): string {
    if (!player) {
        return "";
    }

    return [
        player.nombre,
        player.apellidos,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
}

export default async function AdminRegistrationsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const params =
        await searchParams;

    const search =
        params.q?.trim() ??
        "";

    const tournamentId =
        params.torneo ??
        "";

    const status =
        REGISTRATION_STATES.includes(
            params.estado as RegistrationStatus,
        )
            ? (params.estado as RegistrationStatus)
            : undefined;

    const payment =
        PAYMENT_STATES.includes(
            params.pago as typeof PAYMENT_STATES[number],
        )
            ? (params.pago as typeof PAYMENT_STATES[number])
            : undefined;

    const [
        categories,
        tournaments,
    ] = await Promise.all([
        getCategories(),
        getTournaments(),
    ]);

    const categoryId =
        categories.some(
            (category) =>
                category.id ===
                params.categoria,
        )
            ? params.categoria
            : "";

    const allRegistrations =
        await getAdminRegistrations({
            tournamentId:
                tournamentId ||
                undefined,

            categoryId:
                categoryId ||
                undefined,

            estado:
                status,

            paymentStatus:
                payment,
        });

    /*
     * -----------------------------------------------------------------------
     * OBTENER LOS DOS JUGADORES DE CADA PAREJA
     * -----------------------------------------------------------------------
     *
     * getAdminRegistrations() ya nos devuelve registration.pair.
     * El servicio también devuelve registration.player, pero ese campo
     * representa el jugador principal (player_1).
     *
     * Para el panel administrativo necesitamos mostrar ambos jugadores.
     */

    const playerIds =
        Array.from(
            new Set(
                allRegistrations.flatMap(
                    (
                        registration,
                    ) => [
                        registration
                            .pair
                            ?.player_1_id,
                        registration
                            .pair
                            ?.player_2_id,
                    ].filter(
                        (
                            id,
                        ): id is string =>
                            Boolean(id),
                    ),
                ),
            ),
        );

    const adminPlayers =
        await getAdminPlayersByIds(
            playerIds,
        );

    const playersMap =
        new Map(
            adminPlayers.map(
                (player) => [
                    player.id,
                    player,
                ],
            ),
        );

    /*
     * -----------------------------------------------------------------------
     * BÚSQUEDA
     * -----------------------------------------------------------------------
     *
     * La búsqueda encuentra:
     * - jugador 1
     * - jugador 2
     * - nombre del torneo
     */

    const query =
        search.toLocaleLowerCase(
            "es",
        );

    const registrations =
        allRegistrations.filter(
            (
                registration,
            ) => {
                if (!query) {
                    return true;
                }

                const player1 =
                    registration
                        .pair
                        ?.player_1_id
                        ? playersMap.get(
                            registration
                                .pair
                                .player_1_id,
                        )
                        : null;

                const player2 =
                    registration
                        .pair
                        ?.player_2_id
                        ? playersMap.get(
                            registration
                                .pair
                                .player_2_id,
                        )
                        : null;

                const searchableText =
                    [
                        getPlayerFullName(
                            player1,
                        ),
                        getPlayerFullName(
                            player2,
                        ),
                        registration
                            .tournament
                            ?.nombre ??
                        "",
                    ]
                        .join(" ")
                        .toLocaleLowerCase(
                            "es",
                        );

                return searchableText.includes(
                    query,
                );
            },
        );

    /*
     * -----------------------------------------------------------------------
     * FILTROS ACTIVOS
     * -----------------------------------------------------------------------
     */

    const activeFilters =
        new URLSearchParams();

    if (search) {
        activeFilters.set(
            "q",
            search,
        );
    }

    if (tournamentId) {
        activeFilters.set(
            "torneo",
            tournamentId,
        );
    }

    if (categoryId) {
        activeFilters.set(
            "categoria",
            categoryId,
        );
    }

    if (status) {
        activeFilters.set(
            "estado",
            status,
        );
    }

    if (payment) {
        activeFilters.set(
            "pago",
            payment,
        );
    }

    const returnTo =
        `/admin/inscripciones${activeFilters.size
            ? `?${activeFilters.toString()}`
            : ""
        }`;

    return (
        <main
            className={
                styles.page
            }
        >
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
                        Competición
                    </span>

                    <h1
                        className={
                            styles.title
                        }
                    >
                        Inscripciones
                    </h1>

                    <p
                        className={
                            styles.description
                        }
                    >
                        Revisa el estado de
                        las inscripciones,
                        verifica los pagos
                        presenciales y
                        gestiona el check-in
                        de las parejas.
                    </p>
                </div>

                <span
                    className={
                        styles.count
                    }
                >
                    {
                        registrations.length
                    }{" "}
                    {registrations.length ===
                        1
                        ? "inscripción"
                        : "inscripciones"}
                </span>
            </header>

            {params.resultado ===
                "actualizada" && (
                    <p
                        className={
                            styles.feedback
                        }
                        role="status"
                    >
                        La inscripción se ha
                        actualizado correctamente.
                    </p>
                )}

            {params.resultado ===
                "error" && (
                    <p
                        className={`${styles.feedback} ${styles.danger}`}
                        role="alert"
                    >
                        No se pudo completar la
                        operación. Comprueba el
                        estado de la inscripción y
                        vuelve a intentarlo.
                    </p>
                )}

            {status ===
                "lista_espera" && (
                    <p
                        className={`${styles.feedback} ${styles.warning}`}
                        role="note"
                    >
                        La promoción es manual.
                        Selecciona una pareja
                        concreta. No se aplica
                        ninguna prioridad
                        automática no definida por
                        el reglamento.
                    </p>
                )}

            <section
                className={
                    styles.panel
                }
                aria-label="Listado de inscripciones"
            >
                <form
                    action="/admin/inscripciones"
                    method="GET"
                    className={
                        styles.toolbar
                    }
                >
                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="registration-search">
                            Buscar
                        </label>

                        <input
                            id="registration-search"
                            className={
                                styles.input
                            }
                            type="search"
                            name="q"
                            defaultValue={
                                search
                            }
                            placeholder="Jugador, pareja o torneo"
                        />
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="registration-tournament">
                            Torneo
                        </label>

                        <select
                            id="registration-tournament"
                            className={
                                styles.select
                            }
                            name="torneo"
                            defaultValue={
                                tournamentId
                            }
                        >
                            <option value="">
                                Todos los torneos
                            </option>

                            {tournaments.map(
                                (
                                    tournament,
                                ) => (
                                    <option
                                        key={
                                            tournament.id
                                        }
                                        value={
                                            tournament.id
                                        }
                                    >
                                        {
                                            tournament.nombre
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="registration-category">
                            Categoría
                        </label>

                        <select
                            id="registration-category"
                            className={
                                styles.select
                            }
                            name="categoria"
                            defaultValue={
                                categoryId
                            }
                        >
                            <option value="">
                                Todas
                            </option>

                            {categories.map(
                                (
                                    category,
                                ) => (
                                    <option
                                        key={
                                            category.id
                                        }
                                        value={
                                            category.id
                                        }
                                    >
                                        {
                                            category.nombre
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="registration-state">
                            Estado
                        </label>

                        <select
                            id="registration-state"
                            className={
                                styles.select
                            }
                            name="estado"
                            defaultValue={
                                status ??
                                ""
                            }
                        >
                            <option value="">
                                Todos
                            </option>

                            {REGISTRATION_STATES.map(
                                (
                                    value,
                                ) => (
                                    <option
                                        key={
                                            value
                                        }
                                        value={
                                            value
                                        }
                                    >
                                        {
                                            REGISTRATION_LABELS[
                                            value
                                            ]
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="registration-payment">
                            Pago
                        </label>

                        <select
                            id="registration-payment"
                            className={
                                styles.select
                            }
                            name="pago"
                            defaultValue={
                                payment ??
                                ""
                            }
                        >
                            <option value="">
                                Todos
                            </option>

                            {PAYMENT_STATES.map(
                                (
                                    value,
                                ) => (
                                    <option
                                        key={
                                            value
                                        }
                                        value={
                                            value
                                        }
                                    >
                                        {
                                            getPaymentLabel(
                                                value,
                                            )
                                        }
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <button
                        className={
                            styles.button
                        }
                        type="submit"
                    >
                        Filtrar
                    </button>

                    {(search ||
                        tournamentId ||
                        categoryId ||
                        status ||
                        payment) && (
                            <Link
                                className={
                                    styles.quietButton
                                }
                                href="/admin/inscripciones"
                            >
                                Limpiar
                            </Link>
                        )}
                </form>

                {registrations.length ===
                    0 ? (
                    <div
                        className={
                            styles.empty
                        }
                    >
                        <h2>
                            {search ||
                                tournamentId ||
                                categoryId ||
                                status ||
                                payment
                                ? "No hay resultados"
                                : "Aún no hay inscripciones"}
                        </h2>

                        <p>
                            {search ||
                                tournamentId ||
                                categoryId ||
                                status ||
                                payment
                                ? "Cambia o limpia los filtros para consultar otras inscripciones."
                                : "Las inscripciones recibidas aparecerán aquí."}
                        </p>
                    </div>
                ) : (
                    <div
                        className={
                            styles.tableWrap
                        }
                    >
                        <table
                            className={
                                styles.table
                            }
                        >
                            <thead>
                                <tr>
                                    <th scope="col">
                                        Jugador /
                                        pareja
                                    </th>

                                    <th scope="col">
                                        Torneo
                                    </th>

                                    <th scope="col">
                                        Categoría
                                    </th>

                                    <th scope="col">
                                        Estado
                                    </th>

                                    <th scope="col">
                                        Pago
                                    </th>

                                    <th scope="col">
                                        Check-in
                                    </th>

                                    <th scope="col">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {registrations.map(
                                    (
                                        registration,
                                    ) => {
                                        const pair =
                                            registration.pair;

                                        const registrationState =
                                            registration.estado;

                                        const paymentState =
                                            registration.payment_status ??
                                            "pendiente";

                                        const player1 =
                                            pair?.player_1_id
                                                ? playersMap.get(
                                                    pair.player_1_id,
                                                )
                                                : null;

                                        const player2 =
                                            pair?.player_2_id
                                                ? playersMap.get(
                                                    pair.player_2_id,
                                                )
                                                : null;

                                        const player1Name =
                                            getPlayerFullName(
                                                player1,
                                            ) ||
                                            "Jugador sin perfil";

                                        const player2Name =
                                            getPlayerFullName(
                                                player2,
                                            );

                                        const categoryIdForRegistration =
                                            registration.categoria_id ??
                                            pair?.categoria_id;

                                        const categoryName =
                                            categories.find(
                                                (
                                                    category,
                                                ) =>
                                                    category.id ===
                                                    categoryIdForRegistration,
                                            )
                                                ?.nombre ??
                                            "Sin categoría";

                                        return (
                                            <tr
                                                key={
                                                    registration.id
                                                }
                                            >
                                                <td>
                                                    <Link
                                                        className={
                                                            styles.primaryText
                                                        }
                                                        href={`/admin/inscripciones/${registration.id}`}
                                                    >
                                                        {
                                                            player1Name
                                                        }
                                                    </Link>

                                                    {player2Name ? (
                                                        <span
                                                            className={
                                                                styles.secondaryText
                                                            }
                                                        >
                                                            +{" "}
                                                            {
                                                                player2Name
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                styles.secondaryText
                                                            }
                                                        >
                                                            Sin pareja
                                                            todavía
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        registration
                                                            .tournament
                                                            ?.nombre ??
                                                        "Torneo no disponible"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        categoryName
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={`${styles.badge} ${getBadgeTone(
                                                            registrationState,
                                                        )}`}
                                                    >
                                                        {
                                                            REGISTRATION_LABELS[
                                                            registrationState
                                                            ]
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`${styles.badge} ${getBadgeTone(
                                                            paymentState,
                                                        )}`}
                                                    >
                                                        {
                                                            getPaymentLabel(
                                                                paymentState,
                                                            )
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {registration.checked_in ? (
                                                        <span
                                                            className={`${styles.badge} ${styles.success}`}
                                                        >
                                                            Realizado
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`${styles.badge} ${styles.neutral}`}
                                                        >
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <div
                                                        className={
                                                            styles.rowActions
                                                        }
                                                    >
                                                        {/*
                                                         * ================================================================
                                                         * PAGO PRESENCIAL
                                                         * ================================================================
                                                         */}

                                                        {paymentState !==
                                                            "verificado" &&
                                                            registrationState !==
                                                            "cancelada" && (
                                                                <form
                                                                    action={
                                                                        verifyPaymentAction
                                                                    }
                                                                    className={
                                                                        styles.inlineForm
                                                                    }
                                                                >
                                                                    <input
                                                                        type="hidden"
                                                                        name="registrationId"
                                                                        value={
                                                                            registration.id
                                                                        }
                                                                    />

                                                                    <input
                                                                        type="hidden"
                                                                        name="returnTo"
                                                                        value={
                                                                            returnTo
                                                                        }
                                                                    />

                                                                    <select
                                                                        className={
                                                                            styles.inlineSelect
                                                                        }
                                                                        name="method"
                                                                        aria-label={`Método de pago de ${player1Name}`}
                                                                        defaultValue="fisico"
                                                                    >
                                                                        <option value="fisico">
                                                                            Efectivo
                                                                        </option>

                                                                        <option value="transferencia">
                                                                            Transferencia
                                                                        </option>

                                                                        <option value="otro">
                                                                            Otro
                                                                        </option>
                                                                    </select>

                                                                    <button
                                                                        className={
                                                                            styles.smallButton
                                                                        }
                                                                        type="submit"
                                                                    >
                                                                        Marcar
                                                                        pagado
                                                                    </button>
                                                                </form>
                                                            )}

                                                        {paymentState ===
                                                            "verificado" &&
                                                            registrationState !==
                                                            "cancelada" && (
                                                                <RegistrationMutationForm
                                                                    action={
                                                                        markPaymentPendingAction
                                                                    }
                                                                    registrationId={
                                                                        registration.id
                                                                    }
                                                                    returnTo={
                                                                        returnTo
                                                                    }
                                                                    confirmation="¿Confirmas devolver el estado del pago a pendiente? Esta acción no realiza ningún reembolso; solo corrige el estado administrativo."
                                                                >
                                                                    Desmarcar
                                                                    pago
                                                                </RegistrationMutationForm>
                                                            )}

                                                        {/*
                                                         * ================================================================
                                                         * CHECK-IN
                                                         * ================================================================
                                                         */}

                                                        {registrationState ===
                                                            "confirmada" &&
                                                            !registration.checked_in && (
                                                                <form
                                                                    action={
                                                                        checkInAction
                                                                    }
                                                                >
                                                                    <input
                                                                        type="hidden"
                                                                        name="registrationId"
                                                                        value={
                                                                            registration.id
                                                                        }
                                                                    />

                                                                    <input
                                                                        type="hidden"
                                                                        name="returnTo"
                                                                        value={
                                                                            returnTo
                                                                        }
                                                                    />

                                                                    <button
                                                                        className={
                                                                            styles.smallButton
                                                                        }
                                                                        type="submit"
                                                                    >
                                                                        Registrar
                                                                        check-in
                                                                    </button>
                                                                </form>
                                                            )}

                                                        {/*
                                                         * ================================================================
                                                         * CONFIRMAR INSCRIPCIÓN
                                                         * ================================================================
                                                         */}

                                                        {registrationState ===
                                                            "pendiente_pago" &&
                                                            [
                                                                "verificado",
                                                                "no_aplicable",
                                                            ].includes(
                                                                paymentState,
                                                            ) &&
                                                            pair?.player_2_id && (
                                                                <form
                                                                    action={
                                                                        confirmRegistrationAction
                                                                    }
                                                                >
                                                                    <input
                                                                        type="hidden"
                                                                        name="registrationId"
                                                                        value={
                                                                            registration.id
                                                                        }
                                                                    />

                                                                    <input
                                                                        type="hidden"
                                                                        name="returnTo"
                                                                        value={
                                                                            returnTo
                                                                        }
                                                                    />

                                                                    <button
                                                                        className={
                                                                            styles.smallButton
                                                                        }
                                                                        type="submit"
                                                                    >
                                                                        Confirmar
                                                                        inscripción
                                                                    </button>
                                                                </form>
                                                            )}

                                                        {/*
                                                         * ================================================================
                                                         * LISTA DE ESPERA
                                                         * ================================================================
                                                         */}

                                                        {registrationState ===
                                                            "lista_espera" &&
                                                            pair?.player_1_id &&
                                                            pair?.player_2_id && (
                                                                <RegistrationMutationForm
                                                                    action={
                                                                        promoteWaitingRegistrationAction
                                                                    }
                                                                    registrationId={
                                                                        registration.id
                                                                    }
                                                                    returnTo={
                                                                        returnTo
                                                                    }
                                                                    confirmation="¿Confirmas promover esta pareja a pendiente de pago? Solo se completará si hay cupo, las inscripciones siguen abiertas y no hay partidos creados en la categoría."
                                                                >
                                                                    Promover
                                                                    manualmente
                                                                </RegistrationMutationForm>
                                                            )}

                                                        {[
                                                            "pendiente_pago",
                                                            "confirmada",
                                                        ].includes(
                                                            registrationState,
                                                        ) &&
                                                            !registration.checked_in && (
                                                                <RegistrationMutationForm
                                                                    action={
                                                                        moveRegistrationToWaitingListAction
                                                                    }
                                                                    registrationId={
                                                                        registration.id
                                                                    }
                                                                    returnTo={
                                                                        returnTo
                                                                    }
                                                                    confirmation="¿Confirmas mover esta inscripción a lista de espera? Se conserva cualquier pago registrado y no se promueve otra pareja automáticamente."
                                                                >
                                                                    Mover a
                                                                    espera
                                                                </RegistrationMutationForm>
                                                            )}

                                                        {/*
                                                         * ================================================================
                                                         * CANCELAR
                                                         * ================================================================
                                                         */}

                                                        {registrationState !==
                                                            "cancelada" && (
                                                                <RegistrationMutationForm
                                                                    action={
                                                                        cancelRegistrationAction
                                                                    }
                                                                    registrationId={
                                                                        registration.id
                                                                    }
                                                                    returnTo={
                                                                        returnTo
                                                                    }
                                                                    confirmation="¿Confirmas cancelar esta inscripción? Se conservará el historial y cualquier pago verificado; esta acción no inicia ningún reembolso."
                                                                >
                                                                    Cancelar
                                                                </RegistrationMutationForm>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}