import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Info,
    MapPin,
    Search,
    Trophy,
    Users,
    XCircle,
} from "lucide-react";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import {
    canCancelRegistration,
    getRegistrations,
} from "@/lib/services/registrations";
import { getPlayerById } from "@/lib/services/players";
import CancelRegistrationButton from "./CancelRegistrationButton";

import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Mis inscripciones",
    description:
        "Consulta tus inscripciones en Sagunto Padel Cup.",
    robots: {
        index: false,
        follow: false,
    },
};

type SearchParams = Promise<{
    resultado?: string;
}>;

function formatDate(
    value:
        | string
        | null
        | undefined,
): string {
    if (!value) {
        return "Sin fecha";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    ).format(date);
}

function formatDateRange(
    start:
        | string
        | null
        | undefined,
    end:
        | string
        | null
        | undefined,
): string {
    if (!start) {
        return "Fecha pendiente";
    }

    const startDate =
        new Date(start);

    if (
        Number.isNaN(
            startDate.getTime(),
        )
    ) {
        return "Fecha pendiente";
    }

    if (!end || start === end) {
        return formatDate(start);
    }

    const endDate =
        new Date(end);

    if (
        Number.isNaN(
            endDate.getTime(),
        )
    ) {
        return formatDate(start);
    }

    return `${new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "2-digit",
            month: "short",
        },
    ).format(startDate)} – ${new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    ).format(endDate)}`;
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

    return [
        player.nombre,
        player.apellidos,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function getRegistrationLabel(
    status: string,
): string {
    switch (status) {
        case "confirmada":
            return "Confirmada";

        case "pendiente_pago":
            return "Pendiente de pago";

        case "lista_espera":
            return "Lista de espera";

        case "cancelada":
            return "Cancelada";

        default:
            return status;
    }
}

function getRegistrationClass(
    status: string,
): string {
    switch (status) {
        case "confirmada":
            return styles.statusConfirmed;

        case "pendiente_pago":
            return styles.statusPending;

        case "lista_espera":
            return styles.statusWaiting;

        case "cancelada":
            return styles.statusCancelled;

        default:
            return styles.statusCancelled;
    }
}

function getPaymentLabel(
    status:
        | string
        | undefined,
): string {
    switch (status) {
        case "verificado":
            return "Pagado";

        case "rechazado":
            return "Rechazado";

        case "no_aplicable":
            return "No aplica";

        default:
            return "Pendiente";
    }
}

function getPaymentClass(
    status:
        | string
        | undefined,
): string {
    switch (status) {
        case "verificado":
            return styles.paymentVerified;

        case "rechazado":
            return styles.paymentRejected;

        case "no_aplicable":
            return styles.paymentNotApplicable;

        default:
            return styles.paymentPending;
    }
}

export default async function MisInscripcionesPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const params =
        await searchParams;

    const {
        user,
        player,
    } =
        await getAuthenticatedContext();

    if (!user || !player) {
        return null;
    }

    const registrations =
        await getRegistrations({
            playerId: player.id,
        });

    const partnerIds =
        Array.from(
            new Set(
                registrations
                    .map(
                        (registration) => {
                            const pair =
                                registration.pair;

                            if (!pair) {
                                return null;
                            }

                            if (
                                pair.player_1_id ===
                                player.id
                            ) {
                                return pair.player_2_id;
                            }

                            return pair.player_1_id;
                        },
                    )
                    .filter(
                        (
                            id,
                        ): id is string =>
                            Boolean(id) &&
                            id !== player.id,
                    ),
            ),
        );

    const partnerRows =
        await Promise.all(
            partnerIds.map(
                (id) =>
                    getPlayerById(id),
            ),
        );

    const partners =
        new Map(
            partnerRows
                .filter(
                    (
                        partner,
                    ): partner is NonNullable<
                        typeof partner
                    > =>
                        Boolean(partner),
                )
                .map(
                    (partner) => [
                        partner.id,
                        partner,
                    ],
                ),
        );

    const total =
        registrations.length;

    const pendingPayment =
        registrations.filter(
            (registration) =>
                registration.payment_status ===
                "pendiente",
        ).length;

    const confirmed =
        registrations.filter(
            (registration) =>
                registration.estado ===
                "confirmada",
        ).length;

    const paid =
        registrations.filter(
            (registration) =>
                registration.payment_status ===
                "verificado",
        ).length;

    return (
        <main
            className={
                styles.page
            }
        >
            <div
                className={
                    styles.container
                }
            >
                <header
                    className={
                        styles.pageHeader
                    }
                >
                    <div>
                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            MI CUENTA
                        </span>

                        <h1>
                            Mis inscripciones
                        </h1>

                        <p>
                            Consulta tus
                            participaciones,
                            el estado de cada
                            inscripción y la
                            situación del pago.
                        </p>
                    </div>

                    <Link
                        href="/torneos"
                        className={
                            styles.findTournamentLink
                        }
                    >
                        <Search
                            size={15}
                            aria-hidden="true"
                        />

                        Buscar torneos

                        <ArrowRight
                            size={14}
                            aria-hidden="true"
                        />
                    </Link>
                </header>

                {params.resultado ===
                    "cancelada" && (
                        <div
                            className={
                                styles.feedbackSuccess
                            }
                            role="status"
                        >
                            <CheckCircle2
                                size={18}
                                aria-hidden="true"
                            />

                            <div>
                                <strong>
                                    Inscripción cancelada
                                </strong>

                                <span>
                                    La inscripción se ha
                                    cancelado correctamente.
                                </span>
                            </div>
                        </div>
                    )}

                {params.resultado ===
                    "error" && (
                        <div
                            className={
                                styles.feedbackError
                            }
                            role="alert"
                        >
                            <XCircle
                                size={18}
                                aria-hidden="true"
                            />

                            <div>
                                <strong>
                                    No se pudo cancelar
                                    la inscripción
                                </strong>

                                <span>
                                    Comprueba el estado
                                    de la inscripción o
                                    contacta con la
                                    organización.
                                </span>
                            </div>
                        </div>
                    )}

                {total > 0 && (
                    <section
                        className={
                            styles.summary
                        }
                        aria-label="Resumen"
                    >
                        <div
                            className={
                                styles.summaryItem
                            }
                        >
                            <span>
                                INSCRIPCIONES
                            </span>

                            <strong>
                                {total}
                            </strong>
                        </div>

                        <div
                            className={
                                styles.summaryItem
                            }
                        >
                            <span>
                                PENDIENTES DE PAGO
                            </span>

                            <strong>
                                {pendingPayment}
                            </strong>
                        </div>

                        <div
                            className={
                                styles.summaryItem
                            }
                        >
                            <span>
                                CONFIRMADAS
                            </span>

                            <strong>
                                {confirmed}
                            </strong>
                        </div>

                        <div
                            className={
                                styles.summaryItem
                            }
                        >
                            <span>
                                PAGADAS
                            </span>

                            <strong>
                                {paid}
                            </strong>
                        </div>
                    </section>
                )}

                {registrations.length ===
                    0 ? (
                    <section
                        className={
                            styles.emptyState
                        }
                    >
                        <div
                            className={
                                styles.emptyIcon
                            }
                        >
                            <Trophy
                                size={21}
                                aria-hidden="true"
                            />
                        </div>

                        <span
                            className={
                                styles.eyebrow
                            }
                        >
                            SIN INSCRIPCIONES
                        </span>

                        <h2>
                            Todavía no tienes
                            ninguna inscripción
                        </h2>

                        <p>
                            Cuando te inscribas a
                            un torneo del circuito,
                            podrás consultar aquí
                            toda la información de
                            tu participación.
                        </p>

                        <Link
                            href="/torneos"
                            className={
                                styles.primaryButton
                            }
                        >
                            Ver torneos

                            <ArrowRight
                                size={15}
                                aria-hidden="true"
                            />
                        </Link>
                    </section>
                ) : (
                    <section
                        className={
                            styles.registrationList
                        }
                        aria-label="Mis inscripciones"
                    >
                        {registrations.map(
                            (
                                registration,
                            ) => {
                                const pair =
                                    registration.pair;

                                const partnerId =
                                    pair?.player_1_id ===
                                        player.id
                                        ? pair?.player_2_id
                                        : pair?.player_1_id;

                                const partner =
                                    partnerId
                                        ? partners.get(
                                            partnerId,
                                        )
                                        : null;

                                const categoryName =
                                    registration
                                        .tournamentCategory
                                        ?.categoria_id ===
                                        registration.categoria_id
                                        ? "Categoría"
                                        : "Categoría";

                                const paymentStatus =
                                    registration.payment_status ??
                                    "pendiente";

                                const isCancelled =
                                    registration.estado ===
                                    "cancelada";

                                const canCancel =
                                    canCancelRegistration(
                                        registration.estado,
                                    );

                                return (
                                    <article
                                        key={
                                            registration.id
                                        }
                                        className={[
                                            styles.registrationCard,
                                            isCancelled
                                                ? styles.registrationCancelled
                                                : "",
                                        ].join(" ")}
                                    >
                                        <header
                                            className={
                                                styles.cardHeader
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.cardHeading
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles.cardEyebrow
                                                    }
                                                >
                                                    INSCRIPCIÓN
                                                </span>

                                                <h2>
                                                    {
                                                        registration
                                                            .tournament
                                                            ?.nombre ??
                                                        "Torneo"
                                                    }
                                                </h2>
                                            </div>

                                            <div
                                                className={
                                                    styles.cardStatusGroup
                                                }
                                            >
                                                <span
                                                    className={[
                                                        styles.statusBadge,
                                                        getRegistrationClass(
                                                            registration.estado,
                                                        ),
                                                    ].join(" ")}
                                                >
                                                    {getRegistrationLabel(
                                                        registration.estado,
                                                    )}
                                                </span>

                                                <span
                                                    className={[
                                                        styles.paymentBadge,
                                                        getPaymentClass(
                                                            paymentStatus,
                                                        ),
                                                    ].join(" ")}
                                                >
                                                    {getPaymentLabel(
                                                        paymentStatus,
                                                    )}
                                                </span>
                                            </div>
                                        </header>

                                        <div
                                            className={
                                                styles.cardMeta
                                            }
                                        >
                                            <div>
                                                <CalendarDays
                                                    size={14}
                                                    aria-hidden="true"
                                                />

                                                <span>
                                                    {formatDateRange(
                                                        registration
                                                            .tournament
                                                            ?.fecha_inicio,
                                                        registration
                                                            .tournament
                                                            ?.fecha_fin,
                                                    )}
                                                </span>
                                            </div>

                                            <div>
                                                <Trophy
                                                    size={14}
                                                    aria-hidden="true"
                                                />

                                                <span>
                                                    {categoryName}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className={
                                                styles.detailsGrid
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.detail
                                                }
                                            >
                                                <span>
                                                    JUGADOR
                                                </span>

                                                <strong>
                                                    {
                                                        getPlayerName(
                                                            player,
                                                        )
                                                    }
                                                </strong>

                                                <small>
                                                    Jugador
                                                    inscrito
                                                </small>
                                            </div>

                                            <div
                                                className={
                                                    styles.detail
                                                }
                                            >
                                                <span>
                                                    PAREJA
                                                </span>

                                                <strong>
                                                    {partner
                                                        ? getPlayerName(
                                                            partner,
                                                        )
                                                        : "Sin pareja"}
                                                </strong>

                                                <small>
                                                    {partner
                                                        ? "Pareja asociada"
                                                        : "Buscando pareja o pendiente de completar"}
                                                </small>
                                            </div>

                                            <div
                                                className={
                                                    styles.detail
                                                }
                                            >
                                                <span>
                                                    INSCRITO EL
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        pair?.fecha_inscripcion,
                                                    )}
                                                </strong>

                                                <small>
                                                    Fecha de registro
                                                </small>
                                            </div>

                                            <div
                                                className={
                                                    styles.detail
                                                }
                                            >
                                                <span>
                                                    PAGO
                                                </span>

                                                <strong>
                                                    {getPaymentLabel(
                                                        paymentStatus,
                                                    )}
                                                </strong>

                                                <small>
                                                    Pago presencial
                                                </small>
                                            </div>
                                        </div>

                                        {paymentStatus ===
                                            "pendiente" &&
                                            !isCancelled && (
                                                <div
                                                    className={
                                                        styles.paymentNotice
                                                    }
                                                >
                                                    <CircleDollarSign
                                                        size={17}
                                                        aria-hidden="true"
                                                    />

                                                    <div>
                                                        <strong>
                                                            Pago presencial
                                                            pendiente
                                                        </strong>

                                                        <p>
                                                            El pago de la
                                                            inscripción se
                                                            realizará de forma
                                                            presencial. La
                                                            organización
                                                            verificará
                                                            manualmente el
                                                            pago.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {registration.estado ===
                                            "lista_espera" &&
                                            !isCancelled && (
                                                <div
                                                    className={
                                                        styles.waitingNotice
                                                    }
                                                >
                                                    <Clock3
                                                        size={17}
                                                        aria-hidden="true"
                                                    />

                                                    <div>
                                                        <strong>
                                                            Estás en lista de
                                                            espera
                                                        </strong>

                                                        <p>
                                                            La organización
                                                            gestionará las
                                                            plazas disponibles
                                                            y podrá promocionar
                                                            la inscripción
                                                            cuando corresponda.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {registration.checked_in &&
                                            !isCancelled && (
                                                <div
                                                    className={
                                                        styles.paymentNotice
                                                    }
                                                >
                                                    <CheckCircle2
                                                        size={17}
                                                        aria-hidden="true"
                                                    />

                                                    <div>
                                                        <strong>
                                                            Check-in realizado
                                                        </strong>

                                                        <p>
                                                            La organización ha
                                                            registrado tu
                                                            llegada al torneo.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        <footer
                                            className={
                                                styles.cardFooter
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.footerInfo
                                                }
                                            >
                                                {registration
                                                    .tournament
                                                    ?.club_id ? (
                                                    <>
                                                        <MapPin
                                                            size={13}
                                                            aria-hidden="true"
                                                        />

                                                        <span>
                                                            Consulta los
                                                            detalles del
                                                            torneo.
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Info
                                                            size={13}
                                                            aria-hidden="true"
                                                        />

                                                        <span>
                                                            Inscripción
                                                            registrada en
                                                            Sagunto Padel
                                                            Cup.
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <div
                                                className={
                                                    styles.cardActions
                                                }
                                            >
                                                {registration
                                                    .tournament
                                                    ?.slug && (
                                                        <Link
                                                            href={`/torneos/${registration.tournament.slug}`}
                                                            className={
                                                                styles.secondaryButton
                                                            }
                                                        >
                                                            Ver torneo

                                                            <ArrowRight
                                                                size={14}
                                                                aria-hidden="true"
                                                            />
                                                        </Link>
                                                    )}

                                                {canCancel &&
                                                    !isCancelled && (
                                                        <CancelRegistrationButton
                                                            registrationId={
                                                                registration.id
                                                            }
                                                        />
                                                    )}
                                            </div>
                                        </footer>
                                    </article>
                                );
                            },
                        )}
                    </section>
                )}

                <div
                    className={
                        styles.bottomHelp
                    }
                >
                    <Users
                        size={19}
                        aria-hidden="true"
                    />

                    <div>
                        <strong>
                            ¿Necesitas ayuda con tu
                            inscripción?
                        </strong>

                        <p>
                            Si necesitas modificar
                            tu pareja, categoría o
                            resolver cualquier duda,
                            contacta con la
                            organización.
                        </p>
                    </div>

                    <Link href="/contacto">
                        Contactar

                        <ArrowRight
                            size={14}
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </div>
        </main>
    );
}