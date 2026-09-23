"use client";

import { useActionState } from "react";

import {
    completeRegistration,
    initialRegistrationState,
} from "./actions";

import type {
    Category,
    Player,
} from "@/types/database";

import styles from "./RegistrationForm.module.css";

type Props = {
    email: string;
    defaultName: string;
    defaultSurname: string;
    defaultAvatar: string | null;
    categories: Category[];
    existingPlayer:
    | (Player & {
        category?: Category | null;
    })
    | null;
};

export default function RegistrationForm({
    email,
    defaultName,
    defaultSurname,
    categories,
    existingPlayer,
}: Props) {
    const [
        state,
        formAction,
        pending,
    ] =
        useActionState(
            completeRegistration,
            initialRegistrationState,
        );

    const fieldError = (
        name: string,
    ) =>
        state.fieldErrors[
        name
        ]?.[0];

    return (
        <form
            className={styles.form}
            action={formAction}
        >
            <section
                className={styles.block}
            >
                <div
                    className={
                        styles.blockHeader
                    }
                >
                    <span>
                        CUENTA
                    </span>

                    <p>
                        La identidad de
                        acceso se gestiona
                        desde Supabase Auth.
                    </p>
                </div>

                <div
                    className={
                        styles.accountField
                    }
                >
                    <label htmlFor="profile-email">
                        Email
                    </label>

                    <input
                        id="profile-email"
                        value={email}
                        readOnly
                        aria-readonly="true"
                    />
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
                        DATOS PERSONALES
                    </span>

                    <p>
                        Estos datos identifican
                        tu perfil dentro del
                        circuito.
                    </p>
                </div>

                <div
                    className={
                        styles.gridTwo
                    }
                >
                    <Field
                        name="nombre"
                        label="Nombre"
                        defaultValue={
                            existingPlayer?.nombre ??
                            defaultName
                        }
                        error={fieldError(
                            "nombre",
                        )}
                    />

                    <Field
                        name="apellidos"
                        label="Apellidos"
                        defaultValue={
                            existingPlayer?.apellidos ??
                            defaultSurname
                        }
                        error={fieldError(
                            "apellidos",
                        )}
                    />

                    <Field
                        name="telefono"
                        label="Teléfono"
                        defaultValue={
                            existingPlayer?.telefono ??
                            ""
                        }
                        error={fieldError(
                            "telefono",
                        )}
                        type="tel"
                    />

                    <Field
                        name="ciudad"
                        label="Ciudad"
                        defaultValue={
                            existingPlayer?.ciudad ??
                            ""
                        }
                        error={fieldError(
                            "ciudad",
                        )}
                    />
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
                        DATOS DEPORTIVOS
                    </span>

                    <p>
                        Podrás completar o
                        modificar estos datos
                        desde tu área privada.
                    </p>
                </div>

                <div
                    className={
                        styles.gridTwo
                    }
                >
                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="categoria_actual_id">
                            Categoría
                        </label>

                        <select
                            id="categoria_actual_id"
                            name="categoria_actual_id"
                            defaultValue={
                                existingPlayer?.categoria_actual_id ??
                                ""
                            }
                        >
                            <option value="">
                                Seleccionar
                                categoría
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

                        {fieldError(
                            "categoria_actual_id",
                        ) && (
                                <small
                                    className={
                                        styles.fieldError
                                    }
                                >
                                    {fieldError(
                                        "categoria_actual_id",
                                    )}
                                </small>
                            )}
                    </div>

                    <div
                        className={
                            styles.field
                        }
                    >
                        <label htmlFor="mano_dominante">
                            Mano dominante
                        </label>

                        <select
                            id="mano_dominante"
                            name="mano_dominante"
                            defaultValue={
                                existingPlayer?.mano_dominante ??
                                ""
                            }
                        >
                            <option value="">
                                Seleccionar
                            </option>

                            <option value="diestro">
                                Diestro
                            </option>

                            <option value="zurdo">
                                Zurdo
                            </option>
                        </select>
                    </div>

                    <Field
                        name="pala"
                        label="Pala"
                        defaultValue={
                            existingPlayer?.pala ??
                            ""
                        }
                        error={fieldError(
                            "pala",
                        )}
                    />

                    <Field
                        name="instagram"
                        label="Instagram"
                        defaultValue={
                            existingPlayer?.instagram
                                ? `@${existingPlayer.instagram.replace(/^@/, "")}`
                                : ""
                        }
                        error={fieldError(
                            "instagram",
                        )}
                        placeholder="@usuario"
                    />
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
                        PRIVACIDAD
                    </span>

                    <p>
                        Necesitamos estas
                        confirmaciones para
                        completar el alta.
                    </p>
                </div>

                <div
                    className={styles.checks}
                >
                    <label
                        className={
                            styles.check
                        }
                    >
                        <input
                            type="checkbox"
                            name="acceptTerms"
                            required
                        />

                        <span>
                            Acepto las{" "}
                            <a
                                href="/aviso-legal"
                                target="_blank"
                                rel="noreferrer"
                            >
                                condiciones de uso
                            </a>
                            .
                        </span>
                    </label>

                    {fieldError(
                        "acceptTerms",
                    ) && (
                            <small
                                className={
                                    styles.fieldError
                                }
                            >
                                {fieldError(
                                    "acceptTerms",
                                )}
                            </small>
                        )}

                    <label
                        className={
                            styles.check
                        }
                    >
                        <input
                            type="checkbox"
                            name="acceptPrivacy"
                            required
                        />

                        <span>
                            Acepto la{" "}
                            <a
                                href="/privacidad"
                                target="_blank"
                                rel="noreferrer"
                            >
                                política de
                                privacidad
                            </a>
                            .
                        </span>
                    </label>

                    {fieldError(
                        "acceptPrivacy",
                    ) && (
                            <small
                                className={
                                    styles.fieldError
                                }
                            >
                                {fieldError(
                                    "acceptPrivacy",
                                )}
                            </small>
                        )}
                </div>
            </section>

            {state.message && (
                <div
                    className={
                        styles.formError
                    }
                    role="alert"
                >
                    {state.message}
                </div>
            )}

            <button
                type="submit"
                className={styles.submit}
                disabled={pending}
                aria-busy={pending}
            >
                {pending
                    ? "Guardando perfil..."
                    : "Crear mi perfil"}
            </button>
        </form>
    );
}

function Field({
    name,
    label,
    defaultValue,
    error,
    type = "text",
    placeholder,
}: {
    name: string;
    label: string;
    defaultValue: string;
    error?: string;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div className={styles.field}>
            <label htmlFor={name}>
                {label}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                defaultValue={
                    defaultValue
                }
                placeholder={
                    placeholder
                }
                aria-invalid={
                    Boolean(error)
                }
            />

            {error && (
                <small
                    className={
                        styles.fieldError
                    }
                >
                    {error}
                </small>
            )}
        </div>
    );
}