
"use client";

import { useActionState } from "react";

import { updateOwnProfile } from "@/app/(app)/app/perfil/actions";

import styles from "./ProfileForm.module.css";

type ProfileFormValues = {
    nombre: string;
    apellidos: string;
    telefono: string;
    ciudad: string;
    instagram: string;
    pala: string;
    manoDominante: string;
};

type ProfileFormProps = {
    player: ProfileFormValues;
};

type ProfileActionState = {
    success: boolean;
    message: string;
    fieldErrors?: Partial<
        Record<keyof ProfileFormValues, string>
    >;
};

const initialState: ProfileActionState = {
    success: false,
    message: "",
};

const dominantHandOptions = [
    { value: "", label: "Selecciona una opción" },
    { value: "diestro", label: "Diestro" },
    { value: "zurdo", label: "Zurdo" },
];

export default function ProfileForm({
    player,
}: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(
        updateOwnProfile,
        initialState,
    );

    return (
        <form action={formAction} className={styles.form}>
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3>Datos personales</h3>
                        <p>
                            Información básica asociada a tu perfil
                            de jugador.
                        </p>
                    </div>
                </div>

                <div className={styles.fieldsGrid}>
                    <div className={styles.field}>
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            id="nombre"
                            name="nombre"
                            type="text"
                            defaultValue={player.nombre}
                            autoComplete="given-name"
                            maxLength={80}
                            required
                            aria-invalid={Boolean(
                                state.fieldErrors?.nombre,
                            )}
                            aria-describedby={
                                state.fieldErrors?.nombre
                                    ? "nombre-error"
                                    : undefined
                            }
                        />
                        {state.fieldErrors?.nombre && (
                            <span
                                id="nombre-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.nombre}
                            </span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="apellidos">
                            Apellidos
                        </label>
                        <input
                            id="apellidos"
                            name="apellidos"
                            type="text"
                            defaultValue={player.apellidos}
                            autoComplete="family-name"
                            maxLength={120}
                            required
                            aria-invalid={Boolean(
                                state.fieldErrors?.apellidos,
                            )}
                            aria-describedby={
                                state.fieldErrors?.apellidos
                                    ? "apellidos-error"
                                    : undefined
                            }
                        />
                        {state.fieldErrors?.apellidos && (
                            <span
                                id="apellidos-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.apellidos}
                            </span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="telefono">
                            Teléfono
                        </label>
                        <input
                            id="telefono"
                            name="telefono"
                            type="tel"
                            defaultValue={player.telefono}
                            autoComplete="tel"
                            maxLength={30}
                            placeholder="Tu número de teléfono"
                            aria-invalid={Boolean(
                                state.fieldErrors?.telefono,
                            )}
                            aria-describedby={
                                state.fieldErrors?.telefono
                                    ? "telefono-error"
                                    : undefined
                            }
                        />
                        {state.fieldErrors?.telefono && (
                            <span
                                id="telefono-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.telefono}
                            </span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="ciudad">Ciudad</label>
                        <input
                            id="ciudad"
                            name="ciudad"
                            type="text"
                            defaultValue={player.ciudad}
                            autoComplete="address-level2"
                            maxLength={100}
                            placeholder="Tu ciudad"
                            aria-invalid={Boolean(
                                state.fieldErrors?.ciudad,
                            )}
                            aria-describedby={
                                state.fieldErrors?.ciudad
                                    ? "ciudad-error"
                                    : undefined
                            }
                        />
                        {state.fieldErrors?.ciudad && (
                            <span
                                id="ciudad-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.ciudad}
                            </span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="instagram">
                            Instagram
                        </label>
                        <div className={styles.inputPrefix}>
                            <span aria-hidden="true">@</span>
                            <input
                                id="instagram"
                                name="instagram"
                                type="text"
                                defaultValue={player.instagram}
                                autoComplete="off"
                                maxLength={30}
                                placeholder="usuario"
                                aria-invalid={Boolean(
                                    state.fieldErrors?.instagram,
                                )}
                                aria-describedby={
                                    state.fieldErrors?.instagram
                                        ? "instagram-error"
                                        : undefined
                                }
                            />
                        </div>
                        {state.fieldErrors?.instagram && (
                            <span
                                id="instagram-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.instagram}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3>Datos deportivos</h3>
                        <p>
                            Completa la información relacionada con
                            tu juego.
                        </p>
                    </div>
                </div>

                <div className={styles.fieldsGrid}>
                    <div className={styles.field}>
                        <label htmlFor="manoDominante">
                            Mano dominante
                        </label>
                        <select
                            id="manoDominante"
                            name="manoDominante"
                            defaultValue={player.manoDominante}
                            aria-invalid={Boolean(
                                state.fieldErrors?.manoDominante,
                            )}
                            aria-describedby={
                                state.fieldErrors?.manoDominante
                                    ? "manoDominante-error"
                                    : undefined
                            }
                        >
                            {dominantHandOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {state.fieldErrors?.manoDominante && (
                            <span
                                id="manoDominante-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.manoDominante}
                            </span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pala">Pala</label>
                        <input
                            id="pala"
                            name="pala"
                            type="text"
                            defaultValue={player.pala}
                            maxLength={100}
                            placeholder="Marca o modelo de tu pala"
                            aria-invalid={Boolean(
                                state.fieldErrors?.pala,
                            )}
                            aria-describedby={
                                state.fieldErrors?.pala
                                    ? "pala-error"
                                    : undefined
                            }
                        />
                        {state.fieldErrors?.pala && (
                            <span
                                id="pala-error"
                                className={styles.fieldError}
                            >
                                {state.fieldErrors.pala}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {state.message && (
                <p
                    className={
                        state.success
                            ? styles.successMessage
                            : styles.errorMessage
                    }
                    role="status"
                    aria-live="polite"
                >
                    {state.message}
                </p>
            )}

            <div className={styles.formFooter}>
                <p>
                    Los cambios se guardarán en tu perfil de jugador.
                </p>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isPending}
                >
                    {isPending
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>
            </div>
        </form>
    );
}
