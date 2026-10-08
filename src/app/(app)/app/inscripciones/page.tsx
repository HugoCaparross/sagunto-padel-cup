import Link from "next/link";

import type { RegistrationStatus } from "@/types/database";

import {
    getAdminPlayersByIds,
    getAdminRegistrations,
    getCategories,
} from "@/lib/services/admin";

import { getTournaments } from "@/lib/services/tournaments";

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

const REGISTRATION_STATES: RegistrationStatus[] = [
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

type PaymentStatus = (typeof PAYMENT_STATES)[number];

const REGISTRATION_LABELS: Record<
    RegistrationStatus,
    string
> = {
    confirmada: "Confirmada",
    lista_espera: "Lista de espera",
    pendiente_pago: "Pendiente de pago",
    cancelada: "Cancelada",
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
    if (status === "verificado") {
        return "Pagado";
    }

    if (status === "rechazado") {
        return "Rechazado";
    }

    if (status === "no_aplicable") {
        return "No aplica";
    }

    return "Pendiente";
}

function getPlayerName(
    player:
        | {
            nombre: string;
            apellidos?: string | null;
        }
        | null
        | undefined,
): string {
    if (!player) {
        return "Jugador no disponible";
    }

    return `${player.nombre} ${player.apellidos ?? ""
        }`.trim();
}

function getPairNames(
    registration: {
        player?: {
            nombre: string;
            apellidos?: string | null;
        } | null;
        pair?: {
            player_2_id?: string | null;
        } | null;
    },
    player2Names: Map<string, string>,
): {
    player1: string;
    player2: string | null;
} {
    const player1 = getPlayerName(
        registration.player,
    );

    const player2Id =
        registration.pair?.player_2_id ?? null;

    const player2 = player2Id
        ? player2Names.get(player2Id) ??
        "Jugador no disponible"
        : null;

    return {
        player1,
        player2,
    };
}

export default async function AdminRegistrationsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const params = await searchParams;

    const search =
        params.q?.trim() ?? "";

    const tournamentId =
        params.torneo ?? "";

    const status =
        REGISTRATION_STATES.includes(
            params.estado as RegistrationStatus,
        )
            ? (params.estado as RegistrationStatus)
            : undefined;

    const payment =
        PAYMENT_STATES.includes(
            params.pago as PaymentStatus,
        )
            ? (params.pago as PaymentStatus)
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
                tournamentId || undefined,

            categoryId:
                categoryId || undefined,

            estado: status,

            paymentStatus:
                payment,
        });

    /*
     * getRegistrations() ya devuelve el jugador principal
     * de la pareja. Para poder buscar y mostrar correctamente
     * la pareja completa necesitamos consultar también al
     * segundo jugador cuando exista.
     */
    const player2Ids =
        Array.from(
            new Set(
                allRegistrations
                    .map(
                        (registration) =>
                            registration.pair
                                ?.player_2_id,
                    )
                    .filter(
                        (
                            id,
                        ): id is string =>
                            Boolean(id),
                    ),
            ),
        );

    const player2Rows =
        player2Ids.length > 0
            ? await getAdminPlayersByIds(
                player2Ids,
            )
            : [];

    const player2Names =
        new Map(
            player2Rows.map(
                (player) => [
                    player.id,
                    `${player.nombre} ${player.apellidos ??
                        ""
                        }`.trim(),
                ],
            ),
        );

    /*
     * La búsqueda se hace sobre los dos jugadores
     * y también sobre el torneo.
     */
    const query =
        search.toLocaleLowerCase(
            "es",
        );

    const registrations =
        allRegistrations.filter(
            (registration) => {
                if (!query) {
                    return true;
                }

                const {
                    player1,
                    player2,
                } = getPairNames(
                    registration,
                    player2Names,
                );

                const tournamentName =
                    registration
                        .tournament
                        ?.nombre ??
                    "";

                const searchableText =
                    [
                        player1,
                        player2 ?? "",
                        tournamentName,
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

    const hasFilters =
        Boolean(
            search ||
            tournamentId ||
            categoryId ||
            status ||
            payment,
        );

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
                        Gestiona las parejas inscritas,
                        verifica los pagos presenciales
                        y controla el estado operativo
                        de cada inscripción.
                    </p>
                </div>

                <span
                    className={
                        styles.count
                    }
                >
                    {registrations.length}{" "}
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
                        estado de la inscripción
                        y vuelve a intentarlo.
                    </p>
                )}

            {status ===
                "lista_espera" && (
                    <p
                        className={`${styles.feedback} ${styles.warning}`}
                        role="note"
                    >
                        La promoción desde la lista
                        de espera es manual. Selecciona
                        siempre una pareja concreta.
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
                        <label
                            htmlFor="registration-search"
                        >
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
                        <label
                            htmlFor="registration-tournament"
                        >
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
                        <label
                            htmlFor="registration-category"
                        >
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
                        <label
                            htmlFor="registration-state"
                        >
                            Estado
                        </label>

                        <select
                            id="registration-state"
                            className={
                                styles.select
                            }
                            name="estado"
                            defaultValue={
                                status ?? ""
                            }
                        >
                            <option value="">
                                Todos
                            </option>

                            {REGISTRATION_STATES.map(
                                (value) => (
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
                        <label
                            htmlFor="registration-payment"
                        >
                            Pago
                        </label>

                        <select
                            id="registration-payment"
                            className={
                                styles.select
                            }
                            name="pago"
                            defaultValue={
                                payment ?? ""
                            }
                        >
                            <option value="">
                                Todos
                            </option>

                            {PAYMENT_STATES.map(
                                (value) => (
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

                    {hasFilters && (
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
                            {hasFilters
                                ? "No hay resultados"
                                : "Aún no hay inscripciones"}
                        </h2>

                        <p>
                            {hasFilters
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
                                        const registrationState =
                                            registration.estado;

                                        const paymentState =
                                            registration.payment_status ??
                                            "pendiente";

                                        const {
                                            player1,
                                            player2,
                                        } =
                                            getPairNames(
                                                registration,
                                                player2Names,
                                            );

                                        const category =
                                            categories.find(
                                                (
                                                    item,
                                                ) =>
                                                    item.id ===
                                                    (registration.categoria_id ??
                                                        registration
                                                            .pair
                                                            ?.categoria_id),
                                            );

                                        const isCancelled =
                                            registrationState ===
                                            "cancelada";

                                        const isPaid =
                                            paymentState ===
                                            "verificado";

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
                                                        {player1}
                                                    </Link>

                                                    {player2 ? (
                                                        <span
                                                            className={
                                                                styles.secondaryText
                                                            }
                                                        >
                                                            {player2}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                styles.secondaryText
                                                            }
                                                        >
                                                            Segundo jugador
                                                            pendiente
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
                                                        category?.nombre ??
                                                        "Sin categoría"
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
                                                        {!isPaid &&
                                                            !isCancelled &&
                                                            paymentState !==
                                                            "no_aplicable" && (
                                                                <form
                                                                    action={
                                                                        verifyPaymentAction
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
                                                                        Marcar pagado
                                                                    </button>
                                                                </form>
                                                            )}

                                                        {isPaid &&
                                                            !isCancelled && (
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
                                                                    confirmation="¿Quieres desmarcar este pago y devolverlo a estado pendiente?"
                                                                >
                                                                    Desmarcar pago
                                                                </RegistrationMutationForm>
                                                            )}

                                                        {registrationState ===
                                                            "pendiente_pago" &&
                                                            isPaid &&
                                                            Boolean(
                                                                registration
                                                                    .pair
                                                                    ?.player_2_id,
                                                            ) && (
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
                                                                        Confirmar inscripción
                                                                    </button>
                                                                </form>
                                                            )}

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
                                                                        Registrar check-in
                                                                    </button>
                                                                </form>
                                                            )}

                                                        {registrationState ===
                                                            "lista_espera" &&
                                                            registration
                                                                .pair
                                                                ?.player_1_id &&
                                                            registration
                                                                .pair
                                                                ?.player_2_id && (
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
                                                                    confirmation="¿Confirmas promover esta pareja a pendiente de pago? Solo se completará si hay cupo y se cumplen las condiciones operativas del torneo."
                                                                >
                                                                    Promover
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
                                                                    confirmation="¿Confirmas mover esta inscripción a lista de espera?"
                                                                >
                                                                    Mover a espera
                                                                </RegistrationMutationForm>
                                                            )}

                                                        {!isCancelled && (
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
                                                                confirmation="¿Confirmas cancelar esta inscripción? Se conservará el historial y la cancelación no inicia ningún reembolso."
                                                            >
                                                                Cancelar
                                                            </RegistrationMutationForm>
                                                        )}

                                                        <Link
                                                            className={
                                                                styles.quietButton
                                                            }
                                                            href={`/admin/inscripciones/${registration.id}`}
                                                        >
                                                            Ver
                                                        </Link>
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