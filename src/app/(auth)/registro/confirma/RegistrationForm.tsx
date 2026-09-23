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
    ] = useActionState(
        completeRegistration,
        initialRegistrationState,
    );

    // Defensive access: the form must never crash if a stale/partial
    // action state is temporarily received during development/HMR.
    const fieldError = (name: string) =>
        state?.fieldErrors?.[name]?.[0];

    const formMessage = state?.message ?? "";

    return (
        <form
            className={styles.form}
            action={formAction}
            noValidate
        >
            <section className={styles.block}>
                <div className={styles.blockHeader}>
                    <span>CUENTA</span>

                    <p>
                        La identidad de acceso se gestiona
                        desde Supabase Auth.
                    </p>
                </div>

                <div className={styles.accountField}>
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

            <section className={styles.block}>
                <div className={styles.blockHeader}>
                    <span>DATOS PERSONALES</span>

                    <p>
                        Estos datos identifican tu perfil
                        dentro del circuito.
                    </p>
                </div>

                <div className={styles.gridTwo}>
                    <Field
                        name="nombre"
                        label="Nombre"
                        defaultValue={
                            existingPlayer?.nombre ??
                            defaultName
                        }
                        error={fieldError("nombre")}
                    />

                    <Field
                        name="apellidos"
                        label="Apellidos"
                        defaultValue={
                            existingPlayer?.apellidos ??
                            defaultSurname
                        }
                        error={fieldError("apellidos")}
                    />

                    <Field
                        name="telefono"
                        label="Teléfono"
                        defaultValue={
                            existingPlayer?.telefono ??
                            ""
                        }
                        error={fieldError("telefono")}
                        type="tel"
                        autoComplete="tel"
                    />

                    <Field
                        name="ciudad"
                        label="Ciudad"
                        defaultValue={
                            existingPlayer?.ciudad ??
                            ""
                        }
                        error={fieldError("ciudad")}
                        autoComplete="address-level2"
                    />
                </div>
            </section>

            <section className={styles.block}>
                <div className={styles.blockHeader}>
                    <span>DATOS DEPORTIVOS</span>

                    <p>
                        Podrás completar o modificar estos
                        datos desde tu área privada.
                    </p>
                </div>

                <div className={styles.gridTwo}>
                    <div className={styles.field}>
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
                            aria-invalid={Boolean(
                                fieldError(
                                    "categoria_actual_id",
                                ),
                            )}
                            aria-describedby={
                                fieldError(
                                    "categoria_actual_id",
                                )
                                    ? "categoria_actual_id-error"
                                    : undefined
                            }
                        >
                            <option value="">
                                Seleccionar categoría
                            </option>

                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.nombre}
                                </option>
                            ))}
                        </select>

                        {fieldError(
                            "categoria_actual_id",
                        ) && (
                                <small
                                    id="categoria_actual_id-error"
                                    className={styles.fieldError}
                                >
                                    {fieldError(
                                        "categoria_actual_id",
                                    )}
                                </small>
                            )}
                    </div>

                    <div className={styles.field}>
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
                            aria-invalid={Boolean(
                                fieldError("mano_dominante"),
                            )}
                            aria-describedby={
                                fieldError("mano_dominante")
                                    ? "mano_dominante-error"
                                    : undefined
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

                        {fieldError("mano_dominante") && (
                            <small
                                id="mano_dominante-error"
                                className={styles.fieldError}
                            >
                                {fieldError("mano_dominante")}
                            </small>
                        )}
                    </div>

                    <Field
                        name="pala"
                        label="Pala"
                        defaultValue={
                            existingPlayer?.pala ??
                            ""
                        }
                        error={fieldError("pala")}
                    />

                    <Field
                        name="instagram"
                        label="Instagram"
                        defaultValue={
                            existingPlayer?.instagram
                                ? `@${existingPlayer.instagram.replace(
                                    /^@/,
                                    "",
                                )}`
                                : ""
                        }
                        error={fieldError("instagram")}
                        placeholder="@usuario"
                        autoComplete="off"
                    />
                </div>
            </section>

            <section className={styles.block}>
                <div className={styles.blockHeader}>
                    <span>PRIVACIDAD</span>

                    <p>
                        Necesitamos estas confirmaciones para
                        completar el alta.
                    </p>
                </div>

                <div className={styles.checks}>
                    <label className={styles.check}>
                        <input
                            type="checkbox"
                            name="acceptTerms"
                            value="on"
                            required
                            aria-invalid={Boolean(
                                fieldError("acceptTerms"),
                            )}
                            aria-describedby={
                                fieldError("acceptTerms")
                                    ? "acceptTerms-error"
                                    : undefined
                            }
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

                    {fieldError("acceptTerms") && (
                        <small
                            id="acceptTerms-error"
                            className={styles.fieldError}
                        >
                            {fieldError("acceptTerms")}
                        </small>
                    )}

                    <label className={styles.check}>
                        <input
                            type="checkbox"
                            name="acceptPrivacy"
                            value="on"
                            required
                            aria-invalid={Boolean(
                                fieldError("acceptPrivacy"),
                            )}
                            aria-describedby={
                                fieldError("acceptPrivacy")
                                    ? "acceptPrivacy-error"
                                    : undefined
                            }
                        />

                        <span>
                            Acepto la{" "}
                            <a
                                href="/privacidad"
                                target="_blank"
                                rel="noreferrer"
                            >
                                política de privacidad
                            </a>
                            .
                        </span>
                    </label>

                    {fieldError("acceptPrivacy") && (
                        <small
                            id="acceptPrivacy-error"
                            className={styles.fieldError}
                        >
                            {fieldError("acceptPrivacy")}
                        </small>
                    )}
                </div>
            </section>

            {formMessage && (
                <div
                    className={styles.formError}
                    role="alert"
                    aria-live="polite"
                >
                    {formMessage}
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
    autoComplete,
}: {
    name: string;
    label: string;
    defaultValue: string;
    error?: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
}) {
    const errorId = `${name}-error`;

    return (
        <div className={styles.field}>
            <label htmlFor={name}>
                {label}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                autoComplete={autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={
                    error ? errorId : undefined
                }
            />

            {error && (
                <small
                    id={errorId}
                    className={styles.fieldError}
                >
                    {error}
                </small>
            )}
        </div>
    );
}
