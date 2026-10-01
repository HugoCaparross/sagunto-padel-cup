
import Link from "next/link";

import {
    getClubs,
    requireAdminContext,
} from "@/lib/services/admin";
import { getSeasons } from "@/lib/services/seasons";

import { createTournamentAction } from "./actions";
import styles from "./page.module.css";

export default async function NewTournamentPage() {
    await requireAdminContext();

    const [seasons, clubs] = await Promise.all([
        getSeasons(),
        getClubs(),
    ]);

    // Solo se pueden asociar torneos a temporadas
    // planificadas o actualmente activas.
    const availableSeasons = seasons.filter(
        (season) =>
            season.status === "planificada" ||
            season.status === "activa",
    );

    const canCreate =
        availableSeasons.length > 0 &&
        clubs.length > 0;

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <nav
                    className={styles.breadcrumbs}
                    aria-label="Migas de pan"
                >
                    <Link href="/admin">
                        Administración
                    </Link>

                    <span aria-hidden="true">/</span>

                    <Link href="/admin/torneos">
                        Torneos
                    </Link>

                    <span aria-hidden="true">/</span>

                    <span aria-current="page">
                        Nuevo torneo
                    </span>
                </nav>

                <header className={styles.header}>
                    <div>
                        <span className={styles.eyebrow}>
                            Gestión de competición
                        </span>

                        <h1 className={styles.title}>
                            Crear torneo
                        </h1>

                        <p className={styles.description}>
                            Introduce los datos básicos de la prueba.
                            Podrás configurar sus categorías, horarios
                            e inscripciones desde su ficha.
                        </p>
                    </div>
                </header>

                {availableSeasons.length === 0 && (
                    <div
                        className={styles.notice}
                        role="status"
                    >
                        No hay temporadas disponibles.
                        Crea o activa una temporada antes
                        de registrar un torneo.
                    </div>
                )}

                {clubs.length === 0 && (
                    <div
                        className={styles.notice}
                        role="status"
                    >
                        No hay clubes registrados.
                        Añade un club antes de crear el torneo.
                    </div>
                )}

                <form
                    action={createTournamentAction}
                    className={styles.form}
                >
                    <section className={styles.formSection}>
                        <div className={styles.sectionHeading}>
                            <h2>
                                Información general
                            </h2>

                            <p>
                                Datos identificativos de la prueba.
                            </p>
                        </div>

                        <div className={styles.fieldsGrid}>
                            <div className={styles.field}>
                                <label htmlFor="name">
                                    Nombre del torneo
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    maxLength={120}
                                    autoComplete="off"
                                    placeholder="Ej. 2ª Prueba Sagunto Padel Cup"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="slug">
                                    Slug
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="slug"
                                    name="slug"
                                    type="text"
                                    required
                                    maxLength={140}
                                    pattern="[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ -]+"
                                    autoComplete="off"
                                    placeholder="segunda-prueba-sagunto-padel-cup"
                                    aria-describedby="slug-help"
                                />

                                <small id="slug-help">
                                    Identificador para la URL pública.
                                    Utiliza palabras separadas por
                                    guiones o espacios.
                                </small>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="tournamentType">
                                    Tipo de torneo
                                </label>

                                <select
                                    id="tournamentType"
                                    name="tournamentType"
                                    defaultValue="regular"
                                >
                                    <option value="regular">
                                        Prueba regular
                                    </option>

                                    <option value="master">
                                        Master
                                    </option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="seasonId">
                                    Temporada
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="seasonId"
                                    name="seasonId"
                                    required
                                    defaultValue=""
                                    disabled={
                                        availableSeasons.length === 0
                                    }
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Selecciona una temporada
                                    </option>

                                    {availableSeasons.map(
                                        (season) => (
                                            <option
                                                key={season.id}
                                                value={season.id}
                                            >
                                                {season.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="clubId">
                                    Club sede
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="clubId"
                                    name="clubId"
                                    required
                                    defaultValue=""
                                    disabled={clubs.length === 0}
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Selecciona un club
                                    </option>

                                    {clubs.map((club) => (
                                        <option
                                            key={club.id}
                                            value={club.id}
                                        >
                                            {club.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className={styles.formSection}>
                        <div className={styles.sectionHeading}>
                            <h2>
                                Fechas y precio
                            </h2>

                            <p>
                                Periodo de celebración y precio
                                informativo de inscripción.
                            </p>
                        </div>

                        <div className={styles.fieldsGrid}>
                            <div className={styles.field}>
                                <label htmlFor="startDate">
                                    Fecha de inicio
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="endDate">
                                    Fecha de finalización
                                    <span aria-hidden="true">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="price">
                                    Precio
                                </label>

                                <input
                                    id="price"
                                    name="price"
                                    type="text"
                                    maxLength={80}
                                    placeholder="Ej. 20 € por jugador"
                                />

                                <small>
                                    Texto informativo. No activa
                                    ningún sistema de pago.
                                </small>
                            </div>
                        </div>
                    </section>

                    <section className={styles.formSection}>
                        <div className={styles.sectionHeading}>
                            <h2>
                                Descripción
                            </h2>

                            <p>
                                Información adicional de la prueba.
                            </p>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="description">
                                Descripción del torneo
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                rows={5}
                                maxLength={3000}
                                placeholder="Información sobre la prueba..."
                            />
                        </div>
                    </section>

                    <footer className={styles.formFooter}>
                        <Link
                            href="/admin/torneos"
                            className={styles.cancelButton}
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={!canCreate}
                        >
                            Crear torneo
                        </button>
                    </footer>
                </form>
            </div>
        </main>
    );
}
