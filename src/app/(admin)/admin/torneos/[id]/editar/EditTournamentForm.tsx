"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Club, Season, Tournament } from "@/types/database";
import { updateTournamentAction } from "./actions";
import styles from "./page.module.css";

function SaveButton() {
    const { pending } = useFormStatus();
    return <button className={styles.primaryButton} disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</button>;
}

export default function EditTournamentForm({ tournament, seasons, clubs }: { tournament: Tournament; seasons: Season[]; clubs: Club[] }) {
    const action = updateTournamentAction.bind(null, tournament.id);
    const [state, formAction] = useActionState(action, {});
    return <form action={formAction} className={styles.form}>
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        {state.success && <p className={styles.success} role="status">{state.success}</p>}
        <div className={styles.grid}>
            <label>Nombre<input name="name" required maxLength={120} defaultValue={tournament.nombre} /></label>
            <label>Slug<input name="slug" required maxLength={120} defaultValue={tournament.slug} /></label>
            <label>Temporada<select name="seasonId" required defaultValue={tournament.season_id ?? ""}>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select></label>
            <label>Club<select name="clubId" required defaultValue={tournament.club_id ?? ""}>{clubs.map((club) => <option key={club.id} value={club.id}>{club.nombre}</option>)}</select></label>
            <label>Fecha de inicio<input type="date" name="startDate" required defaultValue={tournament.fecha_inicio.slice(0, 10)} /></label>
            <label>Fecha de fin<input type="date" name="endDate" required defaultValue={tournament.fecha_fin.slice(0, 10)} /></label>
            <label>Tipo<select name="tournamentType" defaultValue={tournament.tournament_type}><option value="regular">Prueba regular</option><option value="master">Master</option></select></label>
            <label>Precio informativo<input name="price" maxLength={80} defaultValue={tournament.precio_texto ?? ""} placeholder="Ej. 20 € por jugador" /></label>
            <label className={styles.full}>Descripción<textarea name="description" maxLength={5000} rows={7} defaultValue={tournament.descripcion ?? ""} /></label>
        </div>
        <p className={styles.help}>El tipo define la clase de prueba. Las reglas deportivas y los cuadros se gestionan en sus módulos específicos.</p>
        <SaveButton />
    </form>;
}
