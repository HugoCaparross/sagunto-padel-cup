"use client";

import {
    useState,
    useTransition,
} from "react";

import {
    Check,
    ChevronDown,
    UserRound,
} from "lucide-react";

import {
    registerForTournament,
} from "./actions";

import styles from "./RegistrationForm.module.css";

type Partner = {
    id: string;
    playerId: string;

    player: {
        id: string;
        nombre: string;
        apellidos: string | null;
        foto_url: string | null;
    } | null;

    availability:
    | "buscando"
    | "encontrada"
    | "no_busca";
};

type CategoryOption = {
    id: string;
    name: string;
    gender: string;
    maxCapacity: number | null;

    capacity: {
        maxCapacity: number | null;
        confirmed: number;
        pendingPayment: number;
        waitingList: number;
        available: number | null;
        isFull: boolean;
    } | null;

    partnerPool: Partner[];
};

type Props = {
    slug: string;
    tournamentId: string;
    categories: CategoryOption[];
    defaultCategoryId: string;
    playerName: string;
};

function initials(
    name: string,
): string {
    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    return (
        parts
            .slice(0, 2)
            .map(
                (part) =>
                    part[0],
            )
            .join("")
            .toUpperCase() ||
        "J"
    );
}

export default function RegistrationForm({
    slug,
    tournamentId,
    categories,
    defaultCategoryId,
    playerName,
}: Props) {
    const [
        categoryId,
        setCategoryId,
    ] = useState(
        defaultCategoryId,
    );

    const [
        partnerMode,
        setPartnerMode,
    ] = useState<
        "partner" | "pool"
    >("pool");

    const [
        partnerId,
        setPartnerId,
    ] = useState("");

    const [
        isPending,
        startTransition,
    ] = useTransition();

    const selectedCategory =
        categories.find(
            (category) =>
                category.id ===
                categoryId,
        ) ??
        categories[0];

    const isFull =
        selectedCategory.capacity
            ?.isFull ??
        false;

    const partnerPool =
        selectedCategory.partnerPool;

    const selectedPartner =
        partnerPool.find(
            (partner) =>
                partner.playerId ===
                partnerId,
        );

    function submit(
        formData: FormData,
    ) {
        startTransition(
            async () => {
                await registerForTournament(
                    formData,
                );
            },
        );
    }

    return (
        <form
            action={submit}
            className={styles.form}
        >
            <input
                type="hidden"
                name="slug"
                value={slug}
            />

            <input
                type="hidden"
                name="tournamentId"
                value={
                    tournamentId
                }
            />

            <input
                type="hidden"
                name="categoryId"
                value={categoryId}
            />

            <input
                type="hidden"
                name="partnerMode"
                value={partnerMode}
            />

            <input
                type="hidden"
                name="partnerId"
                value={partnerId}
            />

            <section
                className={styles.block}
            >
                <div
                    className={
                        styles.blockHeader
                    }
                >
                    <span>
                        01 · CATEGORÍA
                    </span>

                    <p>
                        Selecciona la
                        categoría con la que
                        vas a competir en este
                        torneo.
                    </p>
                </div>

                <div
                    className={
                        styles.categoryGrid
                    }
                >
                    {categories.map(
                        (category) => {
                            const active =
                                category.id ===
                                categoryId;

                            const capacity =
                                category.capacity;

                            return (
                                <button
                                    key={
                                        category.id
                                    }
                                    type="button"
                                    className={`${styles.categoryOption} ${active
                                            ? styles.categoryOptionActive
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setCategoryId(
                                            category.id,
                                        );

                                        setPartnerId(
                                            "",
                                        );

                                        setPartnerMode(
                                            "pool",
                                        );
                                    }}
                                    aria-pressed={
                                        active
                                    }
                                >
                                    <span
                                        className={
                                            styles.categoryTopline
                                        }
                                    >
                                        <strong>
                                            {
                                                category.name
                                            }
                                        </strong>

                                        {active && (
                                            <Check
                                                size={
                                                    17
                                                }
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>

                                    <span
                                        className={
                                            styles.categoryMeta
                                        }
                                    >
                                        {capacity?.isFull
                                            ? "Lista de espera"
                                            : capacity?.available !==
                                                null &&
                                                capacity?.available !==
                                                undefined
                                                ? `${capacity.available} plazas disponibles`
                                                : category.maxCapacity
                                                    ? `${category.maxCapacity} plazas`
                                                    : "Plazas abiertas"}
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>
            </section>

            <section
                className={styles.block}
            >
                <div
                    className={
                        styles.blockHeader
                    }
                >
                    <span>
                        02 · PAREJA
                    </span>

                    <p>
                        Tu inscripción puede
                        quedar vinculada a otra
                        persona del Partner Pool.
                    </p>
                </div>

                <div
                    className={
                        styles.partnerModes
                    }
                >
                    <button
                        type="button"
                        className={`${styles.modeOption} ${partnerMode ===
                                "pool"
                                ? styles.modeOptionActive
                                : ""
                            }`}
                        onClick={() => {
                            setPartnerMode(
                                "pool",
                            );

                            setPartnerId("");
                        }}
                    >
                        <span
                            className={
                                styles.modeRadio
                            }
                            aria-hidden="true"
                        />

                        <span>
                            <strong>
                                No tengo pareja
                            </strong>

                            <small>
                                Entrar en el
                                Partner Pool de
                                esta categoría
                            </small>
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.modeOption} ${partnerMode ===
                                "partner"
                                ? styles.modeOptionActive
                                : ""
                            }`}
                        onClick={() =>
                            setPartnerMode(
                                "partner",
                            )
                        }
                    >
                        <span
                            className={
                                styles.modeRadio
                            }
                            aria-hidden="true"
                        />

                        <span>
                            <strong>
                                Elegir una pareja
                                disponible
                            </strong>

                            <small>
                                Selecciona a
                                alguien que ya
                                esté buscando
                                pareja
                            </small>
                        </span>
                    </button>
                </div>

                {partnerMode ===
                    "partner" && (
                        <div
                            className={
                                styles.partnerSelector
                            }
                        >
                            <label htmlFor="partner-select">
                                Jugador disponible
                            </label>

                            {partnerPool.length >
                                0 ? (
                                <div
                                    className={
                                        styles.selectWrap
                                    }
                                >
                                    <select
                                        id="partner-select"
                                        value={
                                            partnerId
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setPartnerId(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Selecciona una
                                            pareja
                                        </option>

                                        {partnerPool.map(
                                            (
                                                partner,
                                            ) => {
                                                const name =
                                                    partner
                                                        .player
                                                        ? `${partner.player.nombre} ${partner
                                                                .player
                                                                .apellidos ??
                                                            ""
                                                            }`.trim()
                                                        : "Jugador disponible";

                                                return (
                                                    <option
                                                        key={
                                                            partner.id
                                                        }
                                                        value={
                                                            partner.playerId
                                                        }
                                                    >
                                                        {
                                                            name
                                                        }
                                                    </option>
                                                );
                                            },
                                        )}
                                    </select>

                                    <ChevronDown
                                        size={
                                            17
                                        }
                                        aria-hidden="true"
                                    />
                                </div>
                            ) : (
                                <div
                                    className={
                                        styles.emptyPool
                                    }
                                >
                                    <UserRound
                                        size={
                                            18
                                        }
                                        aria-hidden="true"
                                    />

                                    <p>
                                        No hay jugadores
                                        disponibles en
                                        esta categoría
                                        todavía.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                {partnerMode ===
                    "pool" && (
                        <div
                            className={
                                styles.poolMessage
                            }
                        >
                            <span
                                className={
                                    styles.poolDot
                                }
                                aria-hidden="true"
                            />

                            <div>
                                <strong>
                                    Te apuntaremos al
                                    Partner Pool.
                                </strong>

                                <p>
                                    {partnerPool.length >
                                        0
                                        ? `Ahora mismo hay ${partnerPool.length
                                        } ${partnerPool.length ===
                                            1
                                            ? "jugador disponible"
                                            : "jugadores disponibles"
                                        } en esta categoría.`
                                        : "Todavía no hay otros jugadores disponibles en esta categoría."}
                                </p>
                            </div>
                        </div>
                    )}

                {selectedPartner &&
                    partnerMode ===
                    "partner" && (
                        <div
                            className={
                                styles.selectedPartner
                            }
                        >
                            <div
                                className={
                                    styles.avatar
                                }
                            >
                                {selectedPartner
                                    .player
                                    ?.foto_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={
                                            selectedPartner
                                                .player
                                                .foto_url
                                        }
                                        alt=""
                                    />
                                ) : (
                                    initials(
                                        `${selectedPartner
                                            .player
                                            ?.nombre ??
                                        "Jugador"
                                        } ${selectedPartner
                                            .player
                                            ?.apellidos ??
                                        ""
                                        }`,
                                    )
                                )}
                            </div>

                            <div>
                                <span>
                                    PARTNER
                                    SELECCIONADO
                                </span>

                                <strong>
                                    {selectedPartner
                                        .player
                                        ? `${selectedPartner.player.nombre} ${selectedPartner
                                                .player
                                                .apellidos ??
                                            ""
                                            }`.trim()
                                        : "Jugador disponible"}
                                </strong>
                            </div>
                        </div>
                    )}
            </section>

            <section
                className={styles.block}
            >
                <div
                    className={
                        styles.blockHeader
                    }
                >
                    <span>
                        03 · REVISIÓN
                    </span>

                    <p>
                        Comprueba los datos antes
                        de confirmar tu inscripción.
                    </p>
                </div>

                <div
                    className={
                        styles.review
                    }
                >
                    <div>
                        <span>
                            JUGADOR
                        </span>

                        <strong>
                            {playerName}
                        </strong>
                    </div>

                    <div>
                        <span>
                            CATEGORÍA
                        </span>

                        <strong>
                            {
                                selectedCategory.name
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            PAREJA
                        </span>

                        <strong>
                            {partnerMode ===
                                "pool"
                                ? "Buscar pareja"
                                : selectedPartner?.player
                                    ? `${selectedPartner.player.nombre} ${selectedPartner
                                            .player
                                            .apellidos ??
                                        ""
                                        }`.trim()
                                    : "Selecciona una pareja"}
                        </strong>
                    </div>
                </div>
            </section>

            <section
                className={
                    styles.paymentNotice
                }
            >
                <div
                    className={
                        styles.paymentTitle
                    }
                >
                    <span>
                        PAGO
                    </span>

                    <strong>
                        No se realiza ningún
                        pago online.
                    </strong>
                </div>

                <p>
                    La inscripción se registra
                    ahora y el pago se realizará
                    de forma presencial. La
                    organización verificará
                    manualmente el pago.
                </p>
            </section>

            <div
                className={
                    styles.submitArea
                }
            >
                {isFull && (
                    <p
                        className={
                            styles.waitingNotice
                        }
                    >
                        Esta categoría está
                        completa. Tu solicitud se
                        incorporará a la lista de
                        espera.
                    </p>
                )}

                {partnerMode ===
                    "partner" &&
                    !partnerId &&
                    partnerPool.length >
                    0 && (
                        <p
                            className={
                                styles.formHint
                            }
                        >
                            Selecciona una pareja
                            disponible o cambia a
                            “No tengo pareja”.
                        </p>
                    )}

                <button
                    type="submit"
                    className={
                        styles.submit
                    }
                    disabled={
                        isPending ||
                        (partnerMode ===
                            "partner" &&
                            !partnerId)
                    }
                >
                    {isPending
                        ? "Registrando inscripción…"
                        : "Confirmar inscripción"}
                </button>
            </div>
        </form>
    );
}